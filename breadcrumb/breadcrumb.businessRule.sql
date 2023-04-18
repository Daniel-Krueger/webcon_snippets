WITH recursiveQuery AS
(
    SELECT WFD_ID, WFD_WFDID, WFD_DTYPEID, APP_ID,WFD_AttText1Glob,WFD_Signature, 0 as ParentLevel
      FROM V_WFElements as startingTable
	  WHERE 
      (WFD_ID = {WFD_ID}and (('{BRP:123}' = '') or ('{BRP:123}' = 0)))
      or 
      (WFD_ID = '{BRP:123}' and '{BRP:123}' > 0)
    UNION ALL
    SELECT parentTable.WFD_ID, parentTable.WFD_WFDID, parentTable.WFD_DTYPEID, childTable.APP_ID
          , parentTable.WFD_AttText1Glob,parentTable.WFD_Signature
          , childTable.ParentLevel +1 as ParentLevel
      FROM V_WFElements as parentTable INNER JOIN recursiveQuery as childTable
        ON parentTable.WFD_ID = childTable.WFD_WFDID
      WHERE ('{BRP:124}' = '' ) or ( '{BRP:124}' > 0 and childTable.ParentLevel< '{BRP:124}' ) 
)
/* for debugging purposes in management studio
  SELECT *, (select isnull(
  (
    select Trans_name 
    from Translates
    -- Trans-ObjId See table DicTranslationsObjects
    where TRANS_OBJID = 13
    and TRANS_ELEMID = WFD_DTYPEID
    and TRANS_LANID = (select LAN_ID from TranslateLanguages where LAN_Name = '{USERLAN}')
  )
  , 
    (select DTYPE_Name         
      from WFDocTypes
      where DTYPE_ID =WFD_DTYPEID
  )) as Translation) as Translation
FROM recursiveQuery  
*/
 
 select '['+STUFF(
  (
  SELECT CHAR(123)+ 
    '"id":'+cast(WFD_ID as varchar(10))
    + ', "parentId":'+(case when WFD_WFDID is null then 'null' else cast(WFD_WFDID as varchar(10)) end)
    + ', "parentLevel":'+cast(ParentLevel as varchar(10))
    + ', "signature":"'+ replace(isnull(WFD_Signature,''),'"',' ')+'"'
    + ', "title":"'+ replace(replace(isnull(WFD_AttText1Glob,''),'"',' '),'''',' ')+'"'
    + ', "appId":' +cast(APP_ID as varchar(10))
    
    + ', "formType":"'+ replace(replace((select isnull(
            (
              select Trans_name 
              from Translates
              -- Trans-ObjId See table DicTranslationsObjects
              where TRANS_OBJID = 13
              and TRANS_ELEMID = WFD_DTYPEID
              and TRANS_LANID = (select LAN_ID from TranslateLanguages where LAN_Name = '{USERLAN}')
            )
            , 
              (select DTYPE_Name         
                from WFDocTypes
                where DTYPE_ID =WFD_DTYPEID
            )) as Translation),'"',' '),'''',' ')+'"' 
    + CHAR(125)+','
FROM recursiveQuery 
order by ParentLevel desc
    FOR XML PATH('')
  ),1,0,'')+']'