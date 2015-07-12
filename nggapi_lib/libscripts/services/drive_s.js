/// <reference path="../../../nggapi_interfaces/drive_interfaces.d.ts"/>
'use strict';
var NgGapi;
(function (NgGapi) {
    /**
     * The Drive service.
     */
    var DriveService = (function () {
        function DriveService($log, $timeout, $q, HttpService) {
            this.$log = $log;
            this.$timeout = $timeout;
            this.$q = $q;
            this.HttpService = HttpService;
            this.sig = 'DriveService'; // used in unit testing to confirm DI
            // this files object (and the self assignment) allows calls of the nature DriveService.files.insert for compatibility with gapi structure
            this.files = {
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
            this.about = {
                self: this,
                get: this.aboutGet
            };
            this.changes = {
                self: this,
                get: this.changesGet,
                list: this.changesList,
                watch: this.changesWatch
            };
            this.children = {
                self: this,
                get: this.childrenGet,
                del: this.childrenDelete,
                insert: this.childrenInsert,
                list: this.childrenList
            };
            this.parents = {
                self: this,
                get: this.parentsGet,
                del: this.parentsDelete,
                insert: this.parentsInsert,
                list: this.parentsList
            };
            this.permissions = {
                self: this,
                get: this.permissionsGet,
                del: this.permissionsDelete,
                insert: this.permissionsInsert,
                update: this.permissionsUpdate,
                patch: this.permissionsPatch,
                list: this.permissionsList,
                getIdForEmail: this.permissionsGetIdForEmail
            };
            this.revisions = {
                self: this,
                get: this.revisionsGet,
                del: this.revisionsDelete,
                update: this.revisionsUpdate,
                patch: this.revisionsPatch,
                list: this.revisionsList
            };
            this.self = this; // this is recursive and is only required if we expose the files.get form (as opposed to filesGet)
            this.RESOURCE_TOKEN = 'reSource';
            this.urlBase = 'https://www.googleapis.com/drive/v2/' + this.RESOURCE_TOKEN + '/:id';
            this.filesUrl = this.urlBase.replace(this.RESOURCE_TOKEN, 'files');
            this.filesUploadUrl = 'https://www.googleapis.com/upload/drive/v2/files';
            this.changesUrl = this.urlBase.replace(this.RESOURCE_TOKEN, 'changes');
            this.aboutUrl = this.urlBase.replace(this.RESOURCE_TOKEN, 'about');
            this.childrenUrl = this.urlBase.replace(this.RESOURCE_TOKEN, 'files/:fid/children');
            this.parentsUrl = this.urlBase.replace(this.RESOURCE_TOKEN, 'files/:cid/parents');
            this.permissionsUrl = this.urlBase.replace(this.RESOURCE_TOKEN, 'files/:fid/permissions');
            this.permissionIdsUrl = this.urlBase.replace(this.RESOURCE_TOKEN, 'permissionIds');
            this.revisionsUrl = this.urlBase.replace(this.RESOURCE_TOKEN, 'files/:fid/revisions');
            this.urlTrashSuffix = '/trash';
            this.urlUntrashSuffix = '/untrash';
            this.urlWatchSuffix = '/watch';
            this.urlTouchSuffix = '/touch';
            this.lastFile = { id: 'noid' }; // for testing, holds the most recent file response
        }
        /**
         * getter for underlying HttpService, often used to in turn get OauthService or the $http service
         *
         * @returns {IHttpService}
         */
        DriveService.prototype.getHttpService = function () {
            return this.HttpService;
        };
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
        DriveService.prototype.aboutGet = function (params) {
            var _this = this;
            var co = {
                method: 'GET',
                url: this.self.aboutUrl.replace(':id', ''),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp.data, responseObject); // if file, transcribe properties
            });
            return responseObject;
        };
        /**
         * Implements Get for the changes resource
         * See https://developers.google.com/drive/v2/reference/changes/get
         *
         * @param params object containing a changeId
         * @returns {IDriveResponseObject}
         */
        DriveService.prototype.changesGet = function (params) {
            var _this = this;
            var co = {
                method: 'GET',
                url: this.self.changesUrl.replace(':id', '' + params.changeId)
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp.data, responseObject); // if file, transcribe properties
            });
            return responseObject;
        };
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
        DriveService.prototype.changesList = function (params) {
            if (params && params.fields && params.fields.indexOf('nextPageToken') == -1) {
                this.self.$log.warn('[D145] You have tried to list changes with specific fields, but forgotten to include "nextPageToken" which will crop your results to just one page.');
            }
            var co = {
                method: 'GET',
                url: this.self.changesUrl.replace(':id', ''),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: [],
                headers: undefined
            };
            promise.then(function (resp) {
                if (!!resp.data && !!resp.data.items) {
                    var l = resp.data.items.length;
                    for (var i = 0; i < l; i++) {
                        responseObject.data.push(resp.data.items[i]); // push each new file
                    }
                }
            }, undefined, function (resp) {
                var l = resp.data.items.length;
                for (var i = 0; i < l; i++) {
                    responseObject.data.push(resp.data.items[i]); // push each new file
                }
            });
            return responseObject;
        };
        /**
         * Implements drive.Watch
         * NB This is not available as CORS endpoint for browser clients
         *
         * @param resource
         * @returns IDriveResponseObject
         */
        DriveService.prototype.changesWatch = function (resource) {
            var _this = this;
            this.self.$log.warn('[D137] NB files.watch is not available as a CORS endpoint for browser clients.');
            var co = {
                method: 'POST',
                url: this.self.changesUrl.replace(':id', '') + this.self.urlWatchSuffix,
                data: resource
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: undefined,
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp.data, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements Get both for getting a file object and the newer alt=media to get a file's media content
         * See https://developers.google.com/drive/v2/reference/files/get for semantics including the params object
         *
         * @param params
         * @returns {IDriveResponseObject}
         */
        DriveService.prototype.filesGet = function (params) {
            var _this = this;
            var co = {
                method: 'GET',
                url: this.self.filesUrl.replace(':id', params.fileId),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                if (params.alt == 'media') {
                    responseObject.data['media'] = resp.data; // if media, assign to media property
                }
                else {
                    _this.self.transcribeProperties(resp.data, responseObject); // if file, transcribe properties
                    _this.self.lastFile = resp.data;
                }
            });
            return responseObject;
        };
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
        DriveService.prototype.filesList = function (params, excludeTrashed) {
            if (params && params.fields && params.fields.indexOf('nextPageToken') == -1) {
                this.self.$log.warn('[D82] You have tried to list files with specific fields, but forgotten to include "nextPageToken" which will crop your results to just one page.');
            }
            if (excludeTrashed) {
                var trashed = 'trashed = false';
                params.q = params.q ? params.q + ' and ' + trashed : trashed; // set or append to q
            }
            var co = {
                method: 'GET',
                url: this.self.filesUrl.replace(':id', ''),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: [],
                headers: undefined
            };
            promise.then(function (resp) {
                if (!!resp.data && !!resp.data.items) {
                    var l = resp.data.items.length;
                    for (var i = 0; i < l; i++) {
                        responseObject.data.push(resp.data.items[i]); // push each new file
                    }
                }
            }, undefined, function (resp) {
                var l = resp.data.items.length;
                for (var i = 0; i < l; i++) {
                    responseObject.data.push(resp.data.items[i]); // push each new file
                }
            });
            return responseObject;
        };
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
         * @param contentHeaders sets the content headers for the content part of the multipart body. A typical use would be
         * to set the Content-Transfer-Encoding to base64 thus {'Content-Transfer-Encoding ', 'base64'}. Because content-transfer-encoding
         * is the most common case, a simple string value will be interpreted as content-transfer-encoding, thus either 'base64' or {'Content-Transfer-Encoding ', 'base64'}
         * have the same effect.
         * @param storeId stores the ID from the Google Drive response in the original file object. NB DEFAULTS TO TRUE
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesInsertWithContent = function (file, params, content, contentHeaders, storeId) {
            var _this = this;
            var configObject;
            if (!params || !params.uploadType) {
                var s = "[D314] Missing params (which must contain uploadType)";
                return this.self.reject(s);
            }
            if (!content) {
                var s = "[D318] Missing content";
                return this.self.reject(s);
            }
            try {
                configObject = this.self.buildUploadConfigObject(file, params, content, contentHeaders, true); // build a config object from params
                configObject.method = 'POST';
                configObject.url = this.self.filesUploadUrl; // nb non-standard URL
            }
            catch (ex) {
                return this.self.reject(ex);
            }
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
                if (storeId == undefined || storeId == true) {
                    file.id = resp.data.id; // stgore the ID
                }
                _this.self.transcribeProperties(resp.data, responseObject);
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
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
         * @param storeId stores the ID from the Google Drive response in the original file object. NB DEFAULTS TO TRUE
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesInsert = function (file, storeId) {
            var _this = this;
            var configObject = {
                method: 'POST',
                url: this.self.filesUrl.replace(':id', ''),
                data: file
            };
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
                if (storeId == undefined || storeId == true) {
                    file.id = resp.data.id; // stgore the ID
                }
                _this.self.transcribeProperties(resp.data, responseObject);
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements Update, both for metadata only and for multipart media content upload
         * TODO NB resumable uploads not yet supported
         *
         * See https://developers.google.com/drive/v2/reference/files/update for semantics including the params object
         *
         * @param file  Files resource
         * @param params see Google docs
         * @param content
         * @param contentHeaders see insertWithContent for a decription
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesUpdate = function (file, params, content, contentHeaders) {
            var _this = this;
            // validate there is an id somewhere, either in the passed file, or in params.fileId
            var id;
            if (params && params.fileId) {
                id = params.fileId;
            }
            else {
                if (file.id) {
                    id = file.id;
                }
                else {
                    var s = "[D193] Missing fileId";
                    return this.self.reject(s);
                }
            }
            var configObject;
            if (!params || !params.uploadType) {
                configObject = { method: 'PUT', url: this.self.filesUrl.replace(':id', id), data: file }; // no params is a simple metadata insert
            }
            else {
                try {
                    configObject = this.self.buildUploadConfigObject(file, params, content, contentHeaders, false); // build a config object from params
                    configObject.method = 'PUT';
                    configObject.url = this.self.filesUploadUrl + '/' + params.fileId; // nb non-standard URL
                }
                catch (ex) {
                    return this.self.reject(ex);
                }
            }
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
                _this.self.transcribeProperties(resp.data, responseObject);
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements drive.patch
         *
         * @param params containg a fileID and a files resource
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesPatch = function (params) {
            var _this = this;
            if (!params || !params.fileId) {
                var s = "[D230] Missing fileId";
                return this.self.reject(s);
            }
            var co = {
                method: 'PATCH',
                url: this.self.filesUrl.replace(':id', params.fileId),
                data: params.resource
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp.data, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements drive.trash
         *
         * @param params fileId
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesTrash = function (params) {
            var _this = this;
            if (!params || !params.fileId) {
                var s = "[D225] Missing fileId";
                return this.self.reject(s);
            }
            var co = {
                method: 'POST',
                url: this.self.filesUrl.replace(':id', params.fileId) + this.self.urlTrashSuffix
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp.data, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements drive.Untrash
         *
         * @param params fileId
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesUntrash = function (params) {
            var _this = this;
            if (!params || !params.fileId) {
                var s = "[D251] Missing fileId";
                return this.self.reject(s);
            }
            var co = {
                method: 'POST',
                url: this.self.filesUrl.replace(':id', params.fileId) + this.self.urlUntrashSuffix
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp.data, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements drive.delete
         *
         * @param params fileID
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesDelete = function (params) {
            if (!params || !params.fileId) {
                var s = "[D222] Missing fileId";
                return this.self.reject(s);
            }
            var co = {
                method: 'delete',
                url: this.self.filesUrl.replace(':id', params.fileId)
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
            });
            return responseObject;
        };
        /**
         * Implements drive.Watch
         * NB This is not available as CORS endpoint for browser clients
         *
         * @param params mandatory fileID optional alt and revisionId
         * @param resource
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesWatch = function (params, resource) {
            var _this = this;
            this.self.$log.warn('[D334] NB files.watch is not available as a CORS endpoint for browser clients.');
            if (!params || !params.fileId) {
                var s = "[D302] Missing id";
                return this.self.reject(s);
            }
            var co = {
                method: 'POST',
                url: this.self.filesUrl.replace(':id', params.fileId) + this.self.urlWatchSuffix,
                params: params,
                data: resource
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: undefined,
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp.data, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements drive.Touch
         *
         * @param params
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesTouch = function (params) {
            var _this = this;
            if (!params || !params.fileId) {
                var s = "[D329] Missing fileId";
                return this.self.reject(s);
            }
            var co = {
                method: 'POST',
                url: this.self.filesUrl.replace(':id', params.fileId) + this.self.urlTouchSuffix
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp.data, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements drive.emptyTrash
         *
         * @returns IDriveResponseObject
         */
        DriveService.prototype.filesEmptyTrash = function () {
            var co = {
                method: 'DELETE',
                url: this.self.filesUrl.replace(':id', 'trash')
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
            });
            return responseObject;
        };
        /*
                      C H I L D R E N
         */
        /**
         * Implements Get for getting a children object
         * See https://developers.google.com/drive/v2/reference/children/get for semantics including the params object
         *
         * @param params
         * @returns {IDriveResponseObject}
         */
        DriveService.prototype.childrenGet = function (params) {
            var _this = this;
            if (!params || !params.folderId) {
                var s = "[D679] Missing params.folderId";
                return this.self.reject(s);
            }
            if (!params.childId) {
                var s = "[D683] Missing childId";
                return this.self.reject(s);
            }
            var co = {
                method: 'GET',
                url: this.self.childrenUrl.replace(':fid', params.folderId).replace(":id", params.childId),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp.data, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements children.List
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
        DriveService.prototype.childrenList = function (params, excludeTrashed) {
            if (params && params.fields && params.fields.indexOf('nextPageToken') == -1) {
                this.self.$log.warn('[D712] You have tried to list children with specific fields, but forgotten to include "nextPageToken" which will crop your results to just one page.');
            }
            if (excludeTrashed) {
                var trashed = 'trashed = false';
                params.q = params.q ? params.q + ' and ' + trashed : trashed; // set or append to q
            }
            var co = {
                method: 'GET',
                url: this.self.childrenUrl.replace(':fid', params.folderId).replace(":id", ""),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: [],
                headers: undefined
            };
            promise.then(function (resp) {
                if (!!resp.data && !!resp.data.items) {
                    var l = resp.data.items.length;
                    for (var i = 0; i < l; i++) {
                        responseObject.data.push(resp.data.items[i]); // push each new file
                    }
                }
            }, undefined, function (resp) {
                var l = resp.data.items.length;
                for (var i = 0; i < l; i++) {
                    responseObject.data.push(resp.data.items[i]); // push each new file
                }
            });
            return responseObject;
        };
        /**
         * Implements Insert for children, ie. adding a file to a folder
         *
         * See https://developers.google.com/drive/v2/reference/children/insert for semantics including the params object
         *
         * Optionally (default true) it will store the ID returned in the Drive response in the file object that was passed to it.
         * This is done since it is almost always what an app needs to do, and by doing it in this method, saves the developer from
         * writing any promise.then logic
         *
         * @param params contains the folderId
         * @param child  Child resource with at least an ID
         * @returns IDriveResponseObject
         */
        DriveService.prototype.childrenInsert = function (params, child) {
            var _this = this;
            if (!params || !params.folderId) {
                var s = "[D763] Missing params.folderId";
                return this.self.reject(s);
            }
            if (!child || !child.id) {
                var s = "[D767] Missing childId";
                return this.self.reject(s);
            }
            var configObject = {
                method: 'POST',
                url: this.self.childrenUrl.replace(':fid', params.folderId).replace(":id", ""),
                data: child
            };
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
                _this.self.transcribeProperties(resp.data, responseObject);
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements children.delete
         *
         * @param params folderID
         * @returns IDriveResponseObject
         */
        DriveService.prototype.childrenDelete = function (params) {
            if (!params || !params.folderId) {
                var s = "[D799] Missing fileId";
                return this.self.reject(s);
            }
            if (!params || !params.childId) {
                var s = "[D803] Missing childId";
                return this.self.reject(s);
            }
            var co = {
                method: 'delete',
                url: this.self.childrenUrl.replace(':fid', params.folderId).replace(":id", params.childId)
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
            });
            return responseObject;
        };
        /*
            P A R E N T S
         */
        /**
         * Implements Get for getting a parents object
         * See https://developers.google.com/drive/v2/reference/parents/get for semantics including the params object
         *
         * @param params
         * @returns {IDriveResponseObject}
         */
        DriveService.prototype.parentsGet = function (params) {
            var _this = this;
            if (!params || !params.fileId) {
                var s = "[D874] Missing params.fileId";
                return this.self.reject(s);
            }
            if (!params.parentId) {
                var s = "[D878] Missing parentId";
                return this.self.reject(s);
            }
            var co = {
                method: 'GET',
                url: this.self.parentsUrl.replace(':cid', params.fileId).replace(":id", params.parentId),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp.data, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements parents.List
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
         * @param params see https://developers.google.com/drive/v2/reference/parents/list
         * @param excludeTrashed
         * @returns IDriveResponseObject
         */
        DriveService.prototype.parentsList = function (params, excludeTrashed) {
            if (params && params.fields && params.fields.indexOf('nextPageToken') == -1) {
                this.self.$log.warn('[D712] You have tried to list parents with specific fields, but forgotten to include "nextPageToken" which will crop your results to just one page.');
            }
            if (excludeTrashed) {
                var trashed = 'trashed = false';
                params.q = params.q ? params.q + ' and ' + trashed : trashed; // set or append to q
            }
            var co = {
                method: 'GET',
                url: this.self.parentsUrl.replace(':cid', params.fileId).replace(":id", ""),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: [],
                headers: undefined
            };
            promise.then(function (resp) {
                if (!!resp.data && !!resp.data.items) {
                    var l = resp.data.items.length;
                    for (var i = 0; i < l; i++) {
                        responseObject.data.push(resp.data.items[i]); // push each new file
                    }
                }
            }, undefined, function (resp) {
                var l = resp.data.items.length;
                for (var i = 0; i < l; i++) {
                    responseObject.data.push(resp.data.items[i]); // push each new file
                }
            });
            return responseObject;
        };
        /**
         * Implements Insert for parents, ie. adding a file to a folder
         *
         * See https://developers.google.com/drive/v2/reference/parents/insert for semantics including the params object
         *
         * Optionally (default true) it will store the ID returned in the Drive response in the file object that was passed to it.
         * This is done since it is almost always what an app needs to do, and by doing it in this method, saves the developer from
         * writing any promise.then logic
         *
         * @param params contains fileID
         * @param parent  Parent resource with at least an ID
         * @returns IDriveResponseObject
         */
        DriveService.prototype.parentsInsert = function (params, parent) {
            var _this = this;
            if (!params || !params.fileId) {
                var s = "[D971] Missing params.fileId";
                return this.self.reject(s);
            }
            if (!parent || !parent.id) {
                var s = "[D975] Missing parentId";
                return this.self.reject(s);
            }
            var configObject = {
                method: 'POST',
                url: this.self.parentsUrl.replace(':cid', params.fileId).replace(":id", ""),
                data: parent
            };
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
                _this.self.transcribeProperties(resp.data, responseObject);
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements parents.delete
         *
         * @param params folderID
         * @returns IDriveResponseObject
         */
        DriveService.prototype.parentsDelete = function (params) {
            if (!params || !params.fileId) {
                var s = "[D1007] Missing fileId";
                return this.self.reject(s);
            }
            if (!params || !params.parentId) {
                var s = "[D1010] Missing parentId";
                return this.self.reject(s);
            }
            var co = {
                method: 'delete',
                url: this.self.parentsUrl.replace(':cid', params.fileId).replace(":id", params.parentId)
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
            });
            return responseObject;
        };
        /*
         P E R M I S S I O N S
         */
        /**
         * Implements Get for getting a permissions object
         * See https://developers.google.com/drive/v2/reference/permissions/get for semantics including the params object
         *
         * @param params
         * @returns {IDriveResponseObject}
         */
        DriveService.prototype.permissionsGet = function (params) {
            var _this = this;
            if (!params || !params.fileId) {
                var s = "[D1045] Missing params.fileId";
                return this.self.reject(s);
            }
            if (!params.permissionId) {
                var s = "[D1049] Missing permissionId";
                return this.self.reject(s);
            }
            var co = {
                method: 'GET',
                url: this.self.permissionsUrl.replace(':fid', params.fileId).replace(":id", params.permissionId),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp.data, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements permissions.List
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
         * @param params see https://developers.google.com/drive/v2/reference/permissions/list
         * @returns IDriveResponseObject
         */
        DriveService.prototype.permissionsList = function (params) {
            if (params && params.fields && params.fields.indexOf('nextPageToken') == -1) {
                this.self.$log.warn('[D1091] You have tried to list permissions with specific fields, but forgotten to include "nextPageToken" which will crop your results to just one page.');
            }
            var co = {
                method: 'GET',
                url: this.self.permissionsUrl.replace(':fid', params.fileId).replace(":id", ""),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: [],
                headers: undefined
            };
            promise.then(function (resp) {
                if (!!resp.data && !!resp.data.items) {
                    var l = resp.data.items.length;
                    for (var i = 0; i < l; i++) {
                        responseObject.data.push(resp.data.items[i]); // push each new file
                    }
                }
            }, undefined, function (resp) {
                var l = resp.data.items.length;
                for (var i = 0; i < l; i++) {
                    responseObject.data.push(resp.data.items[i]); // push each new file
                }
            });
            return responseObject;
        };
        /**
         * Implements Insert for permissions, ie. adding a file to a folder
         *
         * See https://developers.google.com/drive/v2/reference/permissions/insert for semantics including the params object
         *
         * Optionally (default true) it will store the ID returned in the Drive response in the file object that was passed to it.
         * This is done since it is almost always what an app needs to do, and by doing it in this method, saves the developer from
         * writing any promise.then logic
         *
         * @param permission  Permission resource with at least an ID
         * @param params contains fileID
         * @returns IDriveResponseObject
         */
        DriveService.prototype.permissionsInsert = function (permission, params) {
            var _this = this;
            if (!params || !params.fileId) {
                var s = "[D1141] Missing params.fileId";
                return this.self.reject(s);
            }
            if (!permission || !permission.type || !permission.role) {
                var s = "[D1145] Missing role or type";
                return this.self.reject(s);
            }
            var configObject = {
                method: 'POST',
                url: this.self.permissionsUrl.replace(':fid', params.fileId).replace(":id", ""),
                data: permission
            };
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
                _this.self.transcribeProperties(resp.data, responseObject);
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements permissions.delete
         *
         * @param params fileID, permissionId
         * @returns IDriveResponseObject
         */
        DriveService.prototype.permissionsDelete = function (params) {
            if (!params || !params.fileId) {
                var s = "[D1177] Missing fileId";
                return this.self.reject(s);
            }
            if (!params || !params.permissionId) {
                var s = "[D1181] Missing permissionId";
                return this.self.reject(s);
            }
            var co = {
                method: 'delete',
                url: this.self.permissionsUrl.replace(':fid', params.fileId).replace(":id", params.permissionId)
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
            });
            return responseObject;
        };
        /**
         * Implements permissions Update
         *
         * See https://developers.google.com/drive/v2/reference/permissions/update for semantics including the params object
         *
         * @param permission Permission resource
         * @param params see Google docs
         * @returns IDriveResponseObject
         */
        DriveService.prototype.permissionsUpdate = function (permission, params) {
            var _this = this;
            // validate there is an id somewhere, either in the passed file, or in params.fileId
            var id;
            if (params && params.permissionId) {
                id = params.permissionId;
            }
            else {
                if (permission.id) {
                    id = permission.id;
                }
                else {
                    var s = "[D1214] Missing permissionId";
                    return this.self.reject(s);
                }
            }
            var configObject;
            configObject = { method: 'PUT', url: this.self.permissionsUrl.replace(':fid', params.fileId).replace(':id', id), data: permission };
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = {
                promise: promise,
                data: {},
                params: params,
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
                _this.self.transcribeProperties(resp.data, responseObject);
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements permissions Patch
         *
         * See https://developers.google.com/drive/v2/reference/permissions/patch for semantics including the params object
         *
         * @param permission Permission resource
         * @param params see Google docs
         * @returns IDriveResponseObject
         */
        DriveService.prototype.permissionsPatch = function (permission, params) {
            var _this = this;
            // validate there is an id somewhere, either in the passed file, or in params.fileId
            var id;
            if (params && params.permissionId) {
                id = params.permissionId;
            }
            else {
                if (permission.id) {
                    id = permission.id;
                }
                else {
                    var s = "[D1254] Missing permissionId";
                    return this.self.reject(s);
                }
            }
            var configObject;
            configObject = { method: 'PATCH', url: this.self.permissionsUrl.replace(':fid', params.fileId).replace(':id', id), data: permission };
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = {
                promise: promise,
                data: {},
                params: params,
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
                _this.self.transcribeProperties(resp.data, responseObject);
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
             * Implements permissions getIds for email
             *
             * See https://developers.google.com/drive/v2/reference/permissions/getIdForEmail for semantics including the params object
             *
             * @param email
             * @returns IDriveResponseObject
             */
        DriveService.prototype.permissionsGetIdForEmail = function (email) {
            var _this = this;
            // validate there is an id somewhere, either in the passed file, or in params.fileId
            var id;
            var configObject;
            configObject = { method: 'GET', url: this.self.permissionIdsUrl.replace(':id', email) };
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
                _this.self.transcribeProperties(resp.data, responseObject);
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /*
         R E V I S I O N S
         */
        /**
         * Implements Get for getting a revisions object
         * See https://developers.google.com/drive/v2/reference/revisions/get for semantics including the params object
         *
         * @param params
         * @returns {IDriveResponseObject}
         */
        DriveService.prototype.revisionsGet = function (params) {
            var _this = this;
            if (!params || !params.fileId) {
                var s = "[D1310] Missing params.fileId";
                return this.self.reject(s);
            }
            if (!params.revisionId) {
                var s = "[D1314] Missing revisionId";
                return this.self.reject(s);
            }
            var co = {
                method: 'GET',
                url: this.self.revisionsUrl.replace(':fid', params.fileId).replace(":id", params.revisionId),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers function
                _this.self.transcribeProperties(resp.data, responseObject); // if file, transcribe properties
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements revisions.List
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
         * @param params see https://developers.google.com/drive/v2/reference/revisions/list
         * @returns IDriveResponseObject
         */
        DriveService.prototype.revisionsList = function (params) {
            if (params && params.fields && params.fields.indexOf('nextPageToken') == -1) {
                this.self.$log.warn('[D1355] You have tried to list revisions with specific fields, but forgotten to include "nextPageToken" which will crop your results to just one page.');
            }
            var co = {
                method: 'GET',
                url: this.self.revisionsUrl.replace(':fid', params.fileId).replace(":id", ""),
                params: params
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: [],
                headers: undefined
            };
            promise.then(function (resp) {
                if (!!resp.data && !!resp.data.items) {
                    var l = resp.data.items.length;
                    for (var i = 0; i < l; i++) {
                        responseObject.data.push(resp.data.items[i]); // push each new file
                    }
                }
            }, undefined, function (resp) {
                var l = resp.data.items.length;
                for (var i = 0; i < l; i++) {
                    responseObject.data.push(resp.data.items[i]); // push each new file
                }
            });
            return responseObject;
        };
        /**
         * Implements revisions.delete
         *
         * @param params fileID, revisionId
         * @returns IDriveResponseObject
         */
        DriveService.prototype.revisionsDelete = function (params) {
            if (!params || !params.fileId) {
                var s = "[D1393] Missing fileId";
                return this.self.reject(s);
            }
            if (!params || !params.revisionId) {
                var s = "[D1397] Missing revisionId";
                return this.self.reject(s);
            }
            var co = {
                method: 'delete',
                url: this.self.revisionsUrl.replace(':fid', params.fileId).replace(":id", params.revisionId)
            };
            var promise = this.self.HttpService.doHttp(co); // call HttpService
            var responseObject = {
                promise: promise,
                data: {},
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
            });
            return responseObject;
        };
        /**
         * Implements revisions Update
         *
         * See https://developers.google.com/drive/v2/reference/revisions/update for semantics including the params object
         *
         * @param revision Revision resource
         * @param params see Google docs
         * @returns IDriveResponseObject
         */
        DriveService.prototype.revisionsUpdate = function (revision, params) {
            var _this = this;
            // validate there is an id somewhere, either in the passed file, or in params.fileId
            var id;
            if (params && params.revisionId) {
                id = params.revisionId;
            }
            else {
                if (revision.id) {
                    id = revision.id;
                }
                else {
                    var s = "[D1435] Missing revisionId";
                    return this.self.reject(s);
                }
            }
            var configObject;
            configObject = { method: 'PUT', url: this.self.revisionsUrl.replace(':fid', params.fileId).replace(':id', id), data: revision };
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = {
                promise: promise,
                data: {},
                params: params,
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
                _this.self.transcribeProperties(resp.data, responseObject);
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /**
         * Implements revisions Patch
         *
         * See https://developers.google.com/drive/v2/reference/revisions/patch for semantics including the params object
         *
         * @param revision Revision resource
         * @param params see Google docs
         * @returns IDriveResponseObject
         */
        DriveService.prototype.revisionsPatch = function (revision, params) {
            var _this = this;
            // validate there is an id somewhere, either in the passed file, or in params.fileId
            var id;
            if (params && params.revisionId) {
                id = params.revisionId;
            }
            else {
                if (revision.id) {
                    id = revision.id;
                }
                else {
                    var s = "[D1475] Missing revisionId";
                    return this.self.reject(s);
                }
            }
            var configObject;
            configObject = { method: 'PATCH', url: this.self.revisionsUrl.replace(':fid', params.fileId).replace(':id', id), data: revision };
            var promise = this.self.HttpService.doHttp(configObject);
            var responseObject = {
                promise: promise,
                data: {},
                params: params,
                headers: undefined
            };
            promise.then(function (resp) {
                responseObject.headers = resp.headers; // transcribe headers
                _this.self.transcribeProperties(resp.data, responseObject);
                _this.self.lastFile = resp.data;
            });
            return responseObject;
        };
        /*
              C O M M O N  F U N C T I O N S
         */
        /**
         * reject the current request by creating a response object with a promise and rejecting it
         * This is used to deal with validation errors prior to http submission
         *
         * @param reason
         * @returns {{data: undefined, promise: IPromise<T>, headers: undefined}}
         */
        DriveService.prototype.reject = function (reason) {
            this.self.$log.error('NgGapi: ' + reason);
            var def = this.self.$q.defer();
            def.reject(reason); // which is used to reject the promise
            return { data: undefined, promise: def.promise, headers: undefined };
        };
        /**
         * Used to build a $http config object for an upload. This will (normally) be a multipart mime body.
         *
         * NB resumable upload is not currently implemented!!!
         *
         * @param file
         * @param params
         * @param content
         * @param contentHeaders see insertWithContent for a description
         * @param isInsert true for insert, false/undefined for Update
         * @returns a $http config object
         *
         * @throws D115 resumables not supported
         * @throws D125 safety check there is a mime type
         */
        DriveService.prototype.buildUploadConfigObject = function (file, params, content, contentHeaders, isInsert) {
            // check for a resumable upload and reject coz we don't support them yet
            if (params.uploadType == 'resumable') {
                throw "[D136] resumable uploads are not currently supported";
            }
            //// check the media is base64 encoded
            //if (base64EncodedContent.match(/^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/) == null) {
            //	throw ("[D142] content does not appear to be base64 encoded.");
            //}
            // check the dev provided a mime type for media or multipart
            if ((params.uploadType == 'multipart' || params.uploadType == 'media') && (isInsert && (!file || !file.mimeType))) {
                throw ("[D148] file metadata is missing mandatory mime type");
            }
            // deal with optional content headers
            var otherHeaders = "";
            //console.warn(contentHeaders);
            if (contentHeaders) {
                if (typeof contentHeaders === 'string') {
                    otherHeaders += 'Content-Transfer-Encoding: ' + contentHeaders + '\r\n';
                }
                else {
                    for (var key in contentHeaders) {
                        otherHeaders += key + ': ' + contentHeaders[key] + '\r\n'; // set each header
                    }
                }
            }
            //console.warn(otherHeaders);
            //			var base64Data = window['tools'].base64Encode(fileContent);
            var body;
            if (params.uploadType == 'multipart') {
                var boundary = '-------3141592ff65358979323846';
                var delimiter = "\r\n--" + boundary + "\r\n";
                var mimeHeader = '';
                if (isInsert) {
                    mimeHeader = 'Content-Type: ' + file.mimeType + '\r\n'; // updates uses existing file
                }
                var close_delim = "\r\n--" + boundary + "--";
                body = delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(file) + delimiter + otherHeaders + mimeHeader + '\r\n' + content + close_delim;
                //params['alt'] = 'json';
                var headers = {};
                headers['Content-Type'] = 'multipart/mixed; boundary="-------3141592ff65358979323846"';
            }
            if (params.uploadType == 'media') {
                body = content;
                var headers = {};
                if (isInsert) {
                    headers['Content-Type'] = file.mimeType;
                }
            }
            // return the finished config object
            return { method: undefined, url: undefined, params: params, data: body, headers: headers };
        };
        /**
         * instantiate each property of src object into dest object
         * Used to transcribe properties from the returned JSON object to the responseObject so as not to break
         * any object assignments the the view model
         *
         * @param src
         * @param dest
         */
        DriveService.prototype.transcribeProperties = function (src, dest) {
            if (!dest.data) {
                dest.data = {};
            }
            if (typeof src == "object") {
                Object.keys(src).map(function (key) {
                    dest.data[key] = src[key];
                });
            }
            else {
                dest = src;
            }
        };
        DriveService.$inject = ['$log', '$timeout', '$q', 'HttpService'];
        return DriveService;
    })();
    NgGapi.DriveService = DriveService;
})(NgGapi || (NgGapi = {}));
angular.module('ngm.NgGapi').service('DriveService', NgGapi.DriveService);
//# sourceMappingURL=drive_s.js.map