-- =============================================================================
-- UPDATE SCRIPT:
--  Mark attachment and their versions as deleted.
--  WEBCON BPS does not support deleting the content of versions which file
--  has already been marked as deleted
--  https://community.webcon.com/forum/thread/8056?messageid=8056
--  Unfortunately there isn't a simple way. Once an attachment is removed, it is flagged as deleted in the database and further actions do not operate on it.
-- The functionality to remove binary data of deleted attachments is in backlog and I hope it will be implemented sooner than later.
-- As a workaround, advanced users may want to manually update ATF_Value to empty string or change ATT_IsDeleted to 0 and then execute an action again.
-- =============================================================================
-- This script will:
-- 1. Set ATF_Value to 0 (clear file content)
-- 2. Set ATT_IsDeleted to 1 (mark attachment as deleted)
-- 3. Set ATF_IsDeleted to 1 (mark attachment version as deleted)
-- =============================================================================

-- =============================================================================
-- CONFIGURATION VARIABLES
-- =============================================================================
declare @dryrun bit = 1;  -- Set to 1 for dry run (preview), 0 for actual update

-- =============================================================================
-- Update database names
-- The attachment files may exist in the content database or one of the attachment databases.
-- Adjust the database names as needed. This applies to the variable and the FROM clause.
-- =============================================================================


-- =============================================================================
-- TABLE VARIABLE: Store records matching criteria (WHERE condition defined once)
-- =============================================================================
declare @RecordsToUpdate table (
    ATT_ID int,
    ATF_ID int,
    DEF_Name nvarchar(255),
    WFD_ID int,
    ATT_Name nvarchar(255),
    ATT_IsDeleted bit,
    ATF_Version int,
    ATF_IsDeleted bit,
    ATF_Value_Size int
);

-- Populate table variable with records matching criteria (WHERE condition defined only here)
insert into @RecordsToUpdate (ATT_ID, ATF_ID, DEF_Name, WFD_ID, ATT_Name, ATT_IsDeleted, ATF_Version, ATF_IsDeleted, ATF_Value_Size)
select 
    ATT_ID,
    ATF_ID,
    DEF_Name,
    WFD_ID,
    ATT_Name,
    ATT_IsDeleted,
    ATF_Version,
    ATF_IsDeleted,
    datalength(ATF_Value) as ATF_Value_Size
from [webcon_prod_Content].dbo.WFAttachmentFiles
join [webcon_prod_Content].dbo.WFDataAttachmets on ATT_ID = ATF_ATTID
join [webcon_prod_Content].dbo.V_WFElements on ATT_WFDID = WFD_ID
where /* ATT_Name like 'GeneratedDocument%'*/
	ATT_WFDID = 2145 
   and ATT_IsDeleted = 1 and datalength(ATF_Value) > 1;


declare @RowCount int = 0
declare @NumberOfVersionsRecordsToUpdate int = (select count(*) from @RecordsToUpdate);
declare @NumberOfFileRecordsToUpdate  int = (select count(*) from (select distinct ATT_ID from @RecordsToUpdate) as files);

-- =============================================================================
-- CONDITIONAL EXECUTION: DRY RUN OR UPDATE
-- =============================================================================
if @dryrun = 1
begin
    -- =============================================================================
    -- DRY RUN: View data that will be updated
    -- =============================================================================    
    print 'DRY RUN: Showing records that will be updated...'
    print 'Total Attachment Version Records to Update: ' + cast(@NumberOfVersionsRecordsToUpdate as varchar)
    print 'Total Attachment File Records to Update: ' + cast(@NumberOfFileRecordsToUpdate as varchar)
    print '======================================================='
    -- Calculate total size of data to be deleted (in bytes, KB, MB)
    declare @TotalBytesToDelete bigint = (select sum(ATF_Value_Size) from @RecordsToUpdate);
    declare @TotalGBToDelete decimal(18,2) = cast(@TotalBytesToDelete as decimal(18,2)) / 1024 / 1024 / 1024;
    print 'Estimated total data to be deleted: ' + cast(@TotalGBToDelete as varchar) + ' GB.';
    print 'NOTE: The transaction log will grow by at least this amount during the update, and the data file may temporarily grow as well.'
    print 'Ensure you have sufficient free space in your transaction log and data files before running the update.'
        
    select 
        DEF_Name as [Process], 
        WFD_ID as [Workflow Instance],
        ATT_Name as [File], 
        ATT_ID as [File id],
        ATT_IsDeleted as [Current File Deleted Status],
        ATF_Version as [File Version], 
        ATF_ID as [File version id], 
        ATF_IsDeleted as [Current Version Deleted Status],
        ATF_Value_Size / 1024 as [Current File Size (KB)], 
        -- Show what the new values will be
        1 as [New ATT_IsDeleted],
        1 as [New ATF_IsDeleted],
        0 as [New ATF_Value_Size]
    from @RecordsToUpdate
    order by DEF_Name, WFD_ID, ATT_Name;

    -- Show summary count
    select @NumberOfVersionsRecordsToUpdate [Total Attachment Version Records to Update]
    select @NumberOfFileRecordsToUpdate [Total Attachment File Records to Update]
    
    print '======================================================='
    print 'Review the above data carefully before proceeding with the update.'
    print 'To execute the update, set @dryrun = 0 at the top of the script.'
    print '======================================================='
end
else
begin
    -- =============================================================================
    -- ACTUAL UPDATE STATEMENTS
    -- =============================================================================
    declare @UpdateCount int = (select count(*) from @RecordsToUpdate);
    print 'EXECUTING UPDATE: Processing ' + cast(@UpdateCount as varchar) + ' records...'
    print 'Total Attachment Version Records to Update: ' + cast(@NumberOfVersionsRecordsToUpdate as varchar)
    print 'Total Attachment File Records to Update: ' + cast(@NumberOfFileRecordsToUpdate as varchar)
    print '======================================================='

    begin transaction

    -- Update WFAttachmentFiles table
    update files
    set ATF_IsDeleted = 1,
        ATF_Value = 0x0
    from [webcon_prod_Content].dbo.WFAttachmentFiles as files
    inner join @RecordsToUpdate as recordsToUpdate on files.ATF_ID = recordsToUpdate.ATF_ID;

    set @RowCount = @@ROWCOUNT
    if (@RowCount <> @NumberOfVersionsRecordsToUpdate) begin
        print 'WARNING: Number of updated file versions records (' + cast(@RowCount as varchar) + ') does not match expected count (' + cast(@NumberOfVersionsRecordsToUpdate as varchar) + ').'
        rollback transaction
        print 'Rolling back transaction'
        return
    end else begin 
        print 'All expected ' + cast(@RowCount as varchar) + ' expected file version records have bene updated'
    end

    -- Update WFDataAttachmets table
    update fileInformation
    set ATT_IsDeleted = 1        
    from [webcon_prod_Content].dbo.WFDataAttachmets fileInformation
    inner join (select distinct ATT_ID from @RecordsToUpdate) as recordsToUpdate on fileInformation.ATT_ID = recordsToUpdate.ATT_ID;

    set @RowCount = @@ROWCOUNT
    if (@RowCount <> @NumberOfFileRecordsToUpdate) begin
        print 'WARNING: Number of updated file records (' + cast(@RowCount as varchar) + ') does not match expected count (' + cast(@NumberOfFileRecordsToUpdate as varchar) + ').'
        print 'Rolling back transaction'
        rollback transaction
        return
    end else begin 
        print 'All expected ' + cast(@RowCount as varchar) + ' expected file records have bene updated'
    end
    
   
    -- rollback transaction  -- Uncomment for developing purposes 
    commit transaction

    print 'Script completed. Review the verification results above.'
end

