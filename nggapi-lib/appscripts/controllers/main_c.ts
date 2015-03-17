/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>

class MainCtrl {
	sig = 'MainCtrl';
  filetitle:string = 'foo';
	static $inject = ['$scope', '$log', 'OauthService', 'DriveService'];
	//constructor(local $scope, local $log) {
	constructor(private $scope, private $log, private OauthService, private DriveService) {
		$scope.vm = this;
    DriveService.doGet().then((data)=>{
      console.log("controller then");
      this.filetitle = data.title;
    });

	}
}

//angular.module('MyApp')
//  .controller('MainCtrl', function ($scope) {
//    $scope.sig = 'MainCtrl';
//  });
angular.module('MyApp')
	.controller('MainCtrl', MainCtrl);


