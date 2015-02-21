(function() {
    'use strict';

    angular
        .module('angular.screenmatch', [])
        .provider('screenmatchConfig', screenmatchConfig)
        .factory('screenmatch', screenmatch)
        .directive('asmScreen', asmScreen);

    screenmatch.$inject = ['$rootScope', '$window', '$interval', '$timeout', 'screenmatchConfig'];
    asmScreen.$inject = ['ngIfDirective', 'screenmatch'];

    function screenmatchConfig() {
        /* jshint validthis:true */
        this.config = {
            // Configured via screenmatchConfigProvider
            //
            // debounce: integer (ms)
            // rules: either a string eg 'bootstrap' or an obj for custom set
            // extrarules: obj that extends ruleset
            // nobind: bool, set to true to cancel bind on init
        };

        this.$get = function() {
            return {
                config: this.config
            };
        };
    }

    function screenmatch($rootScope, $window, $interval, $timeout, screenmatchConfig) {

        var configRules = screenmatchConfig.config.rules;
        var extraRules = screenmatchConfig.config.extraRules || {};
        var nobind = screenmatchConfig.config.nobind || false;
        var debounce = screenmatchConfig.config.debounce || 250;
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

        //Public methods

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
        //      [3] Scope, the scope to attach the listener to
        //
        //Returns: True if any of the values is a match, else False.
        //         Callback on resize, also returns True/False
        //
        function bind(list, callback, scope) {
            var prev = null;
            var match = is(list); // set truthiness of match

            if (!nobind && angular.isFunction(callback)) {

                scope = scope || $rootScope;
                scope.$on('screenmatch::resize', function () {

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
        //             Eg, loading data.
        //             After executing callback it will deregister.
        //
        //Method: Passes a list of values to is() to compare truthiness.
        //        Fires a callback, ONCE, when a match is found.
        //
        //        Note: if nobind is true, callback only performs a check on page load.
        //
        //Args: [1] String (passed to is())
        //      [2] Func for callback
        //      [3] Scope, the scope to attach the listener to
        //
        //Returns: Fires the callback. No other return value.
        //
        function once(list, callback, scope) {
            var fired = false;
            var prev = null;
            var match = is(list); // set truthiness of match

            if (angular.isFunction(callback)) {

                if (match) {
                    fired = true;
                    callback();
                }

                if (!nobind && !fired) {

                    scope = scope || $rootScope;
                    var watcher = scope.$on('screenmatch::resize', function () {

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

        //Private methods

        //Selects rules, default is bootstrap
        //Extends rules if extra rules
        function setRules() {
            if (angular.isObject(configRules) && !angular.equals({}, configRules)) {
                rules = configRules;
            } else {
                rules = ruleset[configRules] || ruleset.bootstrap;
            }

            if (!angular.equals({}, extraRules) && angular.isObject(extraRules)) {

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
            var done = false;

            w.on('resize', function () {
                if (!done) { //start timer
                    var resizeTimer = $interval(function () {
                        $rootScope.$broadcast('screenmatch::resize', true);
                        if (done) {
                            $interval.cancel(resizeTimer); //stop timer
                            done = false; //re-init timer
                        }
                    }, debounce);
                }
                done = true; //so timer runs once
            });
        }

        function init() {
            setRules();
            if (!nobind) {
                bindResize();
            }
        }
    }

//  Usage(asmScreen): The same as ngIf, but pass in a string to match.
//                    Eg, <p asm-screen='phone'> I will appear on phones </p>
    function asmScreen(ngIfDirective, screenmatch) {

        var ngIf = ngIfDirective[0];
        var directive = {
            link: link,
            terminal: ngIf.terminal,
            transclude: ngIf.transclude,
            priority: ngIf.priority,
            restrict: ngIf.restrict
        };

        return directive;

        function link(scope, element, attrs) {

            var size = attrs.asmScreen;

            var match = screenmatch.bind(size, function (val) {
                match = val;
            }, scope);

            attrs.ngIf = function() {
                return match;
            };

            ngIf.link.apply(ngIf, arguments);
        }
    }
})();
