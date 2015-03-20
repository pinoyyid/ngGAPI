/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
// TODO need to extract all interfaces to a single definition file
/// <reference path="../../libscripts/services/drive_s.ts"/>

class MainCtrl {
	sig = 'MainCtrl';
  filetitle:string = 'foo';
  filetitle2:string = 'foo';
  filetitle3:string = 'foo';
  ro;
  d;
  inp = 'inp';
	static $inject = ['$scope', '$log', 'DriveService'];
	//constructor(local $scope, local $log) {
	constructor(private $scope, private $log:ng.ILogService,  private DriveService:NgGapi.IDriveService) {
		$scope.vm = this;
    var id = '0Bw3h_yCVtXbbSXhZR00tUDcyWVE';
    //DriveService.filesGet({fileId:id}).promise.then((data:NgGapi.IDriveFile)=>{
    //  console.log("controller then");
    //  this.filetitle = data.title;
    //});
    DriveService.files.insert({title: 'delme'}).promise.then((data:NgGapi.IDriveFile)=>{
      console.log("controller then inserted id = "+data.id);
      this.filetitle = data.title;
      return
    });
    DriveService.files.get({fileId:id}).promise.then((data:NgGapi.IDriveFile)=>{
      console.log("controller then");
      this.filetitle = data.title;
    });

    this.insertFile('delme chain file title')                   // insert a file
      .then((file)=>{return this.getFile(file.id)})             // retrieve the newly inserted file
      .then((file)=>{this.displayTitle(file.title)});           // console log the title


    // TODO need a warning in the docs/comments that this doesn't work because in JS a String is a primitive data type, so filetitle2 receives the current value

    console.log(DriveService);
    this.d = DriveService.files.get({fileId:id}).data;
	}


  insertFile(title:string):ng.IPromise<NgGapi.IDriveFile> {
    return  this.DriveService.files.insert({title: title}).promise;
  }
  getFile(id:string):ng.IPromise<NgGapi.IDriveFile> {
    return  this.DriveService.files.get({fileId: id}).promise;
  }
  displayTitle(title:string) {
    this.$log.info("chained title = "+title);
  }
}

//angular.module('MyApp')
//  .controller('MainCtrl', function ($scope) {
//    $scope.sig = 'MainCtrl';
//  });
angular.module('MyApp')
	.controller('MainCtrl', MainCtrl);

