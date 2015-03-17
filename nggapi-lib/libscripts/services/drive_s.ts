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

		static $inject = ['$log', '$timeout', '$q', 'HttpService'];
		constructor(private $log:ng.ILogService, private $timeout:ng.ITimeoutService, private $q:ng.IQService, private HttpService:IHttpService) {
      console.log('drive cvons');
      this.doGet();
		}

		doGet():ng.IPromise<{data:IDriveFile}> {
      var id = '0Bw3h_yCVtXbbSXhZR00tUDcyWVE';
      var co:IHttpConfigObject = {method: 'GET', url: 'https://www.googleapis.com/drive/v2/files/'+id};
      var promise = this.HttpService.doHttp(co);
      promise.then((data:IDriveFile)=>{console.log('service then '+data.title)})
      return promise;
		}

	}
}

angular.module('MyApp')
  .service('DriveService',NgGapi.DriveService );

