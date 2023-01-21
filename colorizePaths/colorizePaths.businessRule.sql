/* Merging all the rows into a single column and adding a leading [ and trailing ] to return a json array */
select '['+
   STUFF(
    (
      /* Creating the json structure and retrieving the color from the xml string*/
      select 
            CHAR(123)
            + '"id":'+ cast(Path_ID as varchar(10))
            +',"name":"'+replace(PATH_Name,'"','''')
            +'","color":"'+isnull(XmlData.value('(/data/@color)[1]','nvarchar(max)'),'default') +'"'
            +CHAR(125)
            +','
      from 
            (
                  /* Returning the path information */
                  select Path_ID, PATH_Name, Convert(xml,PATH_DesignerData)  as XmlData
                  from WFAvaiblePaths where PATH_STPID = {STP_ID}
            ) temp
     FOR XML PATH('')
  )
  ,1,0,'')
  +']'