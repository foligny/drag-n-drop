///////////////////////////////
//   Capture Mouse Position  //
///////////////////////////////
//
//   Written by : Francois Oligny-Lemieux
// Date Created : 02.Nov.2014
//     Modified : 22.Nov.2014 (added jsonp request, added [data-template])
//     Modified : 02.Sep.2015 (Put in AMD module. Add support for scrolling floating elements)
//  Description : Very simple capture mouse position handling in javascript.
//                Includes dragging functionality as a bonus.
//      License : If you want to include in your personal project, it is free
//                If it is for a corporate or group project, the price is 10$USD
//  Copyright (c) 2007 Francois Oligny-Lemieux
// ***********************************************************

// Browser support : IE8+, Firefox 1.5+, Chrome, Safari
//
//////////////////////////////////////////////////////
"use strict";

import T from './toolbox'

define(function (require) {

	function CaptureMousePosition() {
		if (console) console.log("WARNING: You do not need to call new CaptureMousePosition(). You can use it directly, e.g., CaptureMousePosition.bindAll(...)");
	}

	CaptureMousePosition.setupIdleTimeout = function(idleTimeoutMs, idleTimeoutCallback) {
		if (idleTimeoutMs > 0) {
		  CaptureMousePosition.idleTimeout = function() {
			idleTimeoutCallback();
		  };
		  CaptureMousePosition.idleTimeoutMs = idleTimeoutMs;
		  CaptureMousePosition.idleTimeoutRef = setTimeout(CaptureMousePosition.idleTimeout, CaptureMousePosition.idleTimeoutMs)
	   } else if (CaptureMousePosition.idleTimeoutRef) {
			clearTimeout(CaptureMousePosition.idleTimeoutRef);
		}
	}

	// Set Netscape up to run the "captureMousePosition" function whenever
	// the mouse is moved. For Internet Explorer and Netscape 6, you can capture
	// the movement a little easier.
	if (document.layers)
	{
		// Netscape
		document.captureEvents(Event.MOUSEMOVE);
		document.onmousemove = captureMousePosition;
		//alert("layers");
	}
	else if (document.all)
	{
		// Internet Explorer
		document.onmousemove = captureMousePosition;
		//document.onmousemove = function() { return false }
		//alert("alls");
	}
	else if (document.getElementById)
	{	// Netcsape 6
		document.onmousemove = captureMousePosition;
		//alert("netscape 6");
	}
	
	// Global variables
	var g_dragging = 0;
	var f_endCleanup = null;	
	var xMousePos = 0; // Horizontal position of the mouse on the screen
	var yMousePos = 0; // Vertical position of the mouse on the screen
	var xMousePosMax = 0; // Width of the page
	var yMousePosMax = 0; // Height of the page
	
	var f_onMove = function ()
	{
		return 1; // propagate event
	}
	
	function captureMousePosition(e) 
	{
		if (document.layers) 
		{
			// When the page scrolls in Netscape, the event's mouse position
			// reflects the absolute position on the screen. innerHight/Width
			// is the position from the top/left of the screen that the user is
			// looking at. pageX/YOffset is the amount that the user has
			// scrolled into the page. So the values will be in relation to
			// each other as the total offsets into the page, no matter if
			// the user has scrolled or not.
			xMousePos = e.pageX;
			yMousePos = e.pageY;
			xMousePosMax = window.innerWidth+window.pageXOffset;
			yMousePosMax = window.innerHeight+window.pageYOffset;
		} 
		else if (document.all)
		{
			// When the page scrolls in IE, the event's mouse position
			// reflects the position from the top/left of the screen the
			// user is looking at. scrollLeft/Top is the amount the user
			// has scrolled into the page. clientWidth/Height is the height/
			// width of the current page the user is looking at. So, to be
			// consistent with Netscape (above), add the scroll offsets to
			// both so we end up with an absolute value on the page, no
			// matter if the user has scrolled or not.
			xMousePos = window.event.x+document.body.scrollLeft;
			yMousePos = window.event.y+document.body.scrollTop;
			xMousePosMax = document.body.clientWidth+document.body.scrollLeft;
			yMousePosMax = document.body.clientHeight+document.body.scrollTop;
		} 
		else if (document.getElementById) 
		{
			// Netscape 6 behaves the same as Netscape 4 in this regard
			xMousePos = e.pageX;
			yMousePos = e.pageY;
			xMousePosMax = window.innerWidth+window.pageXOffset;
			yMousePosMax = window.innerHeight+window.pageYOffset;
		}
//console.log("moving to position", xMousePos, yMousePos)
        if (CaptureMousePosition.idleTimeoutRef)
		{
			clearTimeout(CaptureMousePosition.idleTimeoutRef);
			CaptureMousePosition.idleTimeoutRef = setTimeout(CaptureMousePosition.idleTimeout, CaptureMousePosition.idleTimeoutMs); // renew the timer
		}

		var iret = f_onMove();
	
		if ( iret == 0 )
		{
			if (!e)
			{
				e = window.event; // IE event model
			}
		
			if ( e && e.stopPropagation )
			{
				e.stopPropagation();  // DOM Level 2
			}
			else if ( e )
			{
				//alert("cancelling bubbles");
				e.cancelBubble = true; // IE
				if ( iret == 1 )
				{
					e.returnValue = false;
				}
			}
		}
	}	
	
	var g_initial_div_position_x = 0; // div position at startDrag 
	var g_initial_div_position_y = 0;
	
	var g_div_position_x = 0; // div position while dragging, only valid if g_dragging >= 1 
	var g_div_position_y = 0;	
	var g_currentDivDragging = null;
	var g_currentPlaceholder = null;
	
	var g_initial_drag_position_x = 0; // mouse position at startDrag
	var g_initial_drag_position_y = 0;
	var g_div_right_aligned = 0;
	
	function onMouseMove_div(divElement, options)
	{
		if ( divElement == null )
		{
			return;
		}
	
		var varX = xMousePos - g_initial_drag_position_x;
		var varY = yMousePos - g_initial_drag_position_y;
		
		var bodyRect = document.body.getBoundingClientRect();
		var elementRect = divElement.getBoundingClientRect();

		if (divElement.style.position !== "absolute")
		{
			//convert to absolute
			// get current top-left position
	//		var offset = elemRect.top - bodyRect.top;
	
			if (console) console.log("begin drag, top pos:"+elementRect.top);
			
			//var $offset = $(divElement).offset();
			// var $offset = T.getOffset(divElement);
			// if (console) console.log("begin drag, jquery top pos:"+$offset.top);
	
			divElement.style.position = "absolute";
			divElement.style.marginTop = "0";
	//		T.addClass(divElement, "draggingAbsolutePos");
			divElement.style.left = elementRect.left + "px";
			divElement.style.top = elementRect.top + "px";
			g_initial_div_position_x = elementRect.left + window.scrollX;
			g_initial_div_position_y = elementRect.top + window.scrollY;
			// need to adjust with scrolling.
			//g_initial_drag_position_x = elementRect.left;
			//g_initial_drag_position_y = elementRect.top;
			varX = varY = 0;
			g_div_right_aligned = 0;
		}
		else
		{
			//var $offset = $(divElement).offset();
			//if (console) console.log("drag, jquery top pos:"+$offset.top);
			//if (console) console.log("varX:"+varX);
		}
				
		if (g_dragging == 1) 
		{
			g_dragging = 2; // indicate we have moved 
			g_currentDivDragging = divElement;
				
			if (options != null && options.removeClass)
			{
				T.removeClass(divElement, options.removeClass);
			}
		
			if (options != null && options.replaceWith)
			{
				var templateEl = T.getElement(options.replaceWith);
				if (templateEl == null) 
				{	if (console) console.log("Could not get element based on selector:"+options.replaceWith);
					return;
				}
				
				var html = templateEl.innerHTML;
				html = T.Replace(html, {id:"ph"}); // after handling and removing logic blocks, parse everything
				var newDiv = document.createElement("div");
				newDiv.innerHTML = html;
				const placeHolder = T.getElement("div", newDiv);
				if (placeHolder)
				{
					placeHolder.style.width = elementRect.width+'px';
					placeHolder.style.height =elementRect.height+'px';
				}
				var parentNode = divElement.parentNode;
				// console.log('parentNode is', parentNode)
				parentNode.insertBefore(newDiv, divElement);
				g_currentPlaceholder = newDiv;
			}
				
			f_endCleanup = function()
			{
				if (options != null && options.removeClass)
				{
					T.addClass(divElement, options.removeClass);
				}
				
				if (options != null && options.replaceWith)
				{
					// snap back into place
					g_currentPlaceholder.parentNode.replaceChild(divElement, g_currentPlaceholder);
					g_currentPlaceholder = null;
					divElement.style.position = ""; // reset to default
					divElement.style.marginTop = ""; // reset to default
				}
			};
			
			// first time dragging
		}
		
		//document.getElementById('id_debug_message').innerHTML += "(" + g_initial_div_position_x + "::"+varX+"<br>\n";
		
		if ( g_div_right_aligned )
		{
			divElement.style.right = g_initial_div_position_x - varX + "px";
			var bodyRect = document.body.getBoundingClientRect();
			g_div_position_x = bodyRect.right - bodyRect.left - (g_initial_div_position_x - varX);
		}
		else
		{
			divElement.style.left = g_div_position_x = g_initial_div_position_x + varX + "px";
		}
		divElement.style.top = g_div_position_y = g_initial_div_position_y + varY + "px";
		
		CaptureMousePosition.manageGroups(".jsDragEl"); // FIXME bound to parent
	}
	
	CaptureMousePosition.startDrag = function(target_id, event, options)
	{
		var divElement = document.getElementById(target_id);
		
		if (divElement == null) 
		{
			if (console) console.log("Error could not find element from id:"+target_id);
			return;
		}
		
		var string = null;
	
		g_div_right_aligned = 0;
	
		string = divElement.style.left + "";
		string = string.replace("/px$/","");
		g_initial_div_position_x = parseInt(string);
		if ( isNaN(g_initial_div_position_x) )
		{
			string = divElement.style.right + "";
			string = string.replace("/px$/","");
			var right = parseInt(string);
			g_initial_div_position_x = right;
			g_div_right_aligned = 1;
		}
	
		string = divElement.style.top + "";
		string = string.replace("/px$/","");
		g_initial_div_position_y = parseInt(string);
		g_initial_drag_position_x = xMousePos;
		g_initial_drag_position_y = yMousePos;
				
		//alert("init div position left: "+ g_initial_div_position_x);
		f_onMove = function ()
		{
			onMouseMove_div(divElement, options);
			return 0; // 0 to signal calling function to not bubble up
		}
	
		if ( event == null )
		{
			event = window.event;
		}
	
		// We've handled this event. Don't let anybody else see it.  
		if (event.stopPropagation) event.stopPropagation( );  // DOM Level 2
		else event.cancelBubble = true;                      // IE
		
		// Now prevent any default action.
		if (event.preventDefault) event.preventDefault( );   // DOM Level 2
		else event.returnValue = false;                     // IE	
	
		//document.onmouseup = function() { stopDrag(id); }
	
		g_dragging = 1;
	}
	
	// returns 1 if was dragging
	// returns 0 if was not dragging
	CaptureMousePosition.stopDrag = function(event)
	{
		f_onMove = function ()
		{	return 1; // propagate event
		}
		
		if (f_endCleanup != null)
		{
			f_endCleanup();
			f_endCleanup = null;
		}
	
		var wasDragging = g_dragging;
		g_dragging = 0;
		g_currentDivDragging = null;
		return wasDragging;
	}

	// This switches the placeholder to the nearest target
	CaptureMousePosition.manageGroups = function(selector)
	{
		var divs = T.getAll(selector); // FIXME find from top listContainer
		 
		var smallestDistanceWith = null;
		var smallestDistance = 0xFFFFFFFF;
		
		var placeholderX = null;
		var placeholderY = null;
		var placeholderW = null;
		var placeholderH = null;
		
		// calculate current drag position
		
		// calculate each position
		divs.forEach(function(div) // frank fixme do a polyfill for forEach
		{
			var elementRect = div.getBoundingClientRect();
            console.log('elementRect', elementRect)
			if (div._t == null) div._t = {};
			if (div.id === g_currentDivDragging.id && div.attributes['data-drag-placeholder'] == null)
			{
				// dont diff with ourself 
				return;
			}
			var x2 = Math.pow(parseInt(g_div_position_x,10) - (elementRect.left + window.scrollX), 2);
			var y2 = Math.pow(parseInt(g_div_position_y,10) - (elementRect.top + window.scrollY), 2);
			div._t.x = elementRect.left;
			div._t.y = elementRect.top;
			div._t.distanceWidth = Math.sqrt(x2 + y2)
			if (console) console.log("distance with "+div.attributes['data-name'].value+" " + div._t.distanceWidth);
			if (smallestDistance > div._t.distanceWidth)
			{
				smallestDistance = div._t.distanceWidth;
				smallestDistanceWith = div;
			}
			
			if (div.attributes['data-drag-placeholder'] != null && div.attributes['data-drag-placeholder'].value == "true")
			{
				placeholderX = elementRect.left;
				placeholderY = elementRect.top;
				placeholderW = elementRect.width; // UNUSED
				placeholderH = elementRect.height; // UNUSED
			}
		});

		if (smallestDistanceWith == null) {
			return; // maybe no elements 
		}
		
		if (smallestDistanceWith.id !== g_currentDivDragging.id)
		{
			// lets move !
			if (smallestDistanceWith.attributes['data-name'].value == "placeholder")
			{
				// dont need to move
				return;
			}
			if (console) console.log("Moving to new spot:"+smallestDistanceWith.id + ", :"+g_currentDivDragging.id);
			if (console) console.log("Moving to new spot:"+smallestDistanceWith.attributes['data-name'].value);
			var parentNode = g_currentPlaceholder.parentNode;		
			var entry = smallestDistanceWith.nextSibling;
			var before = false;
			if (placeholderY == smallestDistanceWith._t.y)
			{
				if (placeholderX < smallestDistanceWith._t.x)
				{	before = true;
				}				
			}
			else if (placeholderY < smallestDistanceWith._t.y)
			{	before = true;
			}
			
			console.log("before:"+before);
			if (!before)
			{
				parentNode.insertBefore(g_currentPlaceholder, smallestDistanceWith);
			}
			else
			{
				if (entry == null) console.log("NO ENTRY");
				parentNode.insertBefore(g_currentPlaceholder, entry);
			}
		}
		
	};
	
	// Recommended to cut/paste these event handling in your view manager module
	// Use instead CaptureMousePosition.startDrag() and CaptureMousePosition.stopDrag() in your view manager module.	
	// Like this you don't mix event binding on your DOM object with library code.
	// For example if you want to bind onclick function on the same dragger DOM element, it is easier to extend the mouseup handler.
	CaptureMousePosition.bindAll = function(domSelector)
	{
	   var els = T.getAllElements(domSelector);
		T.onEvent('mousedown', els, function(event)
		{
			var element = event.currentTarget;
			var options = {};
			if (element.attributes['data-drag-removeClass'] != null)
			{
				options.removeClass = element.attributes['data-drag-removeClass'].value;
			}
			
			if (element.attributes['data-drag-replaceWith'] != null)
			{
				options.replaceWith = element.attributes['data-drag-replaceWith'].value;
			}
			
			startDrag(element.id, event, options);
		});
		
		T.onEvent('mouseup', els, function(event)
		{
			var element = event.currentTarget;
			stopDrag();	
		});

		// release drag if mouse released outside window
		T.onEvent('mouseup', document, function(event)
		{
			stopDrag();	
		});
		
	};
	
 //onMouseDown="startDrag('id_div_city_%%id%%', event, {removeClass: 'transition500ms'})" onMouseUp="stopDrag();"
 
 
	return CaptureMousePosition;

});