(function() {
    'use strict';

    angular
        .module('angular.screenmatch')
        .directive('asmScreen', asmScreen);

        //Usage: The same as ngIf, but pass in a string to match.
        //       Eg, <p asm-screen='phone'> I will appear on phones </p>

        /* @ngInject */
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