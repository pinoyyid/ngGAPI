// / <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../../../nggapi_interfaces/drive_interfaces.d.ts"/>

'use strict';


module NgGapi {

	/**
	 * The Http service.
	 * Basically a wrapper for $http that deals with the most common GAPI error conditions and returns an application level promise in place of the low level $http promise
	 */
	export class HttpService implements IHttpService {
		sig = 'HttpService';                                                                                            // used in unit testing to confirm DI
		RETRY_COUNT = 10;                                                                                               // how many times to retry
		INTERVAL_NORMAL = 10;
		INTERVAL_THROTTLE = 500;
		INTERVAL_MAX = 1500;


		/*

		500 69
		800 72
		1000  75
		2000 83
		 */

		//throttleInterval;                                                                                               // the variable delay
		isQueueMode = true;                                                                                             // use queue, set to false for unit testing
		queue:Array<any> = [];                                                                                          // q of requests
		queueInterval;                                                                                                  // frequency of dq
		queuePromise:mng.IPromise<any>;                                                                                 // the $interval promise


		testStatus:string = 'foo';                  // this has no role in the functionality of OauthService. it's a helper property for unit tests


		static $inject = ['$log', '$http', '$timeout', '$interval', '$q', 'OauthService'];
		constructor(private $log:mng.ILogService, private $http:mng.IHttpService, private $timeout:mng.ITimeoutService,
		            private $interval:mng.IIntervalService, private $q:mng.IQService, private OauthService:IOauthService) {
			//console.log('http cons');
		}

		/**
		 * getter for the underlying Oauth service just in case the app needs it
		 *
		 * @returns {ng.IHttpService}
		 */
		getOauthService():NgGapi.IOauthService {
			return this.OauthService;
		}

		/**
		 * getter for the underlying $http service just in case the app needs it
		 *
		 * @returns {ng.IHttpService}
		 */
		get$http():mng.IHttpService {
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
		doHttp(configObject:mng.IRequestConfig):mng.IPromise < any > {
			var def = this.$q.defer();
			// replace with add2q {}
			if (this.isQueueMode) {
				this.add2q(configObject, def, this.RETRY_COUNT);
			} else {
				this._doHttp(configObject, def, this.RETRY_COUNT);
			}
			return def.promise;
		}

		/* add2q
		pushes to q
		if dq not running, starts dq interval
		*/

		/**
		 * adds a new config object to the http queue
		 *
		 * @param configObject
		 * @param def
		 * @param retryCounter
		 */
		add2q(configObject:mng.IRequestConfig, def:mng.IDeferred < any >, retryCounter:number) {
			//console.log('adding '+configObject.method);
			this.queue.push({c:configObject, d:def, r:retryCounter});
			if (!this.queuePromise) {
				console.log('starting dq')
				this.queuePromise = this.$interval(()=>{this.dq()}, this.queueInterval);
			}

		}

		/**
		 * slows down http submission
		 */
		throttleDown() {
			//console.info('throttling down');
			if (this.queueInterval == this.INTERVAL_NORMAL) {
				this.queueInterval = this.INTERVAL_THROTTLE;
				//console.log('starting throttling');
			}
			if (this.queuePromise) {                                                                                    // if there is an interval running
				//console.log('killing existing dq');
				this.$interval.cancel(this.queuePromise);                                                               // kill it
			}
			this.queueInterval = this.INTERVAL_MAX;                                                                     // set max delay (ie. close throttle)
			// old way was to slowly throttle back by 10%
			//this.queueInterval = this.queueInterval * 1.1;
			//if (this.queueInterval > this.INTERVAL_MAX) {
			//	this.queueInterval = this.INTERVAL_MAX;
			//}
			//console.log('throttling at '+this.queueInterval);
			this.queuePromise = this.$interval(()=>{this.dq()}, this.queueInterval);                                    // start a new interval
		}


		/**
		 * speeds up http submission
		 */
		throttleUp() {
			//console.info('throttling up');
			if (this.queueInterval == this.INTERVAL_NORMAL) {                                                           // if no throttling taking place
				//console.log('not throttling');                                                                        // do nothing
				return;
			}
			if (this.queuePromise) {                                                                                    // kill any existing interval
				//console.log('killing existing dq');
				this.$interval.cancel(this.queuePromise);
			}
			this.queueInterval = this.queueInterval * 0.8;                                                              // subtract 20%
			if (this.queueInterval < this.INTERVAL_NORMAL) {
				this.queueInterval = this.INTERVAL_NORMAL;
			}
			//console.log('throttling at '+this.queueInterval);
			this.queuePromise = this.$interval(()=>{this.dq()}, this.queueInterval);                                    // start a new interval
		}

		/*	dq
		checks q length,
		if 0, set interval = 10, cancel
		get  [0]
		remove [0]
		_do [0]
		 */

		/**
		 * takes an item off the queue and processes it
		 */
		dq() {
			if (this.queue.length == 0) {                                                                               // if q is empty
				//debugger;
				this.queueInterval = this.INTERVAL_NORMAL;
				this.$interval.cancel(this.queuePromise);                                                               // kill any interval
				this.queuePromise = undefined;
				return;
			}
			// here with q items
			//console.log('processing item, qlen = '+this.queue.length);
			var obj = this.queue[0];                                                                                    // get the oldest item
			this.queue.splice(0,1);                                                                                     // remove from q
			this._doHttp(obj.c, obj.d, obj.r);                                                                          // process it
		}

		/**
		 * internal $http call. This is recursed for errors
		 *
		 * @param configObject  the $http config object {method, url, params, data}
		 * @param def  the parent deferred object that we will resolve or reject
		 * @param retryCounter used to countdown recursions. set by outer method
		 */
		_doHttp(configObject:mng.IRequestConfig, def:mng.IDeferred < any >, retryCounter:number) {
			//console.log('in _ with conf '+configObject.method);
			//debugger;
			// TODO suppress $http with a warning if getAccestoken returns undefined
			if (!configObject.headers) {
				configObject.headers = {};
			}
			var at = this.OauthService.getAccessToken();                                                                // add auth header
			if (at && (at.indexOf('!FAIL') != 0) && (at.indexOf('!RETRY=') != 0)) {                                     // if there is an access token
				configObject.headers['Authorization'] = 'Bearer ' + this.OauthService.getAccessToken();                 // add auth header
				var httpPromise = this.$http(configObject);                                                             // run the http call and capture the promise
				httpPromise.success((data, status, headers, configObject, statusText) => {                              // if http success, resolve the app promise
					this.throttleUp();
					//debugger;
					this.$log.debug(status);
					if (data.nextPageToken) {                                                                           // if there is more data, emit a notify and recurse
						def.notify(data);
						if (!configObject.params) {
							configObject.params = {};                                                                   // just in case the original call had no params
						}
						configObject.params.pageToken = data.nextPageToken;                                             // store the token into the params for the next call
						return this._doHttp(configObject, def, retryCounter);
					}
					def.resolve({data:data, configObject: configObject, headers:headers, status:status, statusText: statusText});
				});
				httpPromise.error((data, status, headers, configObject, statusText) => {                                // for an error
					this.errorHandler(data, status, headers, configObject, statusText, def, retryCounter);
				})
				return;
			}
			// here with no access token
			if (at && at.indexOf('!FAIL') == 0) {                                                                       // if we are requested to fail
				def.reject('401 no access token');
			} else {
				var ms = at?at.replace('!RETRY=', ''):500;
				//console.log('sleeping for ms='+ms);
				this.sleep(+ms).then(() => {
					//console.log('retrying');
					this._doHttp(configObject, def, retryCounter);
				})
			}
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
		errorHandler(data:any, status:number, headers:{}, configObject:mng.IRequestConfig, statusText:string, def:mng.IDeferred<any>, retryCounter:number) {
			// 404 - hard error
			if (status == 404) { // 404 is not recoverable, so reject the promise
				def.reject(status+" "+data.error.message);
				return;
			}

			// 401 - get new access token
			// retry after 0.5s
			if (status == 401) { // 401 need to refresh the token and then retry
				this.$log.warn("[H116] Need to acquire a new Access Token and resubmit");
				this.OauthService.refreshAccessToken();
				if (--retryCounter > 0) { // number of retries set by caller
					this.sleep(2000).then(() => {
						this._doHttp(configObject, def, retryCounter);
					})
				} else {
					def.reject(status + ' ' +data.error.message);
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
					def.reject(status + ' ' +data.error.message);
				}
				return;
			}

			// 403 - rate limit, sleep for 2s x the number of retries to allow some more bucket tokens
			//if (status == 403) debugger;
			if (status == 403 && data.error.message.toLowerCase().indexOf('rate limit') > -1) {
				this.$log.warn('[H153] 403 rate limit. requeuing retryConter = '+retryCounter);
				this.throttleDown();                                                                                    // slow down submission
				this.add2q(configObject, def,  retryCounter);                                                           // and resubmit
				return;
			}

			// anything else is a hard error
			def.reject(status+" "+data.error.message);
		}


		/**
		 * simple sleep(ms) returning a promise
		 */
		sleep(ms:number):mng.IPromise < any > {
			var def = this.$q.defer();
			this.$timeout(() => {
				def.resolve(0)
			}, ms);
			return def.promise;
		}
	}
}

declare var angular: mng.IAngularStatic;
angular.module('ngm.NgGapi')
	.service('HttpService', NgGapi.HttpService);
