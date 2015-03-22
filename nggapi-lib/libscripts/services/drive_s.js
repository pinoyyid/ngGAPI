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
                insert: this.filesInsert
            };
            this.self = this; // this is recursive and is only required if we expose the files.get form (as opposed to filesGet)
            this.filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
            this.filesUploadUrl = 'https://www.googleapis.com/upload/drive/v2/files';
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
            //var responseObject:{promise:mng.IPromise<{data:IDriveFile}>; data:IDriveFile; headers:{}} = {promise:promise, data:{}, headers:{}};
            var responseObject = { promise: promise, data: {}, headers: undefined };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                if (params.alt == 'media') {
                    responseObject.data['media'] = resp; // if media, assign to media property
                }
                else {
                    //responseObject['a']=resp.data;
                    _this.self.transcribeProperties(resp, responseObject); // if file, transcribe properties
                    _this.self.lastFile = resp;
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
         * @returns {any}
         */
        DriveService.prototype.filesInsert = function (file, params, base64EncodedContent) {
            var _this = this;
            var configObject;
            if (!params) {
                configObject = { method: 'POST', url: this.self.filesUrl.replace(':id', ''), data: file }; // no params is a simple metadata insert
            }
            else {
                try {
                    configObject = this.self.buildUploadConfigObject(file, params, base64EncodedContent); // build a config object from params
                    configObject.method = 'POST';
                    configObject.url = this.self.filesUploadUrl; // nb non-standard URL
                }
                catch (ex) {
                    var def = this.self.$q.defer();
                    def.reject(ex); // which is used to reject the promise
                    return { data: undefined, promise: def.promise, headers: undefined };
                }
            }
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = { promise: promise, data: {}, headers: undefined };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe heqaders
                _this.self.transcribeProperties(resp, responseObject);
                _this.self.lastFile = resp;
            });
            return responseObject;
        };
        /**
         * Used to build a $http config object for an upload. This will (normally) be a multipart mime body.
         *
         * NB resumable upload is not currently implemented!!!
         *
         * @param file
         * @param params
         * @param base64EncodedContent
         * @returns {undefined}
         *
         * @throws D115 resumables not supported
         * @throws D119 safety check that the media is base64 encoded
         * @throws D125 safety check there is a mime type
         */
        DriveService.prototype.buildUploadConfigObject = function (file, params, base64EncodedContent) {
            // check for a resumable upload and reject coz we don't support them yet
            if (params.uploadType == 'resumable') {
                this.self.$log.error("NgGapi: [D136] resumable uploads are not currently supported");
                throw "[D136] resumable uploads are not currently supported";
            }
            // check the media is base64 encoded
            if (base64EncodedContent.match(/^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/) == null) {
                this.self.$log.error("NgGapi: [D142] content does not appear to be base64 encoded.");
                throw ("[D142] content does not appear to be base64 encoded.");
            }
            // check the dev provided a mime type
            if (params.uploadType == 'multipart' && (!file || !file.mimeType)) {
                this.self.$log.error("NgGapi: [D148] file metadata is missing mandatory mime type");
                throw ("[D148] file metadata is missing mandatory mime type");
            }
            //			var base64Data = window['tools'].base64Encode(fileContent);
            var body;
            if (params.uploadType == 'multipart') {
                var boundary = '-------3141592ff65358979323846';
                var delimiter = "\r\n--" + boundary + "\r\n";
                var close_delim = "\r\n--" + boundary + "--";
                body = delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(file) + delimiter + 'Content-Type: ' + file.mimeType + '\r\n' + 'Content-Transfer-Encoding: base64\r\n' + '\r\n' + base64EncodedContent + close_delim;
                //params['alt'] = 'json';
                var headers = {};
                headers['Content-Type'] = 'multipart/mixed; boundary="-------3141592ff65358979323846"';
            }
            if (params.uploadType == 'media') {
                body = base64EncodedContent;
                var headers = {};
                headers['Content-Type'] = file.mimeType;
                headers['Content-Length'] = base64EncodedContent.length;
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