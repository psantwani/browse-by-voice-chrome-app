(function(context) {

	/**Setting App Id**/
    document.getElementById("appid").value = chrome.runtime.id;
	
	/**Constants/Variables**/
    var logField = document.getElementById("log");
    var sendText = document.getElementById("sendText");
    var sendId = document.getElementById("sendId");
    var send = document.getElementById("send");

    /**Android Part Variables.**/
    var ws = null;
    var connected = false;
    var serverUrl;
    var connectionStatus;
    var sendMessages;
    var connectButton;
    var disconnectButton;
    var sendButton;
    var errorMessageSent = false;

	/**Click Send Button**/
    function sendMessage(message) {
        send.click();
    }

	/**Detect Voice command using Annyang**/
    if (annyang) {
        var cmd = function(cmd) {
            sendText.value = cmd;
            sendMessage(cmd);
        }
        var commands = {
            '*color': cmd
        };
        annyang.addCommands(commands);
        annyang.start();
    }

	/**Manually Close App**/
    chrome.app.window.onClosed.addListener(function() {
        chrome.runtime.sendMessage(
            sendId.value, {
                myCustomMessage: "Force closing App"
            }
        )
        console.log("Closing App");
        annyang.abort();
    });

	/**Get BackgroundPage**/
    chrome.runtime.getBackgroundPage(function(page) {
        backgroundPage = page;
    });

	/**Send message to Extension**/
    send.addEventListener('click', function() {        
        chrome.runtime.sendMessage(
            sendId.value, {
                myCustomMessage: sendText.value
            },
            function(response) {
                //appendLog("response: "+JSON.stringify(response));
            })
    });

	/**Convert long number to IP address**/
    function numToIp(number) {

        var ip = number % 256;
        for (var i = 1; i <= 3; i++) {
            number = Math.floor(number / 256);
            ip = number % 256 + '.' + ip;
        }
        return ip; // As string
    }
	
	/**Convert Ip address to long number**/
    function ipToNumbert(ip) {
        var d = ip.split('.');
        var n = d[0] * Math.pow(256, 3);
        n += d[1] * Math.pow(256, 2);
        n += d[2] * 256;
        n += +d[3];
        return n;
    }
    
	/**Messages from Extension**/
    chrome.runtime.onMessageExternal.addListener(
        function(request, sender, sendResponse) {			
            if (request.myCustomMessage) {
				/**Close APP**/
                if (request.myCustomMessage == "closeApp") {
                    window.close();
                }
                
				/**Setting Extension ID**/
				if (request.myCustomMessage == "myAddress") {
                    console.log("reached");
                    sendId.value = request.setExtId;
                }
                
				/**Reply to extension about app status**/
				if (request.myCustomMessage == "Check app status") {
                    sendResponse({
                        state: "on"
                    });
                }
                
				/**Connect to android based on Session password from Extension**/
				if (request.myCustomMessage == "ConnectToAndroid") {
                    console.log("Request Arrived");
                    console.log(request.sessionPassword);
                    var ipPort = request.sessionPassword.split("@");
                    var yourLong = parseInt(ipPort[0], 36);
                    var yourNumber = parseInt(ipPort[1], 36);
                    var ipAddress = numToIp(parseInt(yourLong.toString(36), 36));
                    var portNumber = parseInt(yourNumber.toString(36), 36);
                    $('#serverUrl').val("ws://" + ipAddress.toString() + ":" + portNumber.toString());
                    if (request.action == "Connect to Android") {
                        $('#connectButton').click();
                    } else if (request.action == "Disconnect") {
                        $('#disconnectButton').click();
                    }

                }
            } 
			else {
                sendResponse({
                    "result": "Ops, I don't understand this message"
                });
            }
        });
  
    /**Android part**/

	/**Open socket**/
    var open = function() {
        try {
            var url = serverUrl.val();
            try {
                ws = new WebSocket(url);
            } catch (err) {
                console.log("error");
                console.log(err.message);
            }
            ws.onopen = onOpen;
            ws.onclose = onClose;
            ws.onmessage = onMessage;
            ws.onerror = onError;
            connectionStatus.val("OPENING ...");
            serverUrl.attr('disabled', 'disabled');            
        } catch (err) {
            console.log("Error occurred");

            chrome.runtime.sendMessage(
                sendId.value, {
                    myCustomNotification: "AboutConnection",
                    ConnectionStatus: "Failure"
                });

        }
    }

	/**Close socket**/
    var close = function() {
        if (ws) {
            console.log('CLOSING ...');
            $("#sendMessage").val("Chrome aborting Browse By Voice");
            $("#sendButton").click();
            ws.close();
        }
        connected = false;
        connectionStatus.val("CLOSED");
        //connectionStatus.text('CLOSED');

        serverUrl.removeAttr('disabled');
        //connectButton.show();
        //disconnectButton.hide();
        sendMessages.attr('disabled', 'disabled');
        sendButton.attr('disabled', 'disabled');
    }

	/**Obselete.CLear log**/
    var clearLog = function() {
        $('#messages').html('');
    }

	/**After socket is opened , send success message to extension**/
    var onOpen = function() {
        chrome.runtime.sendMessage(
            sendId.value, {
                myCustomNotification: "AboutConnection",
                ConnectionStatus: "Success"
            });
        console.log('OPENED: ' + serverUrl.val());
        connected = true;
        connectionStatus.val("OPENED");
        sendMessages.removeAttr('disabled');
        sendButton.removeAttr('disabled');
    };

	/**After socket is closed, send failure message to extension**/
    var onClose = function() {
        chrome.runtime.sendMessage(
            sendId.value, {
                myCustomNotification: "AboutConnection",
                ConnectionStatus: "Closed"
            });
        $('#connectionStatus').val('CLOSED');
        console.log('CLOSED: ' + serverUrl.val());
        ws = null;
    };

	/**Decode the message received from android**/
    var onMessage = function(event) {
        var reader = new window.FileReader();
        reader.readAsDataURL(event.data);
        reader.onloadend = function() {
            base64data = reader.result;
            var decodedData = window.atob(base64data.toString().split(";base64,")[1]);
            addMessage(decodedData);
            sendMessages.val(decodedData);
            sendText.value = decodedData;
            send.click();
            if (decodedData == "Aborting Browse By Voice") {
                disconnectButton.click();
            }
        }
    };

	/**Abort connection when error occurs, and send failure message to extension**/
    var onError = function(event) {

        chrome.runtime.sendMessage(
            sendId.value, {
                myCustomNotification: "AboutConnection",
                ConnectionStatus: "Failure"
            });

        console.log(event);
        console.log(event.data);
        //disconnectButton.click();
    }

	/**Commented Method. Make log of commands**/
    var addMessage = function(data, type) {
		/**
        var msg = $('<pre>').text(data);
        if (type === 'SENT') {
        msg.addClass('sent');
        }
        var messages = $('#messages');
        messages.append(msg);

        var msgBox = messages.get(0);
        while (msgBox.childNodes.length > 1000) {
        msgBox.removeChild(msgBox.firstChild);
        }
        msgBox.scrollTop = msgBox.scrollHeight;
		**/
    }
	

	/**WebSocketClient**/
    WebSocketClient = {
        init: function() {
			/**Local variables**/
            serverUrl = $('#serverUrl');
            connectionStatus = $('#connectionStatus');
            sendMessages = $('#sendMessage');
            connectButton = $('#connectButton');
            disconnectButton = $('#disconnectButton');
            sendButton = $('#sendButton');

			/**Connect button to android**/
            connectButton.click(function(e) {
                /**close();**/
                open();
            });
			
			/**Disconnect button to android**/
            disconnectButton.click(function(e) {
                close();
            });

			/**Send Button click to send message to android**/
            sendButton.click(function(e) {
                var msg = $('#sendMessage').val();
                addMessage(msg, 'SENT');
                ws.send(msg);
            });

			/**Clear log**/
            $('#clearMessage').click(function(e) {
                clearLog();
            });
          
        }
    };

})(window)

$(function() {
    WebSocketClient.init();
});