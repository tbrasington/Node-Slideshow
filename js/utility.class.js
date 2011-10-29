/**
 * @fileoverview Contains various helper utilities that the app
 * needs that aren't in jQuery or another plugin
 * @author tom@2c2d.co.uk (Thomas Brasington)
 */

/**
 * Utility Class
 * @class Utility
 * @version 2011 alpha 1.0
 * @namespace A collection of functions needed by the app
 */
var Utility = { 

	/**
	 * @description newElement builds a new DOM Element <br>jQuery has no method for building new elements in one line so this method takes care of that 
	 * @type {Function}
	 * @param {DOMElement} el the type of DOMElement you want to construct. e.g. "div"
	 * @param {String} cssClass the name of the css class you wish to use
	 * @param {String} id the id of the DOMElement 
	 * @returns {DOMElement} The new DOMElement.
	 */
	newElement : function (el, cssClass, id)
	{ 
		
		var newEl = document.createElement(el);
		newEl.className = cssClass.substr(1);
		newEl.id = id;
		return newEl;	
	},
	
	/**
	 * @description escape_id for cleaning string<br>jQuery cannot cope with slashes, periods etc so they have to be escaped
	 * @type {Function}
	 * @param {String} my_id the name of an id that needs to be escaped
	 * @returns {String} The escape string prepended with a hash symbol
	 */
	escape_id : function (my_id)
	{ 
		return '#' + my_id.replace(/(:|\.)/g,'\\$1');
	}
}