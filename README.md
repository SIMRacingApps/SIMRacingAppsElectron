Atom/Electron is a platform for running SIMRacingApps (SRA) without a browser.
It combines the Chromium Webkit, V8 JavaScripting Engine, and Node.js
modules to provide runtime support for Apps written in JavaScript/HTML5.
I created a Main Menu App, specifically for Electron, to provide the following capabilities:

1. Automatically load specified Apps on startup.
2. Ability to create multiple configurations by using different storage locations. 
     For example (road, oval, stock, open wheel, etc).
3. Run Apps with or without a frame (i.e. the borders around the window and title bar)
4. Run Apps with a transparent background. (This may cause FPS slow down on some older systems).
5. Resize and Move the App and it will remember where you put it.
6. Control when the Apps are visible (NotConnected, InCar, InGarage, InReplay). 
7. Create your own dashes on Window's Tablets or Laptops that are not your SIM PC. See instructions below.
8. Make the App Windows stay on top of all other windows, including the SIM.<br />
   **!!! NOTE: The SIM has to be running in Windowed Mode (See Below on how to configure).**
   If Windowed Mode causes problems for you, your only choice is to run Electron Apps on a different device.

The latest version is included with the SIMRacingAppsServer. 
If not already enabled, enable it in the settings by adding/updating "electron-autoupdate = Y" and "electron-autostart = Y".
For an article on setting up Electron, see [this](https://www.facebook.com/notes/simracingapps/electron-a-html-client-for-simracingapps/1196997937076853) post on FaceBook.

## iRacing must be configured to run in Windowed Mode, and still be full screen.

Please go to this Wiki page, https://github.com/SIMRacingApps/SIMRacingApps/wiki/How-to-setup-iRacing-in-Windowed-Mode

===============================================================================

## Installation on a Windows Tablet, LapTop or other PC not running the SIM.

Even though you can access the SIMRacingApps server from any browser on a Window's device,
there are advantages to installing Electron on the device. 
You can launch multiple Apps and/or Widgets, resize them, move them and basically create your own dash.
Here are the steps to do so.

1. Using the "Clone or Download" button on this page, download the ZIP file.
1. Open the .ZIP file with Window's Explorer and Extract it somewhere.
1. In the extracted location, navigate to the "SIMRacingAppsElectron-{branch}" folder. {branch} is "master" by default.
1. Right click on the startapps.bat and either select "Send To -> Desktop" or "Create shortcut". (Optionally, move the shortcut to the desktop).
1. Right click on the shortcut and in the "Target" field append the option "-hostname IPADDRESS" to specify the PC where SIMRacingApps is running. This would be just the IP address shown in the SIMRacingAppsServer window. If your server runs on a port other than 80, you can add a "-port PORT" option as well. Examples:
   1. ``startapps.bat -hostname 192.168.1.61``
   1. ``startapps.bat -hostname 192.168.1.61 -port 8080``
1. Optionally, you can modify the shortcut and add the following options to override the defaults. Or you can create multiple shortcuts to launch different configurations.
   1. Usage: startapps.bat \[-hostname {host}] \[-port {port}] \[-lang {lang_country}] \[-configuration "{configuration}"] \[-delay {milliseconds}]
      1. Defaults are:
         1.   ``host            = localhost    ;Where SRA Server is running``
         1.   ``port            = 80           ;What port SRA Server is running on``
         1.   ``lang            = language     ;languageCode or languageCode_COUNTRY_CODE from your system settings``
         1.   ``configuration   = "default"    ;The name of configuration to save App locations and sizes to.``
         1.   ``delay           = 0            ;The amount of time to allow the widget to load before applying transparency. Some systems need a 5000 ms delay to get transparency to work.``
1. Now click on the shortcut to launch Electron. It should connect to the server and display the menu, assuming the server is running on the PC.
   1. Tip: Resize and Move an App/Widget with transparency turned off. Then, if you want it, turn the transparency back on and reload the App/Widget.
   1. Tip: Because Electron is not that touch friendly, I highly recommend you use a mouse to move and resize the Apps. 
     You could also install/run [TeamViewer](http://www.teamviewer.com) on the tablet and the PC running the SIM, then remote control the tablet from the PC to set it up.
   1. Tip: Touch and hold (or Right Click) near the top of the App's window to get to the system drop down menu, Restore, Move, Size,...Close. 
   1. Tip: You can also touch and hold (Click and hold), near the top of the window then drag to move it. 
   1. Tip: You can touch and hold (Click and hold), on the bottom left and right corners and drag to resize it.
          
===============================================================================

If you want to find out more about Atom/Electron, check out the very active repository at https://github.com/atom/electron. Also, if you are willing to fork my repository and improve this solution, I will be willing to take a look at it. Just submit a pull request.

===============================================================================

## Debugging with Electron

1. Run the App from the menu.
1. Click on the App/Widget window to debug to give it focus.
1. Press Ctrl-Shift-i
1. In the console type, document.getElementById("webviewelement").openDevTools();
