SELECT 
	ROW_NUMBER () OVER ( order by command.[BRD_ID] asc) as RowNumber
	, APP_ID as Application
	, process.DEF_Name as Process
	, command.[BRD_ID]  Command_BRD_ID
	, command.[BRD_BRDID] as Command_BRD_BRDID
	, command.[BRD_Name] as Command_BRD_Name
	, command.[BRD_Value] as Command_BRD_Value
	, command.[BRD_Documentation] as Command_BRD_Documentation
	, parent.[BRD_ID]  Command_BRD_ID
	, parent.[BRD_BRDID] as Command_BRD_BRDID
	, parent.[BRD_Name] as Command_BRD_Name
	, parent.[BRD_Value] as Command_BRD_Value
	, parent.[BRD_Documentation] as Command_BRD_Documentation
FROM [dbo].[WFBusinessRuleDefinitions] command
  left join [dbo].[WFBusinessRuleDefinitions] parent on parent.BRD_ID = command.BRD_BRDID
  join [dbo].WFDefinitions  process on command.BRD_DEFID = DEF_ID
  join WFApplications on DEF_APPID = APP_ID
where command.BRD_Value like '%WFCONCOL_ID:%'
