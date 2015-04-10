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
			insertWithContent: this.filesInsertWithContent,
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
		about = {
			self: this,
			get: this.aboutGet
		};
		changes = {
			self: this,
			get: this.changesGet,
			list: this.changesList,
			watch: this.changesWatch
		};

		self = this;                                                                                                    // this is recursive and is only required if we expose the files.get form (as opposed to filesGet)

		resourceToken = 'reSource';
		urlBase = 'https://www.googleapis.com/drive/v2/' + this.resourceToken + '/:id';
		filesUrl = this.urlBase.replace(this.resourceToken, 'files');
		filesUploadUrl = 'https://www.googleapis.com/upload/drive/v2/files';
		changesUrl = this.urlBase.replace(this.resourceToken, 'changes');
		aboutUrl = this.urlBase.replace(this.resourceToken, 'about');
		urlTrashSuffix = '/trash';
		urlUntrashSuffix = '/untrash';
		urlWatchSuffix = '/watch';
		urlTouchSuffix = '/touch';

		testStatus:string;                                                                                              // this has no role in the functionality of OauthService. it's a helper property for unit tests
		lastFile:IDriveFile = {id: 'noid'};                                                                       // for testing, holds the most recent file response

		static $inject = ['$log', '$timeout', '$q', 'HttpService'];

		constructor(private $log:mng.ILogService, private $timeout:mng.ITimeoutService,
		            private $q:mng.IQService, private HttpService:IHttpService) {
		}

		/**
		 * getter for underlying HttpService, often used to in turn get OauthService or the $http service
		 *
		 * @returns {IHttpService}
		 */
		getHttpService():IHttpService {
			return this.HttpService;
		}

		/*
		 Each method implements a method from https://developers.google.com/drive/v2/reference/files .
		 Generally this is done by constructing an appropriate IRequestConfig object and passing it to the HttpService.

		 NB. To support the DriveService.files.insert form of calling, references to "this" must always be "this.self"

		 */


		/**
		 * Implements Get for the About resource
		 * See https://developers.google.com/drive/v2/reference/about/get
		 *
		 * @params includeSubscribed etc
		 * @returns {IDriveResponseObject}
		 */
		aboutGet(params:IDriveAboutGetParameters):IDriveResponseObject<IDriveAbout,IDriveAbout> {
			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'GET',
				url: this.self.aboutUrl.replace(':id', ''),
				params: params
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IDriveAbout,IDriveAbout> = {
				promise: promise,
				data: {},
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IDriveAbout>)=> {                                     // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp.data, responseObject);                                              // if file, transcribe properties
			});
			return responseObject;
		}


		/**
		 * Implements Get for the changes resource
		 * See https://developers.google.com/drive/v2/reference/changes/get
		 *
		 * @param params object containing a changeId
		 * @returns {IDriveResponseObject}
		 */
		changesGet(params:{changeId:number}):IDriveResponseObject<IDriveChange,IDriveChange> {
			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'GET',
				url: this.self.changesUrl.replace(':id', '' + params.changeId)
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IDriveChange,IDriveChange> = {
				promise: promise,
				data: {},
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IDriveChange>)=> {                                    // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp.data, responseObject);                                              // if file, transcribe properties
			});
			return responseObject;
		}

		/**
		 * Implements changes.List
		 * Validates that Dev hasn't inadvertently excluded nextPageToken from response, displaying a warning if missing.
		 * Previously this fired an error, but there is a scenario where this is valid. Specifically, if Dev wants to
		 * just return the first n matches (which are generally the n most recent), he can do this by setting maxResults
		 * and omitting the pageToken.
		 *
		 * responseObject.data contains an array of all results across all pages
		 *
		 * The promise will fire its notify for each page with data containing the raw http response object
		 * with an embedded items array. The final page will fire the resolve.
		 *
		 * @param params see https://developers.google.com/drive/v2/reference/changes/list
		 * @returns IDriveResponseObject
		 */
		changesList(params:IDriveChangeListParameters):IDriveResponseObject<IDriveChangeList,IDriveChange[]> {
			if (params && params.fields && params.fields.indexOf('nextPageToken') == -1) {
				this.self.$log.warn('[D145] You have tried to list changes with specific fields, but forgotten to include "nextPageToken" which will crop your results to just one page.');
			}
			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'GET',
				url: this.self.changesUrl.replace(':id', ''),
				params: params
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IDriveChangeList,IDriveChange[]> = {
				promise: promise,
				data: [],
				headers: undefined
			};
			promise.then((resp:{data:IDriveChangeList})=> {                                                             // on complete
					if (!!resp.data && !!resp.data.items) {
						var l = resp.data.items.length;
						for (var i = 0; i < l; i++) {
							responseObject.data.push(resp.data.items[i]);                                                   // push each new file
						}   // Nb can't use concat as that creates a new array
					}
				}, undefined,
				(resp:{data:IDriveChangeList})=> {                                                                      // on notify, ie a single page of results
					var l = resp.data.items.length;
					for (var i = 0; i < l; i++) {
						responseObject.data.push(resp.data.items[i]);                                                   // push each new file
					}   // Nb can't use concat as that creates a new array
				});
			return responseObject;
		}


		/**
		 * Implements drive.Watch
		 * NB This is not available as CORS endpoint for browser clients
		 *
		 * @param resource
		 * @returns IDriveResponseObject
		 */
		changesWatch(resource:IWatchBody) {
			this.self.$log.warn('[D137] NB files.watch is not available as a CORS endpoint for browser clients.');

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'POST',
				url: this.self.changesUrl.replace(':id', '') + this.self.urlWatchSuffix,
				data: resource
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IApiChannel,IApiChannel> = {
				promise: promise,
				data: undefined,
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IApiChannel>)=> {                                            // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp.data, responseObject);                                                   // if file, transcribe properties
				this.self.lastFile = resp.data;
			});
			return responseObject;
		}


		/**
		 * Implements Get both for getting a file object and the newer alt=media to get a file's media content
		 * See https://developers.google.com/drive/v2/reference/files/get for semantics including the params object
		 *
		 * @param params
		 * @returns {IDriveResponseObject}
		 */
		filesGet(params:IDriveFileGetParameters):IDriveResponseObject<IDriveFile|string,IDriveFile|string> {
			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'GET',
				url: this.self.filesUrl.replace(':id', params.fileId),
				params: params
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IDriveFile|string,IDriveFile|string> = {
				promise: promise,
				data: {},
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IDriveFile|string>)=> {                                      // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				if (params.alt == 'media') {                                                                            // figure out if the response is a file or media
					responseObject.data['media'] = resp.data;                                                           // if media, assign to media property
				} else {
					this.self.transcribeProperties(resp.data, responseObject);                                          // if file, transcribe properties
					this.self.lastFile = resp.data;
				}
			});
			return responseObject;
		}


		/**
		 * Implements files.List
		 * Validates that Dev hasn't inadvertently excluded nextPageToken from response, displaying a warning if missing.
		 * Previously this fired an error, but there is a scenario where this is valid. Specifically, if Dev wants to
		 * just return the first n matches (which are generally the n most recent), he can do this by setting maxResults
		 * and omitting the pageToken.
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
		filesList(params:IDriveFileListParameters, excludeTrashed:boolean):IDriveResponseObject<IDriveFileList,IDriveFile[]> {
			if (params && params.fields && params.fields.indexOf('nextPageToken') == -1) {
				this.self.$log.warn('[D82] You have tried to list files with specific fields, but forgotten to include "nextPageToken" which will crop your results to just one page.');
			}
			if (excludeTrashed) {                                                                                       // if wants to exclude trashed
				var trashed = 'trashed = false';
				params.q = params.q ? params.q + ' and ' + trashed : trashed;                                           // set or append to q
				;
			}
			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'GET',
				url: this.self.filesUrl.replace(':id', ''),
				params: params
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IDriveFileList,IDriveFile[]> = {
				promise: promise,
				data: [],
				headers: undefined
			};
			promise.then((resp:{data:IDriveFileList})=> {    			                                                // on complete
					if (!!resp.data && !!resp.data.items) {
						var l = resp.data.items.length;
						for (var i = 0; i < l; i++) {
							responseObject.data.push(resp.data.items[i]);                                                   // push each new file
						}   // Nb can't use concat as that creates a new array
					}
				}, undefined,
				(resp:{data:IDriveFileList})=> {                                                                        // on notify, ie a single page of results
					var l = resp.data.items.length;
					for (var i = 0; i < l; i++) {
						responseObject.data.push(resp.data.items[i]);                                                   // push each new file
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
		 *
		 * Optionally (default true) it will store the ID returned in the Drive response in the file object that was passed to it.
		 * This is done since it is almost always what an app needs to do, and by doing it in this method, saves the developer from
		 * writing any promise.then logic
		 *
		 * @param file  Files resource with at least a mime type
		 * @param params see Google docs, must contain at least uploadType
		 * @param content
		 * @param storeID stores the ID from the Google Drive response in the original file object. NB DEFAULTS TO TRUE
		 * @returns IDriveResponseObject
		 */
		filesInsertWithContent(file:IDriveFile, params:IDriveFileInsertParameters, content:string, storeId?:boolean):IDriveResponseObject<IDriveFile,IDriveFile> {
			var configObject:mng.IRequestConfig;
			if (!params || !params.uploadType) {
				var s = "[D314] Missing params (which must contain uploadType)";
				return this.self.reject(s);
			}
			if (!content) {
				var s = "[D318] Missing content";
				return this.self.reject(s);
			}
			try {
				configObject = this.self.buildUploadConfigObject(file, params, content, true);                          // build a config object from params
				configObject.method = 'POST';
				configObject.url = this.self.filesUploadUrl;                                                            // nb non-standard URL
			} catch (ex) {                                                                                              // any validation errors throw an exception
				return this.self.reject(ex);
			}


			var promise = this.self.HttpService.doHttp(configObject);
			var responseObject:IDriveResponseObject<IDriveFile,IDriveFile> = {
				promise: promise,
				data: {},
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IDriveFile>)=> {                                             // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers
				if (storeId == undefined || storeId == true) {                                                          // if requested
					file.id = resp.data.id;                                                                             // stgore the ID
				}
				this.self.transcribeProperties(resp.data, responseObject);
				this.self.lastFile = resp.data;
			});
			return responseObject;
		}


		/**
		 * Implements Insert for metadata only
		 *
		 * See https://developers.google.com/drive/v2/reference/files/insert for semantics including the params object
		 *
		 * Optionally (default true) it will store the ID returned in the Drive response in the file object that was passed to it.
		 * This is done since it is almost always what an app needs to do, and by doing it in this method, saves the developer from
		 * writing any promise.then logic
		 *
		 * @param file  Files resource with at least a mime type
		 * @param storeID stores the ID from the Google Drive response in the original file object. NB DEFAULTS TO TRUE
		 * @returns IDriveResponseObject
		 */
		filesInsert(file:IDriveFile, storeId?:boolean):IDriveResponseObject<IDriveFile,IDriveFile> {
			var configObject:mng.IRequestConfig = {
				method: 'POST',
				url: this.self.filesUrl.replace(':id', ''),
				data: file
			};

			var promise = this.self.HttpService.doHttp(configObject);
			var responseObject:IDriveResponseObject<IDriveFile,IDriveFile> = {
				promise: promise,
				data: {},
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IDriveFile>)=> {                                             // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers
				if (storeId == undefined || storeId == true) {                                                          // if requested
					file.id = resp.data.id;                                                                             // stgore the ID
				}
				this.self.transcribeProperties(resp.data, responseObject);
				this.self.lastFile = resp.data;
			});
			return responseObject;
		}


		/**
		 * Implements Update, both for metadata only and for multipart media content upload
		 * TODO NB resumable uploads not yet supported
		 *
		 * See https://developers.google.com/drive/v2/reference/files/update for semantics including the params object
		 *
		 * @param file  Files resource
		 * @param params see Google docs
		 * @param content
		 * @returns IDriveResponseObject
		 */
		filesUpdate(file:IDriveFile, params?:IDriveFileUpdateParameters, content?:string):IDriveResponseObject<IDriveFile,IDriveFile> {
			// validate there is an id somewhere, either in the passed file, or in params.fileId
			var id;
			if (params && params.fileId) {                                                                              // if in params.fileID
				id = params.fileId;
			} else {                                                                                                    // else
				if (file.id) {                                                                                          // if in file object
					id = file.id;
				} else {                                                                                                // if no ID
					var s = "[D193] Missing fileId";
					return this.self.reject(s);
				}
			}
			var configObject:mng.IRequestConfig;
			if (!params || !params.uploadType) {
				configObject = {method: 'PUT', url: this.self.filesUrl.replace(':id', id), data: file};      // no params is a simple metadata insert
			} else {
				try {
					configObject = this.self.buildUploadConfigObject(file, params, content, false);                     // build a config object from params
					configObject.method = 'PUT';
					configObject.url = this.self.filesUploadUrl + '/' + params.fileId;                                      // nb non-standard URL
				} catch (ex) {                                                                                          // any validation errors throw an exception
					return this.self.reject(ex);
				}
			}

			var promise = this.self.HttpService.doHttp(configObject);
			var responseObject:IDriveResponseObject<IDriveFile,IDriveFile> = {
				promise: promise,
				data: {},
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers
				this.self.transcribeProperties(resp.data, responseObject);
				this.self.lastFile = resp.data;
			});
			return responseObject;
		}


		/**
		 * Implements drive.patch
		 *
		 * @param params containg a fileID and a files resource
		 * @returns IDriveResponseObject
		 */
		filesPatch(params:{fileId:string; resource:IDriveFile}):IDriveResponseObject<IDriveFile,IDriveFile> {
			if (!params || !params.fileId) {
				var s = "[D230] Missing fileId";
				return this.self.reject(s);
			}

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'PATCH',
				url: this.self.filesUrl.replace(':id', params.fileId),
				data: params.resource
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IDriveFile,IDriveFile> = {
				promise: promise,
				data: {},
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp.data, responseObject);                                                   // if file, transcribe properties
				this.self.lastFile = resp.data;
			});
			return responseObject;
		}

		/**
		 * Implements drive.trash
		 *
		 * @param params fileId
		 * @returns IDriveResponseObject
		 */
		filesTrash(params:{fileId:string}) {
			if (!params || !params.fileId) {
				var s = "[D225] Missing fileId";
				return this.self.reject(s);
			}

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'POST',
				url: this.self.filesUrl.replace(':id', params.fileId) + this.self.urlTrashSuffix
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IDriveFile,IDriveFile> = {
				promise: promise,
				data: {},
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IDriveFile>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp.data, responseObject);                                                   // if file, transcribe properties
				this.self.lastFile = resp.data;
			});
			return responseObject;
		}

		/**
		 * Implements drive.Untrash
		 *
		 * @param params fileId
		 * @returns IDriveResponseObject
		 */
		filesUntrash(params:{fileId:string}) {
			if (!params || !params.fileId) {
				var s = "[D251] Missing fileId";
				return this.self.reject(s);
			}

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'POST',
				url: this.self.filesUrl.replace(':id', params.fileId) + this.self.urlUntrashSuffix
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IDriveFile,IDriveFile> = {
				promise: promise,
				data: {},
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp.data, responseObject);                                                   // if file, transcribe properties
				this.self.lastFile = resp.data;
			});
			return responseObject;
		}

		/**
		 * Implements drive.delete
		 *
		 * @param params fileID
		 * @returns IDriveResponseObject
		 */
		filesDelete(params:{fileId:string}) {
			if (!params || !params.fileId) {
				var s = "[D222] Missing fileId";
				return this.self.reject(s);
			}

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'delete',
				url: this.self.filesUrl.replace(':id', params.fileId)
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IDriveFile,IDriveFile> = {
				promise: promise,
				data: {},
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers
			});
			return responseObject;
		}


		/**
		 * Implements drive.Watch
		 * NB This is not available as CORS endpoint for browser clients
		 *
		 * @param params mandatory fileID optional alt and revisionId
		 * @param resource
		 * @returns IDriveResponseObject
		 */
		filesWatch(params:{fileId:string}, resource:IWatchBody) {
			this.self.$log.warn('[D334] NB files.watch is not available as a CORS endpoint for browser clients.');
			if (!params || !params.fileId) {
				var s = "[D302] Missing id";
				return this.self.reject(s);
			}

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'POST',
				url: this.self.filesUrl.replace(':id', params.fileId) + this.self.urlWatchSuffix,
				params: params,
				data: resource
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IApiChannel,IApiChannel> = {
				promise: promise,
				data: undefined,
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IApiChannel>)=> {                                            // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp.data, responseObject);                                                   // if file, transcribe properties
				this.self.lastFile = resp.data;
			});
			return responseObject;
		}

		/**
		 * Implements drive.Touch
		 *
		 * @param params
		 * @returns IDriveResponseObject
		 */
		filesTouch(params:{fileId:string}) {
			if (!params || !params.fileId) {
				var s = "[D329] Missing fileId";
				return this.self.reject(s);
			}

			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'POST',
				url: this.self.filesUrl.replace(':id', params.fileId) + this.self.urlTouchSuffix
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IDriveFile,IDriveFile> = {
				promise: promise,
				data: {},
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<IDriveFile|string>)=> {                               // on complete
				responseObject.headers = resp.headers;                                                                  // transcribe headers function
				this.self.transcribeProperties(resp.data, responseObject);                                                   // if file, transcribe properties
				this.self.lastFile = resp.data;
			});
			return responseObject;
		}


		/**
		 * Implements drive.emptyTrash
		 *
		 * @returns IDriveResponseObject
		 */
		filesEmptyTrash() {
			var co:mng.IRequestConfig = {                                                                               // build request config
				method: 'DELETE',
				url: this.self.filesUrl.replace(':id', 'trash')
			};
			var promise = this.self.HttpService.doHttp(co);                                                             // call HttpService
			var responseObject:IDriveResponseObject<IDriveFile,IDriveFile> = {
				promise: promise,
				data: {},
				headers: undefined
			};
			promise.then((resp:mng.IHttpPromiseCallbackArg<any>)=> {                               // on complete
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
		reject(reason:any):IDriveResponseObject<any,any> {
			this.self.$log.error('NgGapi: ' + reason);
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
		 * @param content
		 * @param isInsert true for insert, false/undefined for Update
		 * @returns {undefined}
		 *
		 * @throws D115 resumables not supported
		 * @throws D125 safety check there is a mime type
		 */
		buildUploadConfigObject(file:IDriveFile, params:IDriveFileInsertParameters|IDriveFileUpdateParameters, content:string, isInsert:boolean):mng.IRequestConfig {
			// check for a resumable upload and reject coz we don't support them yet
			if (params.uploadType == 'resumable') {
				throw "[D136] resumable uploads are not currently supported";
			}

			//// check the media is base64 encoded
			//if (base64EncodedContent.match(/^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/) == null) {
			//	throw ("[D142] content does not appear to be base64 encoded.");
			//}

			// check the dev provided a mime type for media or multipart
			if ((params.uploadType == 'multipart' || params.uploadType == 'media')
				&& (isInsert && (!file || !file.mimeType))) {
				throw ("[D148] file metadata is missing mandatory mime type");
			}


			//			var base64Data = window['tools'].base64Encode(fileContent);
			var body:string;
			if (params.uploadType == 'multipart') {
				var boundary = '-------3141592ff65358979323846';
				var delimiter = "\r\n--" + boundary + "\r\n";
				var mimeHeader = '';
				if (isInsert) {                                                                                         // only set a mime header for inserts
					mimeHeader = 'Content-Type: ' + file.mimeType + '\r\n';                                             // updates uses existing file
				}
				var close_delim = "\r\n--" + boundary + "--";
				body =
					delimiter +
					'Content-Type: application/json\r\n\r\n' +
					JSON.stringify(file) +
					delimiter +
					mimeHeader +
					'\r\n' +
					content +
					close_delim;
				//params['alt'] = 'json';
				var headers = {};
				headers['Content-Type'] = 'multipart/mixed; boundary="-------3141592ff65358979323846"'
			}

			if (params.uploadType == 'media') {
				body = content;
				var headers = {};
				if (isInsert) {
					headers['Content-Type'] = file.mimeType;
				}
				//headers['Content-Transfer-Encoding'] = 'BASE64';
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


// see https://developers.google.com/drive/web/scopes
// these are provided only a a convenience to the developer. They are not used by the library
//NgGapi.DRIVE_SCOPES = {
//	drive: "https://www.googleapis.com/auth/drive",
//	drive_file: "https://www.googleapis.com/auth/drive.file",
//	apps_readonly: "https://www.googleapis.com/auth/drive.apps.readonly",
//	readonly: "https://www.googleapis.com/auth/drive.readonly",
//	readonly_metadata: "https://www.googleapis.com/auth/drive.readonly.metadata",
//	install: "https://www.googleapis.com/auth/drive.install",
//	appfolder: "https://www.googleapis.com/auth/drive.appfolder",
//	scripts: "https://www.googleapis.com/auth/drive.scripts"
//};

declare
var angular:mng.IAngularStatic;
angular.module('ngm.NgGapi')
	.service('DriveService', NgGapi.DriveService);
