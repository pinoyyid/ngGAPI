/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
var MainCtrl = (function () {
    //constructor(local $scope, local $log) {
    function MainCtrl($scope, $log, OauthService) {
        this.$scope = $scope;
        this.$log = $log;
        this.OauthService = OauthService;
        this.sig = 'MainCtrl';
        $scope.vm = this;
    }
    MainCtrl.$inject = ['$scope', '$log', 'OauthService'];
    return MainCtrl;
})();
//angular.module('MyApp')
//  .controller('MainCtrl', function ($scope) {
//    $scope.sig = 'MainCtrl';
//  });
angular.module('MyApp').controller('MainCtrl', MainCtrl);
//# sourceMappingURL=main_c.js.map