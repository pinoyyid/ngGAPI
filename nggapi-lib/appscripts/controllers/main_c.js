/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
var MainCtrl = (function () {
    //constructor(local $scope, local $log) {
    function MainCtrl($scope, $log, OauthService, DriveService) {
        var _this = this;
        this.$scope = $scope;
        this.$log = $log;
        this.OauthService = OauthService;
        this.DriveService = DriveService;
        this.sig = 'MainCtrl';
        this.filetitle = 'foo';
        $scope.vm = this;
        DriveService.doGet().then(function (data) {
            console.log("controller then");
            _this.filetitle = data.title;
        });
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