/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../../../nggapi_interfaces/drive_interfaces.d.ts"/>
var MaximalCtrl = (function () {
    function MaximalCtrl($scope, $log, $q, DriveService) {
        this.$scope = $scope;
        this.$log = $log;
        this.$q = $q;
        this.DriveService = DriveService;
        this.sig = 'MaximalCtrl';
        // an array of steps to display
        this.steps = [];
        this.largestChangeId = 0;
        $scope.vm = this;
        this.doEverything();
    }
    /**
     * perform all steps using promise chaining to run them in sequence
     */
    MaximalCtrl.prototype.doEverything = function () {
        var _this = this;
        this.getAbout().then(function () {
            return _this.insertFiles('delmezzz', 2);
        }).then(function () {
            return _this.getFile(_this.currentFile.id);
        }).then(function () {
            return _this.getFileContents(_this.currentFile.id);
        }).then(function () {
            return _this.patchFileTitle(_this.currentFile.id, _this.currentFile.title + " PATCHED");
        }).then(function () {
            return _this.updateFileTitle(_this.currentFile.id, _this.currentFile.title + " UPDATED");
        }).then(function () {
            return _this.updateFileContent(_this.currentFile.id, 'updated file content');
        }).then(function () {
            return _this.touchFile(_this.currentFile.id);
        }).then(function () {
            return _this.trashFile(_this.currentFile.id);
        }).then(function () {
            return _this.untrashFile(_this.currentFile.id);
        }).then(function () {
            return _this.deleteFile(_this.currentFile.id);
        }).then(function () {
            return _this.listChanges(_this.largestChangeId);
        }).then(function () {
            return _this.getChange(_this.largestChangeId);
        }).then(function () {
            return _this.emptyTrash();
        }).then(function () {
            console.log('All done');
        });
    };
    /*
     Each function follows the same pattern. I've commented the getFile. The rest are structured the same way.

     The goal of each function is to update the UI with what it is about to do, then do it, then update the UI with part
     of the response, finally returning the promise so the function calls can be chained together.
     */
    /**
     * Get the About object for this user
     *
     * @returns {mng.IPromise<{data: IDriveAbout}>} The promise for chaining
     */
    MaximalCtrl.prototype.getAbout = function () {
        var _this = this;
        // create a step object containing what we're about to do
        var currentStep = { op: 'Getting about', status: '...', data: undefined };
        // push that step object onto the list which is displayed via an ng-repeat
        this.steps.push(currentStep);
        // do the get, storing its ResponseObject in ro
        var ro = this.DriveService.about.get({ includeSubscribed: true });
        // create a then function on ro which will execute on completion
        ro.promise.then(function (resp) {
            // update the display with the status and response data
            currentStep.status = 'done';
            currentStep.data = resp.data.user + ' change id=' + resp.data.largestChangeId;
            _this.largestChangeId = resp.data.largestChangeId;
        });
        // return the promise for chaining
        return ro.promise;
    };
    /**
     * Get a change
     *
     * @returns {mng.IPromise<{data: IDriveAbout}>} The promise for chaining
     */
    MaximalCtrl.prototype.listChanges = function (id) {
        // create a step object containing what we're about to do
        var currentStep = { op: 'Listing changes ', status: '...', data: undefined };
        // push that step object onto the list which is displayed via an ng-repeat
        this.steps.push(currentStep);
        // do the get, storing its ResponseObject in ro
        var ro = this.DriveService.changes.list({ startChangeId: id, maxResults: 989 });
        // create a then function on ro which will execute on completion
        ro.promise.then(function (resp) {
            // update the display with the status and response data
            currentStep.status = 'done';
            currentStep.data = ' change count=' + resp.data.items.length;
        });
        // return the promise for chaining
        return ro.promise;
    };
    /**
     * Get a change
     *
     * @returns {mng.IPromise<{data: IDriveAbout}>} The promise for chaining
     */
    MaximalCtrl.prototype.getChange = function (id) {
        // create a step object containing what we're about to do
        var currentStep = { op: 'Getting change ' + id, status: '...', data: undefined };
        // push that step object onto the list which is displayed via an ng-repeat
        this.steps.push(currentStep);
        // do the get, storing its ResponseObject in ro
        var ro = this.DriveService.changes.get({ changeId: id });
        // create a then function on ro which will execute on completion
        ro.promise.then(function (resp) {
            // update the display with the status and response data
            currentStep.status = 'done';
            currentStep.data = ' change id=' + resp.data.id;
        });
        // return the promise for chaining
        return ro.promise;
    };
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
            currentStep.data = resp.data.title;
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
     * @returns {mng.IPromise<{data: IDriveFile}>}
     */
    MaximalCtrl.prototype.insertFiles = function (title, count) {
        var _this = this;
        var contentBase = 'content for ';
        var doneCount = 0;
        var currentStep = { op: 'Inserting files', status: '' + doneCount, data: undefined };
        this.steps.push(currentStep);
        var def = this.$q.defer();
        for (var i = 0; i < count; i++) {
            this.DriveService.files.insert({
                title: title + '-' + i,
                mimeType: 'text/plain'
            }, { uploadType: 'multipart' }, contentBase + title + '-' + i).promise.then(function (resp) {
                currentStep.status = '' + ++doneCount;
                currentStep.data = resp.data.id + ' , content length = ' + resp.data.fileSize;
                _this.currentFile = resp.data;
                if (doneCount == count) {
                    currentStep.status = 'done';
                    def.resolve();
                }
                // check count then resolve
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
            currentStep.data = resp.data;
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
            currentStep.data = resp.data.title;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.updateFileTitle = function (id, newTitle) {
        var currentStep = { op: 'Using Update to update a file\'s title', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.update({ title: newTitle }, { fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.data.title;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.updateFileContent = function (id, newContent) {
        var currentStep = { op: 'Using Update to update a file\'s content', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.update(undefined, {
            fileId: id,
            uploadType: 'media'
        }, newContent);
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = 'content length = ' + resp.data.fileSize;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.touchFile = function (id) {
        var currentStep = { op: 'Using Touch to update a file\'s last modified date', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.touch({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.data.modifiedDate;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.trashFile = function (id) {
        var currentStep = { op: 'Trash a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.trash({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = 'trashed=' + resp.data.labels.trashed;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.untrashFile = function (id) {
        var currentStep = { op: 'Untrash a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.untrash({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = 'trashed=' + resp.data.labels.trashed;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.deleteFile = function (id) {
        var currentStep = { op: 'Delete a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.del({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.data;
        });
        return ro.promise;
    };
    MaximalCtrl.prototype.emptyTrash = function () {
        var currentStep = { op: 'Empty trash', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.emptyTrash();
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.data;
        }, function (resp) {
            currentStep.status = 'failed';
            currentStep.data = resp + '  will fail if user granted insufficient privilege to empty trash';
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
            currentStep.data = resp.data.kind + " " + resp['resourceUri'];
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
angular.module('MyApp').controller('MaximalCtrl', MaximalCtrl);
//# sourceMappingURL=maximal_c.js.map