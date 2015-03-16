/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>

class MainCtrl {
	sig = 'MainCtrl';
	static $inject = ['$scope', '$log', 'oauthService'];
	//constructor(local $scope, local $log) {
	constructor(private $scope, private $log, private oauthService) {
		$scope.vm = this;
	}
}

//angular.module('MyApp')
//  .controller('MainCtrl', function ($scope) {
//    $scope.sig = 'MainCtrl';
//  });
angular.module('MyApp')
	.controller('MainCtrl', MainCtrl);


