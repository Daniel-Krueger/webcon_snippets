/* Using the GUID will allow us to execute the same script on different environments */
declare @defId int = (select DEF_ID from WFDefinitions where DEF_Guid = 'de6a610b-ca59-4058-9907-53f6b3887431')

delete from WFAttachmentFiles
where ATF_ATTID in (
    select ATT_ID
    from WFDataAttachmets
    join WFElements on ATT_WFDID = WFD_ID
    join WFDocTypes on WFD_DTYPEID = DTYPE_ID
    where DTYPE_DEFID = @defId
)
