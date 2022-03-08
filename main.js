process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
console.log("SRALauncher, Electron Version = " + process.versions.electron);
const LocalStorage   = require('node-localstorage').LocalStorage;
const XMLHttpRequest = require("node-XMLHttpRequest").XMLHttpRequest;
const electron       = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const ipc = electron.ipcMain;
var screen = null;
var storagePath = app.getPath('documents')+'\\SIMRacingApps\\storage\\';
console.log("Electron storage at "+storagePath);

var defaultStorage = new LocalStorage(storagePath + 'default');

var SRAlauncher = {};
if (defaultStorage.getItem("SIMRacingAppsLauncher"))
    SRAlauncher = parseJSON(defaultStorage.getItem("SIMRacingAppsLauncher"));

SRAlauncher.hostname       = SRAlauncher.hostname       || 'localhost';
SRAlauncher.port           = SRAlauncher.port           || 80;
SRAlauncher.lang           = null;
SRAlauncher.configuration  = SRAlauncher.configuration  || 'default';
SRAlauncher.configurations = SRAlauncher.configurations || {'default':true};
SRAlauncher.x              = SRAlauncher.x               ? SRAlauncher.x : 0;
SRAlauncher.y              = SRAlauncher.y               ? SRAlauncher.y : 0;
SRAlauncher.width          = SRAlauncher.width          || 800;
SRAlauncher.height         = SRAlauncher.height         || 680;
SRAlauncher.version        = app.getVersion()+" ("+process.versions.electron+")";
SRAlauncher.startMinimized = false;

console.log("SRAlauncher = " + JSON.stringify(SRAlauncher));

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});

var main;
var windows = [];
var delay = 0;
var appsToLoad = {};
var frame = false;
var transparent = false;
var clicktrough = true;
var backgroundColor = "";
var seenElectronArgs = false;  //we only want the args that come after the electron args
var menu=true;
var currentState = 'notconnected';
var showAppsOnTaskBar = false;
var enableHardwareAcceleration = false;

console.log('argv = ',process.argv);

for (var i=1;i < process.argv.length;i++) {
    
    var arg = process.argv[i].toLowerCase();
    if (!seenElectronArgs) {
        if (arg.substr(0,1) != '-')
            seenElectronArgs = true;
    }
    else
    if (arg == "-hostname") {
        SRAlauncher.hostname = process.argv[++i];
    }
    else
    if (arg == "-port") {
        SRAlauncher.port = process.argv[++i];
    }
    else
    if (arg == "-enablehardwareacceleration") {
        enableHardwareAcceleration = true;
        console.log('enableHardwareAcceleration = true');
    }
    else
    if (arg == "-lang") {
        SRAlauncher.lang = process.argv[++i];
        //TODO: implement when Electron merges it to master.
        //app.setLocale(SRAlauncher.lang);
    }
    else
    if (arg == "-delay") {
        delay = process.argv[++i];
    }
    else
    if (arg == "-storage" || arg == "-configuration") {
        ++i;
        var a = null;
        //first see if we already have one saved
        for (var c in SRAlauncher.configurations) {
            if (c.toLowerCase() == process.argv[i].toLowerCase()) {
                a = c;
            }
        }
        SRAlauncher.configuration = a ? a : c;
        SRAlauncher.configurations[SRAlauncher.configuration] = true;
    }
    else
    if (arg == "-frame") {
        frame = true;
    }
    else
    if (arg == "-transparent") {
        transparent = true;
        backgroundColor = 'transparent';
    }
    else
    if (arg == "-showappsontaskbar") {
    	showAppsOnTaskBar = true;
    }
    else
    if (arg == "-startminimized") {
        SRAlauncher.startMinimized = true;
    }
    else
    if (arg == "-noclickthrough") {
        clickthrough = false;
    }
    else
    if (arg == "-backgroundcolor") {
        backgroundColor = process.argv[++i];
    }
    else
    if (arg == "!frame") {
        frame = false;
    }
    else
    if (arg == "!transparent") {
        transparent = false;
        backgroundColor = '';
    }
    else {
        if (arg.toLowerCase() != "menu") {
            menu = false;
            appsToLoad[arg] = { backgroundColor: backgroundColor, transparent: transparent, frame: frame, loaded: false };
        }
    }
}

//Save the options for the client windows to use and to remember for next time
defaultStorage.setItem("SIMRacingAppsLauncher",JSON.stringify(SRAlauncher));
console.log('save args = ' + JSON.stringify(SRAlauncher));

var localStorage   = (SRAlauncher.configuration == 'default' ? defaultStorage : new LocalStorage(storagePath + SRAlauncher.configuration));


if (!enableHardwareAcceleration) {
    console.log('calling app.disableHardwareAcceleration()');
    app.disableHardwareAcceleration();
}


function parseJSON(s) {
    try {
        return JSON.parse(s);
    }
    catch (e) {
        return {};
    }
    return {};
}

function updateStatus(win) {
    if (win && win.SRAapp.name != 'Settings') {
        console.log('updateStatus('+win.SRAapp.name+') currentState='+currentState
                   +', notconnected='+win.SRAapp.notconnected
                   +', incar='+win.SRAapp.incar
                   +', ingarage='+win.SRAapp.ingarage
                   +', inreplay='+win.SRAapp.inreplay
                   );

        if (win.SRAapp.notconnected && currentState == 'notconnected') {
            win.show();
        }
        else
        if (win.SRAapp.ingarage && currentState == 'ingarage') {
            win.focus();
            win.show();
        }
        else
        if (win.SRAapp.inreplay && currentState == 'inreplay') {
        	win.focus();
            win.show();
        }
        else
        if (win.SRAapp.incar && currentState == 'incar') {
        	win.focus();
            win.show();
        }
        else
            win.hide();
    }
};

function isWithinDisplayBounds(x,y,w,h) {
    const displays = screen.getAllDisplays()
    for (i=0; i < displays.length; i++) {
        const area = displays[i].workArea;
        if (//upper left
        (   x >= area.x 
        &&  y >= area.y 
        &&  x < area.x + area.width 
        &&  y < area.y + area.height
        )
        ||  //upper right
        (   x+w-1 >= area.x 
        &&  y     >= area.y 
        &&  x+w-1 < area.x + area.width 
        &&  y     < area.y + area.height
        )
        ||  //lower left
        (   x     >= area.x 
        &&  y+h-1 >= area.y 
        &&  x     < area.x + area.width 
        &&  y+h-1 < area.y + area.height
        )
        ||  //lower right
        (   x+w-1 >= area.x 
        &&  y+h-1 >= area.y 
        &&  x+w-1 < area.x + area.width 
        &&  y+h-1 < area.y + area.height
        )
        ) {
            return true; 
        }
    }
    return false;
};

function loadMain() {
    if (main != null)
        main.close();
    
    if (!isWithinDisplayBounds(SRAlauncher.x,SRAlauncher.y,SRAlauncher.width,SRAlauncher.height)) {
        console.log("Electron loadMain(x:" + SRAlauncher.x + ", y:" + SRAlauncher.y + ") outside of display area. Resetting to primary display");
        SRAlauncher.x = 0;
        SRAlauncher.y = 0;
    }

    main = new BrowserWindow({
        width:          SRAlauncher.width, 
        height:         SRAlauncher.height,
        x:              SRAlauncher.x,
        y:              SRAlauncher.y,
        title:          'SIMRacingAppsLauncher Electron ' + SRAlauncher.version + ' - ' + SRAlauncher.configuration,
        icon:           'resources/SRA-Logo-16x16.png',
        resizable:      true,
        alwaysOnTop:    false,
        frame:          true,
        transparent:    false,
        webPreferences: {nodeIntegration: true, contextIsolation: false, webviewTag: true}
    });
    
    main.SRAname = "SIMRacingAppsLauncher";  //just for storage to save state
    
    //if user wants to run minimized
    if (SRAlauncher.startMinimized)
        main.minimize();
     
    main.loadURL('file://' + app.getAppPath() + (menu ? '/menu.html' : '/loader.html'));
//        + '?hostname=' + SRAlauncher.hostname
//        + '&port='     + SRAlauncher.port
//        + '&version='  + encodeURIComponent(app.getVersion()+" ("+process.versions.electron+")")
//    );
    
    main.on('move', function(e,s) {
        var bounds = e.sender.getBounds();
        SRAlauncher.x = bounds.x;
        SRAlauncher.y = bounds.y;
//        if (isWithinDisplayBounds(SRAlauncher.x, SRAlauncher.y,SRAlauncher.width,SRAlauncher.height)) {
            defaultStorage.setItem("SIMRacingAppsLauncher",JSON.stringify(SRAlauncher));
            //console.log('move = ' + JSON.stringify(SRAlauncher));
//        }
    });
    
    main.on('resize', function(e) {
        var bounds = e.sender.getBounds();
        SRAlauncher.width = bounds.width;
        SRAlauncher.height = bounds.height;
        defaultStorage.setItem("SIMRacingAppsLauncher",JSON.stringify(SRAlauncher));
        //console.log('resize = ' + JSON.stringify(SRAlauncher));
    });

    //When the main window is minimize, restored or closed, do all windows the same
    main.on('close',function(e) {
        for (var i=0; i < windows.length; i++) {
            if (windows[i]) {
                windows[i].close();
                windows[i] = null;
            }
        }
        main = null;
    });

    ipc.on('hide',function(e) {
        for (var i=0; i < windows.length; i++) {
            if (windows[i]) {
                windows[i].hide();
            }
        }
    });

    ipc.on('show',function(e) {
        for (var i=0; i < windows.length; i++) {
            updateStatus(windows[i]);
        }
    });

/*    
    ipc.on('state',function(e,state) {
        if (currentState != state) {
            console.log('state changed from ('+currentState+') to ('+state+')')
            currentState = state;
            for (var i=0; i < windows.length; i++) {
                updateStatus(windows[i]);
            }
        }
    });
*/
    
    function S4() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
    };
    var guid = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
    
    function loadConfiguration(configuration) {
        var a = null;
        //first see if we already have one saved
        for (var c in SRAlauncher.configurations) {
            if (c.toLowerCase() == configuration.toLowerCase()) {
                a = c;
            }
        }
        SRAlauncher.configuration = a ? a : configuration;
        SRAlauncher.configurations[SRAlauncher.configuration] = true;
        console.log('loadConfiguration = ' + SRAlauncher.configuration);
        
        defaultStorage.setItem("SIMRacingAppsLauncher",JSON.stringify(SRAlauncher));
        console.log('loadConfiguration = ' + JSON.stringify(SRAlauncher));
        main.setTitle('SIMRacingApps - ' + SRAlauncher.configuration);
        localStorage   = (SRAlauncher.configuration == 'default' ? defaultStorage : new LocalStorage(storagePath + SRAlauncher.configuration));
        
        console.log("Loading configuration: " + SRAlauncher.configuration);
        for (var i=0; i < windows.length; i++) {
            if (windows[i]) {
                windows[i].close();
                windows[i] = null;
            }
        }
        
        var request = new XMLHttpRequest();
        var i18n = SRAlauncher.lang ? SRAlauncher.lang : app.getLocale().toLowerCase();
        console.log('i18n = ' + i18n);
        
        request.onreadystatechange = function(e) {
            if (this.readyState == this.DONE) {
                if (this.status == 200) {
                    var listings = parseJSON(this.responseText);
                    listings.SRAlauncher = SRAlauncher;

                    listings.lang = i18n;
                    var version = listings.version.major + '.' + listings.version.minor + '_' + listings.version.build + ' [' + i18n + ']';
                    var title = main.SRAname + ' Electron ' + SRAlauncher.version + ', Server Version '+version;
                    console.log(title + ' ' + guid);
                    main.setTitle(title + ' - ' + SRAlauncher.configuration);

                    var ga = new XMLHttpRequest();
                    ga.onreadystatechange = function() {
                        if (this.readyState == this.DONE) {
                            if (this.status == 200) {
                                var s=ga;
                                console.log('ga sent: ');
                            }
                        }
                    }
                    
                    var gaurl = 'http://www.google-analytics.com/collect';
                    var gadata  = 'v=1';
                        gadata += '&t=pageview';
                        gadata += '&tid=UA-72478308-1';
                        gadata += '&cid='+encodeURI(guid);
                        //gadata += '&cid='+Date.now()+'.'+Date.now();
                        gadata += '&dl=http%3A%2F%2Flocalhost%2Felectron%2Fmenu';
                        gadata += '&dh=localhost';
                        gadata += '&dp=%2Felectron%2Fmenu';
                        gadata += '&av='+encodeURI(version);
                        gadata += '&dt='+encodeURI(title);
                        gadata += '&an=SIMRacingApps';
                        gadata += '&ul='+encodeURI(i18n);
                        gadata += '&ua='+encodeURI('Electron '+SRAlauncher.version+' Windows');
                        gadata += '&z=' + Date.now(); 
                        
                    console.log(gaurl);
                    console.log(gadata);
                    ga.open("POST",gaurl+'?'+gadata);
                    ga.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                    ga.send();
                    

                    for (var headeridx in listings.headers) {
                        var header = listings.headers[headeridx];
                        if (listings[header].length > 0) {
                            for (var listingsidx in listings[header]) {
                                var item = listings[header][listingsidx];
                                
                                //add these to the listings. We store these locally
                                if (menu) {
                                    item.transparent   = false;
                                    item.frame         = header.toUpperCase() === 'DOCUMENTATION' ? true : false;
                                    item.loadonstartup = false;
                                    item.notconnected  = true;
                                    item.incar         = true;
                                    item.ingarage      = true;
                                    item.inreplay      = true;
                                    
                                    console.log('loading menu item = ' + JSON.stringify(item));
                                    
                                    if (localStorage.getItem(item.name)) {
                                        var state = parseJSON(localStorage.getItem(item.name));
                                        if (state) {
                                            item.x             = typeof(state.x) === 'undefined' ? item.x : state.x;
                                            item.y             = typeof(state.y) === 'undefined' ? item.y : state.y;
                                            item.width         = (state.width  || item.width) * 1;
                                            item.height        = (state.height || item.height) * 1;
                                            item.transparent   = typeof(state.transparent)   === 'undefined' ? item.transparent   : state.transparent;
                                            item.frame         = header.toUpperCase() === 'DOCUMENTATION' ? true : (typeof(state.frame)         === 'undefined' ? item.frame         : state.frame);
                                            item.loadonstartup = typeof(state.loadonstartup) === 'undefined' ? item.loadonstartup : state.loadonstartup;
                                            item.notconnected  = typeof(state.notconnected)  === 'undefined' ? item.notconnected  : state.notconnected;
                                            item.incar         = typeof(state.incar)         === 'undefined' ? item.incar         : state.incar;
                                            item.ingarage      = typeof(state.ingarage)      === 'undefined' ? item.ingarage      : state.ingarage;
                                            item.inreplay      = typeof(state.inreplay)      === 'undefined' ? item.inreplay      : state.inreplay;
                                            if (item.width < 0)
                                                item.width = 800;
                                            if (item.height < 0)
                                                item.height = 480;
                                        }
                                    }
                                    localStorage.setItem(item.name,JSON.stringify(item));
                                    console.log('saving menu item = ' + JSON.stringify(item));
                                }

                                if (item.loadonstartup || (!menu && item.name.toLowerCase() in appsToLoad)) {
                                    if (localStorage.getItem(item.name)) {
                                        var state = parseJSON(localStorage.getItem(item.name));
                                        if (state) {
                                            item.x             = typeof(state.x) === 'undefined' ? item.x : state.x;
                                            item.y             = typeof(state.y) === 'undefined' ? item.y : state.y;
                                            item.width         = (state.width  || item.width) * 1;
                                            item.height        = (state.height || item.height) * 1;
                                            item.transparent   = typeof(state.transparent)   === 'undefined' ? item.transparent   : state.transparent;
                                            item.frame         = header.toUpperCase() === 'DOCUMENTATION' ? true : (typeof(state.frame)         === 'undefined' ? item.frame         : state.frame);
                                            item.loadonstartup = typeof(state.loadonstartup) === 'undefined' ? item.loadonstartup : state.loadonstartup;
                                            item.notconnected  = typeof(state.notconnected)  === 'undefined' ? item.notconnected  : state.notconnected;
                                            item.incar         = typeof(state.incar)         === 'undefined' ? item.incar         : state.incar;
                                            item.ingarage      = typeof(state.ingarage)      === 'undefined' ? item.ingarage      : state.ingarage;
                                            item.inreplay      = typeof(state.inreplay)      === 'undefined' ? item.inreplay      : state.inreplay;
                                            if (item.width < 0)
                                                item.width = 800;
                                            if (item.height < 0)
                                                item.height = 480;
                                        }
                                    }
                                    localStorage.setItem(item.name,JSON.stringify(item));
                                    console.log('loadStartup = ' + JSON.stringify(item));
                                    loadApp(item);
                                }
                            }
                        }
                    }

                    main.webContents.send('listings',listings);
                }
                else {
                    console.log("loadConfiguration() Error: status(" + this.status + ")");
                }
            }
        }
        request.open("GET","http://"+SRAlauncher.hostname+":"+SRAlauncher.port+"/SIMRacingApps/listings?lang="+i18n);
        request.send();
    }
    
    main.webContents.on('did-finish-load',function(e) {
        //main.webContents.send('SIMRacingAppsLauncher',SRAlauncher); //send() stringifies on its own.
        loadConfiguration(SRAlauncher.configuration);
        
    });
    
    ipc.on('loadConfiguration',function(e,configuration) {
        console.log('main.on.loadConfiguration('+configuration+')');
        loadConfiguration(configuration);
    });
    
    ipc.on('deleteConfiguration',function(e,configuration) {
        console.log('main.on.deleteConfiguration('+configuration+')');
        if (configuration.toLowerCase() != 'default') {
            for (var c in SRAlauncher.configurations) {
                if (configuration.toLowerCase() == c.toLowerCase())
                    delete SRAlauncher.configurations[c];
            }
            localStorage.clear();
            SRAlauncher.configuration = 'default';
            defaultStorage.setItem("SIMRacingAppsLauncher",JSON.stringify(SRAlauncher));
            loadConfiguration('default');
        }
    });
    
    ipc.on('itemChanged', function(e,item) {
        console.log('itemChanged().item = ' + JSON.stringify(item));
        var state = parseJSON(localStorage.getItem(item.name));
        if (state) {
            //other windows are only allowed to change the following values
            if (typeof item.transparent !== 'undefined')
                state.transparent = item.transparent;
            if (typeof item.frame !== 'undefined')
                state.frame = item.frame;
            if (typeof item.loadonstartup !== 'undefined')
                state.loadonstartup = item.loadonstartup;
            
            if (typeof item.notconnected !== 'undefined')
                state.notconnected = item.notconnected;
            if (typeof item.incar !== 'undefined')
                state.incar = item.incar;
            if (typeof item.ingarage !== 'undefined')
                state.ingarage = item.ingarage;
            if (typeof item.inreplay !== 'undefined')
                state.inreplay = item.inreplay;
            
            localStorage.setItem(item.name,JSON.stringify(state));
            console.log('itemChanged().state = ' + JSON.stringify(state));
            
            for (var i=0; i < windows.length; i++) {
                var reload = false;
                if (windows[i] && windows[i].SRAapp.name == item.name) {
                    
                    if (windows[i].SRAapp.transparent != state.transparent) {
                        windows[i].SRAapp.transparent = state.transparent;
                        reload = true;
                    }
                    if (windows[i].SRAapp.frame != state.frame) {
                        windows[i].SRAapp.frame = state.frame;
                        reload = true;
                    }
                    windows[i].SRAapp.loadonstartup = state.loadonstartup;
                    windows[i].SRAapp.notconnected  = state.notconnected;
                    windows[i].SRAapp.incar         = state.incar;
                    windows[i].SRAapp.ingarage      = state.ingarage;
                    windows[i].SRAapp.inreplay      = state.inreplay;
                    updateStatus(windows[i]);
                    
                    if (reload)
                        loadApp(windows[i].SRAapp);
                }
                
                
            }
        }
    });
    
    function loadApp(SRAapp) {
        var options = {
                name:        SRAapp.name,
                x:           SRAapp.x || 0,
                y:           SRAapp.y || 0,
                width:       SRAapp.width || 800,
                height:      SRAapp.height || 480,
                url:         SRAapp.url,
                frame:       SRAapp.frame, 
                transparent: SRAapp.frame ? false : SRAapp.transparent,
                notconnected: SRAapp.notconnected,
                incar:       SRAapp.incar,
                ingarage:    SRAapp.ingarage,
                inreplay:    SRAapp.inreplay,
                args:        SRAapp.args
            };
        
        if (!isWithinDisplayBounds(options.x,options.y,options.width,options.height)) {
            console.log("Electron loadApp("+SRAapp.name+", x:" + options.x + ", y:" + options.y + ") outside of display area. Resetting to primary display");
            options.x = 0;
            options.y = 0;
        }

        //pick up the command line options
        if (SRAapp.name in appsToLoad) {
            options.transparent     = appsToLoad[item.name].transparent;
            options.frame           = appsToLoad[item.name].frame;
            if (appsToLoad[item.name].backgroundColor)
                options.args += (options.args.length > 0 ? '&' : '') + "backgroundColor=" + encodeURIComponent(SRAapp.backgroundColor);
        }
        else
        if (options.transparent && !clicktrough)
            options.args += (options.args.length > 0 ? '&' : '') + "backgroundColor=" + encodeURIComponent("rgba(0,0,0,.01)");
        else
        if (options.transparent && clicktrough)
            options.args += (options.args.length > 0 ? '&' : '') + "backgroundColor=" + encodeURIComponent("rgba(0,0,0,0)");
        
        var win = createAppWindow(options);
        win.SRA_originalOptions = options;
        win.setAspectRatio(options.width/options.height);  //doesn't work on windows
    }
    
    ipc.on('loadApp',function(e,name,url) {
        var SRAapp = localStorage.getItem(name);
        if (name == 'settings' || name == 'Settings') {
            SRAapp = JSON.stringify({
                name:   'Settings',
                url:    'settings.html',
                width:  800,
                height: 700,
                x:      0,
                y:      0
            });
        }
        if (url && url.match(/^http:/)) {
            SRAapp = JSON.stringify({
                name:   name,
                url:    url,
                width:  800,
                height: 700,
                x:      0,
                y:      0
            });
        }
        console.log("ipc.on.loadApp("+name+") = " + SRAapp);
        loadApp(parseJSON(SRAapp));
    });


    var last_message = "";
    var last_status = "";
    var last_replay = false;
    
    function updateState(state) {
        if (currentState != state) {
            console.log('state changed from ('+currentState+') to ('+state+')')
            currentState = state;
            for (var i=0; i < windows.length; i++) {
                updateStatus(windows[i]);
            }
        }
    }
    
    function setState() {
        var index = last_message.indexOf(';DISCONNECTED;');
//        console.log('index='+index+', message='+last_message+', status='+last_status+', replay='+last_replay);
        if (index > -1) {
            updateState('notconnected');
        }
        else
        if (last_status == 'INGARAGE') {
            updateState('ingarage');
        }
        else
        if (last_replay) {
            updateState('inreplay');
        }
        else {
            updateState('incar');
        }
        setTimeout( setState,200 );
    }
    
    setTimeout( setState,5000 );  //give the apps time to load
    
    var messages_request = new XMLHttpRequest();
    var messages_URL = "http://"+SRAlauncher.hostname+":"+SRAlauncher.port+"/SIMRacingApps/Data/Session/Messages?output=json";
    
    messages_request.onreadystatechange = function(e) {
        if (this.readyState == this.DONE) {
            if (this.status == 200) {
                var response = parseJSON(this.responseText);

                last_message = response.Value + "";  //force to a string
            }
            if (this.status != 0) {
                setTimeout( function() {
                    messages_request.open("GET",messages_URL);
                    messages_request.send();
                },1000);
            }
        }
    };
    console.log("Starting Messages at "+messages_URL);
    setTimeout( function() {
        messages_request.open("GET",messages_URL);
        messages_request.send();
    },200);
    
    var status_request = new XMLHttpRequest();
    var status_URL = "http://"+SRAlauncher.hostname+":"+SRAlauncher.port+"/SIMRacingApps/Data/Car/ME/Status?output=json";
    
    status_request.onreadystatechange = function(e) {
        if (this.readyState == this.DONE) {
            if (this.status == 200) {
                var response = parseJSON(this.responseText);

                last_status = response.Value;
            }
            if (this.status != 0) {
                setTimeout( function() {
                    status_request.open("GET",status_URL);
                    status_request.send();
                },1000);
            }
        }
    };
    console.log("Starting Status at "+status_URL);
    setTimeout( function() {
        status_request.open("GET",status_URL);
        status_request.send();
    },200);
    
    var replay_request = new XMLHttpRequest();
    var replay_URL = "http://"+SRAlauncher.hostname+":"+SRAlauncher.port+"/SIMRacingApps/Data/Session/IsReplay?output=json";
    
    replay_request.onreadystatechange = function(e) {
        if (this.readyState == this.DONE) {
            if (this.status == 200) {
                var response = parseJSON(this.responseText);

                last_replay = response.Value;
            }
            if (this.status != 0) {
                setTimeout( function() {
                    replay_request.open("GET",replay_URL);
                    replay_request.send();
                },1000);
            }
        }
    };
    console.log("Starting Replay at "+replay_URL);
    setTimeout( function() {
        replay_request.open("GET",replay_URL);
        replay_request.send();
    },200);
    
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    screen = electron.screen;
    const displays = screen.getAllDisplays();
    for (i=0; i < displays.length; i++) {
        const area = displays[i].workArea;
        console.log("Electron Display " + i + " = x:" + area.x + ", y:" + area.y + ", width:" + area.width + ", height:" + area.height);
    }
    loadMain();
});

function createAppWindow(SRAapp) {
    
    //If the window is already loaded, close it first
    for (var i=0; i < windows.length; i++) {
        if (windows[i] && windows[i].SRAapp.name == SRAapp.name) {
            windows[i].close();
        }
    }
    
    // Create the browser window, then move it to get transparency to take affect
    var options = {
            width:          (SRAapp.width * 1)  || 800, 
            height:         (SRAapp.height * 1) || 480,
            x:              SRAapp.x ? (SRAapp.x * 1) : 0,
            y:              SRAapp.y ? (SRAapp.y * 1): 0,
            title:          SRAapp.name,
            icon:           'resources/SRA-Logo-16x16.png',
            autoHideMenuBar:SRAapp.frame ? true : false,
            useContentSize: SRAapp.frame ? false : true,
            resizable:      true,
            alwaysOnTop:    true,
            frame:          typeof SRAapp.frame === 'undefined' ? true : SRAapp.frame,
            transparent:    (SRAapp.frame ? false : SRAapp.transparent) || false,
            webPreferences: {nodeIntegration: true, webviewTag: true}
        };
    
    if (!isWithinDisplayBounds(options.x,options.y,options.width,options.height)) {
        console.log("Electron createAppWindow("+SRAapp.name+", x:" + options.x + ", y:" + options.y + ") outside of display area. Resetting to primary display");
        options.x = 0;
        options.y = 0;
    }

    //sync SRAapp with options
    SRAapp.width = options.width;
    SRAapp.height = options.height;
    SRAapp.x = options.x;
    SRAapp.y = options.y;
    SRAapp.frame = options.frame;
    SRAapp.transparent = options.transparent;
    
    //I'm going to create the window 1 pixel too big, as sometimes that causing the transparency to kick in
    //when it gets resized.
    if (options.transparent && delay > 0) {
        options.height = SRAapp.height + 2;
    }

    console.log("creating BrowserWindow() = " + JSON.stringify(options));
    var win = new BrowserWindow(options);
    
    if (!showAppsOnTaskBar)
        win.setSkipTaskbar(true);

    //the default for the second argument is "floating". 
    //Someone says "normal" fixes the issue where it will stay on top of iRacing.
    //iRacing must be tricking windows to think it's a system level window.
    win.setAlwaysOnTop(true,"normal");
    
    //if the window is minimized based on a previous state, then restore it.
    if (win.isMinimized())
        win.restore();
    
/*    
    var arg = {
            x:      options.x,
            y:      options.y,
            width:  options.width,
            height: options.height
        };
    try {
        //for some reason the options are ignored by the constructor
        //force the window to the requested bounds.
        win.setBounds(arg);
    }
    catch (e) {
        console.log("Exception: win.setBounds("+ JSON.stringify(arg) + ") = " + + JSON.stringify(e));
    }
*/    
    // and load the index.html of the app.
    var url = 'file://' + app.getAppPath().replace(/\\/g,'/') + '/appcontainer.html'
    + '?hostname=' + SRAlauncher.hostname
    + '&port='     + SRAlauncher.port
    + (SRAlauncher.lang == null ? '' : '&lang=' + SRAlauncher.lang)
    + '&url='      + encodeURIComponent(SRAapp.url  || '')
    + '&app='      + encodeURIComponent(SRAapp.name || '')
    +  (SRAapp.args ? '&'+SRAapp.args : '')
    ;
    if (!menu) {
        main.webContents.send('loadingApps',SRAapp.name+' with ' + JSON.stringify(SRAapp));
        main.webContents.send('loadingApps',url);
    }
    console.log('Loading: '+SRAapp.name+' with ' + JSON.stringify(SRAapp));
    console.log(url);
    win.loadURL(url);
    
    
    //wait to restore it, because for some reason the transparency will not
    //function until the webview is loaded.
    //TODO: can I get it to send me an event?
    if (options.transparent && delay > 0)
        setTimeout(function() {
            if (false) {
                win.setBounds({
                    x:      SRAapp.x,
                    y:      SRAapp.y,
                    width:  SRAapp.width,
                    height: SRAapp.height
                });
//                win.setBackgroundColor('#00000000');
            }
            else {
                if (options.useContentSize) {
                    console.log('setContentSize('||SRAapp.width||','||SRAapp.height||')');
                    win.setContentSize(SRAapp.width < 0 ? 800 : (SRAapp.width || 800),SRAapp.height < 0 ? 480 : (SRAapp.height || 480));
                }
                else {
                    console.log('setSize('||SRAapp.width||','||SRAapp.height||')');
                    win.setSize(SRAapp.width || 800,SRAapp.height || 480);
//                setTimeout(function() {
//                    win.setPosition(SRAbounds.x,SRAbounds.y);
                    //win.setBounds(SRAbounds);
//                },delay);
                }
            }
        },delay);
    
    win.SRAapp   = SRAapp;
//    win.SRAname  = SRAapp.name;
    win.SRAindex = windows.length;
    windows.push(win); //keep a reference so it won't garbarge collect it
    
    updateStatus(win);
    
    win.on('move', function(e) {
        var bounds = e.sender.getBounds();
        if (bounds) {
            var state  = parseJSON(localStorage.getItem(e.sender.SRAapp.name));
            if (state) {
                state.x = bounds.x;
                state.y = bounds.y;
//this was an attempt to keep the window withing the display boundries. It didn't work
//                if (isWithinDisplayBounds(state.x,state.y,state.width,state.height)) {
                    //console.log('win.on.move('+e.sender.SRAapp.name+') = ' + JSON.stringify(state));
                    localStorage.setItem(e.sender.SRAapp.name,JSON.stringify(state));
                    e.sender.SRAapp.x = state.x;
                    e.sender.SRAapp.y = state.y;
                    //console.log('win.move = ' + JSON.stringify(state));
//                }
            }
        }
    });
    
    win.on('resize', function(e) {
        var bounds = e.sender.getBounds();
        if (bounds && bounds.width && bounds.height) {
            var state  = parseJSON(localStorage.getItem(e.sender.SRAapp.name));
            if (state) {
                state.width = bounds.width;
                state.height = bounds.height;
                //console.log('win.on.resize('+e.sender.SRAname+') = ' + JSON.stringify(state));
                localStorage.setItem(e.sender.SRAapp.name,JSON.stringify(state));
                e.sender.SRAapp.width = state.width;
                e.sender.SRAapp.height = state.height;
                //console.log('win.resize = ' + JSON.stringify(state));
            }
        }
    });
    
    win.on('maximize', function(e) {
        var bounds = e.sender.getBounds();
        var state  = parseJSON(localStorage.getItem(e.sender.SRAapp.name));
        state.x = bounds.x;
        state.y = bounds.y;
        state.width = bounds.width;
        state.height = bounds.height;
        //console.log('win.on.maximize('+e.sender.SRAname+') = ' + JSON.stringify(state));
        localStorage.setItem(e.sender.SRAapp.name,JSON.stringify(state));
        e.sender.SRAapp.x = state.x;
        e.sender.SRAapp.y = state.y;
        e.sender.SRAapp.width = state.width;
        e.sender.SRAapp.height = state.height;
        console.log('win.maximize = ' + JSON.stringify(state));
    });
    
    win.on('restore', function(e) {
        var bounds = e.sender.getBounds();
        var state  = parseJSON(localStorage.getItem(e.sender.SRAapp.name));
        state.x = bounds.x;
        state.y = bounds.y;
        state.width = bounds.width;
        state.height = bounds.height;
        //console.log('win.on.restore('+e.sender.SRAname+') = ' + JSON.stringify(state));
        localStorage.setItem(e.sender.SRAapp.name,JSON.stringify(state));
        e.sender.SRAapp.x = state.x;
        e.sender.SRAapp.y = state.y;
        e.sender.SRAapp.width = state.width;
        e.sender.SRAapp.height = state.height;
        console.log('win.restore = ' + JSON.stringify(state));
    });
    
    // Emitted when the window is closed.
    win.on('closed', function(e) {
        console.log('Closing: '+e.sender.SRAapp.name);
        windows[e.sender.SRAindex] = null;
        if (main) main.webContents.send('loadingApps','Closing: '+e.sender.SRAapp.name);
    });

    return win;
};

