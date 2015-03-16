/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../objects/DriveFileInterfaces.ts"/>
var NgGapi;
(function (NgGapi) {
    /**
     * an Enum to define the different refresh token behaviours
     */
    (function (TokenRefreshPolicy) {
        TokenRefreshPolicy[TokenRefreshPolicy["ON_DEMAND"] = 0] = "ON_DEMAND";
        TokenRefreshPolicy[TokenRefreshPolicy["PRIOR_TO_EXPIRY"] = 1] = "PRIOR_TO_EXPIRY"; // token will be refreshed shortly prior to expiration using a setTimeout
    })(NgGapi.TokenRefreshPolicy || (NgGapi.TokenRefreshPolicy = {}));
    var TokenRefreshPolicy = NgGapi.TokenRefreshPolicy;
    /**
     * The OAuth service
     */
    var OauthService = (function () {
        /**
         *
         * @param scopes.  a space separated string of scopes
         * @param clientId. The Google client ID
         * @param tokenRefreshPolicy  One of the TokenRefreshPolicy Enum values
         * @param $log
         * @param $window
         */
        function OauthService(scopes, clientId, tokenRefreshPolicy, $log, $window) {
            this.scopes = scopes;
            this.clientId = clientId;
            this.tokenRefreshPolicy = tokenRefreshPolicy;
            this.$log = $log;
            this.$window = $window;
            this.sig = 'OauthService'; // used in unit testing to confirm DI
            this.isAuthInProgress = false; // true if there is an outstanding auth (ie. refresh token) in progress to prevent multiples
            this.isAuthedYet = false; // first time flag, used to set immediate mode
            //console.log("OAuth instantiated with " + scopes);
            //$log.log("scopes", this.scopes);
            //$log.log("trp", this.tokenRefreshPolicy);
        }
        /**
         * return an access token. Normally simply calls gapi.auth.getToken(). If that returns undefined, then
         * return undefined, and starts a background refresh. The idea is that retries of the REST call witll repeatedly fail 401 until
         * such time that the refresh completes and gapi.auth.getToken returns a valid access token.
         *
         * @return the access token string
         */
        OauthService.prototype.getAccessToken = function () {
            if (!this.isGapiLoaded()) {
                this.$log.warn('[O55] waiting for the gapi script to download');
                return undefined;
            }
            if (!!this.$window['gapi'].auth.getToken()) {
                return this.$window['gapi'].auth.getToken()['access_token'];
            }
            else {
                this.refreshAccessToken();
                return undefined;
            }
        };
        /**
         *  call gapi authorize.
         *  Uses isFirstAuth to set the immediate flag, so first time through there is a login prompt.
         *
         *  If isAuthInprogress, does nothing, but emits a console warning to help debug any issues where the callback wasn't invoked.
         */
        OauthService.prototype.refreshAccessToken = function () {
            var _this = this;
            if (this.isAuthInProgress) {
                this.$log.warn('[O75] refresh access token suppressed because there is already such a request in progress');
                return;
            }
            this.isAuthInProgress = true;
            if (!this.isGapiLoaded()) {
                this.$log.warn('[O81] gapi not yet loaded');
                return;
            }
            this.$window['gapi'].auth.authorize({
                client_id: this.clientId,
                scope: this.scopes,
                immediate: this.isAuthedYet
            }, function () {
                _this.isAuthInProgress = false;
                _this.isAuthedYet = true;
                //console.log('authed');
                // if app has requested auto-refresh, set up the timeout
                if (_this.tokenRefreshPolicy == 1 /* PRIOR_TO_EXPIRY */) {
                }
            });
        };
        OauthService.prototype.isGapiLoaded = function () {
            return (this.$window['gapi'] && this.$window['gapi'].auth);
        };
        return OauthService;
    })();
    NgGapi.OauthService = OauthService;
})(NgGapi || (NgGapi = {}));
/**
 * Config function which returns a provider containing methods to set OAuth parameters and a $get to return the OAuth service itself.
 * This will be referenced by the app.js startup script, something like:-
 *
 *myApp.provider('oauthService', NgGapi.Config)
    .config(function (oauthServiceProvider) {
        oauthServiceProvider.setScopes('drive.file');
        oauthServiceProvider.setClientID('1234');
        oauthServiceProvider.setTokenRefreshPolicy(NgGapi.TokenRefreshPolicy.ON_DEMAND);
});
 *
 * @returns {{setScopes: (function(any): undefined), setClientID: (function(any): undefined), $get: (function(): NgGapi.OAuth)}}
 */
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
            var myInjector = angular.injector(["ng"]);
            var $log = myInjector.get("$log");
            var $window = myInjector.get("$window");
            return new NgGapi.OauthService(scopes, clientID, tokenRefreshPolicy, $log, $window);
        }
    };
};
//# sourceMappingURL=oauth_s.js.map