/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../../../definitely_typed/gapi.d.ts"/>
/// <reference path="../objects/DriveFileInterfaces.ts"/>
/// <reference path="oauth_s.ts"/>
var NgGapi;
(function (NgGapi) {
    var MockOauthService = (function () {
        function MockOauthService(scopes, clientId, tokenRefreshPolicy, $log, $window) {
            this.scopes = scopes;
            this.clientId = clientId;
            this.tokenRefreshPolicy = tokenRefreshPolicy;
            this.$log = $log;
            this.$window = $window;
            this.sig = 'OauthService';
            this.isAuthInProgress = false;
            this.isAuthedYet = false;
        }
        MockOauthService.prototype.getAccessToken = function () {
            return 'mock_at';
        };
        MockOauthService.prototype.refreshAccessToken = function () {
            this.$log.warn('[MO56] refreshing');
        };
        return MockOauthService;
    })();
    NgGapi.MockOauthService = MockOauthService;
})(NgGapi || (NgGapi = {}));
NgGapi['Config'] = function () {
    var scopes;
    var clientID;
    var tokenRefreshPolicy;
    return {
        setScopes: function (_scopes) {
            scopes = _scopes;
        },
        setClientID: function (_clientID) {
            clientID = _clientID;
        },
        setTokenRefreshPolicy: function (_policy) {
            tokenRefreshPolicy = _policy;
        },
        $get: function () {
            var myInjector = angular.injector([
                "ng"
            ]);
            var $log = myInjector.get("$log");
            var $window = myInjector.get("$window");
            return new NgGapi.OauthService(scopes, clientID, tokenRefreshPolicy, $log, $window);
        }
    };
};
