/* Merging all the rows into a single column and adding a leading [ and trailing ] to return a json array */
select isnull('['+
   STUFF(
    (
      /* Creating the json structure and retrieving the color from the xml string*/
      select 
           ', '+ CHAR(123)
            + '"id":'+ cast(Path_ID as varchar(10))
            +',"name":"'+replace(PATH_Name,'"','''')+'"'
            +',"color":"'+isnull(XmlData.value('(/data/@color)[1]','nvarchar(max)'),'default') +'"'
            +',"title":"'+replace(isnull((select TRANS_Name from Translates join TranslateLanguages on Translates.TRANS_LANID = TranslateLanguages.LAN_ID and TRANS_ELEMID = PATH_ID and TRANS_OBJID = 9  and SUBSTRING(LAN_Name,1,2) = SUBSTRING('{USERLAN}',1,2)  ),PATH_Name),'"','''')+'"'
            +CHAR(125)
            
      from 
            (
                  /* Returning the path information */
                  select Path_ID, PATH_Name, Convert(xml,PATH_DesignerData)  as XmlData
                  from WFAvaiblePaths where PATH_STPID = {STP_ID}
            ) temp
     FOR XML PATH('')
  )
  ,1,2,'')
  +']','[]')