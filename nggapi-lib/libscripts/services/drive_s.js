/// <reference path="../../../nggapi_interfaces/drive_interfaces.d.ts"/>
'use strict';
var NgGapi;
(function (NgGapi) {
    /**
     * The Drive service.
     */
    var DriveService = (function () {
        function DriveService($log, $timeout, $q, HttpService) {
            this.$log = $log;
            this.$timeout = $timeout;
            this.$q = $q;
            this.HttpService = HttpService;
            this.sig = 'DriveService'; // used in unit testing to confirm DI
            // this files object (and the self assignment) allows calls of the nature DriveService.files.insert for compatibility with gapi structure
            this.files = {
                self: this,
                get: this.filesGet,
                insert: this.filesInsert,
                list: this.filesList,
                update: this.filesUpdate,
                patch: this.filesPatch,
                trash: this.filesTrash,
                untrash: this.filesUntrash,
                del: this.filesDelete,
                watch: this.filesWatch,
                touch: this.filesTouch,
                emptyTrash: this.filesEmptyTrash
            };
            this.self = this; // this is recursive and is only required if we expose the files.get form (as opposed to filesGet)
            this.filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
            this.filesUploadUrl = 'https://www.googleapis.com/upload/drive/v2/files';
            this.urlTrashSuffix = '/trash';
            this.urlUntrashSuffix = '/untrash';
            this.urlWatchSuffix = '/watch';
            this.urlTouchSuffix = '/touch';
            this.lastFile = { id: 'noid' }; // for testing, holds the most recent file response
        }
        /**
         * getter for underlying HttpService, often used to in turn get OauthService
         *
         * @returns {IHttpService}
         */
        DriveService.prototype.getHttpService = function () {
            return this.HttpService;
        };
        /*
        Each method implements a method from https://developers.google.com/drive/v2/reference/files .
        Generally this is done by constructing an appropriate IRequestConfig object and passing it to the HttpService.

        NB. To support the DriveService.files.insert form of calling, references to "this" must always be "this.self"

         */
        /**
         * Implements Get both for getting a file object and the newer alt=media to get a file's media content
         * See https://developers.google.com/drive/v2/reference/files/get for semantics including the params object
         *
         * @param params
         * @returns {IDriveResponseObject}
         */
        DriveService.prototype.filesGet = function (params) {
            var _this = this;
            var co = {
                method: 'GET',
                url: this.self.filesUrl.replace(':id', params.fileId),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = { promise: promise, data: {}, headers: undefined };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                if (params.alt == 'media') {
                    responseObject.data['media'] = resp; // if media, assign to media property
                }
                else {
                    _this.self.transcribeProperties(resp, responseObject); // if file, transcribe properties
                    _this.self.lastFile = resp;
                }
            });
            return responseObject;
        };
        /**
         * Implements files.List
         * Validates that Dev hasn't inadvertently excluded nextPageToken from response, displaying a warning if missing.
         * Previously this fired an error, but there is a scenario where this is valid. Specifically, if Dev wants to
         * just return the first n matches (which are generally the n most recent), he can do this by setting maxResults
         * and omitting the pageToken.
         *
         * responseObject.data contains an array of all results across all pages
         *
         * The promise will fire its notify for each page with data containing the raw http response object
         * with an embedded items array. The final page will fire the resolve.
         *
         * @param params see https://developers.google.com/drive/v2/reference/files/list
         * @param excludeTrashed
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesList = function (params, excludeTrashed) {
            if (params && params.fields && params.fields.indexOf('nextPageToken') == -1) {
                this.self.$log.warn('[D82] You have tried to list files with specific fields, but forgotten to include "nextPageToken" which will crop your results to just one page.');
            }
            if (excludeTrashed) {
                var trashed = 'trashed = false';
                params.q = params.q ? params.q + ' and ' + trashed : trashed; // set or append to q
                ;
            }
            var co = {
                method: 'GET',
                url: this.self.filesUrl.replace(':id', ''),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = { promise: promise, data: [], headers: undefined };
            promise.then(function (resp) {
                var l = resp.items.length;
                for (var i = 0; i < l; i++) {
                    responseObject.data.push(resp.items[i]); // push each new file
                }
            }, undefined, function (resp) {
                var l = resp.items.length;
                for (var i = 0; i < l; i++) {
                    responseObject.data.push(resp.items[i]); // push each new file
                }
            });
            return responseObject;
        };
        /**
         * Implements Insert, both for metadata only and for multipart media content upload
         * TODO NB resumable uploads not yet supported
         *
         * See https://developers.google.com/drive/v2/reference/files/insert for semantics including the params object
         *
         * @param file  Files resource with at least a mime type
         * @param params see Google docs
         * @param base64EncodedContent
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesInsert = function (file, params, base64EncodedContent) {
            var _this = this;
            var configObject;
            if (!params || !params.uploadType) {
                configObject = { method: 'POST', url: this.self.filesUrl.replace(':id', ''), data: file }; // no params is a simple metadata insert
            }
            else {
                try {
                    configObject = this.self.buildUploadConfigObject(file, params, base64EncodedContent, true); // build a config object from params
                    configObject.method = 'POST';
                    configObject.url = this.self.filesUploadUrl; // nb non-standard URL
                }
                catch (ex) {
                    return this.self.reject(ex);
                }
            }
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = { promise: promise, data: {}, headers: undefined };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
                _this.self.transcribeProperties(resp, responseObject);
                _this.self.lastFile = resp;
            });
            return responseObject;
        };
        /**
         * Implements Update, both for metadata only and for multipart media content upload
         * TODO NB resumable uploads not yet supported
         *
         * See https://developers.google.com/drive/v2/reference/files/update for semantics including the params object
         *
         * @param file  Files resource
         * @param params see Google docs
         * @param base64EncodedContent
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesUpdate = function (file, params, base64EncodedContent) {
            var _this = this;
            // validate there is an id somewhere, either in the passed file, or in params.fileId
            var id;
            if (params && params.fileId) {
                id = params.fileId;
            }
            else {
                if (file.id) {
                    id = file.id;
                }
                else {
                    var s = "[D193] Missing fileId";
                    return this.self.reject(s);
                }
            }
            var configObject;
            if (!params || !params.uploadType) {
                configObject = { method: 'PUT', url: this.self.filesUrl.replace(':id', params.fileId), data: file }; // no params is a simple metadata insert
            }
            else {
                try {
                    configObject = this.self.buildUploadConfigObject(file, params, base64EncodedContent, false); // build a config object from params
                    configObject.method = 'PUT';
                    configObject.url = this.self.filesUploadUrl + '/' + params.fileId; // nb non-standard URL
                }
                catch (ex) {
                    return this.self.reject(ex);
                }
            }
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = { promise: promise, data: {}, headers: undefined };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
                _this.self.transcribeProperties(resp, responseObject);
                _this.self.lastFile = resp;
            });
            return responseObject;
        };
        /**
         * Implements drive.patch
         *
         * @param params containg a fileID and a files resource
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesPatch = function (params) {
            var _this = this;
            if (!params || !params.fileId) {
                var s = "[D230] Missing fileId";
                return this.self.reject(s);
            }
            var co = {
                method: 'PATCH',
                url: this.self.filesUrl.replace(':id', params.fileId),
                data: params.resource
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = { promise: promise, data: {}, headers: undefined };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp;
            });
            return responseObject;
        };
        /**
         * Implements drive.trash
         *
         * @param params fileId
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesTrash = function (params) {
            var _this = this;
            if (!params || !params.fileId) {
                var s = "[D225] Missing fileId";
                return this.self.reject(s);
            }
            var co = {
                method: 'POST',
                url: this.self.filesUrl.replace(':id', params.fileId) + this.self.urlTrashSuffix
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = { promise: promise, data: {}, headers: undefined };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp;
            });
            return responseObject;
        };
        /**
         * Implements drive.Untrash
         *
         * @param params fileId
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesUntrash = function (params) {
            var _this = this;
            if (!params || !params.fileId) {
                var s = "[D251] Missing fileId";
                return this.self.reject(s);
            }
            var co = {
                method: 'POST',
                url: this.self.filesUrl.replace(':id', params.fileId) + this.self.urlUntrashSuffix
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = { promise: promise, data: {}, headers: undefined };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp;
            });
            return responseObject;
        };
        /**
         * Implements drive.delete
         *
         * @param params fileID
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesDelete = function (params) {
            if (!params || !params.fileId) {
                var s = "[D222] Missing fileId";
                return this.self.reject(s);
            }
            var co = {
                method: 'delete',
                url: this.self.filesUrl.replace(':id', params.fileId)
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = { promise: promise, data: {}, headers: undefined };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
            });
            return responseObject;
        };
        /**
         * Implements drive.Watch
         * NB This is not available as CORS endpoint for browser clients
         *
         * @param params mandatory fileID optional alt and revisionId
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesWatch = function (params, resource) {
            var _this = this;
            this.self.$log.warn('[D334] NB files.watch is not available as a CORS endpoint for browser clients.');
            if (!params || !params.fileId) {
                var s = "[D302] Missing id";
                return this.self.reject(s);
            }
            var co = {
                method: 'POST',
                url: this.self.filesUrl.replace(':id', params.fileId) + this.self.urlWatchSuffix,
                params: params,
                data: resource
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = { promise: promise, data: undefined, headers: undefined };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp;
            });
            return responseObject;
        };
        /**
         * Implements drive.Touch
         *
         * @param params
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesTouch = function (params) {
            var _this = this;
            if (!params || !params.fileId) {
                var s = "[D329] Missing fileId";
                return this.self.reject(s);
            }
            var co = {
                method: 'POST',
                url: this.self.filesUrl.replace(':id', params.fileId) + this.self.urlTouchSuffix
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = { promise: promise, data: {}, headers: undefined };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp;
            });
            return responseObject;
        };
        /**
         * Implements drive.emptyTrash
         *
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesEmptyTrash = function () {
            var co = {
                method: 'DELETE',
                url: this.self.filesUrl.replace(':id', 'trash')
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = { promise: promise, data: {}, headers: undefined };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
            });
            return responseObject;
        };
        /**
         * reject the current request by creating a response object with a promise and rejecting it
         * This is used to deal with validation errors prior to http submission
         *
         * @param reason
         * @returns {{data: undefined, promise: IPromise<T>, headers: undefined}}
         */
        DriveService.prototype.reject = function (reason) {
            this.self.$log.error('NgGapi: ' + reason);
            var def = this.self.$q.defer();
            def.reject(reason); // which is used to reject the promise
            return { data: undefined, promise: def.promise, headers: undefined };
        };
        /**
         * Used to build a $http config object for an upload. This will (normally) be a multipart mime body.
         *
         * NB resumable upload is not currently implemented!!!
         *
         * @param file
         * @param params
         * @param base64EncodedContent
         * @param isInsert true for insert, false/undefined for Update
         * @returns {undefined}
         *
         * @throws D115 resumables not supported
         * @throws D119 safety check that the media is base64 encoded
         * @throws D125 safety check there is a mime type
         */
        DriveService.prototype.buildUploadConfigObject = function (file, params, base64EncodedContent, isInsert) {
            // check for a resumable upload and reject coz we don't support them yet
            if (params.uploadType == 'resumable') {
                throw "[D136] resumable uploads are not currently supported";
            }
            // check the media is base64 encoded
            if (base64EncodedContent.match(/^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/) == null) {
                throw ("[D142] content does not appear to be base64 encoded.");
            }
            // check the dev provided a mime type for media or multipart
            if ((params.uploadType == 'multipart' || params.uploadType == 'media') && (isInsert && (!file || !file.mimeType))) {
                throw ("[D148] file metadata is missing mandatory mime type");
            }
            //			var base64Data = window['tools'].base64Encode(fileContent);
            var body;
            if (params.uploadType == 'multipart') {
                var boundary = '-------3141592ff65358979323846';
                var delimiter = "\r\n--" + boundary + "\r\n";
                var mimeHeader = '';
                if (isInsert) {
                    mimeHeader = 'Content-Type: ' + file.mimeType + '\r\n'; // updates uses existing file
                }
                var close_delim = "\r\n--" + boundary + "--";
                body = delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(file) + delimiter + mimeHeader + 'Content-Transfer-Encoding: base64\r\n' + '\r\n' + base64EncodedContent + close_delim;
                //params['alt'] = 'json';
                var headers = {};
                headers['Content-Type'] = 'multipart/mixed; boundary="-------3141592ff65358979323846"';
            }
            if (params.uploadType == 'media') {
                body = base64EncodedContent;
                var headers = {};
                if (isInsert) {
                    headers['Content-Type'] = file.mimeType;
                }
                headers['Content-Transfer-Encoding'] = 'base64';
            }
            // return the finished config object
            return { method: undefined, url: undefined, params: params, data: body, headers: headers };
        };
        /**
         * instantiate each property of src object into dest object
         * Used to transcribe properties from the returned JSON object to the responseObject so as not to break
         * any object assignments the the view model
         *
         * @param src
         * @param dest
         */
        DriveService.prototype.transcribeProperties = function (src, dest) {
            if (!dest.data) {
                dest.data = {};
            }
            if (typeof src == "object") {
                Object.keys(src).map(function (key) {
                    dest.data[key] = src[key];
                });
            }
            else {
                dest = src;
            }
        };
        DriveService.$inject = ['$log', '$timeout', '$q', 'HttpService'];
        return DriveService;
    })();
    NgGapi.DriveService = DriveService;
})(NgGapi || (NgGapi = {}));
angular.module('ngm.NgGapi').service('DriveService', NgGapi.DriveService);
//# sourceMappingURL=drive_s.js.map