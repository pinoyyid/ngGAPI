/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../objects/DriveFileInterfaces.ts"/>




module NgGapi {
  export interface IOAuth {
    getAccessToken(): string;
    refreshAccessToken(): void;

  }

  /**
   * an Enum to define the different refresh token behaviours
   */
  export enum TokenRefreshPolicy {
    ON_DEMAND,            // token will be refreshed after a 401
    PRIOR_TO_EXPIRY       // token will be refreshed shortly prior to expiration using a setTimeout
  }

  /**
   * The OAuth service
   */
  export class OauthService implements IOAuth {
    sig = 'OauthService';                // used in unit testing to confirm DI
    isAuthInProgress = false;     // true if there is an outstanding auth (ie. refresh token) in progress to prevent multiples
    isAuthedYet = false;          // first time flag, used to set immediate mode


    /**
     *
     * @param scopes.  a space separated string of scopes
     * @param clientId. The Google client ID
     * @param tokenRefreshPolicy  One of the TokenRefreshPolicy Enum values
     * @param $log
     * @param $window
     */
    constructor(private scopes:string, private clientId:string, private tokenRefreshPolicy, private $log:ng.ILogService, private $window:ng.IWindowService) {
      console.log("OAuth instantiated with " + scopes);
      $log.log("scopes", this.scopes);
      $log.log("trp", this.tokenRefreshPolicy);
    }


    /**
     * return an access token. Normally simply calls gapi.auth.getToken(). If that returns undefined, then
     * return undefined, and starts a background refresh. The idea is that retries of the REST call witll repeatedly fail 401 until
     * such time that the refresh completes and gapi.auth.getToken returns a valid access token.
     *
     * @return the access token string
     */
    getAccessToken():string {
      if (!this.isGapiLoaded()) {
        this.$log.warn('[O55] waiting for the gapi script to download');
        return;
      }
      if (!!this.$window['gapi'].auth.getToken()) {
        return this.$window['gapi'].auth.getToken()['access_token'];
      } else {
        this.refreshAccessToken();
        return undefined;
      }
    }


    /**
     *  call gapi authorize.
     *  Uses isFirstAuth to set the immediate flag, so first time through there is a login prompt.
     *
     *  If isAuthInprogress, does nothing, but emits a console warning to help debug any issues where the callback wasn't invoked.
     */
    refreshAccessToken() {
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
      }, () => {                    // callback invoked when gapi refresh returns with a new token
        this.isAuthInProgress = false;
        this.isAuthedYet = true;
        console.log('authed');

        // if app has requested auto-refresh, set up the timeout
        if (this.tokenRefreshPolicy == TokenRefreshPolicy.PRIOR_TO_EXPIRY) {

        }

      });
    }


    isGapiLoaded():boolean {
      return !this.$window['gapi'] || !this.$window['gapi'].auth;
    }
  }
}

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
			scopes  = _scopes;
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
	}
}




