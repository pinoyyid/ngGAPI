/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
var MainCtrl = (function () {
    //constructor(local $scope, local $log) {
    function MainCtrl($scope, $log, oauthService) {
        this.$scope = $scope;
        this.$log = $log;
        this.oauthService = oauthService;
        this.sig = 'MainCtrl';
        $scope.vm = this;
    }
    MainCtrl.$inject = ['$scope', '$log', 'oauthService'];
    return MainCtrl;
})();
//angular.module('MyApp')
//  .controller('MainCtrl', function ($scope) {
//    $scope.sig = 'MainCtrl';
//  });
angular.module('MyApp').controller('MainCtrl', MainCtrl);
//# sourceMappingURL=main_c.js.map