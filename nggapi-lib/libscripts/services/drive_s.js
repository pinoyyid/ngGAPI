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
            this.files = { self: this, get: this.filesGet };
            this.filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
            this.self = this; // this is recursive and is only required if we expose the filesGet form (as opposed to files.get)
        }
        DriveService.prototype.filesGet = function (argsObject) {
            debugger;
            var co = { method: 'GET', url: this.self.filesUrl.replace(':id', argsObject.fileId) };
            //debugger;
            var promise = this.self.HttpService.doHttp(co);
            //var responseObject:{promise:ng.IPromise<{data:IDriveFile}>; data:IDriveFile; headers:{}} = {promise:promise, data:{}, headers:{}};
            var responseObject = { promise: promise, data: { title: "not yet", foo: "bar" }, headers: {} };
            promise.then(function (data) {
                responseObject.data.title = data.title;
                console.log('service then ' + responseObject.data.title);
            });
            return responseObject;
        };
        DriveService.$inject = ['$log', '$timeout', '$q', 'HttpService'];
        return DriveService;
    })();
    NgGapi.DriveService = DriveService;
})(NgGapi || (NgGapi = {}));
angular.module('PngGapi').service('DriveService', NgGapi.DriveService);
//# sourceMappingURL=drive_s.js.map