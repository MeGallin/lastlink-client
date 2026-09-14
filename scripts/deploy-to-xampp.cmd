@echo off
setlocal EnableExtensions

rem Copy the verified Vite build to the local web root used by the LastLink
rem subdomain. Run through npm: npm run build:deploy

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "CLIENT_DIR=%%~fI"
set "SOURCE_DIR=%CLIENT_DIR%\dist"
set "DEPLOY_PARENT=C:\xampp\htdocs\WebSitesDesigns\live"
set "DEPLOY_DIR=%DEPLOY_PARENT%\lastlink"
set "STAGING_DIR=%DEPLOY_PARENT%\lastlink.__staging"
set "BACKUP_DIR=%DEPLOY_PARENT%\lastlink.__backup"
set "HAD_DEPLOYMENT=0"

if not exist "%SOURCE_DIR%\index.html" (
  set "ERROR_MESSAGE=The production build was not found at %SOURCE_DIR%. Run npm run build first."
  goto :fail
)

echo [LastLink] Preparing deployment copy...
echo [LastLink] Source:      %SOURCE_DIR%
echo [LastLink] Destination: %DEPLOY_DIR%

if not exist "%DEPLOY_PARENT%\" (
  echo [LastLink] Creating the deployment parent directory...
  mkdir "%DEPLOY_PARENT%" 2>nul
  if errorlevel 1 (
    set "ERROR_MESSAGE=Could not create the deployment parent directory."
    goto :fail
  )
)

if not exist "%DEPLOY_PARENT%\" (
  set "ERROR_MESSAGE=The deployment parent directory is unavailable."
  goto :fail
)

if exist "%STAGING_DIR%" (
  echo [LastLink] Removing stale staging files...
  rmdir /s /q "%STAGING_DIR%"
  if exist "%STAGING_DIR%" (
    set "ERROR_MESSAGE=Could not remove the previous staging directory."
    goto :fail
  )
)

if exist "%BACKUP_DIR%\" (
  echo [LastLink] Removing the previous rollback snapshot...
  rmdir /s /q "%BACKUP_DIR%"
  if exist "%BACKUP_DIR%\" (
    set "ERROR_MESSAGE=Could not remove the previous rollback snapshot. The live deployment was not changed."
    goto :fail
  )
)

mkdir "%STAGING_DIR%" 2>nul
if errorlevel 1 (
  set "ERROR_MESSAGE=Could not create the staging directory."
  goto :fail
)

echo [LastLink] Staging the build...
robocopy "%SOURCE_DIR%" "%STAGING_DIR%" /MIR /R:2 /W:1 /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (
  set "ERROR_MESSAGE=The build could not be copied to staging."
  goto :fail
)

if not exist "%STAGING_DIR%\index.html" (
  set "ERROR_MESSAGE=The staged build is missing index.html."
  goto :fail
)

if exist "%DEPLOY_DIR%\" (
  echo [LastLink] Holding the current deployment for rollback...
  move /Y "%DEPLOY_DIR%" "%BACKUP_DIR%" >nul
  if errorlevel 1 (
    set "ERROR_MESSAGE=Could not move the current deployment into rollback storage."
    goto :fail
  )
  set "HAD_DEPLOYMENT=1"
)

echo [LastLink] Activating the staged build...
move /Y "%STAGING_DIR%" "%DEPLOY_DIR%" >nul
if errorlevel 1 (
  set "ERROR_MESSAGE=Could not activate the staged build."
  goto :rollback
)

if not exist "%DEPLOY_DIR%\index.html" (
  set "ERROR_MESSAGE=The deployment is missing index.html after activation."
  goto :rollback
)

if exist "%BACKUP_DIR%\" (
  echo [LastLink] Previous version retained at %BACKUP_DIR% until the next deployment.
)

echo [LastLink] Deployment copy completed successfully.
exit /b 0

:rollback
set "ROLLBACK_ERROR=%ERROR_MESSAGE%"
echo [LastLink] Deployment activation failed; restoring the previous version...
if exist "%DEPLOY_DIR%\" (
  rmdir /s /q "%DEPLOY_DIR%"
)
if exist "%DEPLOY_DIR%\" (
  set "ERROR_MESSAGE=%ROLLBACK_ERROR% Rollback could not remove the failed deployment."
  goto :fail
)
if "%HAD_DEPLOYMENT%"=="1" (
  if exist "%BACKUP_DIR%\" (
    move /Y "%BACKUP_DIR%" "%DEPLOY_DIR%" >nul
    if errorlevel 1 (
      set "ERROR_MESSAGE=%ROLLBACK_ERROR% Rollback could not restore the previous version."
      goto :fail
    )
  )
  set "ERROR_MESSAGE=%ROLLBACK_ERROR% The previous version was restored."
) else (
  set "ERROR_MESSAGE=%ROLLBACK_ERROR% No previous deployment existed to restore."
)
goto :fail

:fail
color 4F
echo [LastLink ERROR] %ERROR_MESSAGE%
echo [LastLink ERROR] No further files will be copied.
exit /b 1
