select BRD_Name, BRD_ID, BRD_GUID,  BRP_Name,BRP_ID, BRP_Guid 
FROM [dbo].[WFBusinessRuleDefinitions] left join WFBusinessRuleParameters on BRD_ID = BRP_RuleID
where BRD_ID = 1453
