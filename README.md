Atom/Electron is a platform for running SIMRacingApps (SRA) without a browser.
It combines the Chromium Webkit, V8 JavaScripting Engine, and Node.js
modules to provide runtime support for Apps written in JavaScript/HTML5.
If you want to find out more about it, check out https://github.com/atom/electron. 

I created a Main Menu App, specifically for Electron, to provide the following capabilities:

1. Automatically load specified Apps on startup.
2. Multiple configurations by using different storage locations. 
     For example (road, oval, stock, open wheel, etc).
3. Run Apps with or without a frame (i.e. the borders around the window and title bar)
4. Run Apps with a transparent background.
5. Resize and Move the App and it will remember where you put it.
6. Make the App Windows stay on top of all other windows, including the SIM.
     !!! NOTE: The SIM has to be running in Windowed Mode (See Below on how to configure).
         If Windowed Mode causes problems for you, you can try using the Overwolf-SIMRacingAppsLauncher instead of Electron-Apps.
7. All App Windows will follow the Main Menu Window's actions.
     Meaning if you minimize the Main Menu, all Apps will minimize also.

===============================================================================================================

Installation:

1. Download the [electron-apps_x.x.x.sra](https://github.com/SIMRacingApps/SIMRacingAppsElectron/releases/latest) 
   file from the downloads link and just save it. 
2. Then, with SIMRacingAppsServer.exe running, connect to the Main Menu using your browser.
3. At the bottom of the menu, use the "Choose File" and "Upload" buttons and upload it.
   This will extract the files to "Documents\SIMRacingApps\electron-apps".
4. Setup a shortcut to launch the apps, follow these simple steps.
  1. In the "Documents\SIMRacingApps\electron-apps" folder, 
     Right Click on the "startapps.bat" file and create a shortcut.
     You may want to move it on your desktop so you can easily find it later.
     Rename it to whatever you want.
  2. That's it. Name the shortcut whatever you want and click OK.
     Now you can run the shortcut and it will be using the default configuration.
5. Optionally, you can modify the shortcut and add the following options to override the defaults.
  1. Usage: startapps.bat \[-hostname {host}] \[-port {port}] \[-configuation "{configuration}"]
    1. Defaults are:
      1.   host            = localhost    ;Where SRA Server is running
      2.   port            = 80           ;What port SRA Server is running on
      3.   configuration   = default      ;The name of configuration to save App locations and sizes to.

===============================================================================================================

iRacing can be configured to run in Windowed Mode and still be full screen.
To do this, in your Documents\iRacing\app.ini file, 
set the following variables in the [graphics] section.

1.   fullScreen=0                   ;0=windowed mode, 1=full screen mode (other variables are not used in full screen mode)
2.   border=0                       ;0=no borders or header, 1=header visible.
3.   reduceFramerateWhenFocusLost=0 ;Set to zero so iRacing will not slow down while clicking an App
4.   windowedMaximized=1            ;if borders are off, this is the only way to get to maximize.
5.   windowedXPos=0                 ;locate the window on the display you want it maximized on.
6.   windowedYPos=0                 ;locate the window on the display you want it maximized on.
7.   windowedWidth=1920             ;optional, will only be used if not maximized. Set to your dimension.
8.   windowedHeight=1080            ;optional, will only be used if not maximized. Set to your dimension.         