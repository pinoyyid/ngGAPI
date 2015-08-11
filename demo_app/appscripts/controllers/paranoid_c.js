/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../../../nggapi_ts_declaration_files/drive_interfaces.d.ts"/>
/*

 this is a clone of MaximalCtrl that is specifically used to test paranoid mode.
 It inserts 100 files, then counts how many have actually been inserted, and then deletes them all

 */
var MaximalCtrl = (function () {
    function MaximalCtrl($scope, $log, $q, DriveService) {
        this.$scope = $scope;
        this.$log = $log;
        this.$q = $q;
        this.DriveService = DriveService;
        this.sig = 'MaximalCtrl';
        // an array of steps to display
        this.steps = [];
        $scope.vm = this;
        this.doEverything();
    }
    /**
     * perform all steps using promise chaining to run them in sequence
     */
    MaximalCtrl.prototype.doEverything = function () {
        var _this = this;
        var start = new Date().valueOf();
        this.getCountandDelete_xxxparanoid()
            .then(function () { return _this.createFolder('paranoid'); })
            .then(function (resp) { console.log(resp.id); return _this.insertFiles('xxxparanoid', 100, resp.id); }, function (reason) { console.error('incomplete insert, reason = ' + reason); })
            .then(function () { return _this.getCountandDelete_xxxparanoid(); }, function (reason) { console.error('incomplete insert, reason = ' + reason); })
            .then(function () { console.log('All done ' + (new Date().valueOf() - start) / 1000); });
    };
    MaximalCtrl.prototype.getCountandDelete_xxxparanoid = function () {
        var _this = this;
        var currentStep = { op: 'listing paranoids', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro;
        ro = this.DriveService.files.list({ maxResults: 500,
            q: "title contains 'xxxparanoid'", fields: 'items/id, items/parents/id' });
        ro.promise.then(function () {
            _this.$log.info('xxxparanoid count = ' + ro.data.length);
            currentStep.status = 'done';
            currentStep.data = ro.data.length;
            if (ro.data.length > 0) {
                var parentFid = ro.data[0].parents[0].id; // delete the parent folder
                console.log('deleting folder ' + parentFid);
                _this.DriveService.files.del({ fileId: parentFid });
            }
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.createFolder = function (title) {
        var currentStep = { op: 'Creating folder ' + title, status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.insert({ title: title, mimeType: 'application/vnd.google-apps.folder' });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.id;
        });
        return ro.promise;
    };
    /*
     Each function follows the same pattern. I've commented the getFile. The rest are structured the same way.

     The goal of each function is to update the UI with what it is about to do, then do it, then update the UI with part
     of the response, finally returning the promise so the function calls can be chained together.
     */
    /**
     * Get a file's metadata for a given id
     *
     * @param id  The file ID
     * @returns {mng.IPromise<{data: IDriveFile}>} The promise for chaining
     */
    MaximalCtrl.prototype.getFile = function (id) {
        // create a step object containing what we're about to do
        var currentStep = { op: 'Getting a file', status: '...', data: undefined };
        // push that step object onto the list which is displayed via an ng-repeat
        this.steps.push(currentStep);
        // do the get, storing its ResponseObject in ro
        var ro = this.DriveService.files.get({ fileId: id });
        // create a then function on ro which will execute on completion
        ro.promise.then(function (resp) {
            // update the display with the status and response data
            currentStep.status = 'done';
            currentStep.data = resp.title;
        });
        // return the promise for chaining
        return ro.promise;
    };
    /**
     * create count files with a title of 'title-n' and contents 'content for title-n'.
     * Much of the code in this function is to deal with the feature of inserting n files
     * and only returning when all n have been succesful. It does this by creating a new
     * deferred.promise to wrap the file.insert promise from each file.
     *
     * @param title stub of the title
     * @param count how many files
     * @param folderId optoinal parent folder
     * @returns {mng.IPromise<{data: IDriveFile}>}
     */
    MaximalCtrl.prototype.insertFiles = function (title, count, folderId) {
        var _this = this;
        var contentBase = 'content for ';
        var doneCount = 0;
        var currentStep = { op: 'Inserting files in ' + folderId, status: '' + doneCount, data: undefined };
        this.steps.push(currentStep);
        var def = this.$q.defer();
        for (var i = 0; i < count; i++) {
            this.DriveService.files.insert({
                title: title + '-' + i,
                mimeType: 'text/plain',
                parents: [{ id: folderId }]
            }, { uploadType: 'multipart' }, btoa(contentBase + title + '-' + i)).promise.then(function (resp) {
                currentStep.status = '' + ++doneCount;
                currentStep.data = resp.id + ' , content length = ' + resp.fileSize;
                _this.currentFile = resp;
                if (doneCount == count) {
                    currentStep.status = 'done';
                    def.resolve();
                }
                // check count then resolve
            }, function (reason) {
                def.reject(reason);
            });
        }
        return def.promise;
    };
    MaximalCtrl.prototype.getFileContents = function (id) {
        var currentStep = { op: 'Getting a file\'s contents', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.get({ fileId: id, alt: 'media' });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.patchFileTitle = function (id, newTitle) {
        var currentStep = { op: 'Using Patch to update a file\'s title', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.patch({
            fileId: id,
            resource: { title: newTitle }
        });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.title;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.updateFileTitle = function (id, newTitle) {
        var currentStep = { op: 'Using Update to update a file\'s title', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.update({ title: newTitle }, { fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.title;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.updateFileContent = function (id, newContent) {
        var currentStep = { op: 'Using Update to update a file\'s content', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.update(undefined, {
            fileId: id,
            uploadType: 'media'
        }, btoa(newContent));
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = 'content length = ' + resp.fileSize;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.touchFile = function (id) {
        var currentStep = { op: 'Using Touch to update a file\'s last modified date', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.touch({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.modifiedDate;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.trashFile = function (id) {
        var currentStep = { op: 'Trash a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.trash({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = 'trashed=' + resp.labels.trashed;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.untrashFile = function (id) {
        var currentStep = { op: 'Untrash a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.untrash({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = 'trashed=' + resp.labels.trashed;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.deleteFile = function (id) {
        var currentStep = { op: 'Delete a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.del({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.emptyTrash = function () {
        var currentStep = { op: 'Empty trash', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.emptyTrash();
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp;
        }, function (resp) {
            currentStep.status = 'failed';
            currentStep.data = resp;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.watchFile = function (id) {
        var currentStep = { op: 'Using Watch to get a file\'s update channel', status: '...', data: undefined };
        this.steps.push(currentStep);
        var watchBody = {
            id: 'aUUID',
            type: 'web_hook',
            address: 'dev.clevernote.co:8888'
        };
        var ro = this.DriveService.files.watch({
            fileId: id,
            alt: 'media'
        }, watchBody);
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.kind + " " + resp['resourceUri'];
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.displayTitle = function (expect, title) {
        this.$log.info("chained title (" + expect + ")= " + title);
    };
    MaximalCtrl.$inject = ['$scope', '$log', '$q', 'DriveService'];
    return MaximalCtrl;
})();
//angular.module('MyApp')
//  .controller('MainCtrl', function ($scope) {
//    $scope.sig = 'MainCtrl';
//  });
angular.module('MyApp')
    .controller('MaximalCtrl', MaximalCtrl);
//# sourceMappingURL=paranoid_c.js.map