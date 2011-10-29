HOST = null; // localhost
PORT = 8001;

var SESSION_TIMEOUT = 900 * 1000,
	MESSAGE_BACKLOG = 500;
	
// Logging - Make sure to check on the memory usage
var mem = process.memoryUsage(),
memProcess = null,
sessionProcess = null;

/***********************************************************************
/
/		Repeating Methods
/		Methods which repeat. Just putting them into a container to
/		be able to control when they start running.
/		
/
***********************************************************************/

function repeatingTasksSetup() { 
	setInterval(function () {
		mem = process.memoryUsage();
	}, 10*1000);
	
	// interval to kill off old sessions
	setInterval(function () {
		//console.log("Dropping off all dead clients");
  		var now = new Date();
  		for (var id in connectedClients) {
    		if (!connectedClients.hasOwnProperty(id)) continue;
   			var connectedClient = connectedClients[id];
    		if (now - connectedClient['timestamp'] > SESSION_TIMEOUT) {
      			connectedClient.destroy();
    		}
  		}
	}, 1000);
}

repeatingTasksSetup();

// Global vars

var connectedClients = {},
fu = require("./fu"),
sys = require("util"),
url = require("url"),
qs = require("querystring");

// Start the server

fu.listen(Number(process.env.PORT || PORT), HOST);

/***********************************************************************
/
/		Main constructors
/		These methods create any constructor which can be remade/respawned.
/		Constructors should handle persisting themselves if appropriate.
/		
/
***********************************************************************/

var bespoke_session = new function () {
  var command_log = [], callbacks = [];

  this.appendMessage = function (id, type, command_data) {
    var m = { 
    	id: id,
        type: type, // "command", "join", "part"
        command_data: command_data,
        timestamp: (new Date()).getTime()
    };
	
    switch (type) {
      case "command":
        console.log(id + " commanded : " + type + " data : " + command_data);
        break;
      case "join":
        console.log(id + " joined");
        break;
      case "part":
        console.log(id + " parted");
        break;
    }

    command_log.push(m);
    while (callbacks.length > 0) {
      callbacks.shift().callback([m]);
    }

    while (command_log.length > MESSAGE_BACKLOG) {
    	command_log.shift();
    }
     
  };

  this.query = function (since, callback) {
    var messages_to_send = [];
    for (var i = 0; i < command_log.length; i++) {
      var log = command_log[i];
      if (log.timestamp > since)
        messages_to_send.push(log)
    }

    if (messages_to_send.length != 0) {
      callback(messages_to_send);
    } else {
      callbacks.push({ timestamp: new Date(), callback: callback });
    }
  };

  // Reset the connection after 30 seconds to make sure we don't let a client hold on too long, the client should then handle a reconnect.
  setInterval(function () {
    var now = new Date();
    while (callbacks.length > 0 && now - callbacks[0].timestamp > 30*1000) {
      callbacks.shift().callback([]);
    }
  }, 1000);
};



/***********************************************************************
/
/		Main communication methods
/		These methods handle sending, receiving, joining and parting 
/		communications. They should be extended to pass through all 
/		comms. between clients and controllers.
/
***********************************************************************/

// Ask who is currently connected

fu.get("/who", function (req, res) {
	 res.simpleJSON(200, { 
	 	clients: connectedClients,
	 	resource: mem.resource
     });
});

// Add a new client to the already existing stack

fu.get("/join", function (req, res) {
	//console.log(req);
	
	var URLParams = parseURL(req);
	var name = URLParams.name;
	if(name == null) { console.log("No name given for join"); return null }
	var session = createSession(name);
	//console.log("Session created for : " + session.name);
	res.writeHead(200, {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin' : '*',
		'Access-Control-Allow-Methods': 'GET, POST'
	});
	
	var body = JSON.stringify({ 
	 	clients: connectedClients,
	 	mySession : session,
	 	resource: mem.resource
    });
     
    res.end(body);
    
    bespoke_session.appendMessage(session.id, "join");

});

// Send a new message to all connected clients

fu.get("/send", function (req, res) { 
	var URLParams = parseURL(req);



	var id = URLParams.id;
	var name = URLParams.name;
  	var command_data = URLParams.command_data;

	var session = connectedClients[id];
		
	if (!session || !command_data) {

		res.writeHead(400, { 
			'Content-Type' : 'application/json',
			'Access-Control-Allow-Origin' : '*',
			'Access-Control-Allow-Methods': 'GET, POST'
		});
		var body = JSON.stringify({ error: "No such session id" });
	    res.end(body);
		return;
	}
	
	session.poke();
	res.writeHead(200, { 
		'Content-Type' : 'application/json',
		'Access-Control-Allow-Origin' : '*'	
	});
	
	bespoke_session.appendMessage(session.id, "command", command_data);
	
	var body = JSON.stringify({ resource: mem.resource });
	res.end(body);
	
	
});

// Listen for new messages

fu.get("/recv", function (req, res) {
	
	var URLParams = parseURL(req);

	// Get the CORS working

	if (!URLParams.since) {
	
		res.writeHead(400, { 
			'Content-Type' : 'application/json',
			'Access-Control-Allow-Origin' : '*'	
		});
	
		var body = JSON.stringify({ 
			error: "Must send a since parameter"
		});
		
		res.end(body);
		return;
	}
	
	var id = URLParams.id;
	var curSession;
	if (id && connectedClients[id]) {
		curSession = connectedClients[id];
		curSession.poke();
	}
	
	var since = parseInt(URLParams.since, 10);
	
	bespoke_session.query(since, function (messages) {
		if (curSession) curSession.poke();
		res.writeHead(200, { 
			'Content-Type' : 'application/json',
			'Access-Control-Allow-Origin' : '*'	
		});
		var body = JSON.stringify({ messages: messages, resource: mem.resource });
		res.end(body);
	});
});

/***********************************************************************
/
/		Utility Methods
/		These methods are those which do work for the other main methods
/		which are the ones that are used for main communication between
/		the clients and controllers.
/
***********************************************************************/


function parseURL(req) { 
	var queryStringObject = qs.parse(url.parse(req.url).query);
	return queryStringObject;
}

function createSession (name) {
  if (name.length > 50) return null;
  if (/[^\w_\-^!]/.exec(name)) return null;

  for (var i in connectedClients) {
    var connectedClient = connectedClients[i];
    if (connectedClient && connectedClient.name === name) return null;
  }

  var connectedClient = { 
    name: name, 
    id: Math.floor(Math.random()*99999999999).toString(),
    timestamp: new Date(),

    poke: function () {
      connectedClient.timestamp = new Date();
    },

    destroy: function () {
      bespoke_session.appendMessage(connectedClient, "part");
      delete connectedClients[connectedClient.id];
    }
  };

  connectedClients[connectedClient.id] = connectedClient;
  return connectedClient;
}



// Push new message URL
