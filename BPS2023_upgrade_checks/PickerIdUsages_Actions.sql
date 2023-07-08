SELECT TOP (1000) 
	ROW_NUMBER () OVER ( order by actionDefinition.ACT_ID asc) as RowNumber
	, actionProcess.DEF_Name as ActionProcess
	, automationProcess.DEF_Name as AutomationProcess
	, WF_Name
	, STP_Name
	, PATH_Name
	, PLU_Name
	, actionDefinitionAutomation.AUTM_Name
	, actionDefinition.[ACT_ID] 
	, DicActionKinds.EnglishName ActionKind
	, DicActionTypes.ObjectName ActionType
	, actionDefinition.[ACT_Name] actionName
	, actionDefinition.ACT_Description actionDescription
	, actionDefinition.ACT_Configuration actionConfiguration
	, templateAction.ACT_ID templateId
	, templateAction.[ACT_Name] templateName
	, templateAction.ACT_Description templateDescription
	, templateAction.ACT_Configuration templateConfiguration	
FROM [dbo].[WFActions] as actionDefinition
  left join WFDefinitions as actionProcess on DEF_ID = ACT_DEFID 
  join DicActionKinds on ACT_ActionKindID = DicActionKinds.TypeID
  join DicActionTypes on ACT_ActionTypeID = DicActionTypes.TypeID
  left join WorkFlows on ACT_WFID = WF_ID
  left join WFSteps on ACT_STPID = STP_ID
  left join WFAvaiblePaths on ACT_PATHID = PATH_ID
  left join WFPlugIns on PLU_ID = ACT_PLUID
  left join Automations as actionDefinitionAutomation on  actionDefinition.ACT_AUTMID = actionDefinitionAutomation.AUTM_ID
  left join [WFActions] as templateAction on templateAction.ACT_ID = actionDefinition.ACT_ACTID
  left join WFDefinitions  as automationProcess  on actionDefinitionAutomation.AUTM_DEFID = automationProcess.DEF_ID
where actionDefinition.ACT_Configuration like '%WFCONCOL_ID:%'