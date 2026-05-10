#Requires -RunAsAdministrator
#Requires -Modules WebAdministration

<#
.SYNOPSIS
    Creates a maintenance website in IIS for WEBCON BPS maintenance pages.

.DESCRIPTION
    This script creates a new IIS website for displaying maintenance pages during WEBCON BPS maintenance.
    It copies the HTTPS binding from an existing WEBCONBPS website but uses port 4443.

.PARAMETER SourceWebsiteName
    Name of the source website to copy HTTPS binding from (default: "WEBCONBPS")

.PARAMETER MaintenanceWebsiteName
    Name of the new maintenance website to create (default: "MaintenancePage")

.PARAMETER MaintenancePort
    Port number for the maintenance website (default: 4443)

.PARAMETER MaintenancePath
    Physical path for maintenance files (default: "C:\inetpub\MaintenancePage")

.EXAMPLE
    New-MaintenanceSite
    Creates maintenance site with default settings

.EXAMPLE
    New-MaintenanceSite -SourceWebsiteName "MyWEBCONSite" -MaintenancePort 8443
    Creates maintenance site copying from custom source website on port 8443
#>

function New-MaintenanceSite {
    [CmdletBinding()]
    param(
        [Parameter(HelpMessage = "Name of the source website to copy HTTPS binding from")]
        [string]$SourceWebsiteName = "WEBCONBPS",
        
        [Parameter(HelpMessage = "Name of the new maintenance website to create")]
        [string]$MaintenanceWebsiteName = "MaintenancePage",
        
        [Parameter(HelpMessage = "Port number for the maintenance website")]
        [ValidateRange(1, 65535)]
        [int]$MaintenancePort = 4443,
        
        [Parameter(HelpMessage = "Physical path for maintenance files")]
        [string]$MaintenancePath = "C:\inetpub\MaintenancePage"
    )

    try {
        Write-Host "=== WEBCON BPS Maintenance Site Setup ===" -ForegroundColor Green
        Write-Host ""

        # Check if WebAdministration module is available
        if (-not (Get-Module -ListAvailable -Name WebAdministration)) {
            throw "WebAdministration module is not available. Please install IIS Management Tools."
        }

        Import-Module WebAdministration -Force

        # Check if source website exists
        Write-Host "Checking source website '$SourceWebsiteName'..."
        $sourceWebsite = Get-Website -Name $SourceWebsiteName -ErrorAction SilentlyContinue
        if (-not $sourceWebsite) {
            throw "Source website '$SourceWebsiteName' not found. Available websites: $(Get-Website | Select-Object -ExpandProperty Name)"
        }
        Write-Host "Source website '$SourceWebsiteName' found" -ForegroundColor Green

        # Get HTTPS binding from source website
        Write-Host "Retrieving HTTPS binding from source website..."
        $httpsBinding = Get-WebBinding -Name $SourceWebsiteName | Where-Object { $_.protocol -eq "https" }
        if (-not $httpsBinding) {
            throw "No HTTPS binding found on source website '$SourceWebsiteName'"
        }

        # Extract certificate information and binding properties
        $certificateHash = $httpsBinding.certificateHash
        $certificateStoreName = $httpsBinding.certificateStoreName
        $sslFlags = $httpsBinding.sslFlags
        # *:443:webcon.example.com
        $ipAddress = $httpsBinding.bindingInformation.Split(':')[0]
        $hostHeader = $httpsBinding.bindingInformation.Split(':')[2]
        

        Write-Host "HTTPS binding found - Certificate: $($certificateHash.Substring(0,16))..." -ForegroundColor Green
        Write-Host "  Store: $certificateStoreName, SSL Flags: $sslFlags"
        if ($hostHeader) {
            Write-Host "  Host Header: $hostHeader"
        }
        if ($ipAddress -and $ipAddress -ne '*') {
            Write-Host "  IP Address: $ipAddress"
        }

        # Create maintenance directory if it doesn't exist
        Write-Host "Creating maintenance directory '$MaintenancePath'..."
        if (-not (Test-Path $MaintenancePath)) {
            New-Item -Path $MaintenancePath -ItemType Directory -Force | Out-Null
            Write-Host "Directory created: $MaintenancePath" -ForegroundColor Green
        }
        else {
            Write-Host "Directory exists: $MaintenancePath" -ForegroundColor Green
        }

        # Remove existing maintenance website if it exists
        $existingWebsite = Get-Website -Name $MaintenanceWebsiteName -ErrorAction SilentlyContinue
        if ($existingWebsite) {
            Write-Host "Removing existing maintenance website..."
            Remove-Website -Name $MaintenanceWebsiteName
            Write-Host "Existing website '$MaintenanceWebsiteName' removed" -ForegroundColor Yellow
        }

        # Create new maintenance website
        Write-Host "Creating maintenance website '$MaintenanceWebsiteName'..."
        $newWebsite = New-Website -Name $MaintenanceWebsiteName -PhysicalPath $MaintenancePath -Port 80
        Write-Host "Website created: $MaintenanceWebsiteName" -ForegroundColor Green

        # Remove default HTTP binding
        Write-Host "Configuring bindings..."
        Remove-WebBinding -Name $MaintenanceWebsiteName -Protocol "http" -Port 80

        New-WebBinding -Name $MaintenanceWebsiteName -Protocol "https" -IPAddress $ipAddress -Port $MaintenancePort -HostHeader $hostHeader -SslFlags $sslFlags
    
        # Set the certificate
        $cert = Get-ChildItem -Path "Cert:\LocalMachine\$certificateStoreName" | Where-Object { $_.Thumbprint -eq $certificateHash }
        if ($cert) {
            $binding = Get-WebBinding -Name $MaintenanceWebsiteName -Protocol "https"
            $binding.AddSslCertificate($certificateHash, $certificateStoreName)
            Write-Host "HTTPS binding created on port $MaintenancePort with SSL certificate" -ForegroundColor Green
            if ($hostHeader) {
                Write-Host "  Copied host header: $hostHeader" -ForegroundColor Gray
            }
        }
        else {
            Write-Host "! Certificate not found in store. HTTPS binding created but certificate needs to be configured manually." -ForegroundColor Red
        }

        # Add firewall rule for maintenance port
        Write-Host "Configuring firewall rule..."
        $existingRule = Get-NetFirewallRule -DisplayName $MaintenanceWebsiteName -ErrorAction SilentlyContinue
        if ($existingRule) {
            Remove-NetFirewallRule -DisplayName $MaintenanceWebsiteName
        }
        New-NetFirewallRule -DisplayName $MaintenanceWebsiteName -Direction Inbound -Protocol TCP -LocalPort $MaintenancePort -Action Allow | Out-Null
        Write-Host "Firewall rule configured: port $MaintenancePort allowed inbound" -ForegroundColor Green

        # Configure default document
        Write-Host "Configuring default documents..."
    
        # Clear existing default documents for this site
        $defaultDocPath = "IIS:\Sites\$MaintenanceWebsiteName"
        Clear-WebConfiguration -Filter "system.webServer/defaultDocument/files" -Location $defaultDocPath
    
        # Add index.html as default document
        Add-WebConfiguration -Filter "system.webServer/defaultDocument/files" -Location $defaultDocPath -Value @{value = "index.html" }
    
        # Enable default document feature
        Set-WebConfiguration -Filter "system.webServer/defaultDocument" -Location $defaultDocPath -Value @{enabled = "true" }
    
        Write-Host "Default document configured: index.html" -ForegroundColor Green

        # Reuse application pool from source website
        Write-Host "Configuring application pool..."
        $sourceAppPoolName = Get-ItemProperty -Path "IIS:\Sites\$SourceWebsiteName" -Name applicationPool
    
        if ($sourceAppPoolName) {
            Set-ItemProperty -Path "IIS:\Sites\$MaintenanceWebsiteName" -Name applicationPool -Value $sourceAppPoolName
            Write-Host "Application pool configured: $sourceAppPoolName (reused from $SourceWebsiteName)" -ForegroundColor Green
        }
        else {
            Write-Host "! Could not determine application pool from source website. Using DefaultAppPool." -ForegroundColor Yellow
            Set-ItemProperty -Path "IIS:\Sites\$MaintenanceWebsiteName" -Name applicationPool -Value "DefaultAppPool"
        }

        Write-Host ""
        Write-Host "=== SETUP COMPLETED SUCCESSFULLY ===" -ForegroundColor Green
        Write-Host ""
        Write-Host "Maintenance website details:"
        Write-Host "  Name: $MaintenanceWebsiteName"
        Write-Host "  Path: $MaintenancePath"
        Write-Host "  URL:  https://$(hostname):$MaintenancePort"
        Write-Host "  Default Document: index.html"
        Write-Host ""
        Write-Host "To activate maintenance mode:" -ForegroundColor Cyan
        Write-Host "  1. Stop the main WEBCONBPS website"
        Write-Host "  2. Change the WEBCONBPS HTTPS binding from port 443 to 4443"
        Write-Host "  3. Change this maintenance site HTTPS binding from port $MaintenancePort to 443"
        Write-Host ""
        Write-Host "To deactivate maintenance mode:" -ForegroundColor Cyan
        Write-Host "  1. Change this maintenance site HTTPS binding from port 443 to $MaintenancePort"
        Write-Host "  2. Change the WEBCONBPS HTTPS binding from port 4443 to 443"
        Write-Host "  3. Start the main WEBCONBPS website"

    }
    catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common solutions:" -ForegroundColor Yellow
        Write-Host "  - Run PowerShell as Administrator"
        Write-Host "  - Ensure IIS and WebAdministration module are installed"
        Write-Host "  - Verify the source website name is correct"
        Write-Host "  - Check that the source website has an HTTPS binding"
    }
}

# If script is called directly (not dot-sourced), execute the function
if ($MyInvocation.InvocationName -ne '.') {
    New-MaintenanceSite @PSBoundParameters
}