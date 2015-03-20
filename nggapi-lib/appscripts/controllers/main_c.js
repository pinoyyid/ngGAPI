/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
// TODO need to extract all interfaces to a single definition file
/// <reference path="../../libscripts/services/drive_s.ts"/>
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
        this.inp = 'inp';
        $scope.vm = this;
        var id = '0Bw3h_yCVtXbbSXhZR00tUDcyWVE';
        //DriveService.filesGet({fileId:id}).promise.then((data:NgGapi.IDriveFile)=>{
        //  console.log("controller then");
        //  this.filetitle = data.title;
        //});
        DriveService.files.insert({ title: 'delme' }).promise.then(function (data) {
            console.log("controller then inserted id = " + data.id);
            _this.filetitle = data.title;
            return;
        });
        DriveService.files.get({ fileId: id }).promise.then(function (data) {
            console.log("controller then");
            _this.filetitle = data.title;
        });
        var prom = DriveService.files.insert({ title: 'delme media', mimeType: 'text/plain' }, { uploadType: 'multipart' }, btoa('hello world')).promise;
        prom.then(function (data) {
            console.log('inserted with mime ' + data.mimeType);
        });
        prom.catch(function () {
            console.error("OMG it failed");
        });
        this.insertFile('delme chain file title').then(function (file) {
            return _this.getFile(file.id);
        }).then(function (file) {
            _this.displayTitle(file.title);
        }); // console log the title
        this.insertFile('delme chain file title 2').then(function (file) {
            return _this.getFileContents(file.id);
        }).then(function (data) {
            console.log('inserted content, fetched with GET = ' + data);
        }); // console log the title
        // TODO need a warning in the docs/comments that this doesn't work because in JS a String is a primitive data type, so filetitle2 receives the current value
        console.log(DriveService);
        this.d = DriveService.files.get({ fileId: id }).data;
    }
    MainCtrl.prototype.insertFile = function (title) {
        return this.DriveService.files.insert({ title: title, mimeType: 'text/plain' }, { uploadType: 'multipart' }, btoa('some multipart content')).promise;
    };
    MainCtrl.prototype.getFile = function (id) {
        return this.DriveService.files.get({ fileId: id }).promise;
    };
    MainCtrl.prototype.getFileContents = function (id) {
        return this.DriveService.files.get({ fileId: id, alt: 'media' }).promise;
    };
    MainCtrl.prototype.displayTitle = function (title) {
        this.$log.info("chained title = " + title);
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