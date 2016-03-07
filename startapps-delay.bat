@rem This file is the same as startapps.bat with the default delay set to 2000ms.
@rem Use it if you need a delay to get the transparency to work.

@echo off
if "x%1" == "x-?" (
    echo Usage: startapps [-hostname host] [-port port] [-storage folder] [-frame] [-transparent] [-backgroundColor color] [app] [app...]
    echo Defaults:
    echo    hostname        = localhost
    echo    port            = 80
    echo    storage         = default
    echo    delay           = 2000
    echo    frame           = no
    echo    transparent     = no
    echo    backgroundColor = none or transparent if transparent flag is set
    echo    app             = menu
    echo 
    echo    NOTE: -frame and -transparent only apply to apps that come after them.
    echo          So, it you want a mix, list apps that do not need a frame or transparency before the option
    goto end
)
rem *******************************************************************************************
rem To be able to drag an app window on top of the SIM, you will have to make the SIM run in Windowed Mode.
rem See the electron-apps-readme.txt file for details on how to change this for the supported SIMs.
rem *******************************************************************************************

setlocal EnableDelayedExpansion
for /f "skip=2 tokens=2,*" %%A in ('reg.exe query "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders" /v "Personal"') do set "DOCUMENTS=%%B\"
%~d0
cd %~dp0
set ELECTRON_NO_ATTACH_CONSOLE=true
if "x%ELECTRON%" == "x" set ELECTRON=electron
if not exist "%ELECTRON%\electron.exe" goto noelectron

@rem make sure these exist. Could be starting before server or on stand alone PC, LapTop or Tablet
@mkdir %DOCUMENTS%\SIMRacingApps 2>nul
@mkdir %DOCUMENTS%\SIMRacingApps\storage 2>nul

echo Atom/Electron Version
type "%ELECTRON%\version"
echo.   
echo Starting: %*
if not "x%ELECTRON_NO_ATTACH_CONSOLE%" == "xtrue" "%ELECTRON%\electron.exe" --disable-gpu . -delay 2000 %*
if "x%ELECTRON_NO_ATTACH_CONSOLE%" == "xtrue" start "SIMRacingApps" "%ELECTRON%\electron.exe" --disable-gpu . -delay 2000 %*
goto end

:noelectron
echo "%ELECTRON%\electron.exe" was not found

:end
@ping -n 5 -w 1000 localhost >nul
