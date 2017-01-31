Atom/Electron is a platform for running SIMRacingApps (SRA) without a browser.
It combines the Chromium Webkit, V8 JavaScripting Engine, and Node.js
modules to provide runtime support for Apps written in JavaScript/HTML5.

To download the newest version, click [here](https://github.com/SIMRacingApps/SIMRacingAppsElectron/releases/latest). For an article on setting up Electron, see [this](https://www.facebook.com/notes/simracingapps/electron-a-html-client-for-simracingapps/1566870046675409) post on FaceBook.

I created a Main Menu App, specifically for Electron, to provide the following capabilities:

1. Automatically load specified Apps on startup.
2. Ability to create multiple configurations by using different storage locations. 
     For example (road, oval, stock, open wheel, etc).
3. Run Apps with or without a frame (i.e. the borders around the window and title bar)
4. Run Apps with a transparent background. (This may cause FPS slow down on some older systems).
5. Resize and Move the App and it will remember where you put it.
6. Create your own dashes on Window's Tablets or Laptops that are not your SIM PC. See instructions below.
7. Make the App Windows stay on top of all other windows, including the SIM.<br />
   !!! NOTE: The SIM has to be running in Windowed Mode (See Below on how to configure).
   If Windowed Mode causes problems for you, try using the [Overwolf-SIMRacingAppsLauncher Client](https://github.com/SIMRacingApps/SIMRacingAppsOverwolf) instead of Electron-Apps.

===============================================================================================================

# Installation on same PC as the SIM

1. Download the [electron-apps_x.x.x.sra](https://github.com/SIMRacingApps/SIMRacingAppsElectron/releases/latest) 
   file and just save it. 
2. Then, with SIMRacingAppsServer.exe running, connect to the Main Menu using your browser.
3. At the bottom of the menu, use the "Choose File" and "Upload" buttons and upload it.
   This will extract the files to "Documents\SIMRacingApps\electron-apps".
4. If you don't already have a shortcut, to setup a shortcut to launch the apps, follow these simple steps.
  1. In the "Documents\SIMRacingApps\electron-apps" folder, 
     Right Click on the "startapps.bat" file and either select "Send To -> Desktop" or "Create shortcut".
     You may want to move it on your desktop or task bar so you can easily find it later.
     Rename it to whatever you want.
  2. That's it. Name the shortcut whatever you want and click OK.
     Now you can run the shortcut and it will be using the default configuration.
5. Optionally, you can modify the shortcut and add the following options to override the defaults. Or you can create multiple shortcuts to launch different configurations.
  1. Usage: startapps.bat \[-hostname {host}] \[-port {port}] \[-configuration "{configuration}"] \[-delay {milliseconds}]
    1. Defaults are:
      1.   host            = localhost    ;Where SRA Server is running
      2.   port            = 80           ;What port SRA Server is running on
      3.   configuration   = default      ;The name of configuration to save App locations and sizes to.
      4.   delay           = 0            ;The amount of time to allow the widget to load before applying transparency. Some systems need a 5000 ms delay to get transparency to work.

## Installation on a Windows Tablet, LapTop or other PC not running the SIM.

Even though you can access the SIMRacingApps server from any browser on a Window's device,
there are advantages to installing Electron on the device. 
You can launch multiple Apps and/or Widgets, resize them, move them and basically create your own dash.
Electron will run in desktop mode on Windows 8 and above, because Electron does not have a Modern UI to be used as a Window's App.
Here are the steps to do so.

1. Download the Electron .SRA file using the link above from GitHub. You need at least version 1.2.4.
1. Rename the .SRA file to .ZIP.
1. Open the .ZIP file with Window's Explorer and Extract it somewhere.
1. Open the "electron-apps" folder in the extracted location using Window's Explorer.
1. Right click on the startapps.bat and either select "Send To -> Desktop" or "Create shortcut". (Optionally, move the shortcut to the desktop or task bar).
1. Right click on the shortcut and in the "Target" field append the option "-hostname IPADDRESS" to specify the PC where SIMRacingApps is running. This would be just the IP address shown in the SIMRacingAppsServer window.
``Example: startapps.bat -hostname 192.168.1.61``. If you have changed the port number, you can add that option as well. ``Example: startapps.bat -hostname 192.168.1.61 -port 8080``.
1. Now click on the shortcut to launch Electron. It should connect to the server and display the menu, assuming the server is running on the PC.
  1. Tip: Because Electron is not that touch friendly, I highly recommend you use a mouse to move and resize the Apps. 
     You could also install/run [TeamViewer](http://www.teamviewer.com) on the tablet and the PC running the SIM, then remote control the tablet from the PC to set it up.
  1. Tip: Touch and hold near the top of the App's window to get to the system drop down menu, Restore, Move, Size,...Close. 
  1. Tip: You can also touch, hold, drag near the top of the window to move it. 
  1. Tip: You can touch, hold, drag on the bottom left and right corners to resize it.
          
===============================================================================================================

If you want to find out more about Atom/Electron, check out the very active repository at https://github.com/atom/electron. Also, if you are willing to fork my repository and improve this solution, I will be willing to take a look at it. Just submit a pull request.

===============================================================================================================

## iRacing can be configured to run in Windowed Mode and still be full screen.

To do this, in your Documents\iRacing\app.ini file, 
set the following variables in the [Graphics] or [Graphics DX11] sections. 
Please keep a backup copy of this file before you change it for reference.
This example is for 1 monitor.

1. fullScreen=0                   ;0=windowed mode, 1=full screen mode (other variables are not used in full screen mode)
1. border=0                       ;0=no borders or header, 1=header visible.
1. reduceFramerateWhenFocusLost=0 ;Set to zero so iRacing will not slow down while clicking an App
1. windowedMaximized=1            ;if borders are off, this is the only way to get to maximize.
1. windowedXPos=0                 ;locate the window on the display you want it maximized on.
1. windowedYPos=0                 ;locate the window on the display you want it maximized on.
1. windowedWidth=1920             ;optional, will only be used if not maximized. Set to your dimension.
1. windowedHeight=1080            ;optional, will only be used if not maximized. Set to your dimension.

Also in the [Audio] section.

1. muteWhenFocusLost=0            ; set this to 0 to hear sim sounds when another program has the keyboard focus


