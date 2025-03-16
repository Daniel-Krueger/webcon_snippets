# Does not  release the default hotkey ctrl+shift+s...

$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (!$currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Must be executed in administrator mode" -ForegroundColor Red
}
else {
    $registryPath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge"
    $propertyName = "WebCaptureEnabled"
    $propertyValue = 0

    # Create the registry key if it doesn't exist
    if (-not (Test-Path $registryPath)) {
        New-Item -Path $registryPath -Force | Out-Null
    }

    # Set the registry value
    Set-ItemProperty -Path $registryPath -Name $propertyName -Value $propertyValue -Type DWord
    Write-Host "WebCaptureEnabled set to $propertyValue"
    
}
# Keep the window open after execution
Pause