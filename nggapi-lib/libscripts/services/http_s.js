/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../../../nggapi_interfaces/drive_interfaces.d.ts"/>
'use strict';
var NgGapi;
(function (NgGapi) {
    /**
     * The Http service.
     * Basically a wrapper for $http that deals with the most common GAPI error conditions and returns an application level promise in place of the low level $http promise
     */
    var HttpService = (function () {
        function HttpService($log, $http, $timeout, $q, OauthService) {
            this.$log = $log;
            this.$http = $http;
            this.$timeout = $timeout;
            this.$q = $q;
            this.OauthService = OauthService;
            this.sig = 'HttpService'; // used in unit testing to confirm DI
            //console.log('http cons');
        }
        /**
         * getter for the underlying $http service just in case the app needs it
         *
         * @returns {ng.IHttpService}
         */
        HttpService.prototype.get$http = function () {
            return this.$http;
        };
        /**
         * exported method for any $http call.
         * The call is wrapped in a mid-level promise, ie. not the low level $http promise.
         *
         * @param configObject
         *
         * @returns {IPromise<T>}
         */
        HttpService.prototype.doHttp = function (configObject) {
            var def = this.$q.defer();
            this._doHttp(configObject, def, 10);
            return def.promise;
        };
        /**
         * internal $http call. This is recursed for errors
         *
         * @param config  the $http config object {method, url, params, data}
         * @param def  the parent deferred object that we will resolve or reject
         * @param retryCounter used to countdown recursions. set by outer method
         */
        HttpService.prototype._doHttp = function (configObject, def, retryCounter) {
            var _this = this;
            // TODO suppress $http with a warning if getAccestoken returns undefined
            if (!configObject.headers) {
                configObject.headers = {};
            }
            configObject.headers['Authorization'] = 'Bearer ' + this.OauthService.getAccessToken(); // add auth header
            var httpPromise = this.$http(configObject); // run the http call and capture the promise
            httpPromise.success(function (data) {
                def.resolve(data);
            });
            httpPromise.error(function (data, status, headers, configObject, statusText) {
                _this.errorHandler(data, status, headers, configObject, statusText, def, retryCounter);
            });
        };
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
        HttpService.prototype.errorHandler = function (data, status, headers, configObject, statusText, def, retryCounter) {
            var _this = this;
            console.log("statusText = " + statusText);
            // 404 - hard error
            if (status == 404) {
                def.reject(status);
                return;
            }
            // 401 - get new access token
            // retry after 0.5s
            if (status == 401) {
                console.warn("Need to acquire a new Access Token and resubmit");
                this.OauthService.refreshAccessToken();
                if (--retryCounter > 0) {
                    this.sleep(2000).then(function () {
                        _this._doHttp(configObject, def, retryCounter);
                    });
                }
                else {
                    def.reject("401-0");
                }
                return;
            }
            // 501 - might be a hard error due to a Drive bug or malformed request
            // can also be a soft error caused by an internal Google timeout
            // stoopid Google is too lazy to distinguish the two so need to retry quickly
            // retry after 1s
            if (status == 501) {
                if (--retryCounter > 0) {
                    this.sleep(1000).then(function () {
                        _this._doHttp(configObject, def, retryCounter);
                    });
                }
                else {
                    def.reject("501-0");
                }
                return;
            }
            // 403 - rate limit, sleep for 2s to allow some more bucket tokens
            if (status == 403 && statusText.toLowerCase().indexOf('rate limit') > -1) {
                if (--retryCounter > 0) {
                    this.sleep(2000).then(function () {
                        _this._doHttp(configObject, def, retryCounter);
                    });
                }
                else {
                    def.reject("501-0");
                }
                return;
            }
            // anything else is a hard error
            def.reject(status);
            return;
        };
        /**
         * simple sleep(ms) returning a promise
         */
        HttpService.prototype.sleep = function (ms) {
            var def = this.$q.defer();
            this.$timeout(function () {
                def.resolve(0);
            }, ms);
            return def.promise;
        };
        HttpService.$inject = ['$log', '$http', '$timeout', '$q', 'OauthService'];
        return HttpService;
    })();
    NgGapi.HttpService = HttpService;
})(NgGapi || (NgGapi = {}));
angular.module('ngm.NgGapi').service('HttpService', NgGapi.HttpService);
//# sourceMappingURL=http_s.js.map