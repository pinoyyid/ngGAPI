/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../../../definitely_typed/gapi.d.ts"/>
/// <reference path="../../../nggapi_interfaces/drive_interfaces.d.ts"/>

'use strict';

module NgGapi {

	/**
	 * The Drive service.
	 */
	export class DriveService implements IDriveService {
		sig = 'DriveService';                // used in unit testing to confirm DI

		testStatus:string;                  // this has no role in the functionality of OauthService. it's a helper property for unit tests

		static $inject = ['$log', '$timeout', '$q', 'HttpService'];
		files = {self: this, get: this.filesGet, insert: this.filesInsert};
		filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
		filesUploadUrl = 'https://www.googleapis.com/upload/drive/v2/files';
		self = this;        // this is recursive and is only required if we expose the filesGet form (as opposed to files.get)
		constructor(private $log:ng.ILogService, private $timeout:ng.ITimeoutService, private $q:ng.IQService, private HttpService:IHttpService) {
		}

		filesGet(params):IDriveResponseObject {
			var co:ng.IRequestConfig = {
				method: 'GET',
				url: this.self.filesUrl.replace(':id', params.fileId),
				params: params
			};
			var promise = this.self.HttpService.doHttp(co);
			//var responseObject:{promise:ng.IPromise<{data:IDriveFile}>; data:IDriveFile; headers:{}} = {promise:promise, data:{}, headers:{}};
			var responseObject:IDriveResponseObject = {promise: promise, data: {}, headers: {}};
			promise.then((file:IDriveFile)=> {
				this.self.transcribeProperties(file, responseObject);
				console.log('service then ' + file.title);
			});
			return responseObject;
		}


		filesInsert(file:IDriveFile, params?:IDriveInsertParameters, base64EncodedContent?:string):IDriveResponseObject {
			var configObject:ng.IRequestConfig;
			if (!params) {
				configObject = {method: 'POST', url: this.self.filesUrl.replace(':id', ''), data: file};
			} else {
				try {
					configObject = this.self.buildUploadConfigObject(file, params, base64EncodedContent);
					configObject.method = 'POST';
					configObject.url = this.self.filesUploadUrl;
				} catch (ex) {
					var def = this.self.$q.defer();
					def.reject(ex);
					return {data: undefined, promise: def.promise, headers: undefined};
				}
			}


			var promise = this.self.HttpService.doHttp(configObject);
			var responseObject:IDriveResponseObject = {promise: promise, data: {}, headers: {}};
			promise.then((file:IDriveFile)=> {
				this.self.transcribeProperties(file, responseObject);
				console.log('service then ' + file.title);
			});
			return responseObject;
		}


		/**
		 * Used to build a $http config object for an upload. This will (normally) be a multipart mime body.
		 *
		 * NB resumable upload is not currently implemented!!!
		 *
		 * @param file
		 * @param params
		 * @param base64EncodedContent
		 * @returns {undefined}
		 */
		buildUploadConfigObject(file:IDriveFile, params:IDriveInsertParameters, base64EncodedContent:string):ng.IRequestConfig {
			if (params.uploadType == 'resumable') {
				this.self.$log.error("NgGapi: [D115] resumable uploads are not currently supported");
				throw "[D115] resumable uploads are not currently supported";
			}

			if (base64EncodedContent.match(/^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/) == null) {
				this.self.$log.error("NgGapi: [D119] content does not appear to be base64 encoded.");
				throw ("[D119] content does not appear to be base64 encoded.");
			}

			if (params.uploadType == 'multipart' && (!file || !file.mimeType)) {
				this.self.$log.error("NgGapi: [D125] file metadata is missing mandatory mime type");
				throw ("[D125] file metadata is missing mandatory mime type");
			}


			//			var base64Data = window['tools'].base64Encode(fileContent);
			//			console.log("base54Data = " + base64Data);
			var body:string;
			if (params.uploadType == 'multipart') {
				var boundary = '-------3141592ff65358979323846';
				var delimiter = "\r\n--" + boundary + "\r\n";
				var close_delim = "\r\n--" + boundary + "--";
				body =
					delimiter +
					'Content-Type: application/json\r\n\r\n' +
					JSON.stringify(file) +
					delimiter +
					'Content-Type: ' + file.mimeType + '\r\n' +
					'Content-Transfer-Encoding: base64\r\n' +
					'\r\n' +
					base64EncodedContent +
					close_delim;
				//params['alt'] = 'json';
				var headers = {};
				headers['Content-Type'] = 'multipart/mixed; boundary="-------3141592ff65358979323846"'
			}

			if (params.uploadType == 'media') {
				body = base64EncodedContent;
				var headers = {};
				headers['Content-Type'] = file.mimeType;
				headers['Content-Length'] = base64EncodedContent.length;
				headers['Content-Transfer-Encoding'] = 'base64';
			}


			return {method: undefined, url: undefined, params: params, data: body, headers: headers}
		}


		/**
		 * instantiate each property of src object into dest object
		 * Used to transcsribe properties from the returned JSON object to the responseObject so as not to break
		 * any object assignments the the view model
		 *
		 * @param src
		 * @param dest
		 */
		transcribeProperties(src, dest) {
			Object.keys(src).map(function (key) {
				dest.data[key] = src[key]
			});

		}
	}


}

angular.module('ngm.NgGapi')
	.service('DriveService', NgGapi.DriveService);
