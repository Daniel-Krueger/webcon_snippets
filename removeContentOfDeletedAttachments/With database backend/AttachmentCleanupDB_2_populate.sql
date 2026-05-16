-- 2. Population Script: Populate log table with IDs and file sizes
-- Run this in the AttachmentCleanupDB context
-- The attachment files may exist in the content database or one of the attachment databases.
-- Adjust the database names as needed. This applies to the variable and the FROM clause.
-- Variables are used, so that we know which database name should be the attachment database and content database in the select

declare @AttachmentDbName sysname = N'webcon_prod_Content';
declare @ContentDbName sysname = N'webcon_prod_Content';

insert into AttachmentCleanupLog (
    Process, WorkflowInstance, FileId, [File], [CurrentFileDeletedStatus], FileVersionId, FileVersion, CurrentVersionDeletedStatus, CurrentFileSizeKB, AttachmentDbName, ContentDbName
)
select 
    DEF_Name,
    att.ATT_WFDID,
    att.ATT_ID,
    att.ATT_Name,
    att.ATT_IsDeleted,
    atf.ATF_ID,
    atf.ATF_Version,
    atf.ATF_IsDeleted,
    datalength(atf.ATF_Value) as FileSizeBytes,
    @AttachmentDbName,
    @ContentDbName
from [webcon_prod_Content].dbo.WFAttachmentFiles atf
join [webcon_prod_Content].dbo.WFDataAttachmets att on att.ATT_ID = atf.ATF_ATTID
join [webcon_prod_Content].dbo.V_WFElements on ATT_WFDID = WFD_ID
where ATT_IsDeleted = 1 and datalength(ATF_Value) > 0 and ATT_WFDID = 814
print 'Populated AttachmentCleanupLog with records to process.';