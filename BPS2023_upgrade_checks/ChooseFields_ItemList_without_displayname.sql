select DET_WFDID, DCN_Prompt, FDD_Name, DCN_WFCONID, DET_Att1
FROM [dbo].[WFFieldDetailDefinitions] join [dbo].[WFDetailConfigs]
on FDD_ID = DCN_FDDID 
and DCN_FieldDetailTypeID = 3 
and FDD_Name = 'DET_Att1'
join WFElementDetails 
on DCN_WFCONID = DET_WFCONID
and (DET_Att1 is not null and DET_Att1 <> '' and CHARINDEX('#',DET_Att1) = 0)
UNION ALL
select DET_WFDID, DCN_Prompt, FDD_Name, DCN_WFCONID, DET_Att2
FROM [dbo].[WFFieldDetailDefinitions] join [dbo].[WFDetailConfigs]
on FDD_ID = DCN_FDDID 
and DCN_FieldDetailTypeID = 3 
and FDD_Name = 'DET_Att2'
join WFElementDetails 
on DCN_WFCONID = DET_WFCONID
and (DET_Att2 is not null and DET_Att2 <> '' and CHARINDEX('#',DET_Att2) = 0)
UNION ALL
select DET_WFDID, DCN_Prompt, FDD_Name, DCN_WFCONID, DET_Att3
FROM [dbo].[WFFieldDetailDefinitions] join [dbo].[WFDetailConfigs]
on FDD_ID = DCN_FDDID 
and DCN_FieldDetailTypeID = 3 
and FDD_Name = 'DET_Att3'
join WFElementDetails 
on DCN_WFCONID = DET_WFCONID
and (DET_Att3 is not null and DET_Att3 <> '' and CHARINDEX('#',DET_Att3) = 0)
UNION ALL

select DET_WFDID, DCN_Prompt, FDD_Name, DCN_WFCONID, DET_Att4
FROM [dbo].[WFFieldDetailDefinitions] join [dbo].[WFDetailConfigs]
on FDD_ID = DCN_FDDID 
and DCN_FieldDetailTypeID = 3 
and FDD_Name = 'DET_Att4'
join WFElementDetails 
on DCN_WFCONID = DET_WFCONID
and (DET_Att4 is not null and DET_Att4 <> '' and CHARINDEX('#',DET_Att4) = 0)

UNION ALL
select DET_WFDID, DCN_Prompt, FDD_Name, DCN_WFCONID, DET_Att5
FROM [dbo].[WFFieldDetailDefinitions] join [dbo].[WFDetailConfigs]
on FDD_ID = DCN_FDDID 
and DCN_FieldDetailTypeID = 3 
and FDD_Name = 'DET_Att5'
join WFElementDetails 
on DCN_WFCONID = DET_WFCONID
and (DET_Att5 is not null and DET_Att5 <> '' and CHARINDEX('#',DET_Att5) = 0)
UNION ALL

select DET_WFDID, DCN_Prompt, FDD_Name, DCN_WFCONID, DET_Att6
FROM [dbo].[WFFieldDetailDefinitions] join [dbo].[WFDetailConfigs]
on FDD_ID = DCN_FDDID 
and DCN_FieldDetailTypeID = 3 
and FDD_Name = 'DET_Att6'
join WFElementDetails 
on DCN_WFCONID = DET_WFCONID
and (DET_Att6 is not null and DET_Att6 <> '' and CHARINDEX('#',DET_Att6) = 0)

UNION ALL
select DET_WFDID, DCN_Prompt, FDD_Name, DCN_WFCONID, DET_Att7
FROM [dbo].[WFFieldDetailDefinitions] join [dbo].[WFDetailConfigs]
on FDD_ID = DCN_FDDID 
and DCN_FieldDetailTypeID = 3 
and FDD_Name = 'DET_Att7'
join WFElementDetails 
on DCN_WFCONID = DET_WFCONID
and (DET_Att7 is not null and DET_Att7 <> '' and CHARINDEX('#',DET_Att7) = 0)
UNION ALL

select DET_WFDID, DCN_Prompt, FDD_Name, DCN_WFCONID, DET_Att8
FROM [dbo].[WFFieldDetailDefinitions] join [dbo].[WFDetailConfigs]
on FDD_ID = DCN_FDDID 
and DCN_FieldDetailTypeID = 3 
and FDD_Name = 'DET_Att8'
join WFElementDetails 
on DCN_WFCONID = DET_WFCONID
and (DET_Att8 is not null and DET_Att8 <> '' and CHARINDEX('#',DET_Att8) = 0)

UNION ALL
select DET_WFDID, DCN_Prompt, FDD_Name, DCN_WFCONID, DET_Att9
FROM [dbo].[WFFieldDetailDefinitions] join [dbo].[WFDetailConfigs]
on FDD_ID = DCN_FDDID 
and DCN_FieldDetailTypeID = 3 
and FDD_Name = 'DET_Att9'
join WFElementDetails 
on DCN_WFCONID = DET_WFCONID
and (DET_Att9 is not null and DET_Att9 <> '' and CHARINDEX('#',DET_Att9) = 0)
UNION ALL

select DET_WFDID, DCN_Prompt, FDD_Name, DCN_WFCONID, DET_Att10
FROM [dbo].[WFFieldDetailDefinitions] join [dbo].[WFDetailConfigs]
on FDD_ID = DCN_FDDID 
and DCN_FieldDetailTypeID = 3 
and FDD_Name = 'DET_Att10'
join WFElementDetails 
on DCN_WFCONID = DET_WFCONID
and (DET_Att10 is not null and DET_Att10 <> '' and CHARINDEX('#',DET_Att10) = 0)



