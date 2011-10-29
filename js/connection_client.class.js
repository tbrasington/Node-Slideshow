/**
 * @fileoverview Connection_Client Class, contains the class known as Connection_Client
 * @author tom@2c2d.com (Thomas Brasington)
 */


/**
 * Connection_Client Class
 * @class Connection_Client
 * @version 2011 alpha 1.0
 * @namespace Starts a connection to the node server 
 */
 var Connection_Client = function() { 

	/**
	 * @description A reference to the constructed class
	 * @type Variable
	 * @borrows this as that
	 */
	var that = this;
	
	/**
	 * @description The instance of the views model
	 * @type Object
	 */
	this.model = null,
	
	/**
	 * @description The address of the node server
	 * @type String 	
	 */
	 
	this.node_server = "http://192.168.0.15",
	
	/**
	 * @description The port of the node server
	 * @type String 	
	 */
	this.node_port = "8001",
	/**
	 * @description The name of the call to listen to node
	 * @type String 	
	 */
	this.process_server_listen = "/recv",
	/**
	 * @description The name of the call to see who is listening to node
	 * @type String 	
	 */
	this.process_client_prescence_check = "/who",
	/**
	 * @description The name of the call to join node
	 * @type String 	
	 */
	this.process_client_join = "/join",
	
	/**
	 * @description The name of the call to leave node
	 * @type String 	
	 */
	this.process_client_part = "/part",
	
	/**
	 * @description The name of the call to send to node
	 * @type String 	
	 */
	this.process_client_send= "/send",
	
	/**
	 * @description The name of the join sub-call used when sending to node
	 * @type String 	
	 */
	this.sub_process_join = 'join',
	
	/**
	 * @description The name of the command sub-call used when sending to node
	 * @type String 	
	 */
	this.sub_process_command = 'command', 

	/**
	 * @description The name of the connected device to node.
	 * @type String 	
	 */
	this.device_reference = null,
	
	/**
	 * @description The id of the current connection to node.
	 * @type Number 	
	 */
	this.my_current_id = null,	
	
	/**
	 * @description The last time node made a call. This is updated everytime a query is made with a unix timestamp
	 * @type Number 	
	 */
	this.last_message_time = 1,
	
	/**
	 * @description The count of how many errors have happened in query. If it hits the limit it stops and reconnects
	 * @type Number 	
	 */
	this.transmission_errors = 0,
	
	
	/**
	 * @description Starts the connection to node off
	 * @param {Function} callback provides a method for firing a callback after the JSON data has been loaded.
	 */
	this.listener_setup = function(callback) { 
		jQuery(window).unload(function () {
			jQuery.ajax({
				url: that.node_server + ":" + that.node_port + that.process_client_part,
	  			data: "id="+that.my_current_id,
	  			success: function(result) { 
	  			
	  				if(callback != null) { callback(); } 
	  			},
	 			dataType: "json"
 			});
 		});
 		
 		if(callback != null) { callback(); }
	},
	/**
	 * @description  Initialises the Connection_Client class<br>
	 * Joins with node and starts the listener.
	 * @param {Function} callback provides a method for firing a callback
	 */
	this.init = function(callback) {
		
		that.join(function() 
		{ 
			that.listener_setup(function() 
			{ 
				that.listen();
			});
		});
	},

	/**
	 * @description Joins the device with node
	 * @param {Function} callback provides a method for firing a callback after the JSON data has been loaded.
	 */
	this.join = function(callback) { 
		
		//console.log("Node server address: " + that.node_server + ":" + that.node_port);
		
		var url = that.node_server + ":" + that.node_port + that.process_client_join;

		jQuery.ajax({
			url: url,
  			data: "name="+that.device_reference,
  			success: function(result) { 
  				
  				// Set my_current_id with the session id
  				that.my_current_id = result.mySession.id;
  				
  				if(callback != null) { callback(); } 
  			},
 			dataType: "json"
 		});
	},
	
	/**
	 * @description Listens for new objects that the clients will process<br>
	 * The part that updates the model is taken from data.messages. This processes the message log and fires and update to the Model class
	 * which has been bound to the instance of the Connection_Client. 
	 * @param {Object} data a JSON object.
	 */
	this.listen = function(data) { 
 		
 		if (that.transmission_errors > 2) {
			that.handle_reconnect();
			return;
		}
		
		if (data && data.resource) {
			resource = data.resource;
			that.manage_memory(resource);
		}
		
		/*
		
			Processess messages
			
			Loops through message object
			Organsies messages by command, join, recieve
			updates controllers and views
		
		*/
		
		var commandMessage = [], commands= 0, joinMessage = [], joins = 0;
		
				// Process any updates if we have some...
		if (data && data.messages)
		{
			for (var i = 0; i < data.messages.length; i++)
			{
				var message = data.messages[i];
				//console.log(message.type)
				//track oldest message so we only request newer messages from server
				if (message.timestamp > that.last_message_time)
				{
					that.last_message_time = message.timestamp;
				} 
				//dispatch new messages to their appropriate handlers
				switch (message.type)
				{
					case that.sub_process_command:
						//that.deal_with_command(message);
						commandMessage[commands] = message;
						commands++;
				  	break;
				  	
				  	
					case that.sub_process_join:
						//that.deal_with_command(message);
						joinMessage[joins] = message;
						joins++;
				  	break;
				}
				
				// Once we have looped through all messages, fire off the commands as single objects rather than multiple times
				// This is somewhat blocking 
				if(i == data.messages.length-1) 
				{
					if(commands>0)
					{	
						var image = null;
						//console.log()
					 	jQuery(window).trigger('load_image',commandMessage[commandMessage.length-1])
					}
					 
				}
			}
		}
		
		//make another request
		jQuery.ajax({ 
			cache: false,
			type: "GET",
			url: that.node_server + ":" + that.node_port + that.process_server_listen,
			dataType: "json",
			data: { since: that.last_message_time, id: that.my_current_id },
		    error: function (error) {
		    	console.log("Error");
				that.deal_with_error(error);
				that.transmission_errors += 1;
				//don't flood the server on error, wait before retrying
				setTimeout(that.listen, 10*1000);
			},
		    success: function (data) {
				that.transmission_errors = 0;
				// Success, time to start listening again
				that.listen(data);
			}
		});
	},
	
	/**
	 * @description Handles a reconnect to node
	 */
	this.handle_reconnect = function() { 
		//console.log("Need to handle the reconnection here.");
	},
	
	
	/**
	 * @description Manages the memory being used by node
	 * @param {Object} memory Yet to be defined
	 */
	this.manage_memory = function(memory) { 
		//console.log(resource);
	},
		
	
	/**
	 * @description Manages the errors thrown by node
	 * @param {Object} error Yet to be defined
	 */
	this.deal_with_error = function(error) { 
		//console.log(error);
	}
}