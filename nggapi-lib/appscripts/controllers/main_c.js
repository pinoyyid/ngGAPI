/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
var MainCtrl = (function () {
    //constructor(local $scope, local $log) {
    function MainCtrl($scope, $log, OauthService, DriveService) {
        this.$scope = $scope;
        this.$log = $log;
        this.OauthService = OauthService;
        this.DriveService = DriveService;
        this.sig = 'MainCtrl';
        this.filetitle = 'foo';
        this.filetitle2 = 'foo';
        this.filetitle3 = 'foo';
        this.inp = 'inp';
        $scope.vm = this;
        //DriveService.filesGet().promise.then((data)=>{
        //  console.log("controller then");
        //  this.filetitle = data.title;
        //});
        // need a warning in the docs/comments that this doesn't work because in JS a String is a primitive data type, so filetitle2 receives the current value
        //this.filetitle2 = DriveService.filesGet().data.title;
        // these both work
        //this.ro = DriveService.filesGet();
        //this.d = DriveService.filesGet().data;
        console.log(DriveService);
        var id = '0Bw3h_yCVtXbbSXhZR00tUDcyWVE';
        this.d = DriveService.files.filesGet(id).data;
    }
    MainCtrl.$inject = ['$scope', '$log', 'OauthService', 'DriveService'];
    return MainCtrl;
})();
//angular.module('MyApp')
//  .controller('MainCtrl', function ($scope) {
//    $scope.sig = 'MainCtrl';
//  });
angular.module('MyApp').controller('MainCtrl', MainCtrl);
//# sourceMappingURL=main_c.js.map