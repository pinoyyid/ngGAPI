/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>

class MainCtrl {
	sig = 'MainCtrl';
  filetitle:string = 'foo';
  filetitle2:string = 'foo';
  filetitle3:string = 'foo';
  ro;
  d;
  inp = 'inp';
	static $inject = ['$scope', '$log', 'OauthService', 'DriveService'];
	//constructor(local $scope, local $log) {
	constructor(private $scope, private $log, private OauthService, private DriveService) {
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
}

//angular.module('MyApp')
//  .controller('MainCtrl', function ($scope) {
//    $scope.sig = 'MainCtrl';
//  });
angular.module('MyApp')
	.controller('MainCtrl', MainCtrl);

