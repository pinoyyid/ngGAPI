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
            console.log('drive cvons');
        }
        DriveService.prototype.doGet = function () {
            var id = '0Bw3h_yCVtXbbSXhZR00tUDcyWVE';
            var co = { method: 'GET', url: 'https://www.googleapis.com/drive/v2/files/' + id };
            var promise = this.HttpService.doHttp(co);
            promise.then(function (data) {
                console.log('service then ' + data.title);
            });
            return promise;
        };
        DriveService.$inject = ['$log', '$timeout', '$q', 'HttpService'];
        return DriveService;
    })();
    NgGapi.DriveService = DriveService;
})(NgGapi || (NgGapi = {}));
angular.module('PngGapi').service('DriveService', NgGapi.DriveService);
//# sourceMappingURL=drive_s.js.map