(function() {
    'use strict';

    angular
        .module('angular.screenmatch', [])
        .run(polyfillInjector);

        /* @ngInject */
        function polyfillInjector($window) {

            var needsPolyfill = angular.isUndefined($window.matchMedia) || !angular.isFunction($window.matchMedia('all').addListener);

            if (needsPolyfill) {
                $window.matchMedia = (function () {
                /*! matchMedia() polyfill - Test a CSS media type/query in JS.
                * Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight.
                * Dual MIT/BSD license
                **/

                    // For browsers that support matchMedium api such as IE 9 and webkit
                    var styleMedia = ($window.styleMedia || $window.media);

                    // For those that don't support matchMedium
                    if (!styleMedia) {
                        var style = document.createElement('style'),
                        script = document.getElementsByTagName('script')[0],
                        info = null;

                        style.type = 'text/css';
                        style.id = 'matchmediajs-test';

                        script.parentNode.insertBefore(style, script);

                        // 'style.currentStyle' is used by IE <= 8
                        // '$window.getComputedStyle' for all other browsers
                        info = ('getComputedStyle' in $window) && $window.getComputedStyle(style, null) || style.currentStyle;

                        styleMedia = {
                            matchMedium: function(media) {
                                var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

                                // 'style.styleSheet' is used by IE <= 8
                                // 'style.textContent' for all other browsers
                                if (style.styleSheet) {
                                    style.styleSheet.cssText = text;
                                } else {
                                    style.textContent = text;
                                }

                                // Test if media query is true or false
                                return info.width === '1px';
                            }
                        };
                    }

                    return function(media) {
                        return {
                            matches: styleMedia.matchMedium(media || 'all'),
                            media: media || 'all'
                        };
                    };

                })();
            }
        }
})();