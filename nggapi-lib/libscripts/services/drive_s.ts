/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../../../definitely_typed/gapi.d.ts"/>
/// <reference path="../objects/DriveFileInterfaces.ts"/>
/// <reference path="http_s.ts"/>




module NgGapi {
	/**
	 * Interface definition for the DriveService. Mostly useful for a mock service
	 */
	export interface IDriveService {
	}


	/**
	 * The Drive service.
	 */
	export class DriveService implements IDriveService {
    sig = 'DriveService';                // used in unit testing to confirm DI

    testStatus:string;                  // this has no role in the functionality of OauthService. it's a helper property for unit tests


  //}
    //export module DriveService{
    //  var foo = 123;
    //  export class files {

        static $inject = ['$log', '$timeout', '$q', 'HttpService'];
        files = {self: this, filesGet: this.filesGet};
        filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
        self;
        constructor(private $log:ng.ILogService, private $timeout:ng.ITimeoutService, private $q:ng.IQService, private HttpService:IHttpService) {
          console.log('drive cvons');
        }

        filesGet(id:string):{promise:ng.IPromise<{data:IDriveFile}>; data:IDriveFile; headers:{}} {
          var co:IHttpConfigObject = {method: 'GET', url: this.self.filesUrl.replace(':id', id)};
          //debugger;
          var promise = this.self.HttpService.doHttp(co);
          //var responseObject:{promise:ng.IPromise<{data:IDriveFile}>; data:IDriveFile; headers:{}} = {promise:promise, data:{}, headers:{}};
          var responseObject = {promise: promise, data: {title: "not yet", foo: "bar"}, headers: {}};
          promise.then((data:IDriveFile)=> {
            responseObject.data.title = data.title;
            console.log('service then ' + responseObject.data.title);
          })

          return responseObject;
        }

        files
      //}
  }

}

angular.module('PngGapi')
  .service('DriveService',NgGapi.DriveService );

