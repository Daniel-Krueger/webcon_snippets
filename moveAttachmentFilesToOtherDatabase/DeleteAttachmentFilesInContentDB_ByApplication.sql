/* Using the GUID will allow us to execute the same script on different environments */
/* This version uses a table variable to process multiple workflow definitions from a specific application */

declare @defIds table (DEF_ID int)

insert into @defIds (DEF_ID)
select DEF_ID 
	from WFDefinitions 
	/* Dummy application app 6fa81b0b-20f1-4432-84e8-537102115156 */
	where DEF_APPID = (select APP_ID from WFApplications where APP_Guid = '6fa81b0b-20f1-4432-84e8-537102115156')

delete from WFAttachmentFiles
where ATF_ATTID in (
    select ATT_ID
    from WFDataAttachmets
    join WFElements on ATT_WFDID = WFD_ID
    join WFDocTypes on WFD_DTYPEID = DTYPE_ID
    join @defIds on DTYPE_DEFID = DEF_ID
)