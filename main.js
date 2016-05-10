/**Launching App**/
chrome.app.runtime.onLaunched.addListener(function(launchData) {	
	chrome.app.window.create('index.html', {id:"fileWin", 
	/**hidden: true,**/
	innerBounds: {width: 800, height: 500}}, function(win) {
    win.contentWindow.launchData = launchData;
  });  
});

/**Aborting App**/
chrome.app.window.onClosed.addListener(function(){	
	annyang.abort();
});

