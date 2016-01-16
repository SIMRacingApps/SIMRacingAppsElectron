
const LocalStorage   = require('node-localstorage').LocalStorage;
const XMLHttpRequest = require("node-XMLHttpRequest").XMLHttpRequest;
const electron       = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const ipc = electron.ipcMain;

var storagePath = app.getPath('documents')+'\\SIMRacingApps\\storage\\';
var defaultStorage = new LocalStorage(storagePath + 'default');

var SRAlauncher = {};
if (defaultStorage.getItem("SIMRacingAppsLauncher"))
    SRAlauncher = JSON.parse(defaultStorage.getItem("SIMRacingAppsLauncher"));

SRAlauncher.hostname       = SRAlauncher.hostname       || 'localhost';
SRAlauncher.port           = SRAlauncher.port           || 80;
SRAlauncher.configuration  = SRAlauncher.configuration  || 'default';
SRAlauncher.configurations = SRAlauncher.configurations || {'default':true};
SRAlauncher.x              = typeof(SRAlauncher.x) != 'undefined' ? SRAlauncher.x : 0;
SRAlauncher.y              = typeof(SRAlauncher.y) != 'undefined' ? SRAlauncher.y : 0;
SRAlauncher.width          = SRAlauncher.width          || 800;
SRAlauncher.height         = SRAlauncher.height         || 680;
SRAlauncher.version        = app.getVersion()+" ("+process.versions.electron+")";

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
var delay = 5000;
var appsToLoad = {};
var frame = false;
var transparent = false;
var backgroundColor = "";
var seenPeriod = false;   //we only want the args that come after the period on the command line.
var menu=true;
for (var i=1;i < process.argv.length;i++) {
    
    var arg = process.argv[i].toLowerCase();
    if (!seenPeriod) {
        if (arg == '.')
            seenPeriod = true;
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
    if (arg == "-storage" || arg == "-configuration") {
        SRAlauncher.configuration = process.argv[++i].toLowerCase();
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

var localStorage   = (SRAlauncher.configuration == 'default' ? defaultStorage : new LocalStorage(storagePath + SRAlauncher.configuration));

function loadMain() {
    if (main != null)
        main.close();
    
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
        transparent:    false
    });
    
    main.SRAname = "SIMRacingAppsLauncher";  //just for storage to save state
    
    main.loadURL('file://' + app.getAppPath() + (menu ? '/menu.html' : '/loader.html'));
//        + '?hostname=' + SRAlauncher.hostname
//        + '&port='     + SRAlauncher.port
//        + '&version='  + encodeURIComponent(app.getVersion()+" ("+process.versions.electron+")")
//    );
    
    main.on('move', function(e,s) {
        var bounds = e.sender.getBounds();
        SRAlauncher.x = bounds.x;
        SRAlauncher.y = bounds.y;
        defaultStorage.setItem("SIMRacingAppsLauncher",JSON.stringify(SRAlauncher));
    });
    
    main.on('resize', function(e) {
        var bounds = e.sender.getBounds();
        SRAlauncher.width = bounds.width;
        SRAlauncher.height = bounds.height;
        defaultStorage.setItem("SIMRacingAppsLauncher",JSON.stringify(SRAlauncher));
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
            if (windows[i]) {
                windows[i].show();
            }
        }
    });

    function S4() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
    };
    var guid = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
    
    function loadConfiguration(configuration) {
        SRAlauncher.configuration = configuration;
        SRAlauncher.configurations[configuration] = true;
        
        defaultStorage.setItem("SIMRacingAppsLauncher",JSON.stringify(SRAlauncher));
        main.setTitle('SIMRacingApps - ' + SRAlauncher.configuration);
        localStorage   = (SRAlauncher.configuration == 'default' ? defaultStorage : new LocalStorage(storagePath + SRAlauncher.configuration));
        
        console.log("Loading configuration: " + configuration);
        for (var i=0; i < windows.length; i++) {
            if (windows[i]) {
                windows[i].close();
                windows[i] = null;
            }
        }
        
        var request = new XMLHttpRequest();
        request.onreadystatechange = function(e) {
            if (this.readyState == this.DONE) {
                if (this.status == 200) {
                    var listings = JSON.parse(this.responseText);
                    listings.SRAlauncher = SRAlauncher;
                    
                    var version = listings.version.major + '.' + listings.version.minor + '_' + listings.version.build;
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
                    var i18n = app.getLocale();
                    
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
                                    item.frame         = false;
                                    item.loadonstartup = false;
                                    if (localStorage.getItem(item.name)) {
                                        var state = JSON.parse(localStorage.getItem(item.name));
                                        if (state) {
                                            item.x             = typeof(state.x) === 'undefined' ? item.x : state.x;
                                            item.y             = typeof(state.y) === 'undefined' ? item.y : state.y;
                                            item.width         = state.width  || item.width;
                                            item.height        = state.height || item.height;
                                            item.transparent   = typeof(state.transparent)   === 'undefined' ? item.transparent   : state.transparent;
                                            item.frame         = typeof(state.frame)         === 'undefined' ? item.frame         : state.frame;
                                            item.loadonstartup = typeof(state.loadonstartup) === 'undefined' ? item.loadonstartup : state.loadonstartup;
                                        }
                                    }
                                    localStorage.setItem(item.name,JSON.stringify(item));
                                }

                                if (item.loadonstartup || (!menu && item.name.toLowerCase() in appsToLoad)) {
                                    if (localStorage.getItem(item.name)) {
                                        var state = JSON.parse(localStorage.getItem(item.name));
                                        if (state) {
                                            item.x             = typeof(state.x) === 'undefined' ? item.x : state.x;
                                            item.y             = typeof(state.y) === 'undefined' ? item.y : state.y;
                                            item.width         = state.width  || item.width;
                                            item.height        = state.height || item.height;
                                            item.transparent   = typeof(state.transparent)   === 'undefined' ? item.transparent   : state.transparent;
                                            item.frame         = typeof(state.frame)         === 'undefined' ? item.frame         : state.frame;
                                            item.loadonstartup = typeof(state.loadonstartup) === 'undefined' ? item.loadonstartup : state.loadonstartup;
                                        }
                                    }
                                    localStorage.setItem(item.name,JSON.stringify(item));
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
        request.open("GET","http://"+SRAlauncher.hostname+":"+SRAlauncher.port+"/SIMRacingApps/listings");
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
        if (configuration != 'default') {
            SRAlauncher.configuration = 'default';
            delete SRAlauncher.configurations[configuration];
            localStorage.clear();
            defaultStorage.setItem("SIMRacingAppsLauncher",JSON.stringify(SRAlauncher));
            loadConfiguration('default');
        }
    });
    
    ipc.on('itemChanged', function(e,item) {
        console.log('itemChanged().item = ' + JSON.stringify(item));
        var state = JSON.parse(localStorage.getItem(item.name));
        if (state) {
            //other windows are only allowed to change the following values
            if (typeof item.transparent !== 'undefined')
                state.transparent = item.transparent;
            if (typeof item.frame !== 'undefined')
                state.frame = item.frame;
            if (typeof item.loadonstartup !== 'undefined')
                state.loadonstartup = item.loadonstartup;
            console.log('itemChanged().state = ' + JSON.stringify(state));
            localStorage.setItem(item.name,JSON.stringify(state));
        }
    });
    
    function loadApp(SRAapp) {
        var options = {
                name:        SRAapp.name,
                x:           SRAapp.x,
                y:           SRAapp.y,
                width:       SRAapp.width,
                height:      SRAapp.height,
                url:         SRAapp.url,
                frame:       SRAapp.frame, 
                transparent: SRAapp.transparent, 
                args:        SRAapp.args
            };
        
        //pick up the command line options
        if (SRAapp.name in appsToLoad) {
            options.transparent     = appsToLoad[item.name].transparent;
            options.frame           = appsToLoad[item.name].frame;
            if (appsToLoad[item.name].backgroundColor)
                options.args += (options.args.length > 0 ? '&' : '') + "backgroundColor=" + encodeURIComponent(SRAapp.backgroundColor);
        }
        else
        if (options.transparent)
            options.args += (options.args.length > 0 ? '&' : '') + "backgroundColor=" + encodeURIComponent("rgba(0,0,0,.01)");
        
        var win = createAppWindow(options);
        win.SRA_originalOptions = options;
        win.setAspectRatio(options.width/options.height);  //doesn't work on windows
    }
    
    ipc.on('loadApp',function(e,name) {
        var SRAapp = localStorage.getItem(name);
        if (name == 'settings') {
            SRAapp = JSON.stringify({
                name:   'settings',
                url:    'settings.html',
                width:  800,
                height: 700,
                x:      0,
                y:      0
            });
        }
        console.log("ipc.on.loadApp("+name+") = " + SRAapp);
        loadApp(JSON.parse(SRAapp));
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    loadMain();
});

function createAppWindow(SRAapp) {
    
    //If the window is already loaded, close it first
    for (var i=0; i < windows.length; i++) {
        if (windows[i] && windows[i].SRAname == SRAapp.name) {
            windows[i].close();
        }
    }
    
    // Create the browser window, then move it to get transparency to take affect
    var options = {
            width:          SRAapp.width  || 800, 
            height:         SRAapp.height || 480,
            x:              typeof(SRAapp.x) === 'undefined' ? 0 : SRAapp.x,
            y:              typeof(SRAapp.y) === 'undefined' ? 0 : SRAapp.y,
            title:          SRAapp.name,
            icon:           'resources/SRA-Logo-16x16.png',
            autoHideMenuBar:SRAapp.frame ? true : false,
            useContentSize: SRAapp.frame ? false : true,
            resizable:      true,
            alwaysOnTop:    true,
            frame:          SRAapp.frame || false,
            transparent:    SRAapp.transparent || false
        };
    
    //I'm going to create the window 1 pixel too big, as sometimes that causing the transparency to kick in
    //when it gets resized.
    if (options.transparent) {
        options.height = SRAapp.height + 1;
    }
    
    console.log("creating BrowserWindow() = " + JSON.stringify(options));
    var win = new BrowserWindow(options);
    
    // and load the index.html of the app.
    var url = 'file://' + app.getAppPath() + '/appcontainer.html'
    + '?hostname=' + SRAlauncher.hostname
    + '&port='     + SRAlauncher.port
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
    if (options.transparent)
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
                if (options.useContentSize)
                    win.setContentSize(SRAapp.width,SRAapp.height);
                else
                    win.setSize(SRAapp.width,SRAapp.height);
//                setTimeout(function() {
//                    win.setPosition(SRAbounds.x,SRAbounds.y);
                    //win.setBounds(SRAbounds);
//                },delay);
            }
        },delay);
    
    win.SRAname  = SRAapp.name;
    win.SRAindex = windows.length;
    
    win.on('move', function(e) {
        var bounds = e.sender.getBounds();
        var state  = JSON.parse(localStorage.getItem(e.sender.SRAname));
        state.x = bounds.x;
        state.y = bounds.y;
        //console.log('win.on.move('+e.sender.SRAname+') = ' + JSON.stringify(state));
        localStorage.setItem(e.sender.SRAname,JSON.stringify(state));
    });
    
    win.on('resize', function(e) {
        var bounds = e.sender.getBounds();
        var state  = JSON.parse(localStorage.getItem(e.sender.SRAname));
        state.width = bounds.width;
        state.height = bounds.height;
        //console.log('win.on.resize('+e.sender.SRAname+') = ' + JSON.stringify(state));
        localStorage.setItem(e.sender.SRAname,JSON.stringify(state));
    });
    
    win.on('maximize', function(e) {
        var bounds = e.sender.getBounds();
        var state  = JSON.parse(localStorage.getItem(e.sender.SRAname));
        state.x = bounds.x;
        state.y = bounds.y;
        state.width = bounds.width;
        state.height = bounds.height;
        //console.log('win.on.maximize('+e.sender.SRAname+') = ' + JSON.stringify(state));
        localStorage.setItem(e.sender.SRAname,JSON.stringify(state));
    });
    
    win.on('restore', function(e) {
        var bounds = e.sender.getBounds();
        var state  = JSON.parse(localStorage.getItem(e.sender.SRAname));
        state.x = bounds.x;
        state.y = bounds.y;
        state.width = bounds.width;
        state.height = bounds.height;
        //console.log('win.on.restore('+e.sender.SRAname+') = ' + JSON.stringify(state));
        localStorage.setItem(e.sender.SRAname,JSON.stringify(state));
    });
    
    // Emitted when the window is closed.
    win.on('closed', function(e) {
        console.log('Closing: '+e.sender.SRAname);
        windows[e.sender.SRAindex] = null;
        if (main) main.webContents.send('loadingApps','Closing: '+e.sender.SRAname);
    });
    
    windows.push(win); //keep a reference so it won't garbarge collect it
    return win;
};

