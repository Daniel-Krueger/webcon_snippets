/* Using the GUID will allow us to execute the same script on different environments */
declare @defId int = (select DEF_ID from WFDefinitions  where DEF_Guid = 'de6a610b-ca59-4058-9907-53f6b3887431')

select WFAttachmentFiles.ATF_ATTID, WFAttachmentFiles.ATF_Version, WFAttachmentFiles.ATF_OrginalName
from 
  WFAttachmentFiles 
	join WFDataAttachmets on ATF_ATTID = ATT_ID		
	/* The V_WFElements view would be another option, but the execution will be longer because of the numerous joins */
	join WFElements on ATT_WFDID = WFD_ID
	join WFDocTypes on  WFD_DTYPEID = DTYPE_ID
where 
 DTYPE_DEFID = @defId


 
