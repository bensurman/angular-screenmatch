(function() {
    'use strict';

    angular
        .module('matchscreen', [])
        .provider('matchscreenConfig', matchscreenConfig)
        .factory('matchscreen', matchscreen)
        .directive('amsScreen', amsScreen);

    matchscreen.$inject = ['$rootScope', '$window', '$interval', '$timeout', 'matchscreenConfig'];
    amsScreen.$inject = ['ngIfDirective', 'matchscreen'];

    function matchscreenConfig() {
        /* jshint validthis:true */
        this.config = {
            // Configure via the matchscreenConfigProvider
            //
            // debounce: integer (ms)
            // ruleset: either a string eg 'bootstrap' or an obj for custom set
            // extrarules: obj that extends ruleset
            // nobind: bool, set to false to cancel bind on init (defaults to true)
        };

        this.$get = function() {
            return {
                config: this.config
            };
        };
    }

    function matchscreen($rootScope, $window, $interval, $timeout, matchscreenConfig) {

        var configRules = matchscreenConfig.config.rules;
        var extraRules = matchscreenConfig.config.extraRules || {};
        var nobind = matchscreenConfig.config.nobind || false;
        var debounce = matchscreenConfig.config.debounce || 500;
        var current = null;
        var ruleset = {
            bootstrap : {
                lg: '(min-width: 1200px)',
                md: '(min-width: 992px) and (max-width: 1199px)',
                sm: '(min-width: 768px) and (max-width: 991px)',
                xs: '(max-width: 767px)'
            },
            matchmedia : {
                print : 'print',
                screen : 'screen',
                phone : '(max-width: 767px)',
                tablet : '(min-width: 768px) and (max-width: 991px)',
                desktop : '(min-width: 992px)',
                portrait : '(orientation: portrait)',
                landscape : '(orientation: landscape)'
            }
        };
        var rules = {};

        var service = {
            is: is,
            bind: bind,
            once: once
        };

        init();

        return service;
        /////////////////

        //Usage(is): Initializing variables which only need to be set once.
        //           Also used internally by other methods.
        //
        //Method: Checks a list of values for matchmedia truthiness.
        //
        //Arg: String containing a comma separated list of values to match
        //
        //Returns: True if any of the values is a match, else False.
        //
        function is(list) {
            if (angular.isString(list)) {

                list = list.split(/\s*,\s*/);

                return list.some(function(size, index, arr) {
                    if ($window.matchMedia(rules[size]).matches) {
                        return true;
                    }
                });
            }
        }

        //Usage(bind): Dynamically matching the truthiness of the string passed in.
        //             For anything that needs to unmatch as well as match.
        //             Eg, DOM elements
        //
        //Method: Passes a list of values to is() to compare truthiness.
        //        If nobind is false (default), also watches for window resize.
        //        On resize, evaluates if the truthiness has changed.
        //        Fires a callback if there is a change, returning truthiness.
        //
        //        Note : if nobind is true, the callback never fires.
        //
        //Args: [1] String (passed to is())
        //      [2] Func for callback
        //
        //Returns: True if any of the values is a match, else False.
        //         Callback on resize, also returns True/False
        //
        function bind(list, callback) {
            var prev = null;
            var match = is(list); // set truthiness of match

            if (!nobind && angular.isFunction(callback)) {

                $rootScope.$on('matchscreen::resize', function () {

                    prev = match;
                    match = is(list);

                    //only callback if there is a change of truthiness from last check
                    //prevents unnecessary firing of the callback
                    if (prev !== match) {
                         $timeout(function() {
                            callback(match);
                        });
                    }
                });
            }
            return match;
        }


        //Usage(once): Executing a callback that only needs to run once on a successful match.
        //            Eg, loading data.
        //            After executing callback it will deregister.
        //
        //Method: Fires a callback, ONCE, when a match is found.
        //
        //        Note: if nobind is true, callback only performs a check on page load.
        //
        //Args: [1] String (passed to is())
        //      [2] Func for callback
        //
        //Returns: Fires the callback. No other return value.
        //
        function once(list, callback) {
            var fired = false;
            var prev = null;
            var match = is(list); // set truthiness of match

            if (angular.isFunction(callback)) {

                if (match) {
                    fired = true;
                    callback();
                }

                if (!nobind && !fired) {
                    var watcher = $rootScope.$on('matchscreen::resize', function () {

                        prev = match;
                        match = is(list);

                        if (match && (prev !== match)) {
                             $timeout(function() {
                                fired = true;
                                callback();
                            });
                        }
                        if (fired) {
                            watcher(); //deregister the watcher
                        }

                    });
                }
            }
        }

        //private functions

        //Creates ruleset, default is matchmedia
        function setRules() {
            if (angular.isObject(configRules) && !angular.equals({}, configRules)) {
                rules = configRules;
            } else {
                rules = ruleset[configRules] || ruleset.matchmedia;
            }

            if (!angular.equals({}, extraRules)) {

                var cleanRules = {};
                angular.forEach(extraRules, function (rule, name) {
                    if (angular.isString(rule)) {
                        cleanRules[name] = rule;
                    }
                });

                angular.extend(rules, cleanRules);
            }
        }

        //Exposes the window resize event via broadcast
        function bindResize() {
            var w = angular.element($window);
            var resized = false;

            w.on('resize', function () {
                if (!resized) { //start timer
                    var resizeTimer = $interval(function () {
                        $rootScope.$broadcast('matchscreen::resize', true);
                        if (resized) { //stop timer
                            $interval.cancel(resizeTimer);
                            resized = false; //re-init timer
                        }
                    }, debounce);
                }
                resized = true; //so timer runs once
            });
        }

        function init() {
            setRules();
            if (!nobind) {
                bindResize();
            }
        }
    }

//  Usage(amsScreen): The same as ngIf, but pass in a string to match.
//                    Eg, <p ams-screen='phone'> I will appear on phones </p>
    function amsScreen(ngIfDirective, matchscreen) {

        var ngIf = ngIfDirective[0];
        //add usage notes
        var directive = {
            link:link,
            terminal: ngIf.terminal,
            transclude: ngIf.transclude,
            priority: ngIf.priority,
            restrict: ngIf.restrict
        };

        return directive;
        /////////////////
        function link(scope, element, attrs) {
            var size = attrs.amsScreen;

            var match = matchscreen.bind(size, function (val) {
                match = val;
            });

            attrs.ngIf = function() {
                return match;
            };

            ngIf.link.apply(ngIf, arguments);
        }
    }
})();
