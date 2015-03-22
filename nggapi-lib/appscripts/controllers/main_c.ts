/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
// TODO need to extract all interfaces to a single definition file
/// <reference path="../../../nggapi_interfaces/drive_interfaces.d.ts"/>

class MainCtrl {
	sig = 'MainCtrl';
	filetitle:string = 'foo';
	filetitle2:string = 'foo';
	filetitle3:string = 'foo';
	ro;
	d;
	getData;
	inp = 'inp';
	static $inject = ['$scope', '$log', 'DriveService'];
	//constructor(local $scope, local $log) {
	constructor(private $scope, private $log:ng.ILogService, private DriveService:NgGapi.IDriveService) {
		$scope.vm = this;
		var id = '0Bw3h_yCVtXbbSXhZR00tUDcyWVE';
		//DriveService.filesGet({fileId:id}).promise.then((data:NgGapi.IDriveFile)=>{
		//  console.log("controller then");
		//  this.filetitle = data.title;
		//});
		DriveService.files.insert({title: 'delme'}).promise.then((data:NgGapi.IDriveFile)=> {
			console.log("controller then inserted id = " + data.id);
			this.filetitle = data.title;
			return
		});
		DriveService.files.get({fileId: id}).promise.then((data:NgGapi.IDriveFile)=> {
			console.log("controller then");
			this.filetitle = data.title;
		});

		var prom = DriveService.files.insert({
			title: 'delme media',
			mimeType: 'text/plain'
		}, {uploadType: 'multipart'}, btoa('hello world')).promise;
		prom.then((data:NgGapi.IDriveFile)=> {
			console.log('inserted with mime ' + data.mimeType)
		});
		prom.catch((reason)=> {
			console.error("OMG it failed", reason)
		});

		this.insertFile('delme chain file title')                   // insert a file
			.then((file)=> {
				return this.getFile(file.id)
			})             // retrieve the newly inserted file
			.then((file)=> {
				this.displayTitle(file.title)
			});           // console log the title

		this.insertFile('delme chain file title 2')                 // insert a file
			.then((file)=> {
				return this.getFileContents(file.id)
			})             // retrieve the newly inserted file
			.then((data)=> {
				console.log('inserted content, fetched with GET = ' + data)
			});           // console log the title



		console.log(DriveService);
		this.d = DriveService.files.get({fileId: id}).data;
	}


	insertFile(title:string):ng.IPromise<NgGapi.IDriveFile> {
		return this.DriveService.files.insert({
			title: title,
			mimeType: 'text/plain'
		}, {uploadType: 'multipart'}, btoa('some multipart content')).promise;
	}

	getFile(id:string):ng.IPromise<NgGapi.IDriveFile> {
		return this.DriveService.files.get({fileId: id}).promise;
	}

	getFileContents(id:string):ng.IPromise<NgGapi.IDriveFile> {
		var d = this.DriveService.files.get({fileId: id, alt: 'media'});
		// for a media get, the response object is {media: "file contents"} and must be assigned as shown below. SO important to document that this.media = d.data.media WILL NOT WORK!!!!
		this.getData = d.data;
		return d.promise;
	}

	displayTitle(title:string) {
		this.$log.info("chained title = " + title);
	}
}

//angular.module('MyApp')
//  .controller('MainCtrl', function ($scope) {
//    $scope.sig = 'MainCtrl';
//  });
angular.module('MyApp')
	.controller('MainCtrl', MainCtrl);
