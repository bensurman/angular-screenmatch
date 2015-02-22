(function() {
    'use strict';

    angular
        .module('angular.screenmatch')
        .provider('screenmatchConfig', screenmatchConfig);

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
})();
