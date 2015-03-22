/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
// TODO need to extract all interfaces to a single definition file
/// <reference path="../../../nggapi_interfaces/drive_interfaces.d.ts"/>
var MainCtrl = (function () {
    //constructor(local $scope, local $log) {
    function MainCtrl($scope, $log, DriveService) {
        var _this = this;
        this.$scope = $scope;
        this.$log = $log;
        this.DriveService = DriveService;
        this.sig = 'MainCtrl';
        this.filetitle = 'foo';
        this.filetitle2 = 'foo';
        this.filetitle3 = 'foo';
        this.arry = [];
        this.getData = { media: 'mc' };
        this.inp = 'inp';
        $scope.vm = this;
        var id = '0Bw3h_yCVtXbbSXhZR00tUDcyWVE';
        var idmedia = '0Bw3h_yCVtXbbU3huUVpjb0FfZ0U';
        //DriveService.files.list({}, true).promise.then((data:NgGapi.IDriveFile[]) => {console.info(data.length)});
        DriveService.files.list({}, true).promise.then(function (data) {
            debugger;
            console.error(data.length);
        });
        this.arry = DriveService.files.list({}, true).data;
        return;
        DriveService.files.insert({ title: 'delme insert' }).promise.then(function (data) {
            console.log("controller then inserted id = " + data.id);
            _this.filetitle = data.title;
        });
        DriveService.files.get({ fileId: id }).promise.then(function (data) {
            console.log("controller then");
            _this.filetitle2 = data.title;
        });
        var prom = DriveService.files.insert({
            title: 'delme media',
            mimeType: 'text/plain'
        }, { uploadType: 'multipart' }, btoa('hello world')).promise;
        prom.then(function (data) {
            console.log('inserted with mime ' + data.mimeType);
        });
        prom.catch(function (reason) {
            console.error("OMG it failed", reason);
        });
        var title = 'delme chain file title'; // insert a file
        this.insertFile(title).then(function (file) {
            return _this.getFile(file.id);
        }).then(function (file) {
            _this.displayTitle(title, file.title);
        }); // console log the title
        this.insertFile('delme chain file title 2').then(function (file) {
            return _this.getFileContents(file.id);
        }).then(function (data) {
            console.log('inserted content, fetched with GET = ' + data);
        }); // console log the title
        this.d = DriveService.files.get({ fileId: id }).data;
        this.getFileContents(idmedia);
        this.insertFile("delme trash me").then(function (file) {
            DriveService.files.trash({ fileId: file.id }).promise.then(function (resp) {
                console.log('trashed ' + resp['id']);
            });
        });
    }
    MainCtrl.prototype.insertFile = function (title) {
        return this.DriveService.files.insert({
            title: title,
            mimeType: 'text/plain'
        }, { uploadType: 'multipart' }, btoa('some multipart content')).promise;
    };
    MainCtrl.prototype.getFile = function (id) {
        return this.DriveService.files.get({ fileId: id }).promise;
    };
    MainCtrl.prototype.getFileContents = function (id) {
        var d = this.DriveService.files.get({ fileId: id, alt: 'media' });
        // for a media get, the response object is {media: "file contents"} and must be assigned as shown below. SO important to document that this.media = d.data.media WILL NOT WORK!!!!
        this.getData = d.data;
        return d.promise;
    };
    MainCtrl.prototype.displayTitle = function (expect, title) {
        this.$log.info("chained title (" + expect + ")= " + title);
    };
    MainCtrl.$inject = ['$scope', '$log', 'DriveService'];
    return MainCtrl;
})();
//angular.module('MyApp')
//  .controller('MainCtrl', function ($scope) {
//    $scope.sig = 'MainCtrl';
//  });
angular.module('MyApp').controller('MainCtrl', MainCtrl);
//# sourceMappingURL=main_c.js.map