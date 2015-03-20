/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../../../definitely_typed/gapi.d.ts"/>
/// <reference path="../objects/DriveFileInterfaces.ts"/>
/// <reference path="http_s.ts"/>
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
            this.files = { self: this, get: this.filesGet, insert: this.filesInsert };
            this.filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
            this.self = this; // this is recursive and is only required if we expose the filesGet form (as opposed to files.get)
        }
        DriveService.prototype.filesGet = function (argsObject) {
            var _this = this;
            var co = { method: 'GET', url: this.self.filesUrl.replace(':id', argsObject.fileId) };
            var promise = this.self.HttpService.doHttp(co);
            //var responseObject:{promise:ng.IPromise<{data:IDriveFile}>; data:IDriveFile; headers:{}} = {promise:promise, data:{}, headers:{}};
            var responseObject = { promise: promise, data: {}, headers: {} };
            promise.then(function (data) {
                _this.self.transcribeProperties(data, responseObject);
                console.log('service then ' + responseObject.data.title);
            });
            return responseObject;
        };
        DriveService.prototype.filesInsert = function (file) {
            var _this = this;
            var co = { method: 'POST', url: this.self.filesUrl.replace(':id', ''), data: file };
            var promise = this.self.HttpService.doHttp(co);
            var responseObject = { promise: promise, data: {}, headers: {} };
            promise.then(function (data) {
                _this.self.transcribeProperties(data, responseObject);
                console.log('service then ' + responseObject.data.title);
            });
            return responseObject;
        };
        /**
         * instantiate each property of src object into dest object
         * Used to transcsribe properties from the returned JSON object to the responseObject so as not to break
         * any object assignments the the view model
         *
         * @param src
         * @param dest
         */
        DriveService.prototype.transcribeProperties = function (src, dest) {
            Object.keys(src).map(function (key) {
                dest.data[key] = src[key];
            });
        };
        DriveService.$inject = ['$log', '$timeout', '$q', 'HttpService'];
        return DriveService;
    })();
    NgGapi.DriveService = DriveService;
})(NgGapi || (NgGapi = {}));
angular.module('ngm.NgGapi').service('DriveService', NgGapi.DriveService);
//# sourceMappingURL=drive_s.js.map