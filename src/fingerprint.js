/*jshint curly: true, eqeqeq: true, forin: true, freeze: true, immed: true, latedef: nofunc, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, unused: strict, strict: true, browser: true, devel: true, indent: 4*/
/*global module, define, ActiveXObject*/

/**
 * fingerprintJS 0.5.4 - Fast browser fingerprint library
 * https://github.com/georapbox/fingerprintjs
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function (name, context, definition) {
    'use strict';

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = definition();
	} else if (typeof define === 'function' && define.amd) {
		define(definition);
	} else {
		context[name] = definition();
	}
}('Fingerprint', this, function () {
	'use strict';

	var Fingerprint = function (options) {
		var nativeForEach,
			nativeMap;

		nativeForEach = Array.prototype.forEach;
		nativeMap = Array.prototype.map;

		this.each = function (obj, iterator, context) {
			var i,
                l,
                key;

            if (obj === null) {
				return;
			}

			if (nativeForEach && obj.forEach === nativeForEach) {
				obj.forEach(iterator, context);
			} else if (obj.length === +obj.length) {
				for (i = 0, l = obj.length; i < l; i += 1) {
					if (iterator.call(context, obj[i], i, obj) === {}) {
						return;
					}
				}
			} else {
				for (key in obj) {
					if (obj.hasOwnProperty(key)) {
						if (iterator.call(context, obj[key], key, obj) === {}) {
							return;
						}
					}
				}
			}
		};

		this.map = function (obj, iterator, context) {
			var results = [];

			if (obj === null || typeof obj === 'undefined') {
				return results;
			}

			if (nativeMap && obj.map === nativeMap) {
				return obj.map(iterator, context);
			}

			this.each(obj, function (value, index, list) {
				results[results.length] = iterator.call(context, value, index, list);
			});

			return results;
		};

		if (typeof options === 'object') {
			this.hasher = options.hasher;
			this.screenResolution = options.screenResolution;
			this.canvas = options.canvas;
            this.webgl = options.webgl;
			this.ieActivex = options.ieActivex;
		} else if (typeof options === 'function') {
			this.hasher = options;
		}

        this.debug = {
            logs: true,
            log: function (message, severity) {
                var that = this;

                if (that.logs === true && window.console) {
                    that.log = function (message, severity) {
                        switch (severity) {
                            case 0: console.log(message);
                            break;
                            case 1: console.info(message);
                            break;
                            case 2: console.error(message);
                            break;
                            default: console.log(message);
                            break;
                        }

                        return that;
                    };

                    that.log(message, severity);
                    return that;
                }
                
                that.log = function () {
                    return that;
                };

                that.log();
                return that;
            }
        };
	};

	Fingerprint.prototype = {
		keys: [],
		navKeys: [],
		screenKeys: [],
		dbKeys: [],
		pluginsKeys: [],
		canvasKeys: [],
        webglKeys: [],
		uncategorisedKeys: [],

		set: function () {
			var resolution;
            
            // Reset all keys
            this.keys = [];
            this.navKeys = [];
            this.screenKeys = [];
            this.dbKeys = [];
            this.pluginsKeys = [];
            this.canvasKeys = [];
            this.webglKeys = [];
            this.uncategorisedKeys = [];

			// NAVIGATOR KEYS
			this.navKeys.push(navigator.userAgent);                               // 0. {String} navigator.userAgent.
			this.navKeys.push(navigator.language);                                // 1. {String} navigator.language.
			this.navKeys.push(navigator.cpuClass);                                // 2. {String} navigator.cpuClass, eg x86. Returns "undefined" if not supported.
			this.navKeys.push(navigator.platform);                                // 3. {String} navigator.platform, eg Win32.
			this.navKeys.push(navigator.doNotTrack);                              // 4. {String} navigator.doNotTrack. Returns "1" if enabled, "0" if disabled, "unspecified" if not specified directly.

			// SCREEN KEYS
			this.screenKeys.push(screen.colorDepth);                              // 5. {Number} screen.colorDepth.

			if (this.screenResolution) {
                resolution = this.getScreenResolution();                          // 6. {Object - array} screen resolution.

				if (typeof resolution !== 'undefined') {                          // For headless browsers, such as phantomjs, etc, check if resolution is not "undefined".
					this.screenKeys.push(resolution.join('x'));
				}
			}

			// DB KEYS
			this.dbKeys.push(this.hasSessionStorage());                           // 7. {Boolean} true if sessionStorage is supported else false.
			this.dbKeys.push(this.hasLocalStorage());                             // 8. {Boolean} true if localStorage is supported else false.
			this.dbKeys.push(!!window.indexedDB);                                 // 9. {Boolean} true if indexedDB is supported else false.
			this.dbKeys.push(typeof window.openDatabase);                         // 10. {String} type of openDatabase. Returns "undefined" if not supported.

			// PLUGINS KEYS
			this.pluginsKeys.push(this.getPluginsString());                       // 11. {String} plugins strings.

			// Canvas keys.
			if (this.canvas && this.isCanvasSupported()) {
				this.canvasKeys.push(this.getCanvasFingerprint());                // 12. {String} canvas fingerprint.
			}
            
            // WEBGL KEYS
            if (this.webgl) {
                this.webglKeys.push(this.getWebGlFingerptint());                  // 13. {String} webgl fingerprint.
            }
            
			// UNCATEGORISED KEYS
			this.uncategorisedKeys.push(new Date().getTimezoneOffset());          // 14. {Number} timezone Offset.

			// 'body' might not be defined at this point
            // or removed programmatically.
			if (document.body) {
				this.uncategorisedKeys.push(typeof document.body.addBehavior);    // 15. {String} type of body.addBehavior. If supported returns "object" else "undefined".
			} else {
				this.uncategorisedKeys.push(typeof undefined);
			}

			return this;
		},

		get: function (options) {
			if (typeof options === 'object' && typeof options !== 'undefined' && options instanceof Array) {
				var
					o = {
						'navigator':     this.navKeys,
						'screen':        this.screenKeys,
						'db':            this.dbKeys,
						'plugins':       this.pluginsKeys,
						'canvas':        this.canvasKeys,
                        'webgl':         this.webglKeys,
						'uncategorised': this.uncategorisedKeys
					},
					i = 0,
					len,
					opt;

				this.keys = [];

				for (i, len = options.length; i < len; i += 1) {
					opt = options[i];

					if (o.hasOwnProperty(opt)) {
						this.keys = this.keys.concat(o[opt]);
					}
				}
			} else {
				this.keys = [].concat(
					this.navKeys,
					this.screenKeys,
					this.dbKeys,
					this.pluginsKeys,
					this.canvasKeys,
                    this.webglKeys,
					this.uncategorisedKeys
				);
			}

			return this.keys;
		},

		generateHash: function (category) {
            if (typeof category !== 'undefined' && category !== null) {
                if (this.hasher) {
                    return this.hasher(this.keys.join('###'), 31);
                } else {
                    return this.murmurhash3_32_gc(this.keys.join('###'), 31);
                }
            } else {
                this.debug.log('Invalid number of parameters passed. "generateHash" requires one parameter to work properly. Pass the "get" function as parameter.', 2);
            }
		},

		/**
		 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
		 *
		 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
		 * @see http://github.com/garycourt/murmurhash-js
		 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
		 * @see http://sites.google.com/site/murmurhash/
		 *
		 * @param {string} key ASCII only
		 * @param {number} seed Positive integer only
		 * @return {number} 32-bit positive integer hash
		 */
		murmurhash3_32_gc: function (key, seed) {
			var remainder, bytes, h1, h1b, c1, c2, k1, i;

			remainder = key.length & 3; // key.length % 4
			bytes = key.length - remainder;
			h1 = seed;
			c1 = 0xcc9e2d51;
			c2 = 0x1b873593;
			i = 0;

			while (i < bytes) {
				k1 =
					((key.charCodeAt(i) & 0xff)) |
					((key.charCodeAt(++i) & 0xff) << 8) |
					((key.charCodeAt(++i) & 0xff) << 16) |
					((key.charCodeAt(++i) & 0xff) << 24);
				++i;

				k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
				k1 = (k1 << 15) | (k1 >>> 17);
				k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

				h1 ^= k1;
				h1 = (h1 << 13) | (h1 >>> 19);
				h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
				h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
			}

			k1 = 0;

			switch (remainder) {
            case 3:
                k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
                break;
            case 2:
                k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
                break;
            case 1:
                k1 ^= (key.charCodeAt(i) & 0xff);
                k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
                k1 = (k1 << 15) | (k1 >>> 17);
                k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
                h1 ^= k1;
                break;
            }

			h1 ^= key.length;

			h1 ^= h1 >>> 16;
			h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
			h1 ^= h1 >>> 13;
			h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
			h1 ^= h1 >>> 16;

			return h1 >>> 0;
		},

		// https://bugzilla.mozilla.org/show_bug.cgi?id=781447
		hasLocalStorage: function () {
			try {
				return !!window.localStorage;
			} catch (e) {
				return true; // SecurityError when referencing it means it exists
			}
		},

		hasSessionStorage: function () {
			try {
				return !!window.sessionStorage;
			} catch (e) {
				return true; // SecurityError when referencing it means it exists
			}
		},

		isCanvasSupported: function () {
			var elem = document.createElement('canvas');
			return !!(elem.getContext && elem.getContext('2d'));
		},
        
        // https://www.browserleaks.com/webgl#howto-detect-webgl
        isWebGlSupported: function (return_context) {
            if (!!window.WebGLRenderingContext) {
                var canvas = document.createElement('canvas'),
                    names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'],
                    context = false,
                    i = 0;
                
                for (i; i < 4; i++) {
                    try {
                        context = canvas.getContext(names[i]);
                        
                        if (context && typeof context.getParameter === 'function') {
                            // WebGL is enabled
                            if (return_context) {
                                // return WebGL object if the function's argument is present
                                return {
                                    name: names[i],
                                    gl: context
                                };
                            }
                            
                            // else, return just true
                            return true;
                        }
                    } catch(e) {}
                }
                
                // WebGL is supported, but disabled
                return false;
            }
            
            // WebGL not supported
            return false;
        },

		isIE: function () {
			if (navigator.appName === 'Microsoft Internet Explorer') {
				return true;
			} else if (navigator.appName === 'Netscape' && /Trident/.test(navigator.userAgent)) { // IE 11
				return true;
			}
			return false;
		},

		getPluginsString: function () {
			if (this.isIE() && this.ieActivex) {
				return this.getIEPluginsString();
			} else {
				return this.getRegularPluginsString();
			}
		},

		getRegularPluginsString: function () {
			return this.map(navigator.plugins, function (p) {
				var mimeTypes = this.map(p, function (mt) {
					return [mt.type, mt.suffixes].join('~');
				}).join(',');
				return [p.name, p.description, mimeTypes].join('::');
			}, this).join(';');
		},

		getIEPluginsString: function () {
			if (window.ActiveXObject) {
				var names = [
					'ShockwaveFlash.ShockwaveFlash',                          // Flash plugin
					'AcroPDF.PDF',                                            // Adobe PDF reader 7+
					'PDF.PdfCtrl',                                            // Adobe PDF reader 6 and earlier, brrr
					'QuickTime.QuickTime',                                    // QuickTime
					'rmocx.RealPlayer G2 Control',                            // 5 versions of real players.
					'rmocx.RealPlayer G2 Control.1',
					'RealPlayer.RealPlayer(tm) ActiveX Control (32-bit)',
					'RealVideo.RealVideo(tm) ActiveX Control (32-bit)',
					'RealPlayer',
					'SWCtl.SWCtl',                                            // ShockWave player
					'WMPlayer.OCX',                                           // Windows media player
					'AgControl.AgControl',                                    // Silverlight
					'Skype.Detection'                                         // Skype
				];

				// starting to detect plugins in IE
				return this.map(names, function (name) {
					try {
                        // Assign Constructor function to an unused variable to avoid "side effects".
						// http://www.jshint.com/docs/options/#nonew
                        var activeXObj = new ActiveXObject(name); // jshint ignore: line
						return name;
					} catch (e) {
						return null; // If ActiveXObject is not supported.
					}
				}).join(';');
			} else {
				return ''; // Behavior prior version 0.5.0, not breaking backwards compat.
			}
		},

		getScreenResolution: function () {
			return [screen.height, screen.width];
		},

        // https://www.browserleaks.com/canvas#how-does-it-work
		getCanvasFingerprint: function () {
			var canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d'),
                txt = 'https://github.com/georapbox';

			ctx.textBaseline = 'top';
			ctx.font = '14px \'Arial\'';
			ctx.textBaseline = 'alphabetic';
			ctx.fillStyle = '#f60';
			ctx.fillRect(125, 1, 62, 20);
			ctx.fillStyle = '#069';
			ctx.fillText(txt, 2, 15);
			ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
			ctx.fillText(txt, 4, 17);
			return canvas.toDataURL();
		},
        
        // https://www.browserleaks.com/webgl#howto-webgl-ident
        getWebGlFingerptint: function () {
            var context = this.isWebGlSupported(true),
                webglFingerprint = '';

            if (context) {
                var gl = context.gl,
                    webglContextName = context.name,                                               // WebGL Context Name
                    webglVersion = gl.getParameter(gl.VERSION),                                    // WebGL Version
                    webglShadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION),    // WebGL Language Version
                    webglVendor = gl.getParameter(gl.VENDOR),                                      // WebGL Vendor
                    webglRenderer = gl.getParameter(gl.RENDERER),                                  // WebGL Renderer
                    webglExtensionsList = '',                                                      // WebGL extensions list
                    webglMaxAnisotropy;                                                            // WebGL Max Anisotropy

                // full list of exportable WebGL variables can be found here:
                // https://www.khronos.org/registry/webgl/specs/1.0/#WEBGLRENDERINGCONTEXT
                // Enumeration of supported WebGL Extensions:
                var ext = [];

                try {
                    ext = gl.getSupportedExtensions();
                } catch(e) {}

                var ext_len = ext.length;
                // Getting WebGL extensions list:
                if (ext_len) {
                    for (var i = 0; i < ext_len; i++) {
                        if (webglExtensionsList.length) {
                            webglExtensionsList += '; ';
                        }
                        webglExtensionsList += ext[i];
                    }
                }

                // Some variables can be obtained only through the specific extensions ...
                // Getting Max Anisotropy:
                var e = gl.getExtension('EXT_texture_filter_anisotropic') ||
                    gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
                    gl.getExtension('MOZ_EXT_texture_filter_anisotropic');

                if (e) {
                    webglMaxAnisotropy = gl.getParameter(e.MAX_TEXTURE_MAX_ANISOTROPY_EXT);

                    if (webglMaxAnisotropy === 0) {
                        webglMaxAnisotropy = 2;
                    }
                } else {
                    webglMaxAnisotropy = 'Not available';
                }

                webglFingerprint += webglContextName + '; ' +
                    webglVersion + '; ' +
                    webglShadingLanguageVersion + '; ' +
                    webglVendor + '; ' +
                    webglRenderer + '; ' +
                    webglExtensionsList + '; ' +
                    webglMaxAnisotropy;
                
                return webglFingerprint;
            } else {
                webglFingerprint = 'undefined';
                return webglFingerprint;
            }
        }
	};

	return Fingerprint;
}));