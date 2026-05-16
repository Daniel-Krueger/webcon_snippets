-- 4. Batch Delete/Update Stored Procedure
use AttachmentCleanupDB;
go
exec sp_AttachmentCleanup_BatchDelete @BatchSize = 1000