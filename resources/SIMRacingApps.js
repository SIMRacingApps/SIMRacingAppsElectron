
var SIMRacingAppsConfig = {
      hostname: 'localhost'
    , app:      "WidgetLoader"
    , url:      ""
    , vars:      window.location.search.substring(1).split('&')
    , args:      ""
    , src:       ""
    , port:      80
};

for (var i = 0; i < SIMRacingAppsConfig.vars.length; i++) {
    var pair = SIMRacingAppsConfig.vars[i].split('=');
    if (decodeURIComponent(pair[0]) == "hostname") {
        SIMRacingAppsConfig.hostname = pair[1];
    }
    else
    if (decodeURIComponent(pair[0]) == "port") {
        SIMRacingAppsConfig.port = pair[1];
    }
    else
    if (decodeURIComponent(pair[0]) == "app") {
        SIMRacingAppsConfig.app = decodeURIComponent(pair[1]);
    }
    else
    if (decodeURIComponent(pair[0]) == "url") {
        SIMRacingAppsConfig.url = decodeURIComponent(pair[1]);
    }
    else {
        SIMRacingAppsConfig.args += "&" + SIMRacingAppsConfig.vars[i];
    }
}
console.log('url='+SIMRacingAppsConfig.url);
if (SIMRacingAppsConfig.url && SIMRacingAppsConfig.url.match(/^http/)) {
        SIMRacingAppsConfig.src = SIMRacingAppsConfig.url;
}
else {
        SIMRacingAppsConfig.src = "http://"+SIMRacingAppsConfig.hostname  + ":" + SIMRacingAppsConfig.port
            + "/SIMRacingApps/" + ((SIMRacingAppsConfig.url ? SIMRacingAppsConfig.url : "apps/"+SIMRacingAppsConfig.app) + "?")
            + SIMRacingAppsConfig.args;
}
//alert(SIMRacingAppsConfig.src);
console.log('src='+SIMRacingAppsConfig.src);

//The following events simulate a :hover CSS property. 
//I found that :hover would not go away if the mouse moves out the top of the div.
//I also don't get the mouseout event either. So, I set a timer to hide the bar.
var SRAtimer = null;
var SRAonMouseOver = function() {
  document.getElementById("bar").className = "handleHover";
  document.getElementById("closer").className = "closerHover";
  if (SRAtimer) {
      SRAonMouseOut();
  }
  //set a timer to clear the bar if the mouse leaves for more than 3 seconds.
  SRAtimer = setTimeout(function() {
      document.getElementById("bar").className = "handle";
      document.getElementById("closer").className = "closer";
  },3000);
}

var SRAonMouseOut = function() {
  document.getElementById("bar").className = "handle";
  document.getElementById("closer").className = "closer";
  if (SRAtimer) {
      clearTimeout(SRAtimer);
      SRAtimer = null;
  }
}

var SRAcloser = function() {
    window.close();
};

var SRAreturnFalse = function() { 
    return false; 
};

//var src = 'http://192.168.1.61/SIMRacingApps/WidgetLoader/?widget=TrackMap/TrackMap&play=charlotte.bin&interval=100&zoom=1';

document.addEventListener('DOMContentLoaded', function() {
    console.log('[webview]:'+SIMRacingAppsConfig.src);
    document.title = SIMRacingAppsConfig.app;
    document.getElementById("bar").onmouseover = SRAonMouseOver;
    document.getElementById("bar").onmouseout  = SRAonMouseOut;
    document.getElementById("closer").onmouseover = SRAonMouseOver;
    document.getElementById("closer").onmouseout  = SRAonMouseOut;
    document.getElementById("closer").onmousedown = SRAcloser;
    document.getElementById("closer").onselectstart = SRAreturnFalse;
    var w = document.getElementById("webviewelement");
    w.addEventListener("did-finish-load", function() {
        console.log("webview(did-finish-load)");
        var x = w.executeJavaScript(
                "console.log('inside webview');"
//            +   "var a = document.getElementById('SIMRacingApps-App');"
//            +   "console.log('app='+JSON.stringify(a.style[0]));"
//            +   "const electron = require('electron');"
//            +   "console.log('electron='+electron);"
        );
    });
    w.addEventListener("dom-ready", function() {
        console.log("webview(dom-ready)");
    });
    w.addEventListener("console-message",function(e) {
        console.log("webview(console-message)="+e.message);
    });
    w.addEventListener('dom-ready', () => {
        //w.openDevTools()
    });
    w.setAttribute('src',SIMRacingAppsConfig.src);
});


