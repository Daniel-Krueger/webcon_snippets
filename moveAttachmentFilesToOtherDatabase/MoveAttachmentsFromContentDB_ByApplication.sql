/* Using the GUID will allow us to execute the same script on different environments */
/* This version uses a table variable to process multiple workflow definitions from a specific application */

declare @defIds table (DEF_ID int)

insert into @defIds (DEF_ID)
select DEF_ID 
	from WFDefinitions 
/* Dummy application app 6fa81b0b-20f1-4432-84e8-537102115156 */
	where DEF_APPID = (select APP_ID from WFApplications where APP_Guid = '6fa81b0b-20f1-4432-84e8-537102115156')

insert into [DEV01_BPS_Content_DKR_Att].dbo.WFAttachmentFiles (
    ATF_WFDID, ATF_ATTID, ATF_Value, ATF_TSInsert, ATF_TSUpdate, 
    ATF_IsDeleted, ATF_Version, ATF_AttachmentImage, ATF_OrginalValueHash, ATF_FileType, 
    ATF_CreatedBy, ATF_UpdatedBy, ATF_FlexiData, ATF_AttributesMapping, ATF_OrginalName, ATF_FRData
)
select 
    ATF_WFDID, ATF_ATTID, ATF_Value, ATF_TSInsert, ATF_TSUpdate, 
    ATF_IsDeleted, ATF_Version, ATF_AttachmentImage, ATF_OrginalValueHash, ATF_FileType, 
    ATF_CreatedBy, ATF_UpdatedBy, ATF_FlexiData, ATF_AttributesMapping, ATF_OrginalName, ATF_FRData
from 
    WFAttachmentFiles 
    join WFDataAttachmets on ATF_ATTID = ATT_ID
    join WFElements on ATT_WFDID = WFD_ID
    join WFDocTypes on WFD_DTYPEID = DTYPE_ID
    join @defIds on DTYPE_DEFID = DEF_ID

update WFDefinitions
 set DEF_AttachmentsDatabase = 'BPS_Content_Att2'
where DEF_ID in (select DEF_ID from @defIds)