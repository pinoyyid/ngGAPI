var MaximalCtrl1 = (function () {
    function MaximalCtrl1($scope, $log, $q, DriveService) {
        this.$scope = $scope;
        this.$log = $log;
        this.$q = $q;
        this.DriveService = DriveService;
        this.sig = 'MaximalCtrl';
        this.steps = [];
        this.email = "";
        this.largestChangeId = 0;
        this.currentStepImage = '';
        $scope.vm = this;
        window['DS'] = this.DriveService;
        console.info("A reference to the DriveService has been placed at window.DS\nYou can use this to manually run commands, eg. DS.files.list({maxResults:1, fields:\"items\"})");
        this.doEverything();
    }
    MaximalCtrl1.prototype.uploadImage = function (element) {
        var _this = this;
        var files = element.files;
        console.log(files[0].name + ' ' + files[0].type);
        var reader = new FileReader();
        reader.onload = function () {
            var content = reader.result;
            _this.currentStepImage = 'Inserting ' + content.length;
            var def = _this.$q.defer();
            _this.DriveService.files.insertWithContent({
                title: files[0].name,
                mimeType: files[0].type
            }, { uploadType: 'resumable' }, content, undefined).promise.then(function (resp) {
                _this.currentStepImage = resp.data.id + ' , content length = ' + resp.data.fileSize;
                _this.currentFile = resp.data;
            }, function (reason) { def.reject(reason); }, function (position) {
                console.log('notification at position ' + position);
                _this.currentStepImage = 'progress = ' + position;
            });
            _this.$scope.$apply();
        };
        reader.readAsBinaryString(element.files[0]);
    };
    MaximalCtrl1.prototype.doEverything = function () {
        var _this = this;
        this.getAbout()
            .then(function () {
            return _this.insertFiles('delmezzz', 2);
        })
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
            return _this.listChanges(_this.largestChangeId);
        })
            .then(function () {
            return _this.getChange(_this.largestChangeId);
        })
            .then(function () {
            return _this.insertFolder();
        })
            .then(function () {
            return _this.insertChild(_this.currentFile);
        })
            .then(function () {
            return _this.listChildren();
        })
            .then(function () {
            return _this.getChild();
        })
            .then(function () {
            return _this.deleteChild();
        })
            .then(function () {
            return _this.insertParent(_this.currentFile);
        })
            .then(function () {
            return _this.listParents();
        })
            .then(function () {
            return _this.getParent();
        })
            .then(function () {
            return _this.deleteParent();
        })
            .then(function () {
            return _this.insertPermission(_this.currentFile.id);
        })
            .then(function () {
            return _this.listPermissions();
        })
            .then(function () {
            return _this.getPermission();
        })
            .then(function () {
            return _this.updatePermission();
        })
            .then(function () {
            return _this.getpermissionIdForEmail(_this.email);
        })
            .then(function () {
            return _this.patchPermission();
        })
            .then(function () {
            return _this.deletePermission();
        })
            .then(function () {
            return _this.listRevisions();
        })
            .then(function () {
            return _this.getRevision();
        })
            .then(function () {
            return _this.updateRevision();
        })
            .then(function () {
            return _this.patchRevision();
        })
            .then(function () {
            return _this.deleteRevision();
        })
            .then(function () {
            return _this.deleteFile(_this.currentFolder.id);
        })
            .then(function () {
            return _this.deleteFile(_this.currentFile.id);
        })
            .then(function () {
            return _this.emptyTrash();
        })
            .catch(function (reason) {
            console.error('There was an error: ', reason);
        });
    };
    MaximalCtrl1.prototype.getAbout = function () {
        var _this = this;
        var currentStep = { op: 'Getting about', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.about.get({ includeSubscribed: true });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.data.user + ' change id=' + resp.data.largestChangeId;
            _this.largestChangeId = resp.data.largestChangeId;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.listChanges = function (id) {
        var currentStep = { op: 'Listing changes ', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.changes.list({ startChangeId: id, maxResults: 989 });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = ' change count=' + resp.data.items.length;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.getChange = function (id) {
        var currentStep = { op: 'Getting change ' + id, status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.changes.get({ changeId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = ' change id=' + resp.data.id;
        }, function () {
            currentStep.status = 'failed';
            currentStep.data = 'This call often fails on Drive. Just refresh the page and it will probably succeed';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.getFile = function (id) {
        var currentStep = { op: 'Getting a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.get({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.data.title;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.insertFiles = function (title, count) {
        var _this = this;
        var contentBase = 'content for ';
        var doneCount = 0;
        var currentStep = { op: 'Inserting ' + count + ' files', status: '' + doneCount, data: undefined };
        this.steps.push(currentStep);
        var def = this.$q.defer();
        for (var i = 0; i < count; i++) {
            this.DriveService.files.insertWithContent({
                title: title + '-' + i,
                mimeType: 'text/plain'
            }, { uploadType: 'multipart' }, btoa(contentBase + title + '-' + i), 'base64').promise.then(function (resp) {
                currentStep.status = '' + ++doneCount;
                currentStep.data = resp.data.id + ' , content length = ' + resp.data.fileSize;
                _this.currentFile = resp.data;
                if (doneCount == count) {
                    currentStep.status = 'done';
                    def.resolve();
                }
            }, function (reason) { def.reject(reason); });
        }
        return def.promise;
    };
    MaximalCtrl1.prototype.resumable = function (title) {
        var _this = this;
        var content = '123456789.';
        for (var i = 1; i < 16; i++) {
            content += content;
        }
        console.log(content.length);
        var transferEncoding;
        content = btoa(content);
        transferEncoding = 'base64';
        var currentStep = { op: 'Inserting ' + content.length + ' long file', status: '', data: undefined };
        this.steps.push(currentStep);
        var def = this.$q.defer();
        this.DriveService.files.insertWithContent({
            title: title,
            mimeType: 'text/plain'
        }, { uploadType: 'resumable' }, content, transferEncoding).promise.then(function (resp) {
            currentStep.data = resp.data.id + ' , content length = ' + resp.data.fileSize;
            _this.currentFile = resp.data;
        }, function (reason) { def.reject(reason); }, function (position) {
            console.log('notification at position ' + position);
            currentStep.data = 'progress = ' + position;
        });
        return def.promise;
    };
    MaximalCtrl1.prototype.getFileContents = function (id) {
        var currentStep = { op: 'Getting a file\'s contents', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.get({ fileId: id, alt: 'media' });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.data;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.patchFileTitle = function (id, newTitle) {
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
    MaximalCtrl1.prototype.updateFileTitle = function (id, newTitle) {
        var currentStep = { op: 'Using Update to update a file\'s title', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.update({ title: newTitle }, { fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.data.title;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.updateFileContent = function (id, newContent) {
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
    MaximalCtrl1.prototype.touchFile = function (id) {
        var currentStep = { op: 'Using Touch to update a file\'s last modified date', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.touch({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.data.modifiedDate;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.trashFile = function (id) {
        var currentStep = { op: 'Trash a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.trash({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = 'trashed=' + resp.data.labels.trashed;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.untrashFile = function (id) {
        var currentStep = { op: 'Untrash a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.untrash({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = 'trashed=' + resp.data.labels.trashed;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.deleteFile = function (id) {
        var currentStep = { op: 'Delete a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.del({ fileId: id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            currentStep.data = resp.data;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.emptyTrash = function () {
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
    MaximalCtrl1.prototype.watchFile = function (id) {
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
    MaximalCtrl1.prototype.displayTitle = function (expect, title) {
        this.$log.info("chained title (" + expect + ")= " + title);
    };
    MaximalCtrl1.prototype.insertFolder = function () {
        var _this = this;
        var currentStep = { op: 'Making a folder', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.files.insert({
            title: 'delmeZZZ testfolder',
            mimeType: 'application/vnd.google-apps.folder'
        }, false);
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            _this.currentFolder = resp.data;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.insertChild = function (child) {
        var currentStep = { op: 'Making a child', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.children.insert({ folderId: this.currentFolder.id }, child);
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.getChild = function () {
        var currentStep = { op: 'Getting a child', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.children.get({ folderId: this.currentFolder.id, childId: this.currentFile.id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.listChildren = function () {
        var currentStep = { op: 'Listing all children', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.children.list({ folderId: this.currentFolder.id });
        ro.promise.then(function (resp) {
            currentStep.status = '' + resp.data.items.length;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.deleteChild = function () {
        var currentStep = { op: 'Deleting a child', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.children.del({ folderId: this.currentFolder.id, childId: this.currentFile.id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.insertParent = function (child) {
        var currentStep = { op: 'Making a parent', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.parents.insert({ fileId: child.id }, this.currentFolder);
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.getParent = function () {
        var currentStep = { op: 'Getting a parent', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.parents.get({ fileId: this.currentFile.id, parentId: this.currentFolder.id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.listParents = function () {
        var currentStep = { op: 'Listing all parents', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.parents.list({ fileId: this.currentFile.id });
        ro.promise.then(function (resp) {
            currentStep.status = '' + resp.data.items.length;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.deleteParent = function () {
        var currentStep = { op: 'Deleting a parent', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.parents.del({ fileId: this.currentFile.id, parentId: this.currentFolder.id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.insertPermission = function (fileId) {
        var _this = this;
        var currentStep = { op: 'Making a permission', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.permissions.insert({ type: 'anyone', role: 'writer' }, { fileId: fileId });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
            _this.currentPermission = resp.data;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.getPermission = function () {
        var currentStep = { op: 'Getting a permission', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.permissions.get({ fileId: this.currentFile.id, permissionId: this.currentPermission.id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.updatePermission = function () {
        var currentStep = { op: 'Updating a permission', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.permissions.update({ type: 'domain', role: 'reader' }, { fileId: this.currentFile.id, permissionId: this.currentPermission.id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.patchPermission = function () {
        var currentStep = { op: 'Patching a permission', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.permissions.patch({ type: 'domain', role: 'reader' }, { fileId: this.currentFile.id, permissionId: this.currentPermission.id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.listPermissions = function () {
        var currentStep = { op: 'Listing all permissions for a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.permissions.list({ fileId: this.currentFile.id });
        ro.promise.then(function (resp) {
            currentStep.status = '' + resp.data.items.length;
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.deletePermission = function () {
        var currentStep = { op: 'Deleting a permission', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.permissions.del({ fileId: this.currentFile.id, permissionId: this.currentPermission.id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.getpermissionIdForEmail = function (email) {
        var currentStep = { op: 'getting permission id for ' + this.email, status: '...', data: undefined };
        this.steps.push(currentStep);
        if (!this.email || this.email.length < 4) {
            currentStep.status = 'skipped because no email address provided';
            return;
        }
        var ro = this.DriveService.permissions.getIdForEmail(email);
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.getRevision = function () {
        var currentStep = { op: 'Getting a revision', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.revisions.get({ fileId: this.currentFile.id, revisionId: this.currentRevision.id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.updateRevision = function () {
        var currentStep = { op: 'Updating a revision', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.revisions.update({ pinned: false }, { fileId: this.currentFile.id, revisionId: this.currentRevision.id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.patchRevision = function () {
        var currentStep = { op: 'Patching a revision', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.revisions.patch({ pinned: true }, { fileId: this.currentFile.id, revisionId: this.currentRevision.id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.listRevisions = function () {
        var _this = this;
        var currentStep = { op: 'Listing all revisions for a file', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.revisions.list({ fileId: this.currentFile.id });
        ro.promise.then(function (resp) {
            currentStep.status = '' + resp.data.items.length;
            _this.currentRevision = resp.data.items[0];
        });
        return ro.promise;
    };
    MaximalCtrl1.prototype.deleteRevision = function () {
        var currentStep = { op: 'Deleting a revision', status: '...', data: undefined };
        this.steps.push(currentStep);
        var ro = this.DriveService.revisions.del({ fileId: this.currentFile.id, revisionId: this.currentRevision.id });
        ro.promise.then(function (resp) {
            currentStep.status = 'done';
        });
        return ro.promise;
    };
    MaximalCtrl1.$inject = ['$scope', '$log', '$q', 'DriveService'];
    return MaximalCtrl1;
})();
angular.module('MyApp')
    .controller('MaximalCtrl', MaximalCtrl1);
