/// <reference path="../../../definitely_typed/angular/angular.d.ts"/>
/// <reference path="../../../nggapi_ts_declaration_files/drive_interfaces.d.ts"/>

class MaximalCtrl2 {
	sig = 'MaximalCtrl';

	// an array of steps to display
	steps = [];

	// a current file (the last inserted) that most functions will operate on
	currentFile:NgGapi.IDriveFile;

	static $inject = ['$scope', '$log', '$q', 'DriveService'];

	constructor(private $scope, private $log:ng.ILogService, private $q:ng.IQService, private DriveService:NgGapi.IDriveService) {
		$scope.vm = this;

		this.doEverything();
	}


	/**
	 * perform all steps using promise chaining to run them in sequence
	 */
	doEverything() {
		this.insertFiles('delmexxx', 2)
			.then(() => {
			return this.getFile(this.currentFile.id)
		})
			.then(() => {
			return this.getFileContents(this.currentFile.id)
		})
			.then(() => {
			return this.patchFileTitle(this.currentFile.id, this.currentFile.title + " PATCHED")
		})
			.then(() => {
			return this.updateFileTitle(this.currentFile.id, this.currentFile.title + " UPDATED")
		})
			.then(() => {
			return this.updateFileContent(this.currentFile.id, 'updated file content')
		})
			.then(() => {
			return this.touchFile(this.currentFile.id)
		})
			.then(() => {
			return this.trashFile(this.currentFile.id)
		})
			.then(() => {
			return this.untrashFile(this.currentFile.id)
		})
			.then(() => {
			return this.deleteFile(this.currentFile.id)
		})
			.then(() => {
			return this.emptyTrash()
		})
			.then(()=> {
				console.log('All done')
			}
		);
	}


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
	getFile(id:string):ng.IPromise<NgGapi.IDriveFile> {
		// create a step object containing what we're about to do
		var currentStep = {op: 'Getting a file', status: '...', data: undefined};
		// push that step object onto the list which is displayed via an ng-repeat
		this.steps.push(currentStep);
		// do the get, storing its ResponseObject in ro
		var ro:NgGapi.IDriveResponseObject<NgGapi.IDriveFile> = this.DriveService.files.get({fileId: id});
		// create a then function on ro which will execute on completion
		ro.promise.then((resp:NgGapi.IDriveFile) => {
			// update the display with the status and response data
			currentStep.status = 'done';
			currentStep.data = resp.title;
		});
		// return the promise for chaining
		return ro.promise;
	}

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
	insertFiles(title:string, count:number):ng.IPromise<NgGapi.IDriveFile> {
		var contentBase = 'content for ';
		var doneCount = 0;
		var currentStep = {op: 'Inserting files', status: '' + doneCount, data: undefined};
		this.steps.push(currentStep);

		var def = this.$q.defer();

		for (var i = 0; i < count; i++) {
			this.DriveService.files.insert({
				title: title + '-' + i,
				mimeType: 'application/vnd.google-apps.document'
			} ).promise.then(
				(resp:NgGapi.IDriveFile) => {
					currentStep.status = '' + ++doneCount;
					currentStep.data = resp.id + ' , content length = ' + resp.fileSize;

					var params:NgGapi.IDriveUpdateParameters = {};
					params.convert = true;
					params.uploadType = 'media';
					params.fileId = resp.id;
					this.DriveService.files.update(resp,params,'some content');


					this.currentFile = resp;
					if (doneCount == count) {
						currentStep.status = 'done';
						def.resolve();
					}
					// check count then resolve
				}
			);
		}
		return def.promise;
	}

	getFileContents(id:string):ng.IPromise<any> {
		var currentStep = {op: 'Getting a file\'s contents', status: '...', data: undefined};
		this.steps.push(currentStep);
		var ro:NgGapi.IDriveResponseObject<any> = this.DriveService.files.get({fileId: id, alt: 'media'});
		ro.promise.then((resp:any) => {
			currentStep.status = 'done';
			currentStep.data = resp;
		});
		return ro.promise;
	}

	patchFileTitle(id:string, newTitle:string):ng.IPromise<NgGapi.IDriveFile> {
		var currentStep = {op: 'Using Patch to update a file\'s title', status: '...', data: undefined};
		this.steps.push(currentStep);
		var ro:NgGapi.IDriveResponseObject<NgGapi.IDriveFile> = this.DriveService.files.patch({
			fileId: id,
			resource: {title: newTitle}
		});
		ro.promise.then((resp:NgGapi.IDriveFile) => {
			currentStep.status = 'done';
			currentStep.data = resp.title;
		});
		return ro.promise;
	}

	updateFileTitle(id:string, newTitle:string):ng.IPromise<NgGapi.IDriveFile> {
		var currentStep = {op: 'Using Update to update a file\'s title', status: '...', data: undefined};
		this.steps.push(currentStep);
		var ro:NgGapi.IDriveResponseObject<NgGapi.IDriveFile> = this.DriveService.files.update({title: newTitle}, {fileId: id});
		ro.promise.then((resp:NgGapi.IDriveFile) => {
			currentStep.status = 'done';
			currentStep.data = resp.title;
		});
		return ro.promise;
	}

	updateFileContent(id:string, newContent:string):ng.IPromise<NgGapi.IDriveFile> {
		var currentStep = {op: 'Using Update to update a file\'s content', status: '...', data: undefined};
		this.steps.push(currentStep);
		var ro:NgGapi.IDriveResponseObject<NgGapi.IDriveFile> = this.DriveService.files.update(undefined, {
			fileId: id,
			uploadType: 'media'
		}, btoa(newContent));
		ro.promise.then((resp:NgGapi.IDriveFile) => {
			currentStep.status = 'done';
			currentStep.data = 'content length = ' + resp.fileSize;
		});
		return ro.promise;
	}

	touchFile(id:string):ng.IPromise<NgGapi.IDriveFile> {
		var currentStep = {op: 'Using Touch to update a file\'s last modified date', status: '...', data: undefined};
		this.steps.push(currentStep);
		var ro:NgGapi.IDriveResponseObject<NgGapi.IDriveFile> = this.DriveService.files.touch({fileId: id});
		ro.promise.then((resp:NgGapi.IDriveFile) => {
			currentStep.status = 'done';
			currentStep.data = resp.modifiedDate;
		});
		return ro.promise;
	}

	trashFile(id:string):ng.IPromise<NgGapi.IDriveFile> {
		var currentStep = {op: 'Trash a file', status: '...', data: undefined};
		this.steps.push(currentStep);
		var ro:NgGapi.IDriveResponseObject<NgGapi.IDriveFile> = this.DriveService.files.trash({fileId: id});
		ro.promise.then((resp:NgGapi.IDriveFile) => {
			currentStep.status = 'done';
			currentStep.data = 'trashed=' + resp.labels.trashed;
		});
		return ro.promise;
	}

	untrashFile(id:string):ng.IPromise<NgGapi.IDriveFile> {
		var currentStep = {op: 'Untrash a file', status: '...', data: undefined};
		this.steps.push(currentStep);
		var ro:NgGapi.IDriveResponseObject<NgGapi.IDriveFile> = this.DriveService.files.untrash({fileId: id});
		ro.promise.then((resp:NgGapi.IDriveFile) => {
			currentStep.status = 'done';
			currentStep.data = 'trashed=' + resp.labels.trashed;
		});
		return ro.promise;
	}

	deleteFile(id:string):ng.IPromise<NgGapi.IDriveFile> {
		var currentStep = {op: 'Delete a file', status: '...', data: undefined};
		this.steps.push(currentStep);
		var ro:NgGapi.IDriveResponseObject<NgGapi.IDriveFile> = this.DriveService.files.del({fileId: id});
		ro.promise.then((resp:NgGapi.IDriveFile) => {
			currentStep.status = 'done';
			currentStep.data = resp;
		});
		return ro.promise;
	}

	emptyTrash():ng.IPromise<NgGapi.IDriveFile> {
		var currentStep = {op: 'Empty trash', status: '...', data: undefined};
		this.steps.push(currentStep);
		var ro:NgGapi.IDriveResponseObject<NgGapi.IDriveFile> = this.DriveService.files.emptyTrash();
		ro.promise.then(
			(resp:NgGapi.IDriveFile) => {
				currentStep.status = 'done';
				currentStep.data = resp;
			},
			(resp:any) => {
				currentStep.status = 'failed';
				currentStep.data = resp;
			});
		return ro.promise;
	}

	watchFile(id:string):ng.IPromise<NgGapi.IDriveFile> {
		var currentStep = {op: 'Using Watch to get a file\'s update channel', status: '...', data: undefined};
		this.steps.push(currentStep);
		var watchBody = {
			id: 'aUUID',
			type: 'web_hook',
			address: 'dev.clevernote.co:8888'
		};
		var ro:NgGapi.IDriveResponseObject<NgGapi.IDriveFile> = this.DriveService.files.watch({
			fileId: id,
			alt: 'media'
		}, watchBody);
		ro.promise.then(
			(resp:NgGapi.IDriveFile) => {
				currentStep.status = 'done';
				currentStep.data = resp.kind + " " + resp['resourceUri'];
			});
		return ro.promise;
	}

	displayTitle(expect:string, title:string) {
		this.$log.info("chained title (" + expect + ")= " + title);
	}
}

//angular.module('MyApp')
//  .controller('MainCtrl', function ($scope) {
//    $scope.sig = 'MainCtrl';
//  });
angular.module('MyApp')
	.controller('MaximalCtrl', MaximalCtrl2);
