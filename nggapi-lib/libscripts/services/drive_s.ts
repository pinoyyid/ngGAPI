/// <reference path="../../../nggapi_interfaces/drive_interfaces.d.ts"/>

'use strict';

module NgGapi {

	/**
	 * The Drive service.
	 */
	export class DriveService implements IDriveService {
		sig = 'DriveService';                                                                                           // used in unit testing to confirm DI

		// this files object (and the self assignment) allows calls of the nature DriveService.files.insert for compatibility with gapi structure
		files = {
			self: this,
			get: this.filesGet,
			insert: this.filesInsert,
			list: this.filesList,
			update: this.filesUpdate,
			patch: this.filesPatch,
			trash: this.filesTrash,
			untrash: this.filesUntrash,
			del: this.filesDelete,
			watch: this.filesWatch,
			touch: this.filesTouch,
			emptyTrash: this.filesEmptyTrash
		};
		self = this;                                                                                                    // this is recursive and is only required if we expose the files.get form (as opposed to filesGet)

		filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
		filesUploadUrl = 'https://www.googleapis.com/upload/drive/v2/files';
		urlTrashSuffix = '/trash';
		urlUntrashSuffix = '/untrash';
		urlWatchSuffix = '/watch';
		urlTouchSuffix = '/touch';

		testStatus:string;                                                                                              // this has no role in the functionality of OauthService. it's a helper property for unit tests
		lastFile:NgGapi.IDriveFile = {id:'noid'};                                                                       // for testing, holds the most recent file response

		static $inject = ['$log', '$timeout', '$q', 'HttpService'];
		constructor(private $log:mng.ILogService, private $timeout:mng.ITimeoutService,
		            private $q:mng.IQService, private HttpService:IHttpService) {
		}

		/**
		 * getter for underlying HttpService, often used to in turn get OauthService
		 *
		 * @returns {IHttpService}
		 */
		getHttpService():NgGapi.IHttpService {
			return this.HttpService;
		}

		/*
		Each method implements a method from https://developers.google.com/drive/v2/reference/files .
		Generally this is done by constructing an appropriate IRequestConfig object and passing it to the HttpService.

		NB. To support the DriveService.files.insert form of calling, references to "this" must always be "this.self"

		 */

		/**
		 * Implements Get both for getting a file object and the newer alt=media to get a file's media content
		 * See https://developers.google.com/drive/v2/reference/files/get for semantics including the params object
		 *
		 * @param params
		 * @returns {IDriveResponseObject}
		 */
		filesGet(params:NgGapi.IDriveGetParameters):IDriveResponseObject<NgGapi.IDriveFile|string> {
			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'GET',
				url: this.self.filesUrl.replace(':id', params.fileId),
				params: params
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<NgGapi.IDriveFile|string> = {promise: promise, data: {}, headers: undefined};
			promise.then((resp:mng.IHttpPromiseCallbackArg<NgGapi.IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				if (params.alt == 'media') {                                                                            // figure out if the response is a file or media
					responseObject.data['media'] = resp;                                                                // if media, assign to media property
				} else {
					this.self.transcribeProperties(resp, responseObject);                                               // if file, transcribe properties
					this.self.lastFile = resp;
				}
			});
			return responseObject;
		}


		/**
		 * Implements files.List
		 * Validates that dev hasn't inadvertently excluded nextPageToken from response
		 *
		 * responseObject.data contains an array of all results across all pages
		 *
		 * The promise will fire its notify for each page with data containing the raw http response object
		 * with an embedded items array. The final page will fire the resolve.
		 *
		 * @param params see https://developers.google.com/drive/v2/reference/files/list
		 * @param excludeTrashed
		 * @returns IDriveResponseObject
		 */
		filesList(params:NgGapi.IDriveListParameters, excludeTrashed:boolean):IDriveResponseObject<NgGapi.IDriveFile[]> {
			if (params && params.fields && params.fields.indexOf('nextPageToken') == -1) {
				return this.self.reject('[D82] You have tried to list files with specific fields, but forgotten to include "nextPageToken" which will crop your results to just one page');
			}
			if (excludeTrashed) {                                                                                       // if wants to exclude trashed
				var trashed = 'trashed = false';
				params.q = params.q?params.q+' and '+trashed:trashed;                                                   // set or append to q
;			}
			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'GET',
				url: this.self.filesUrl.replace(':id', ''),
				params: params
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<NgGapi.IDriveFile[]> = {promise: promise, data: [], headers: undefined};
			promise.then((resp:NgGapi.IDriveList)=> {                                                                   // on complete
				var l = resp.items.length;
				for (var i=0; i< l; i++) {
					responseObject.data.push(resp.items[i]);                                                            // push each new file
				}   // Nb can't use concat as that creates a new array
			},undefined,
				(resp:NgGapi.IDriveList)=> {                                                                            // on notify, ie a single page of results
				var l = resp.items.length;
				for (var i=0; i< l; i++) {
					responseObject.data.push(resp.items[i]);                                                            // push each new file
				}   // Nb can't use concat as that creates a new array
			});
			return responseObject;
		}

		/**
		 * Implements Insert, both for metadata only and for multipart media content upload
		 * TODO NB resumable uploads not yet supported
		 *
		 * See https://developers.google.com/drive/v2/reference/files/insert for semantics including the params object
		 *
		 * @param file  Files resource with at least a mime type
		 * @param params see Google docs
		 * @param base64EncodedContent
		 * @returns IDriveResponseObject
		 */
		filesInsert(file:IDriveFile, params?:IDriveInsertParameters, base64EncodedContent?:string):IDriveResponseObject<NgGapi.IDriveFile> {
			var configObject:mng.IRequestConfig;
			if (!params) {
				configObject = {method: 'POST', url: this.self.filesUrl.replace(':id', ''), data: file};                // no params is a simple metadata insert
			} else {
				try {
					configObject = this.self.buildUploadConfigObject(file, params, base64EncodedContent);               // build a config object from params
					configObject.method = 'POST';
					configObject.url = this.self.filesUploadUrl;                                                        // nb non-standard URL
				} catch (ex) {                                                                                          // any validation errors throw an exception
					return this.self.reject(ex);
				}
			}


			var promise = this.self.HttpService.doHttp(configObject);
			var responseObject:IDriveResponseObject<NgGapi.IDriveFile> = {promise: promise, data: {}, headers: undefined};
			promise.then((resp:mng.IHttpPromiseCallbackArg<NgGapi.IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe heqaders
				this.self.transcribeProperties(resp, responseObject);
				this.self.lastFile = resp;
			});
			return responseObject;
		}

		/**
		 * Implements drive.update
		 *
		 * @param params
		 * @returns IDriveResponseObject
		 */
		filesUpdate (params:NgGapi.IDriveUpdateParameters) {
			if (!params || !params.fileId) {
				var s = "[D170] Missing fileId";
				return this.self.reject(s);
			}

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'PUT',
				url: this.self.filesUrl.replace(':id', params.fileId)
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<NgGapi.IDriveFile> = {promise: promise, data: {}, headers: undefined};
			promise.then((resp:mng.IHttpPromiseCallbackArg<NgGapi.IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp, responseObject);                                                   // if file, transcribe properties
				this.self.lastFile = resp;
			});
			return responseObject;
		}


		/**
		 * Implements drive.patch
		 *
		 * @param params
		 * @returns IDriveResponseObject
		 */
		filesPatch (params:NgGapi.IDriveUpdateParameters) {
			if (!params || !params.fileId) {
				var s = "[D197] Missing fileId";
				return this.self.reject(s);
			}

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'PATCH',
				url: this.self.filesUrl.replace(':id', params.fileId)
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<NgGapi.IDriveFile> = {promise: promise, data: {}, headers: undefined};
			promise.then((resp:mng.IHttpPromiseCallbackArg<NgGapi.IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp, responseObject);                                                   // if file, transcribe properties
				this.self.lastFile = resp;
			});
			return responseObject;
		}

		/**
		 * Implements drive.trash
		 *
		 * @param params fileId
		 * @returns IDriveResponseObject
		 */
		filesTrash (params:{fileId:string}) {
			if (!params || !params.fileId) {
				var s = "[D225] Missing fileId";
				return this.self.reject(s);
			}

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'POST',
				url: this.self.filesUrl.replace(':id', params.fileId)+this.self.urlTrashSuffix
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<NgGapi.IDriveFile> = {promise: promise, data: {}, headers: undefined};
			promise.then((resp:mng.IHttpPromiseCallbackArg<NgGapi.IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp, responseObject);                                                   // if file, transcribe properties
				this.self.lastFile = resp;
			});
			return responseObject;
		}

		/**
		 * Implements drive.Untrash
		 *
		 * @param params fileId
		 * @returns IDriveResponseObject
		 */
		filesUntrash (params:{fileId:string}) {
			if (!params || !params.fileId) {
				var s = "[D251] Missing fileId";
				return this.self.reject(s);
			}

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'POST',
				url: this.self.filesUrl.replace(':id', params.fileId)+this.self.urlUntrashSuffix
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<NgGapi.IDriveFile> = {promise: promise, data: {}, headers: undefined};
			promise.then((resp:mng.IHttpPromiseCallbackArg<NgGapi.IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp, responseObject);                                                   // if file, transcribe properties
				this.self.lastFile = resp;
			});
			return responseObject;
		}

		/**
		 * Implements drive.delete
		 *
		 * @param params fileID
		 * @returns IDriveResponseObject
		 */
		filesDelete (params:{fileId:string}) {
			if (!params || !params.fileId) {
				var s = "[D222] Missing fileId";
				return this.self.reject(s);
			}

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'delete',
				url: this.self.filesUrl.replace(':id', params.fileId)
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<NgGapi.IDriveFile> = {promise: promise, data: {}, headers: undefined};
			promise.then((resp:mng.IHttpPromiseCallbackArg<NgGapi.IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
			});
			return responseObject;
		}


		/**
		 * Implements drive.Watch
		 *
		 * @param params IWatchParameters
		 * @returns IDriveResponseObject
		 */
		filesWatch (params:IWatchParameters) {
			if (!params || !params.id) {
				var s = "[D302] Missing id";
				return this.self.reject(s);
			}

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'POST',
				url: this.self.filesUrl.replace(':id', params.id)+this.self.urlWatchSuffix
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IApiChannel> = {promise: promise, data: undefined, headers: undefined};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IApiChannel>)=> {                                            // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp, responseObject);                                                   // if file, transcribe properties
				this.self.lastFile = resp;
			});
			return responseObject;
		}

		/**
		 * Implements drive.Touch
		 *
		 * @param params
		 * @returns IDriveResponseObject
		 */
		filesTouch (params:{fileId:string}) {
			if (!params || !params.fileId) {
				var s = "[D329] Missing fileId";
				return this.self.reject(s);
			}

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'POST',
				url: this.self.filesUrl.replace(':id', params.fileId)+this.self.urlTouchSuffix
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<NgGapi.IDriveFile> = {promise: promise, data: {}, headers: undefined};
			promise.then((resp:mng.IHttpPromiseCallbackArg<NgGapi.IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp, responseObject);                                                   // if file, transcribe properties
				this.self.lastFile = resp;
			});
			return responseObject;
		}


		/**
		 * Implements drive.emptyTrash
		 *
		 * @returns IDriveResponseObject
		 */
		filesEmptyTrash () {
			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'POST',
				url: this.self.filesUrl.replace(':id', 'trash')
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<NgGapi.IDriveFile> = {promise: promise, data: {}, headers: undefined};
			promise.then((resp:mng.IHttpPromiseCallbackArg<NgGapi.IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
			});
			return responseObject;
		}


		/**
		 * reject the current request by creating a response object with a promise and rejecting it
		 * This is used to deal with validation errors prior to http submission
		 *
		 * @param reason
		 * @returns {{data: undefined, promise: IPromise<T>, headers: undefined}}
		 */
		reject(reason:any):NgGapi.IDriveResponseObject<any> {
			this.self.$log.error('NgGapi: '+reason);
			var def = this.self.$q.defer();
			def.reject(reason);                                                                                         // which is used to reject the promise
			return {data: undefined, promise: def.promise, headers: undefined};
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
				throw "[D136] resumable uploads are not currently supported";
			}

			// check the media is base64 encoded
			if (base64EncodedContent.match(/^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/) == null) {
				throw ("[D142] content does not appear to be base64 encoded.");
			}

			// check the dev provided a mime type for media or multipart
			if ((params.uploadType == 'multipart' || params.uploadType == 'media')
				&& (!file || !file.mimeType)) {
				throw ("[D148] file metadata is missing mandatory mime type");
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
			if (!dest.data) {
				dest.data = {};
			}
			if (typeof src == "object") {
				Object.keys(src).map(function (key) {
					dest.data[key] = src[key]
				});
			} else {
				dest = src;
			}

		}
	}


}

declare var angular: mng.IAngularStatic;
angular.module('ngm.NgGapi')
	.service('DriveService', NgGapi.DriveService);
