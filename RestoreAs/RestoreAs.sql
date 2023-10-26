:setvar backupContentDB "C:\Backup\PRS_BPS_Content_CopyOnly_2023-10-13_104804.bak"
:setvar backupAttachmetnDB "C:\Backup\PRS_BPS_Content_Att_CopyOnly_2023-10-13_104804.bak"
:setvar backupArchiveDB "C:\Backup\PRS_BPS_Content_Arch_CopyOnly_2023-10-13_104804.bak"

:setvar sourceDatabase "PRS_BPS_Content"
:setvar targetDatabase "DEV20232_BPS_Content"
:setvar dataFileLocation "C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQL\DATA"
:setvar logFileLocation "C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQL\DATA"

:setvar sourceConfigDB "PRS_BPS_Config"
:setvar targetConfigDB "DEV_BPS_Config"
:setvar applicationPoolAccount "localcomputer\WEBCON_IIS_AppPool"
:setvar sqlUserAccount "DEV_BPS_SQLUser"
:out "c:\temp\restoresas.txt"
:error "c:\temp\restoresasError.txt"
:on ERROR Exit
:setvar IsSqlCmdEnabled "True"

GO
IF ('$(IsSqlCmdEnabled)' = '$' + '(IsSqlCmdEnabled)')
BEGIN
  PRINT('Use SqlCmd is disabled!!');
  SET NOEXEC ON;
  RAISERROR ('This script must be run in SQLCMD mode.', 20, 1) WITH LOG
END


USE [master]
RESTORE DATABASE [$(targetDatabase)] 
FROM DISK = N'$(backupContentDB)' WITH 
FILE = 1, 
MOVE N'$(sourceDatabase)' TO N'$(dataFileLocation)\$(targetDatabase).mdf', 
MOVE N'$(sourceDatabase)_log' TO N'$(logFileLocation)\$(targetDatabase)_log.ldf', NOUNLOAD, STATS = 5
print 'Restored "$(sourceDatabase)" as "$(targetDatabase)"'
ALTER DATABASE [$(targetDatabase)] MODIFY FILE (NAME=N'$(sourceDatabase)', NEWNAME=N'$(targetDatabase)')
ALTER DATABASE [$(targetDatabase)] MODIFY FILE (NAME=N'$(sourceDatabase)_log', NEWNAME=N'$(targetDatabase)_log')
GO
USE [master]
RESTORE DATABASE [$(targetDatabase)_Att] 
FROM DISK = N'$(backupAttachmetnDB)'
WITH FILE = 1, 
MOVE N'$(sourceDatabase)_Att' TO N'$(dataFileLocation)\$(targetDatabase)_Att.mdf', 
MOVE N'$(sourceDatabase)_Att_log' TO N'$(dataFileLocation)\$(targetDatabase)_Att_log.ldf', NOUNLOAD, STATS = 5
ALTER DATABASE [$(targetDatabase)_Att] MODIFY FILE (NAME=N'$(sourceDatabase)_Att', NEWNAME=N'$(targetDatabase)_Att')
ALTER DATABASE [$(targetDatabase)_Att] MODIFY FILE (NAME=N'$(sourceDatabase)_Att_log', NEWNAME=N'$(targetDatabase)_Att_log')
print 'Restored "$(sourceDatabase)_Att" as "$(targetDatabase)_Att"'
GO
USE [master]
RESTORE DATABASE [$(targetDatabase)_Arch] 
FROM DISK = N'$(backupArchiveDB)'
WITH FILE = 1, 
MOVE N'$(sourceDatabase)_Arch' TO N'$(dataFileLocation)\$(targetDatabase)_Arch.mdf', 
MOVE N'$(sourceDatabase)_Arch_log' TO N'$(dataFileLocation)\$(targetDatabase)_Arch_log.ldf', NOUNLOAD, STATS = 5
ALTER DATABASE [$(targetDatabase)_Arch] MODIFY FILE (NAME=N'$(sourceDatabase)_Arch', NEWNAME=N'$(targetDatabase)_Arch')
ALTER DATABASE [$(targetDatabase)_Arch] MODIFY FILE (NAME=N'$(sourceDatabase)_Arch_log', NEWNAME=N'$(targetDatabase)_Arch_log')
print 'Restored "$(sourceDatabase)_Arch" as "$(targetDatabase)_Arch"'
GO

print 'Updating renaming $(sourceDatabase) to $(targetDatabase) in global parameters'
/* Attachment database: Rename content database name */
update [$(targetDatabase)_Att].dbo.[GlobalParameters]
set PRM_Value = '$(targetDatabase)'
where PRM_Value = '$(sourceDatabase)'
/* Archive database: Rename content database name */
update [$(targetDatabase)_Arch].dbo.[GlobalParameters]
set PRM_Value = '$(targetDatabase)'
where PRM_Value = '$(sourceDatabase)'

print 'Updating archive database name'
/* Content database: Rename archiving atabase name */
update [$(targetDatabase)].dbo.[ArchivingDatabases]
set [ARD_Name] = '$(targetDatabase)_Arch'
where [ARD_Name] = '$(sourceDatabase)_Arch'
update [$(targetDatabase)].dbo.[GlobalParameters]
set PRM_Value = '$(targetDatabase)_Arch'
where PRM_Value = '$(sourceDatabase)_Arch'
update [$(targetDatabase)].dbo.[WFDefinitions]
set [DEF_ArchivingDatabase] = '$(targetDatabase)_Arch'
where [DEF_ArchivingDatabase] = '$(sourceDatabase)_Arch'

print 'Updating attachment database name'
/* Content database: Rename attachment atabase name */
update [$(targetDatabase)].dbo.[GlobalParameters]
set PRM_Value = '$(targetDatabase)_Att'
where PRM_Value = '$(sourceDatabase)_Att'
update [$(targetDatabase)].dbo.[WFAttachmentDatabases]
set [ADB_Name] = '$(targetDatabase)_Att'
where [ADB_Name] = '$(sourceDatabase)_Att'
update [$(targetDatabase)].dbo.[WFDefinitions]
set [DEF_AttachmentsDatabase] = '$(targetDatabase)_Att'
where [DEF_AttachmentsDatabase] = '$(sourceDatabase)_Att'

print 'Updating config database name'
update [$(targetDatabase)].dbo.[GlobalParameters]
set PRM_Value = '$(targetConfigDB)'
where PRM_Value = '$(sourceConfigDB)'

print 'Adding new content db to ContentDatabase table'
INSERT INTO [$(targetConfigDB)].dbo.ContentDatabases (CD_Name, CD_Type)
VALUES ('$(targetDatabase)', 1);

/*--------- SQL User account -------------*/
/* Grant permissions to content db */
print 'Adding $(sqlUserAccount) to new databases as db_owner'
USE [$(targetDatabase)]
GO
IF NOT EXISTS (SELECT [name] FROM [sys].[database_principals] WHERE [name] = N'$(sqlUserAccount)')
begin
	CREATE USER [$(sqlUserAccount)] FOR LOGIN [$(sqlUserAccount)] 
end
ALTER USER [$(sqlUserAccount)] WITH DEFAULT_SCHEMA=[dbo]
ALTER ROLE [db_owner] ADD MEMBER [$(sqlUserAccount)]

/*Grant permissions to attachment db */
USE [$(targetDatabase)_Att]
GO
IF NOT EXISTS (SELECT [name] FROM [sys].[database_principals] WHERE [name] = N'$(sqlUserAccount)')
begin
	CREATE USER [$(sqlUserAccount)] FOR LOGIN [$(sqlUserAccount)] 
end
ALTER USER [$(sqlUserAccount)] WITH DEFAULT_SCHEMA=[dbo]
ALTER ROLE [db_owner] ADD MEMBER [$(sqlUserAccount)]

/* Grant permissions to archive db */
USE [$(targetDatabase)_Arch]
GO
IF NOT EXISTS (SELECT [name] FROM [sys].[database_principals] WHERE [name] = N'$(sqlUserAccount)')
begin
	CREATE USER [$(sqlUserAccount)] FOR LOGIN [$(sqlUserAccount)] 
end
ALTER USER [$(sqlUserAccount)] WITH DEFAULT_SCHEMA=[dbo]
ALTER ROLE [db_owner] ADD MEMBER [$(sqlUserAccount)]


/*--------- Application pool account -------------*/
print 'Adding $(applicationPoolAccount) to new databases as db_owner'
/* Grant permissions to content db */
USE [$(targetDatabase)]
GO
IF NOT EXISTS (SELECT [name] FROM [sys].[database_principals] WHERE [name] = N'$(applicationPoolAccount)')
begin
	CREATE USER [$(applicationPoolAccount)] FOR LOGIN [$(applicationPoolAccount)] 
end
ALTER USER [$(applicationPoolAccount)] WITH DEFAULT_SCHEMA=[dbo]
ALTER ROLE [db_owner] ADD MEMBER [$(applicationPoolAccount)]

/* Grant permissions to attachment db */
USE [$(targetDatabase)_Att]
GO
IF NOT EXISTS (SELECT [name] FROM [sys].[database_principals] WHERE [name] = N'$(applicationPoolAccount)')
begin
	CREATE USER [$(applicationPoolAccount)] FOR LOGIN [$(applicationPoolAccount)] 
end
ALTER USER [$(applicationPoolAccount)] WITH DEFAULT_SCHEMA=[dbo]
ALTER ROLE [db_owner] ADD MEMBER [$(applicationPoolAccount)]


/* Grant permissions to archive db */
USE [$(targetDatabase)_Arch]
GO
IF NOT EXISTS (SELECT [name] FROM [sys].[database_principals] WHERE [name] = N'$(applicationPoolAccount)')
begin
	CREATE USER [$(applicationPoolAccount)] FOR LOGIN [$(applicationPoolAccount)] 
end
ALTER USER [$(applicationPoolAccount)] WITH DEFAULT_SCHEMA=[dbo]
ALTER ROLE [db_owner] ADD MEMBER [$(applicationPoolAccount)]
