// Yipp Map Toolbox
// Requirements: jQuery

// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  if (this.console) console.log( Array.prototype.slice.call(arguments) );
};

// trim polyfill : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
if (!String.prototype.trim) {
	(function() {
		// Make sure we trim BOM and NBSP
		var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
		String.prototype.trim = function() {
			return this.replace(rtrim, '');
		};
	})();
}

// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {

  Array.prototype.forEach = function(callback, thisArg) {

    var T, k;

    if (this == null) {
      throw new TypeError(' this is null or not defined');
    }

    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if (typeof callback !== "function") {
      throw new TypeError(callback + ' is not a function');
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (arguments.length > 1) {
      T = thisArg;
    }

    // 6. Let k be 0
    k = 0;

    // 7. Repeat, while k < len
    while (k < len) {

      var kValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[k];

        // ii. Call the Call internal method of callback with T as the this value and
        // argument list containing kValue, k, and O.
        callback.call(T, kValue, k, O);
      }
      // d. Increase k by 1.
      k++;
    }
    // 8. return undefined
  };
}

// place any jQuery/helper plugins in here
(function ($) {

    // Usage:
    // $.cachedGetScript = $.createCache(function( defer, url ) {
    //    $.getScript( url ).then( defer.resolve, defer.reject );
    // });
    // $.cachedGetScript( url ).then( successCallback, errorCallback );
    $.createCache = function( requestFunction ) {
        var cache = {};
        return function( key, callback ) {
            if ( !cache[ key ] ) {
                cache[ key ] = $.Deferred(function( defer ) {
                    requestFunction( defer, key );
                }).promise();
            }
            return cache[ key ].done( callback );
        };
    };

    // Written 25.May.2011 (frank)
    // Cross-browser compatible "min-width:600px; width:50%; max-width:1200px;" kind of declaration
    // Parameters are integers.
    $.fn.widther = function (minWidthPixels, widthPercent, maxWidthPixels, sourceElementSelector) {
        minWidthPixels = +minWidthPixels;
        widthPercent = +widthPercent;
        maxWidthPixels = +maxWidthPixels;

        var element = this;
        var obj = $(this);

        if (sourceElementSelector != null) {
            // loop until source element is found
            var sourceElement = $(sourceElementSelector);
            if (sourceElement) {
                element = sourceElement.get(0);
                obj = sourceElement.eq(0);
            }
            else {
                setTimeout($.fn.widther(minWidthPixels, widthPercent, maxWidthPixels, sourceElement), 20);
                //alert("retrying");
                return;
            }
        }

        var umbrella = obj.lookup(".widtherUmbrella");
        var pageWidth = umbrella.width();
        function routine() {
            obj = $(element);
            var width = obj.width();
            var height = obj.height();
            pageWidth = umbrella.width();
            if (minWidthPixels != null && +pageWidth * widthPercent / 100 < +minWidthPixels) {
                obj.css("width", minWidthPixels + "px");
            }
            else if (maxWidthPixels != null && +pageWidth * widthPercent / 100 > +maxWidthPixels) {
                obj.css("width", maxWidthPixels + "px");
            }
            else {
                obj.css("width", Math.round(+pageWidth * widthPercent / 100) + "px");
            }
        }
        routine();
        $(window).resize(function () {
            routine();
        });
        return obj;
    };
    
    // Written 25.May.2011 (frank)
    // Cross-browser compatible "min-width:600px; width:50%; max-width:1200px;" kind of declaration
    // Parameters are integers.
    $.fn.heighter = function (heightPercent, adjPixels, sourceElementSelector) {
        heightPercent = +heightPercent;
        adjPixels = +adjPixels;

        var element = this;
        var obj = $(this);

        if (sourceElementSelector != null) {
            // loop until source element is found
            var sourceElement = $(sourceElementSelector);
            if (sourceElement) {
                element = sourceElement.get(0);
                obj = sourceElement.eq(0);
            }
            else {
                setTimeout($.fn.heighter(heightPercent, adjPixels, sourceElementSelector), 20);
                //alert("retrying");
                return;
            }
        }

        var umbrella = obj.lookup(".heighterUmbrella");
        if (umbrella.length == 0) umbrella = $(window);
        var pageHeight = umbrella.height();
        function routine() {
            obj = $(element);
            var width = obj.width();
            var height = obj.height();
            pageHeight = umbrella.height();
            var newHeight = pageHeight * heightPercent / 100;
            if (adjPixels != null) {
              newHeight = newHeight + adjPixels;
            }
            if (height !== newHeight)
            { obj.css("height", Math.round(+newHeight) + "px");
            }
        }

        routine();
        $(window).resize(function () {
            routine();
        });
        return obj;
    };
    
    // json is the feedback from .cs code
    // srcElement is a jQuery object
    // requires a <span class="jsFeedbackCompanion"></span> as a sibling of the srcElement that will receive the message
    $.fn.FormatSingleFeedback = function (json, srcElement) {
        if (json == null) { return false; }
        var delay = 500;
        var flashMainBanner = false;
        var companion = null;

        if (srcElement == null) {
            srcElement = $(".feedback"); // fallback on main error flasher, should not happen...
            flashMainBanner = true;
        }
        else {
            // companion == feedback companion
            var companion = srcElement.siblings(".jsFeedbackCompanion");
            if (companion.length == 0) companion = srcElement.parent().siblings(".jsFeedbackCompanion");
            if (companion.length > 0) {
                companion = companion.eq(0); // take only first one
                companion.removeClass("success info error warning");
            }
        }

        srcElement.removeClass("success info error warning");

        if (json.Success == true) { // no errors
            if (json.Type == "Success") {
                srcElement.addClass("success");
                if (companion != null) companion.addClass("success");
            }
            else if (json.Type == "Info") {
                srcElement.addClass("info");
                if (companion != null) companion.addClass("info");
            }
            else if (json.Type == "Warning") {
                srcElement.addClass("warning");
                if (companion != null) companion.addClass("warning");
            }
        }
        else { // error
            if (json.Type == "Error") {
                srcElement.addClass("error");
                if (companion != null) companion.addClass("error");
            }
        } //end else

        if (json.Message) {
            companion.html(json.Message);
        }

        if (flashMainBanner == true) {
            $(".feedback").find(".default").html(json.Message);
            $(".feedback").fadeIn().delay(delay).fadeOut();
        }
    };

    // srcElement is a jQuery object
    $.fn.ClearSingleFeedback = function (srcElement) {
        var flashMainBanner = false;
        var companion = null;

        if (srcElement == null)
        {   srcElement = $(this);  
        }

        if (srcElement == null) {
            srcElement = $(".feedback"); // fallback on main error flasher, should not happen...  
        }
        else {
            // companion == feedback companion
            var companion = srcElement.siblings(".jsFeedbackCompanion");
            if (companion.length > 0) {
                companion = companion.eq(0); // take only first one
                companion.removeClass("success info error warning");
                companion.html("");
            }
        }

        srcElement.removeClass("success info error warning");
    };
    
    // Written 09.May.2011 (frank)
    // Returns only one element, the parent that matched the selector (instead of all parents matching)
    $.fn.parentUntil = function (selector) {
        var empty = [];
        var element = this;
        while (element.length) {
            var element = element.parent();
            if (jQuery(element).is(selector) == true) // no idea what nodeType is parent.nodeType === 1 && 
            {
                // found element
                return element;
            }
        }

        // not found, empty array
        return empty;
    };

    // Written 11.May.2011 (frank)
    // Returns only one element, lookup at siblings for the selector, and move up gradually until found
    $.fn.lookup = function (selector) {
        var empty = [];
        var element = this;
        var lookup;
        while (element.length) {
            if (element.is(selector)) {   // found element
                return element;
            }
            var siblings = element.siblings();
            lookup = siblings.filter(selector); // search among siblings
            if (lookup.length) // no idea what nodeType is parent.nodeType === 1 && 
            {   // found element
                return lookup;
            }
            lookup = siblings.find(selector); // search within siblings
            if (lookup.length) {   // found element
                return lookup;
            }
            if (element.is("html")) break;
            var element = element.parent();
        }

        // not found, empty array
        return empty;
    };
    

})(jQuery);

Toolbox = function()
{
   this.Replace = function(html, model)
   {
      for (var item in model)
      {
         var regex = new RegExp("%%"+item+"%%", "g");
         html = html.replace(regex, model[item]);
      }
      return html;
   };
};

var Toolbox = new Toolbox();
export default Toolbox;

function addEvent(el, eventName, func) {
    if (el.attachEvent) {  // IE
        el.attachEvent("on" + eventName, func);
    }
    else if (el.addEventListener) {  // Gecko
        el.addEventListener(eventName, func, true);
    }
    else {
        el["on" + eventName] = func;
    }
}

function removeEvent(el, eventName, func) {
    if (el.detatchEvent) {  // IE
        el.detatchEvent("on" + eventName, func);
    }
    else if (el.removeEventListener) {  // Gecko
        el.removeEventListener(eventName, func, true);
    }
    else {
        el["on" + eventName] = null;
    }
}


// expires in MINUTES
function SetCookie(name, value, expires, path, domain, secure)
{
  // set time, it's in milliseconds
  var today = new Date();
  today.setTime( today.getTime() );

  if (expires)
  {
    expires = expires * 1000 * 60;
  }
  var expires_date = new Date( today.getTime() + (expires) );

  document.cookie = name + "=" +escape( value ) +
  ( ( expires ) ? ";expires=" + expires_date.toGMTString() : "" ) +
  ( ( path ) ? ";path=" + path : "" ) +
  ( ( domain ) ? ";domain=" + domain : "" ) +
  ( ( secure ) ? ";secure" : "" );
}

function GetCookie(key)
{
   var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');  
   return keyValue ? keyValue[2] : null;  
}


function formatPhone(phonenum) 
{
  var regexObj = /^(?:\+?1[-. ]?)?(?:\(?([0-9]{3})\)?[-. ]?)?([0-9]{3})[-. ]?([0-9]{4})$/;
  if (regexObj.test(phonenum))
  {  var parts = phonenum.match(regexObj);
     var phone = "";
     if (parts[1]) { phone += "(" + parts[1] + ") "; }
     phone += parts[2] + "-" + parts[3];
     return phone;
  }
  else
  {  //invalid phone number
     return phonenum;
  }
}

 

$(".jsConfirmation").on('click', function (event)
{
    var button = $(this);
    var message = button.data("confmsg");
    var answer = confirm(message);
    if (answer === false) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation != null) {
            event.stopImmediatePropagation();
        }
        if (event.cancelBubble != null) {
            event.cancelBubble = true;
        }
        return false;
    }
});

$(".jsOpenLink").on('click', function (event)
{
    var button = $(this);
    var message = button.data("href");
    document.location = href;
});



