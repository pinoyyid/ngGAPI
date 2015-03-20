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
		files = {self: this, get: this.filesGet};
		filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
		self = this;        // this is recursive and is only required if we expose the filesGet form (as opposed to files.get)
		constructor(private $log:ng.ILogService, private $timeout:ng.ITimeoutService, private $q:ng.IQService, private HttpService:IHttpService) {
		}

		filesGet(argsObject:{fileId:string}):{promise:ng.IPromise<{data:IDriveFile}>; data:IDriveFile; headers:{}} {
			debugger;
			var co:ng.IRequestConfig = {method: 'GET', url: this.self.filesUrl.replace(':id', argsObject.fileId)};
			//debugger;
			var promise = this.self.HttpService.doHttp(co);
			//var responseObject:{promise:ng.IPromise<{data:IDriveFile}>; data:IDriveFile; headers:{}} = {promise:promise, data:{}, headers:{}};
			var responseObject = {promise: promise, data: {title: "not yet", foo: "bar"}, headers: {}};
			promise.then((data:IDriveFile)=> {
				responseObject.data.title = data.title;
				console.log('service then ' + responseObject.data.title);
			});

			return responseObject;
		}
	}
}

angular.module('PngGapi')
	.service('DriveService', NgGapi.DriveService);

