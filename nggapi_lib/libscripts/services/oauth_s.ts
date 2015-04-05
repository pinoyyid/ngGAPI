/// <reference path="../../../nggapi_interfaces/drive_interfaces.d.ts"/>

'use strict';

/*
This defines a provider for the OAuth service, responsible to fetching access tokens.

It's a provider so it can be easily configured at app startup to hold the OAuth id and scopes needed for it to operate.
 */

module NgGapi {
  /**
   * an Enum to define the different refresh token behaviours
   */
  export enum NoAccessTokenPolicy {
    RETRY,            // http will sleep for a config number of ms then retry
    FAIL              // http will fail with a synthetic 401
    // TODO implement this by having getAccessToken return FAIL or RETRY=nnn instead of undefined
  }

  /**
   * an Enum to define the different refresh token behaviours
   */
  export enum TokenRefreshPolicy {
    ON_DEMAND,            // token will be refreshed after a 401
    PRIOR_TO_EXPIRY       // token will be refreshed shortly prior to expiration using a setTimeout
    // TODO add some kind of "own" option which overrides calls to gapi.auth
  }

  /**
   * The OAuth service
   */
  export class OauthService implements IOauthService {
    sig = 'OauthService';               // used in unit testing to confirm DI
    isAuthInProgress = false;           // true if there is an outstanding auth (ie. refresh token) in progress to prevent multiples
    isAuthedYet = false;                // first time flag, used to set immediate mode

    GAPI_RETRY_MS = 200;                // how long to wait for gapi load before retrying a refresh

    testingAccessToken;                 // used for e2e testing. If set, overrides gapi

    testStatus:string;                  // this has no rol ein the functionality of OauthService. it's a helper property for unit tests


    /**
     *
     * @param scopes.  a space separated string of scopes
     * @param clientId. The Google client ID
     * @param tokenRefreshPolicy  One of the TokenRefreshPolicy Enum values
     * @param noAccessTokenPolicy (0 = fail and http will return a synthetic 401, !0 = retry after xx ms)
     * @param immediateMode  set to true to suppress the initial auth,
     * @param ownGetAccessTokenFunction (0 = fail and http will return a synthetic 401, !0 = retry after xx ms)
     * @param testingRefreshToken - if set, this is used to fetch access tokens instead of gapi
     * @param testingClientSecret - if set, this is used to fetch access tokens instead of gapi
     * @param $log
     * @param $window
     * @param $http
     * @param $timeout
     */
    constructor(private scopes:string, private clientId:string, private tokenRefreshPolicy,
                private noAccesTokenPolicy:number, private immediateMode:boolean, private ownGetAccessTokenFunction,
                private testingRefreshToken, private testingClientSecret,
                private $log:mng.ILogService, private $window:mng.IWindowService, private $http:mng.IHttpService, private $timeout:mng.ITimeoutService) {
      //console.log("OAuth instantiated with " + scopes);
      //$log.log("scopes", this.scopes);
      //$log.log("trp", this.tokenRefreshPolicy);drivdrivee
      //console.log('oauth cons');

      // if dev has requested to override the default getAccessToken function
      if (ownGetAccessTokenFunction) {
        this.getAccessToken = ownGetAccessTokenFunction;
      };

      if (immediateMode) {                                                                                         // did user override immediate mode
          this.isAuthedYet = true;
      }
    }


    /**
     * return an access token. Normally simply calls gapi.auth.getToken(). If that returns undefined, then
     * return undefined, and starts a background refresh. The idea is that retries of the REST call witll repeatedly fail 401 until
     * such time that the refresh completes and gapi.auth.getToken returns a valid access token.
     *
     * @return the access token string or "!FAIL" for parent to fail 401, or "!RETRY=xxx" for parent to retry
     */
    getAccessToken():string {
      if (!!this.testingAccessToken) {                                                                                  // if a test token has been set
        return this.testingAccessToken;                                                                                 // return it
      }
      if (!!this.testingRefreshToken) {                                                                                 // if a test refresh token has been provided
        this.refreshAccessTokenUsingTestRefreshToken(this.testingRefreshToken, this.testingClientSecret)                // use it to fetch an a_t
        return '!RETRY=1000';                                                                                           // allow 1s

      }
      if (!this.isGapiLoaded()) {
        this.$log.warn('[O55] waiting for the gapi script to download');
        this.testStatus = 'O55';
        return undefined;
      }
      if (!!this.$window['gapi'].auth.getToken()                                                                        // function returns something
          && !!this.$window['gapi'].auth.getToken()['access_token']                                                     // with an access token
          &&  (this.$window['gapi'].auth.getToken()['access_token'] != null)) {                                         // which isn't null
        return this.$window['gapi'].auth.getToken()['access_token'];                                                    // return it
      } else {
        this.refreshAccessToken();
        if (this.noAccesTokenPolicy == 0) {                             // if we want to fail 401 for no access token
          return '!FAIL';                                               // tell the parent
        } else {                                                        // else
          return '!RETRY='+this.noAccesTokenPolicy;                     // tell the parent to retry after xxx ms
        }
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
        this.testStatus = 'O75';
        return;
      }

      if (!this.isGapiLoaded()) {
        this.$log.warn('[O81] gapi not yet loaded, retrying...');
        this.testStatus = 'O81';
        this.$timeout(() => {
            this.refreshAccessToken();
        }, this.GAPI_RETRY_MS);
        return;
      }

      this.isAuthInProgress = true;

      this.$window['gapi'].auth.authorize(
        {client_id:  this.clientId,
        scope:      this.scopes,
        immediate:  this.isAuthedYet},
        ()=>{this.refreshCallback();});                    // callback invoked when gapi refresh returns with a new token
    }



    /**
     *
     *  Uses a poked refresh token to fetch a new access token. Only used for e2e testing
     *
     * @param rt the refresh token
     * @param secret the client secret
     */
    refreshAccessTokenUsingTestRefreshToken(rt:string, secret:string) {
      if (this.isAuthInProgress) {
        this.$log.warn('[O143] refresh access token suppressed because there is already such a request in progress');
        this.testStatus = 'O143';
        return;
      }

      this.isAuthInProgress = true;


      var url = 'https://www.googleapis.com/oauth2/v3/token';

      this.$http({
        method: 'POST',
        url: url,
        params:
        {
            client_id:encodeURI(this.clientId),
            //client_secret:'Y_vhMLV9wkr88APsQWXPUrhq',
            client_secret:encodeURI(secret),
            refresh_token:rt,
            grant_type:'refresh_token',
            foo:'bar'
        },
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      }).
          success((data, status, headers, config) => {
            this.testingAccessToken = data['access_token'];
            this.$log.info('[O172]: test access token is '+this.testingAccessToken);
            this.isAuthInProgress = false;
            // this callback will be called asynchronously
            // when the response is available
          }).
          error((data, status, headers, config) => {
              this.isAuthInProgress = false;
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            this.$log.error('[O191] problem refreshing test refresh token '+status+' '+data.error+' '+data.error_description);
          });
    }

    /**
     * called when gapi.auth.authorize returns
     * Reports an error if no token.
     *
     * Sets up an auto refresh if required
     */
    refreshCallback() {
      this.isAuthInProgress = false;
      this.isAuthedYet = true;
      console.log('o206 authed');

      var token:GoogleApiOAuth2TokenObject = this.$window['gapi'].auth.getToken();
      if (!token) {
        this.$log.error('[O196] There is a problem that authorize has returned without an access token. Poss. access denied by user or invalid client id or wrong origin URL? ');
        return;
      }

       if (token.access_token && token.access_token != null) {                                                          // if there is an access token
           this.testingAccessToken = undefined;                                                                         // lose any testing token
       }

      // if app has requested auto-refresh, set up the timeout to refresh
      if (this.tokenRefreshPolicy == TokenRefreshPolicy.PRIOR_TO_EXPIRY) {
        var expiry:number = token.expires_in;
        this.$log.log('[O203] token will refresh after '+expiry*950+'ms');
        setTimeout(this.refreshAccessToken, expiry*950);              // refresh after 95% of the validity
        this.testStatus = 'O203';
      }
    }


    isGapiLoaded():boolean {
      return (this.$window['gapi'] && this.$window['gapi'].auth);
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
 * @returns a provider with various setters
 */

NgGapi['Config'] = function () {
	var scopes;
	var clientID;
	var tokenRefreshPolicy = NgGapi.TokenRefreshPolicy.ON_DEMAND;               // default is on demand
    var noAccessTokenPolicy = 500;                                              // default is to retry after 1/2 sec
    var getAccessTokenFunction = undefined;
    var immediateMode = false;;
    var testingRefreshToken = undefined;
    var testingClientSecret = undefined;
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
        setNoAccessTokenPolicy: function (_policy) {
          noAccessTokenPolicy = _policy;
        },
        setImmediateMode: function (_mode) {
          immediateMode = _mode;
        },
		setGetAccessTokenFunction: function (_function) {
			getAccessTokenFunction = _function;
		},
        setTestingRefreshToken: function (_rt) {
          testingRefreshToken = _rt;
        },
        setTestingClientSecret: function (_secret) {
          testingClientSecret = _secret;
        },
        // this is the function called by the Angular DI system to return the service
		$get: function () {
			var myInjector = angular.injector(["ng"]);
			var $log = myInjector.get("$log");
			var $window = myInjector.get("$window");
            var $http = myInjector.get("$http");
            var $timeout = myInjector.get("$timeout");
			return new NgGapi.OauthService(scopes, clientID, tokenRefreshPolicy, noAccessTokenPolicy, immediateMode, getAccessTokenFunction, testingRefreshToken, testingClientSecret, $log, $window, $http, $timeout);
		}
	}
};



// define the ngm.NgGapi module. This will then be included by the host app with "angular .module('MyApp', ['ngm.NgGapi']);"
declare var angular: mng.IAngularStatic;
angular.module('ngm.NgGapi', []);

