/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
// TODO need to extract all interafces to a single definition file
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
        DriveService.filesGet({ fileId: id }).promise.then(function (data) {
            console.log("controller then");
            _this.filetitle = data.title;
        });
        DriveService.files.get({ fileId: id }).promise.then(function (data) {
            console.log("controller then");
            _this.filetitle = data.title;
        });
        // TODO need a warning in the docs/comments that this doesn't work because in JS a String is a primitive data type, so filetitle2 receives the current value
        console.log(DriveService);
        this.d = DriveService.files.get({ fileId: id }).data;
    }
    MainCtrl.$inject = ['$scope', '$log', 'DriveService'];
    return MainCtrl;
})();
//angular.module('MyApp')
//  .controller('MainCtrl', function ($scope) {
//    $scope.sig = 'MainCtrl';
//  });
angular.module('MyApp').controller('MainCtrl', MainCtrl);
//# sourceMappingURL=main_c.js.map