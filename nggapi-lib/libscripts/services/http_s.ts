/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../../../nggapi_interfaces/drive_interfaces.d.ts"/>

'use strict';


module NgGapi {

	/**
	 * The Http service.
	 * Basically a wrapper for $http that deals with the most common GAPI error conditions and returns an application level promise in place of the low level $http promise
	 */
	export class HttpService implements IHttpService {
		sig = 'HttpService';                // used in unit testing to confirm DI

		testStatus:string;                  // this has no role in the functionality of OauthService. it's a helper property for unit tests



		static $inject = ['$log', '$http', '$timeout', '$q', 'OauthService'];
		constructor(private $log:ng.ILogService, private $http:ng.IHttpService, private $timeout:ng.ITimeoutService, private $q:ng.IQService, private OauthService:IOauthService) {
      //console.log('http cons');
		}

    /**
     * getter for the underlying $http service just in case the app needs it
     *
     * @returns {ng.IHttpService}
     */
    get$http() {
      return this.$http;
    }

		/**
		 * exported method for any $http call.
		 * The call is wrapped in a mid-level promise, ie. not the low level $http promise.
		 *
		 * @param configObject
		 *
		 * @returns {IPromise<T>}
		 */
		doHttp(configObject:ng.IRequestConfig): ng.IPromise < any > {
			var def = this.$q.defer();
			this._doHttp(configObject, def, 10);
			return def.promise;
		}



		/**
		 * internal $http call. This is recursed for errors
		 *
		 * @param config  the $http config object {method, url, params, data}
		 * @param def  the parent deferred object that we will resolve or reject
		 * @param retryCounter used to countdown recursions. set by outer method
		 */
		_doHttp(configObject: ng.IRequestConfig, def: ng.IDeferred < any > , retryCounter: number) {
      // TODO suppress $http with a warning if getAccestoken returns undefined
      if (!configObject.headers) {
        configObject.headers = {};
      }
			configObject.headers['Authorization'] = 'Bearer ' + this.OauthService.getAccessToken() ;                          // add auth header
			var httpPromise = this.$http(configObject); // run the http call and capture the promise
			httpPromise.success((data) => { // if http success, resolve the app promise
				def.resolve(data);
			});
			httpPromise.error((data, status, headers, configObject, statusText) => { // for an error
				this.errorHandler(data, status, headers, configObject, statusText, def, retryCounter);
			})
		}

		/**
		 * Called in the event of any error.
		 *
		 *
		 * @param data          The response body
		 * @param status        The numeric status
		 * @param headers       Object map of response Headers
		 * @param configObject  The original config object
     * @param statusText    The textual response
		 * @param def           The mid-level deferred object
		 * @param retryCounter  The decrementing retry counter
		 */
		errorHandler(data:any, status:number, headers:{}, configObject:ng.IRequestConfig, statusText:string,  def:ng.IDeferred<any>, retryCounter:number) {
      console.log("statusText = "+statusText);
			// 404 - hard error
			if (status == 404) { // 404 is not recoverable, so reject the promise
				def.reject(status);
				return;
			}

			// 401 - get new access token
			// retry after 0.5s
			if (status == 401) { // 401 need to refresh the token and then retry
				console.warn("Need to acquire a new Access Token and resubmit");
				this.OauthService.refreshAccessToken();
				if (--retryCounter > 0) { // number of retries set by caller
					this.sleep(2000).then(() => {
						this._doHttp(configObject, def, retryCounter);
					})
				} else {
					def.reject("401-0");
				}
				return;
			}

			// 501 - might be a hard error due to a Drive bug or malformed request
			// can also be a soft error caused by an internal Google timeout
			// stoopid Google is too lazy to distinguish the two so need to retry quickly
			// retry after 1s
			if (status == 501) {
				if (--retryCounter > 0) { // number of retries set by caller
					this.sleep(1000).then(() => {
						this._doHttp(configObject, def, retryCounter);
					})
				} else {
					def.reject("501-0");
				}
				return;
			}

			// 403 - rate limit, sleep for 2s to allow some more bucket tokens
			if (status == 403 && statusText.toLowerCase().indexOf('rate limit') > -1) {
				if (--retryCounter > 0) { // number of retries set by caller
					this.sleep(2000).then(() => {
						this._doHttp(configObject, def, retryCounter);
					})
				} else {
					def.reject("501-0");
				}
				return;
			}

      // anything else is a hard error
      def.reject(status);
      return;
		}



		/**
		 * simple sleep(ms) returning a promise
		 */
		sleep(ms: number): ng.IPromise < any > {
			var def = this.$q.defer();
			this.$timeout(() => {
				def.resolve(0)
			}, ms);
			return def.promise;
		}
	}
}

angular.module('ngm.NgGapi')
  .service('HttpService',NgGapi.HttpService );
