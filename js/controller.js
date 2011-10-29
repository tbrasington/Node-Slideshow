var controller = function()
{
	
	var that = this;
	
	this.node_connection_client=null,
	this.total_items = 5,
	this.position = 0,
	
	this.init = function()
	{
		jQuery('body').keydown( function(e){
		
		
			if(e.keyCode==32 || e.keyCode==39)
			{
				that.position++;
				if(that.position>=that.total_items)
				{
					that.position = 0;
				}
			}
			
			
			if(e.keyCode==37)
			{
				that.position--;
				
				if(that.position<=0)
				{
					that.position = that.total_items-1;
				}
			}
		
			if(e.keyCode == 32 || e.keyCode == 37 || e.keyCode == 39)
			{
				// URL that the request will use
				var url = that.node_connection_client.node_server + ":" + that.node_connection_client.node_port + that.node_connection_client.process_client_send;
				//console.log(url)
				// The query string attached to url which will contain what command to use and any references to the DOM elements
				var query_string = "id=" +that.node_connection_client.my_current_id +"&name="+that.node_connection_client.device_reference  + "&command_data="  + encodeURIComponent(that.position);
				
				// Send the request
				jQuery.ajax({
					url: url,
					type : "GET",
		  			data: query_string,
		 			dataType: "json"
		 		});
			}
		});
	}
}