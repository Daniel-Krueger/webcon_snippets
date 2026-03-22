select isnull(
  (select
      ACB_ID
     , ACB_Guid
     , ACB_Icon
     , replace(replace(replace(replace(replace(replace(replace(replace(replace(DefaultName, '\', '\u005c'), '''', '\u0027'), '"', '\u0022'), '/', '\u002f'), '$', '\u0024'), '{', '\u007b'), '}', '\u007d'), '[', '\u005b'), ']', '\u005d') as DefaultName
     , replace(replace(replace(replace(replace(replace(replace(replace(replace(ActionTranslation, '\', '\u005c'), '''', '\u0027'), '"', '\u0022'), '/', '\u002f'), '$', '\u0024'), '{', '\u007b'), '}', '\u007d'), '[', '\u005b'), ']', '\u005d') as ActionTranslation
   from 
   (
   select
     ACB_ID
     , ACB_Guid
     , ACB_Icon
     , ACB_Name as DefaultName
     , isnull(
       (
           select Trans_name 
           from Translates
           -- Trans-ObjId See table DicTranslationsObjects
           where TRANS_OBJID = 58
           and TRANS_ELEMID = ACB_ID
           and TRANS_LANID = (select LAN_ID from TranslateLanguages where LAN_Name = '{USERLAN}')
         ),isnull(
       (
           select Trans_name 
           from Translates
           -- Trans-ObjId See table DicTranslationsObjects
           where TRANS_OBJID = 58
           and TRANS_ELEMID = ACB_ID
           and TRANS_LANID = (select LAN_ID from TranslateLanguages where LAN_Name = left('{USERLAN}',2))
         ), ACB_Name)) as ActionTranslation
     
   from WFActionButtons 
   where ACB_WFID = {WF_ID}
   ) as data
   FOR JSON AUTO),
  '[]'
) as JsonResult