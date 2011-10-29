var view = function()
{
	
	var that = this;
	
	this.node_connection_client=null,
	 
	this.init = function()
	{
		jQuery(window).bind('load_image', function(e,data){
		var alignX=0.5, alignY=0.5, fitX, fitY;
		
		
			var new_image = new Image();
				new_image.onload = function()
				{
					jQuery('body').empty();
					
					var parentWidth = jQuery(window).width();
					var parentHeight = jQuery(window).height();
					
					// Get the image width and height
					var imageWidth = new_image.width;
					var imageHeight = new_image.height;
					
				
					// Get the ratios which would stretch the image disproportionally to fit both dimensions exactly
					var ratioX = parentWidth / imageWidth;
					var ratioY = parentHeight / imageHeight;
					var dimensionRatio = ratioX / ratioY
		 
		
					var new_width = parentWidth;
					var new_height = parentWidth * dimensionRatio;
					
					if(new_height>parentHeight)
					{
						new_height = parentHeight;
						new_width = parentWidth/dimensionRatio
					}
					
					// Position the image element according to the alignment value
					new_image.style.marginTop = (0.5 * (parentHeight-new_height)) + "px";
					new_image.style.width = new_width + "px";
					new_image.style.height = new_height + "px";
					
					jQuery('body').append(new_image);
				}
				
				new_image.src = 'image/' + data.command_data + '.jpg';
				
		})
	}
}