SELECT TOP (1000)
	ROW_NUMBER () OVER ( order by directSource.[WFS_ID] asc) as RowNumber
	, directSource.[WFS_ID]
	, directSource.WFS_Name
	, directSource.[WFS_WFSID] as IdParentSource      
	, parentSource.WFS_Name as ParentSource
	, directSource.[WFS_COMID]
	, directSource.[WFS_Type]
	, directSource.[WFS_SelectCommand]
FROM [dbo].[WFDataSources] directSource
	left join [dbo].[WFDataSources] parentSource on parentSource.WFS_ID = directSource.WFS_WFSID
where directSource.WFS_SelectCommand like '%WFCONCOL_ID:%'