/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../../../definitely_typed/gapi.d.ts"/>
/// <reference path="../objects/DriveFileInterfaces.ts"/>
/// <reference path="http_s.ts"/>


module NgGapi {
  /**
   * Interface definition for the DriveService. Mostly useful for a mock service
   */
  export interface IDriveService {
    files:{
      get(argsObject:{fileId:string}):IResponseObject;
      insert(file:IDriveFile):IResponseObject;
    }
  }

  export interface IResponseObject {
    promise:ng.IPromise<{data:IDriveFile}>;
    data:IDriveFile;
    headers:{}
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
    self = this;        // this is recursive and is only required if we expose the filesGet form (as opposed to files.get)
    constructor(private $log:ng.ILogService, private $timeout:ng.ITimeoutService, private $q:ng.IQService, private HttpService:IHttpService) {
    }

    filesGet(argsObject:{fileId:string}):IResponseObject {
      var co:ng.IRequestConfig = {method: 'GET', url: this.self.filesUrl.replace(':id', argsObject.fileId)};
      var promise = this.self.HttpService.doHttp(co);
      //var responseObject:{promise:ng.IPromise<{data:IDriveFile}>; data:IDriveFile; headers:{}} = {promise:promise, data:{}, headers:{}};
      var responseObject:IResponseObject = {promise: promise, data: {}, headers: {}};
      promise.then((data:IDriveFile)=> {
        this.self.transcribeProperties(data, responseObject);
        console.log('service then ' + responseObject.data.title);
      });
      return responseObject;
    }


    filesInsert(file:IDriveFile):IResponseObject {
      var co:ng.IRequestConfig = {method: 'POST', url: this.self.filesUrl.replace(':id',''), data: file};
      var promise = this.self.HttpService.doHttp(co);
      var responseObject:IResponseObject = {promise: promise, data: {}, headers: {}};
      promise.then((data:IDriveFile)=> {
        this.self.transcribeProperties(data, responseObject);
        console.log('service then ' + responseObject.data.title);
      });
      return responseObject;
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

