-- 1. Setup Script: Create database and log table
create database AttachmentCleanupDB;
go
use AttachmentCleanupDB;
go
create table AttachmentCleanupLog (
    LogID int identity(1,1) primary key,
    [Process] nvarchar(255) null,
    [WorkflowInstance] int null,
    [File] nvarchar(255) null,
    [FileId] int not null,
    [CurrentFileDeletedStatus] bit null,
    [FileVersion] int null,
    [FileVersionId] int not null,
    [CurrentVersionDeletedStatus] bit null,
    [CurrentFileSizeKB] int null,
    Status nvarchar(32) not null default 'Pending', -- Pending, Processed, Error
    LastUpdated datetime not null default getdate(),
    AttachmentDbName sysname not null,
    ContentDbName sysname not null,
    ErrorMessage nvarchar(4000) null
);
-- Index for fast lookups
create index IX_AttachmentCleanupLog_Status on AttachmentCleanupLog(Status);

go
-- Dry Run Stored Procedure: Show what would be deleted
create or alter procedure sp_AttachmentCleanup_DryRun
as
begin
    set nocount on;
    declare @TotalBytes bigint = 0;
    declare @TotalGB decimal(18,2) = 0;
    declare @PendingCount int = (select count(*) from AttachmentCleanupLog where Status = 'Pending');

    print 'DRY RUN: Pending records in log table:';
    select 
        LogID, Process, WorkflowInstance, [File], FileId, FileVersionId, CurrentFileSizeKB, Status, AttachmentDbName, ContentDbName, LastUpdated
    from AttachmentCleanupLog
    where Status = 'Pending'
    order by Process, WorkflowInstance, [File];

    select @TotalBytes = sum(cast( CurrentFileSizeKB as bigint)) from AttachmentCleanupLog where Status = 'Pending';
    set @TotalGB = cast(@TotalBytes as decimal(18,2)) / 1024 / 1024;
    print 'Total files to process: ' + cast(@PendingCount as varchar);
    print 'Total size to delete: ' + cast(@TotalGB as varchar) + ' GB';

    if @PendingCount > 0
    begin
        declare @AttachmentDb sysname, @ContentDbName sysname;
        select top 1 @AttachmentDb = AttachmentDbName, @ContentDbName = ContentDbName from AttachmentCleanupLog where Status = 'Pending';

        declare @sql nvarchar(max) = N'
        select 
            elements.DEF_Name as [Process], 
            elements.WFD_ID as [Workflow Instance],
            att.ATT_Name as [File], 
            att.ATT_ID as [File id],
            att.ATT_IsDeleted as [Current File Deleted Status],
            atf.ATF_Version as [File Version], 
            atf.ATF_ID as [File version id], 
            atf.ATF_IsDeleted as [Current Version Deleted Status],
            datalength(atf.ATF_Value) / 1024 as [Current File Size (KB)],
            1 as [New ATT_IsDeleted],
            1 as [New ATF_IsDeleted],
            0 as [New ATF_Value_Size]
        from [' + @AttachmentDb + '].dbo.WFAttachmentFiles atf
        join [' + @ContentDbName + '].dbo.WFDataAttachmets att on att.ATT_ID = atf.ATF_ATTID
        join [' + @ContentDbName + '].dbo.V_WFElements elements on ATT_WFDID = WFD_ID

        join AttachmentCleanupDB.dbo.AttachmentCleanupLog log on log.FileId = att.ATT_ID and log.FileVersionId = atf.ATF_ID and log.Status = ''Pending''
        order by elements.DEF_Name, elements.WFD_ID, att.ATT_Name;';

        print '=======================================================';
        print 'LIVE DATABASE: Current data for pending records:';
        select @sql as Statement
        exec sp_executesql @sql;
        print '=======================================================';
        print 'Review the above data carefully before proceeding with the update.';
        print 'To execute the update, use the batch delete procedure.';
        print '=======================================================';
    end
end
go
create or alter procedure sp_AttachmentCleanup_BatchDelete
    @BatchSize int = 1000
as
begin
    set nocount on;
    declare @Processed int = 0;
    declare @Total int = (select count(*) from AttachmentCleanupLog where Status = 'Pending');
    declare @LogID int, @ATT_ID int, @ATF_ID int, @AttachmentDbName sysname, @ContentDbName sysname;
    declare @sql nvarchar(max), @err nvarchar(4000);

    print 'Starting batch delete. Total pending: ' + cast(@Total as varchar);

    while exists (select 1 from AttachmentCleanupLog where Status = 'Pending')
    begin
        begin try
            begin transaction;
            -- Get next batch
            declare batch_cursor cursor fast_forward for
                select top (@BatchSize) LogID, FileId, FileVersionId, AttachmentDbName, ContentDbName
                from AttachmentCleanupLog
                where Status = 'Pending'
                order by LogID;
            open batch_cursor;
            fetch next from batch_cursor into @LogID, @ATT_ID, @ATF_ID, @AttachmentDbName, @ContentDbName;
            while @@fetch_status = 0
            begin
                begin try
                    -- Dynamic SQL for file version update
                    set @sql = N'update [' + @AttachmentDbName + '].dbo.WFAttachmentFiles set ATF_IsDeleted = 1, ATF_Value = 0x0 where ATF_ID = @ATF_ID';
                    exec sp_executesql @sql, N'@ATF_ID int', @ATF_ID=@ATF_ID;
                    -- Dynamic SQL for file info update
                    set @sql = N'update [' + @ContentDbName + '].dbo.WFDataAttachmets set ATT_IsDeleted = 1 where ATT_ID = @ATT_ID';
                    exec sp_executesql @sql, N'@ATT_ID int', @ATT_ID=@ATT_ID;
                    -- Mark as processed
                    update AttachmentCleanupLog set Status = 'Processed', LastUpdated = getdate(), ErrorMessage = null where LogID = @LogID;
                    set @Processed = @Processed + 1;
                end try
                begin catch
                    set @err = error_message();
                    update AttachmentCleanupLog set Status = 'Error', LastUpdated = getdate(), ErrorMessage = @err where LogID = @LogID;
                    print 'Error processing LogID ' + cast(@LogID as varchar) + ': ' + @err;
                end catch
                fetch next from batch_cursor into @LogID, @ATT_ID, @ATF_ID, @AttachmentDbName, @ContentDbName;
            end
            close batch_cursor;
            deallocate batch_cursor;
            commit transaction;
            print 'Processed ' + cast(@Processed as varchar) + ' of ' + cast(@Total as varchar) + ' so far.';
        end try
        begin catch
            print 'Batch failed, rolling back. Error: ' + error_message();
            rollback transaction;
        end catch
    end
    print 'Batch delete complete. Total processed: ' + cast(@Processed as varchar);
end
