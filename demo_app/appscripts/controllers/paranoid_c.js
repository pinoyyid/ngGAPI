var MaximalCtrl = (function () {
    function MaximalCtrl($scope, $log, $q, DriveService) {
        this.$scope = $scope;
        this.$log = $log;
        this.$q = $q;
        this.DriveService = DriveService;
        this.sig = 'MaximalCtrl';
        this.steps = [];
        $scope.vm = this;
        this.doEverything();
    }
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
                var parentFid = ro.data[0].parents[0].id;
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
    MaximalCtrl.prototype.getFile = function (id) {
        var currentStep = { op: 'Getting a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.get({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.title;
        });
        return ro.promise;
    };
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
angular.module('MyApp')
    .controller('MaximalCtrl', MaximalCtrl);
