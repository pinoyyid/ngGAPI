/// <reference path="../../../nggapi_interfaces/drive_interfaces.d.ts"/>

'use strict';

module NgGapi {

	/**
	 * The Drive service.
	 */
	export class DriveService implements IDriveService {
		sig = 'DriveService';                                                                                           // used in unit testing to confirm DI

		files = {self: this, get: this.filesGet, insert: this.filesInsert};
		filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
		filesUploadUrl = 'https://www.googleapis.com/upload/drive/v2/files';
		self = this;                                                                                                    // this is recursive and is only required if we expose the files.get form (as opposed to filesGet)

		testStatus:string;                                                                                              // this has no role in the functionality of OauthService. it's a helper property for unit tests

		static $inject = ['$log', '$timeout', '$q', 'HttpService'];
		constructor(private $log:mng.ILogService, private $timeout:mng.ITimeoutService, private $q:mng.IQService, private HttpService:IHttpService) {
		}

		filesGet(params):IDriveResponseObject {
			var co:mng.IRequestConfig = {
				method: 'GET',
				url: this.self.filesUrl.replace(':id', params.fileId),
				params: params
			};
			var promise = this.self.HttpService.doHttp(co);
			//var responseObject:{promise:mng.IPromise<{data:IDriveFile}>; data:IDriveFile; headers:{}} = {promise:promise, data:{}, headers:{}};
			var responseObject:IDriveResponseObject = {promise: promise, data: {}, headers: {}};
			promise.then((file:IDriveFile)=> {
				debugger;
				if (params.alt == 'media') {
						responseObject.data.media = file;
				} else {
					this.self.transcribeProperties(file, responseObject);
				}
				console.log('service then ' + file.title);
			});
			return responseObject;
		}


		filesInsert(file:IDriveFile, params?:IDriveInsertParameters, base64EncodedContent?:string):IDriveResponseObject {
			var configObject:mng.IRequestConfig;
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
		 *
		 * @throws D115 resumables not supported
		 * @throws D119 safety check that the media is base64 encoded
		 * @throws D125 safety check there is a mime type
		 */
		buildUploadConfigObject(file:IDriveFile, params:IDriveInsertParameters, base64EncodedContent:string):mng.IRequestConfig {
			// check for a resumable upload and reject coz we don't support them yet
			if (params.uploadType == 'resumable') {
				this.self.$log.error("NgGapi: [D115] resumable uploads are not currently supported");
				throw "[D115] resumable uploads are not currently supported";
			}

			// check the media is base64 encoded
			if (base64EncodedContent.match(/^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/) == null) {
				this.self.$log.error("NgGapi: [D119] content does not appear to be base64 encoded.");
				throw ("[D119] content does not appear to be base64 encoded.");
			}

			// check the dev provided a mime type
			if (params.uploadType == 'multipart' && (!file || !file.mimeType)) {
				this.self.$log.error("NgGapi: [D125] file metadata is missing mandatory mime type");
				throw ("[D125] file metadata is missing mandatory mime type");
			}


			//			var base64Data = window['tools'].base64Encode(fileContent);
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

			// return the finished config object
			return {method: undefined, url: undefined, params: params, data: body, headers: headers}
		}


		/**
		 * instantiate each property of src object into dest object
		 * Used to transcribe properties from the returned JSON object to the responseObject so as not to break
		 * any object assignments the the view model
		 *
		 * @param src
		 * @param dest
		 */
		transcribeProperties(src, dest) {
			console.log(typeof  src);
			if (typeof src == "object") {
				Object.keys(src).map(function (key) {
					dest.data[key] = src[key]
				});
			} else {
				console.log (src);
				dest = src;
				console.log (dest);
			}

		}
	}


}

angular.module('ngm.NgGapi')
	.service('DriveService', NgGapi.DriveService);
