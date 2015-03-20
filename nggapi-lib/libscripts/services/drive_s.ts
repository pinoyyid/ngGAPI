/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../../../definitely_typed/gapi.d.ts"/>
/// <reference path="../objects/DriveFileInterfaces.ts"/>
/// <reference path="http_s.ts"/>

'use strict';

module NgGapi {


	// TODO interfaces to own file
	/**
	 * Interface definition for the DriveService. Mostly useful for a mock service
	 */
	export interface IDriveService {
		files:{
			get(argsObject:{fileId:string}):IDriveresponseObject;
			insert(file:IDriveFile, params?:IDriveInsertParameters, base64EncodedContent?:string):IDriveresponseObject;
      //list(params:IDriveListParameters):IDriveresponseObject;
		}
	}

	export interface IDriveresponseObject {
		promise:ng.IPromise<{data:IDriveFile}>;
		data:IDriveFile ;
    //data:IDriveFile | Array<IDriveFile>;
		headers:{}
	}

	export interface IDriveListParameters {
		corpus:string;	    //The body of items (files/documents) to which the query applies.  Acceptable values are: "DEFAULT": The items that the user has accessed. "DOMAIN": Items shared to the user's domain.
		maxResults:number;  //	Maximum number of files to return. Acceptable values are 0 to 1000, inclusive. (Default: 100)
		pageToken:string;	  //Page token for files.
		q:string;           // Query string for searching files. See https://developers.google.com/drive/search-parameters for more information about supported fields and operations.
	}

  export interface IDriveInsertParameters {
    uploadType:string;                  // The type of upload request to the /upload URI. Acceptable values are: media - Simple upload. Upload the media only, without any metadata. multipart - Multipart upload. Upload both the media and its metadata, in a single request. resumable - Resumable upload. Upload the file in a resumable fashion, using a series of at least two requests where the first request includes the metadata.
    convert?:boolean;                    // Whether to convert this file to the corresponding Google Docs format. (Default: false)
    ocr?:boolean;                        // Whether to attempt OCR on .jpg, .png, .gif, or .pdf uploads. (Default: false)
    ocrLanguage?:string;                 //  If ocr is true, hints at the language to use. Valid values are ISO 639-1 codes.
    pinned?:boolean;                     // Whether to pin the head revision of the uploaded file. A file can have a maximum of 200 pinned revisions. (Default: false)
    timedTextLanguage?:string;           // The language of the timed text.
    timedTextTrackName?:string;          // The timed text track name.
    useContentAsIndexableText?:boolean;  // Whether to use the content as indexable text. (Default: false)
    visibility?:string;                  // The visibility of the new file. This parameter is only relevant when convert=false.  Acceptable values are: "DEFAULT": The visibility of the new file is determined by the user's default visibility/sharing policies. (default) "PRIVATE": The new file will be visible to only the owner.
  }


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

		filesGet(argsObject:{fileId:string}):IDriveresponseObject {
			var co:ng.IRequestConfig = {method: 'GET', url: this.self.filesUrl.replace(':id', argsObject.fileId)};
			var promise = this.self.HttpService.doHttp(co);
			//var responseObject:{promise:ng.IPromise<{data:IDriveFile}>; data:IDriveFile; headers:{}} = {promise:promise, data:{}, headers:{}};
			var responseObject:IDriveresponseObject = {promise: promise, data: {}, headers: {}};
			promise.then((data:IDriveFile)=> {
				this.self.transcribeProperties(data, responseObject);
				console.log('service then ' + responseObject.data.title);
			});
			return responseObject;
		}


		filesInsert(file:IDriveFile, params?:IDriveInsertParameters, base64EncodedContent?:string):IDriveresponseObject {
      var configObject:ng.IRequestConfig;
      if (!params) {
        configObject = {method: 'POST', url: this.self.filesUrl.replace(':id',''), data: file};
      } else {
        try {
          configObject = this.self.buildUploadConfigObject(file, params, base64EncodedContent);
          configObject.method = 'POST';
          configObject.url = this.self.filesUploadUrl;
        } catch (ex) {
          var def = this.self.$q.defer();
          def.reject(ex);
          return {data:undefined, promise:def.promise, headers:undefined};
        }
      }


			var promise = this.self.HttpService.doHttp(configObject);
			var responseObject:IDriveresponseObject = {promise: promise, data: {}, headers: {}};
			promise.then((data:IDriveFile)=> {
				this.self.transcribeProperties(data, responseObject);
				console.log('service then ' + responseObject.data.title);
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
    buildUploadConfigObject (file:IDriveFile, params:IDriveInsertParameters, base64EncodedContent:string):ng.IRequestConfig {
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




      return {method:undefined, url:undefined, params: params, data:body, headers:headers}
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

