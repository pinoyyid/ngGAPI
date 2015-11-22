var MaximalCtrl2 = (function () {
    function MaximalCtrl2($scope, $log, $q, DriveService) {
        this.$scope = $scope;
        this.$log = $log;
        this.$q = $q;
        this.DriveService = DriveService;
        this.sig = 'MaximalCtrl';
        this.steps = [];
        $scope.vm = this;
        this.doEverything();
    }
    MaximalCtrl2.prototype.doEverything = function () {
        var _this = this;
        this.insertFiles('delmexxx', 2)
            .then(function () {
            return _this.getFile(_this.currentFile.id);
        })
            .then(function () {
            return _this.getFileContents(_this.currentFile.id);
        })
            .then(function () {
            return _this.patchFileTitle(_this.currentFile.id, _this.currentFile.title + " PATCHED");
        })
            .then(function () {
            return _this.updateFileTitle(_this.currentFile.id, _this.currentFile.title + " UPDATED");
        })
            .then(function () {
            return _this.updateFileContent(_this.currentFile.id, 'updated file content');
        })
            .then(function () {
            return _this.touchFile(_this.currentFile.id);
        })
            .then(function () {
            return _this.trashFile(_this.currentFile.id);
        })
            .then(function () {
            return _this.untrashFile(_this.currentFile.id);
        })
            .then(function () {
            return _this.deleteFile(_this.currentFile.id);
        })
            .then(function () {
            return _this.emptyTrash();
        })
            .then(function () {
            console.log('All done');
        });
    };
    MaximalCtrl2.prototype.getFile = function (id) {
        var currentStep = { op: 'Getting a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.get({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.title;
        });
        return ro.promise;
    };
    MaximalCtrl2.prototype.insertFiles = function (title, count) {
        var _this = this;
        var contentBase = 'content for ';
        var doneCount = 0;
        var currentStep = { op: 'Inserting files', status: '' + doneCount, data: undefined };
        this.steps.push(currentStep);
        var def = this.$q.defer();
        for (var i = 0; i < count; i++) {
            this.DriveService.files.insert({
                title: title + '-' + i,
                mimeType: 'application/vnd.google-apps.document'
            }).promise.then(function (resp) {
                currentStep.status = '' + ++doneCount;
                currentStep.data = resp.id + ' , content length = ' + resp.fileSize;
                var params = {};
                params.convert = true;
                params.uploadType = 'media';
                params.fileId = resp.id;
                _this.DriveService.files.update(resp, params, 'some content');
                _this.currentFile = resp;
                if (doneCount == count) {
                    currentStep.status = 'done';
                    def.resolve();
                }
            });
        }
        return def.promise;
    };
    MaximalCtrl2.prototype.getFileContents = function (id) {
        var currentStep = { op: 'Getting a file\'s contents', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.get({ fileId: id, alt: 'media' });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp;
        });
        return ro.promise;
    };
    MaximalCtrl2.prototype.patchFileTitle = function (id, newTitle) {
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
    MaximalCtrl2.prototype.updateFileTitle = function (id, newTitle) {
        var currentStep = { op: 'Using Update to update a file\'s title', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.update({ title: newTitle }, { fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.title;
        });
        return ro.promise;
    };
    MaximalCtrl2.prototype.updateFileContent = function (id, newContent) {
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
    MaximalCtrl2.prototype.touchFile = function (id) {
        var currentStep = { op: 'Using Touch to update a file\'s last modified date', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.touch({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.modifiedDate;
        });
        return ro.promise;
    };
    MaximalCtrl2.prototype.trashFile = function (id) {
        var currentStep = { op: 'Trash a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.trash({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = 'trashed=' + resp.labels.trashed;
        });
        return ro.promise;
    };
    MaximalCtrl2.prototype.untrashFile = function (id) {
        var currentStep = { op: 'Untrash a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.untrash({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = 'trashed=' + resp.labels.trashed;
        });
        return ro.promise;
    };
    MaximalCtrl2.prototype.deleteFile = function (id) {
        var currentStep = { op: 'Delete a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.del({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp;
        });
        return ro.promise;
    };
    MaximalCtrl2.prototype.emptyTrash = function () {
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
    MaximalCtrl2.prototype.watchFile = function (id) {
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
    MaximalCtrl2.prototype.displayTitle = function (expect, title) {
        this.$log.info("chained title (" + expect + ")= " + title);
    };
    MaximalCtrl2.$inject = ['$scope', '$log', '$q', 'DriveService'];
    return MaximalCtrl2;
})();
angular.module('MyApp')
    .controller('MaximalCtrl', MaximalCtrl2);
