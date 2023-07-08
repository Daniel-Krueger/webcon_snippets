SELECT TOP (1000)
	ROW_NUMBER () OVER ( order by [WFCON_ID] asc) as RowNumber
	, APP_Name as Application
	, DEF_Name as Process
	, [WFCON_ID]
    , [WFCON_Prompt]
    , [WFCON_SelectOrCaml]
    , [WFCON_DefaultSelect]      
    , [WFCON_Config]
      
  FROM [dbo].[WFConfigurations] join WFDefinitions on WFCON_DEFID = DEF_ID
  join WFApplications on DEF_APPID = APP_ID
  where [WFCON_SelectOrCaml] like '%WFCONCOL_ID:%' 
  or [WFCON_DefaultSelect] like '%WFCONCOL_ID:%' 
  or [WFCON_Config] like '%WFCONCOL_ID:%' 