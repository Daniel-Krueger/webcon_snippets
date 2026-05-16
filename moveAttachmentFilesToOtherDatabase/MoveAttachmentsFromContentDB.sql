/* Using the GUID will allow us to execute the same script on different environments */
declare @defId int = (select DEF_ID from WFDefinitions where DEF_Guid = 'de6a610b-ca59-4058-9907-53f6b3887431')

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
where 
    DTYPE_DEFID = @defId

update WFDefinitions
 set DEF_AttachmentsDatabase = 'BPS_Content_Att2'
where DEF_ID = @defId