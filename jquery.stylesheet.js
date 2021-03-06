/**
 * jQuery plugin for the stylesheet manipulation
 * 
 * @author Vimal Aravindashan
 * @version 0.2.0
 * @licensed MIT license
 */
(function ($) {
	var _elStyle = document.createElement('style'), /**< <style> element used as staging area for applying CSS rules */
		_ahref = $(document.createElement('a')), /**< <a> tag used for evaluating hrefs */
		_styles = _ahref.prop('style'), /**< Collection of styles available on the host */
		vendorPrefixes = ["Webkit", "O", "Moz", "ms"]; /**< Case sensitive list of vendor specific prefixes */
	
	/**
	 * @function filterStyleSheet
	 * Filter a stylesheet based on ID or location
	 * @param {String} filter Filter to be applied. id or href of the style element can be used as filters.
	 * @param {CSSStyleSheet} styleSheet StyleSheet to be filtered
	 * @returns {Boolean} true if stylesheet matches the filter, false otherwise
	 */
	function filterStyleSheet(filter, styleSheet) {
		filter = filter || '';
		var node = $(styleSheet.ownerNode);
		return (filter === '') ||
			('#'+(node.prop('id') || '') == filter) ||
			((node.prop('href') || '') == _ahref.prop('href', filter).prop('href'));
	}
	
	/**
	 * @function vendorPropName
	 * Vendor prefixed style property name.
	 * Based on similar function in jQuery library.
	 * @param {String} name camelCased CSS property name
	 * @returns {String} Vendor specific tag prefixed style name
	 * if found in styles, else passed name as-is
	 * @see vendorPrefixes
	 * @see _styles
	 */
	function vendorPropName(name) {
		var titleName = name[0].toUpperCase() + name.slice(1),
			styleName, i = vendorPrefixes.length;
		while( --i ) {
			styleName = vendorPrefixes[i] + titleName;
			if(styleName in _styles) {
				return styleName;
			}
		}
		return name;
	}
	
	/**
	 * jQuery.stylesheet
	 * 
	 * Constructor/Factory method for initializing a jQuery.stylesheet object.
	 * Includes a short-cut to apply style changes immediately.
	 * @param {String} selector CSS rule selector text with optional stylesheet filter  
	 * @param {String|Array|Object} name Name of style property to get/set.
	 * Also accepts array of property names and object of name/value pairs.
	 * @param {String} value If defined, then value of the style property
	 * is updated with it. Unused when name is an object map.
	 * @returns {jQuery.stylesheet|String|Object} A new jQuery.stylesheet object
	 * if name/value is not passed, or value of property or object of name/value pairs
	 */
	$.stylesheet = function (selector, name, value) {
		if(!(this instanceof $.stylesheet)) {
			return new $.stylesheet(selector, name, value);
		}
		
		this.init(selector);
		return this.css(name, value);
	};
	
	$.extend($.stylesheet, {
		/**
		 * @function jQuery.stylesheet.cssRules
		 * @param {String} selector CSS rule selector text with optional stylesheet filter
		 * @returns {Array} Array of CSSStyleRule objects that match the selector text
		 * and pass the stylesheet filter
		 */
		cssRules: function (selector) {
			if(!selector) {
				return [];
			}
			
			var rules = [],
				filters = selector.split('{'),
				styleSheetFilter = (filters.length > 1) ? $.trim(filters[0]) : '';
			selector = (filters.length > 1) ? $.trim(filters[1].split('}')[0]) : $.trim(selector);
			//NOTE: selector and filter will be treated as case-sensitive
			$(document.styleSheets).not(_elStyle).reverse().each(function (i, styleSheet) {
				if(filterStyleSheet(styleSheetFilter, styleSheet)) {
					$.each((styleSheet.rules || styleSheet.cssRules), function (j, cssRule) {
						if(cssRule instanceof CSSStyleRule && cssRule.selectorText === selector) {
							rules.push(cssRule);
						}
					});
				}
			});
			return rules;
		},
		
		/**
		 * @function jQuery.stylesheet.camelCase
		 * jQuery.camelCase is undocumented and could be removed at any point
		 * @param {String} hypenated string to be camelCased
		 * @returns {String} camelCased string
		 */
		camelCase: $.camelCase || function( str ) {
			return str.replace(/-([\da-z])/g, function(a){return a.toUpperCase().replace('-','');});
		},
		
		/**
		 * Normalized CSS property names
		 */
		cssProps: $.cssProps || {},
		
		/**
		 * @function jQuery.styesheet.cssStyleName
		 * @param {String} name Hypenated CSS property name
		 * @returns {String} camelCased name if found in host styles, or vendor specific name
		 */
		cssStyleName: function (name) {
			if(!name) {
				return name;
			}
			
			var camelcasedName = $.camelCase(name);
			return (camelcasedName in _styles) ?
					camelcasedName :
					($.cssProps[name] || ($.cssProps[name] = vendorPropName(camelcasedName)));
		}
	});
	
	$.extend($.fn, {
		/**
		 * @function jQuery.fn.reverse
		 * Native Object Method Array.reverse() for jQuery.
		 * Full credits to Michael Geary (http://www.mail-archive.com/discuss@jquery.com/msg04261.html)
		 */
		reverse: $.fn.reverse || [].reverse 
	});
	
	$.stylesheet.fn = $.stylesheet.prototype = {
		/**
		 * @function jQuery.stylesheet.fn.init
		 * Initializes a jQuery.stylesheet object.
		 * Selects a list of applicable CSS rules for given selector.
		 * @see jQuery.stylesheet.cssRules
		 * @param {String|Array|Object} selector CSS rule selector text(s)
		 * with optional stylesheet filter(s)
		 */
		init: function (selector) {
			var rules = []; /**< Array of CSSStyleRule objects matching the selector initialized with */
			
			switch($.type(selector)) {
			case 'string':
				rules = $.stylesheet.cssRules(selector);
				break;
			case 'array':
				$.each(selector, function (idx, val) {
					if($.type(val) === 'string') {
						$.merge(rules, $.stylesheet.cssRules(val));
					} else if(val instanceof CSSStyleRule) {
						rules.push(val);
					}
				});
				break;
			case 'object':
				if(selector instanceof CSSStyleRule) {
					rules.push(val);
				}
				break;
			}
			
			$.extend(this, {
				/**
				 * @function jQuery.stylesheet.rules
				 * @returns {Array} Copy of array of CSSStyleRule objects used
				 * by this instance of jQuery.stylesheet 
				 */
				rules: function() {
					return rules.slice();
				},
				
				/**
				 * @function jQuery.stylesheet.css()
				 * @param {String|Array|Object} name Name of style property to get/set.
				 * Also accepts array of property names and object of name/value pairs.
				 * @param {String} value If defined, then value of the style property
				 * is updated with it. Unused when name is an object map.
				 * @returns {jQuery.stylesheet|String|Object} A new jQuery.stylesheet object
				 * if name/value is not passed, or value of property or object of name/value pairs
				 */
				css: function (name, value) {
					var self = this, styles;
					
					switch($.type(name)) {
					case 'string':
						name = $.stylesheet.cssStyleName(name);
						if(name) {
							$.each(rules, function (i, rule) {
								if(rule.style[name] !== '') {
									if(value !== undefined) {
										rule.style[name] = value;
										styles = self;
									} else {
										styles = rule.style[name];
									}
									return false;
								}
							});
							if(styles === undefined && value !== undefined) {
								rules[0].style[name] = value;
								styles = self;
							}
						}
						break;
					case 'array':
						styles = {};
						$.each(name, function (idx, key) {
							styles[key] = self.css(key, value);
						});
						if(value !== undefined) {
							styles = self;
						}
						break;
					case 'object':
						$.each(name, function (key, val) {
							self.css(key, val);
						});
						styles = self;
						break;
					default: /*undefined, null*/
						return self;
					}
					
					return styles;
				}
			});
			/* backward compatibility */
			this.style = this.css;
		}
	};
})(jQuery);
