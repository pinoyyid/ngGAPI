'use strict';
//
// tests for the DriveService.
describe('Service: DriveService', function () {

	// load the service's module
	beforeEach(module('MyApp'));

	// instantiate service
	var $httpBackend;
	var $rootScope;
	var $q;
	var $timeout;
	var DriveService;
	var authRequestHandlerGet;
	var authRequestHandlerPost;

	beforeEach(inject(function (_$httpBackend_, _DriveService_, _$q_, _$rootScope_, _$timeout_) {
		$httpBackend = _$httpBackend_;
		DriveService = _DriveService_;
		$q = _$q_;
		$rootScope = _$rootScope_;
		$timeout = _$timeout_;
		// mock out the underlyinh getAccessToken to return a test string
		DriveService.getHttpService().getOauthService().getAccessToken = function () {
			return 'testaccesstoken'
		};
	}));

	beforeEach(function () {
		// Set up the mock http service responses
		// backend definition common for all tests
		// this configures the backed to return specified responses in response to specified http calls
		//authRequestHandlerGet = $httpBackend.when('GET', '')
		//	.respond({kind: 'drive#file'}, {'A-Token': 'xxx'});
		//authRequestHandlerPost = $httpBackend.when('POST', '')
		//	.respond(200, {id: 'id_from_mock_httpbackend', title: 'title'});
	});


	afterEach(function () {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});


	it('should be instantiated', function () {
		expect(!!DriveService).toBe(true);
	});

	it('should have the correct sig', function () {
		expect(DriveService.sig).toBe('DriveService');
	});


	// test each method by first defining what we expect it to send to $http
	// and then call the method
	//it('list should call GET on the drive endpoint', function () {
	//	var filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
	//	$httpBackend.expectGET(filesUrl.replace(':id', 'foo'));
	//	DriveService.files.get({fileId: 'foo'});
	//	$httpBackend.flush();
	//});

	it('get should return a file object', function () {
		var id = 'foo2';
		var filesUrl = 'https://www.googleapis.com/drive/v2/files/'+id;
		$httpBackend .whenGET("") .respond({id: id} );

		var ro = DriveService.files.get({fileId: id});

		$httpBackend.flush();

		expect('a'+DriveService.lastFile.id).toBe('a'+id);
		expect('b'+ro.data.id).toBe('b'+id);
	});


	it('get media should return some media', function () {
		var id = 'foom';
		var media = 'some media'
		var filesUrl = 'https://www.googleapis.com/drive/v2/files/'+id;
		$httpBackend .whenGET("") .respond(media);

		var ro = DriveService.files.get({fileId: id, alt:'media'});

		$httpBackend.flush();

		expect(ro.data.media).toBe(media);
	});



	it('insert should return a file object', function () {
		var id = 'fooi';
		var filesUrl = 'https://www.googleapis.com/drive/v2/files';
		$httpBackend .whenPOST("") .respond({id: id} );

		var ro = DriveService.files.insert({title: 'title-'+id});
		$httpBackend.flush();

		expect(DriveService.lastFile.id).toBe(id);
		expect(ro.data.id).toBe(id);
	});


	it('insert media should fail for invalid params or data', function () {
		var id = 'fooi';
		var filesUrl = 'https://www.googleapis.com/drive/v2/files';
		$httpBackend .whenPOST("") .respond({id: id} );

		var ro = DriveService.files.insert({title: 'title-'+id}, {uploadType:'resumable'}, 'notb64');
		ro.promise.then(
			function () {expect('should have failed D136 no resumable yet').toBe('false')},
			function (reason) {expect(reason).toMatch('D136')}
		);

		var ro = DriveService.files.insert({title: 'title-'+id}, {uploadType:'media'}, 'not b64');
		ro.promise.then(
			function () {expect('should have failed D142 base 64').toBe('false')},
			function (reason) {expect(reason).toMatch('D142')}
		);

		var ro = DriveService.files.insert({title: 'title-'+id}, {uploadType:'multipart'}, 'Zm9v');
		ro.promise.then(
			function () {expect('should have failed D148 no mime type').toBe('false')},
			function (reason) {expect(reason).toMatch('D148')}
		);

		var ro = DriveService.files.insert({title: 'title-'+id}, {uploadType:'media'}, 'Zm9v');
		ro.promise.then(
			function () {expect('should have failed D148 no mime type').toBe('false')},
			function (reason) {expect(reason).toMatch('D148')}
		);
	});


	it('list should return a file array', function () {
		var id = 'fooi';
		var filesUrl = 'https://www.googleapis.com/drive/v2/files';
		$httpBackend .whenGET("") .respond({items:[{id:'one'},{id:'two'}]} );

		var ro = DriveService.files.list();
		$httpBackend.flush();
		expect(ro.data.length).toBe(2);
	});


	it('list should fail for missing nextPageToken', function () {
		var ro = DriveService.files.list({fields: 'foo'});
		ro.promise.then(
			function () {expect('should have failed D82 no resumable yet').toBe('false')},
			function (reason) {expect(reason).toMatch('D82')}
		);
	});


	it('update should fail for missing fileId', function () {
		var ro = DriveService.files.update({title: 'title-'});
		ro.promise.then(
			function () {expect('should have failed D170 missing fileId').toBe('false')},
			function (reason) {expect(reason).toMatch('D170')}
		);
	});


	it('update should return a file object ', function () {
		var id = 'foot';
		var filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
		$httpBackend .whenPUT("") .respond({id: id } );

		var ro = DriveService.files.update({fileId: id});
		$httpBackend.flush();

		expect(DriveService.lastFile.id).toBe(id);
		expect(ro.data.id).toBe(id);
	});


	it('patch should fail for missing fileId', function () {
		var ro = DriveService.files.patch({title: 'title-'});
		ro.promise.then(
			function () {expect('should have failed D197 missing fileId').toBe('false')},
			function (reason) {expect(reason).toMatch('D197')}
		);
	});


	it('patch should return a file object ', function () {
		var id = 'foot';
		var filesUrl = 'https://www.googleapis.com/drive/v2/files/:id';
		$httpBackend .whenPATCH("") .respond({id: id } );

		var ro = DriveService.files.patch({fileId: id});
		$httpBackend.flush();

		expect(DriveService.lastFile.id).toBe(id);
		expect(ro.data.id).toBe(id);
	});



	it('trash should fail for missing fileId', function () {
		var ro = DriveService.files.trash({title: 'title-'});
		ro.promise.then(
			function () {expect('should have failed D225 missing fileId').toBe('false')},
			function (reason) {expect(reason).toMatch('D225')}
		);
	});


	it('trash should return a file object with labels trashed=true', function () {
		var id = 'foot';
		var filesUrl = 'https://www.googleapis.com/drive/v2/files/:id/trash';
		$httpBackend .whenPOST("") .respond({id: id, labels:{trashed: true}} );

		var ro = DriveService.files.trash({fileId: id});
		$httpBackend.flush();

		expect(DriveService.lastFile.id).toBe(id);
		expect(ro.data.id).toBe(id);
		expect(ro.data.labels.trashed).toBeTruthy();
	});


	it('untrash should fail for missing fileId', function () {
		var ro = DriveService.files.untrash({title: 'title-'});
		ro.promise.then(
			function () {expect('should have failed D251 no fileId').toBe('false')},
			function (reason) {expect(reason).toMatch('D251')}
		);
	});


	it('untrash should return a file object with labels trashed=false', function () {
		var id = 'foot';
		var filesUrl = 'https://www.googleapis.com/drive/v2/files/:id/trash';
		$httpBackend .whenPOST("") .respond({id: id, labels:{trashed: false}} );

		var ro = DriveService.files.untrash({fileId: id});
		$httpBackend.flush();

		expect(DriveService.lastFile.id).toBe(id);
		expect(ro.data.id).toBe(id);
		expect(ro.data.labels.trashed).toBeFalsy();
	});


	it('delete should fail for missing fileId', function () {
		var ro = DriveService.files.del({title: 'title-'});
		ro.promise.then(
			function () {expect('should have failed D222 no fileId').toBe('false')},
			function (reason) {expect(reason).toMatch('D222')}
		);
	});



	/*
	 it('insert should call POST on the tasks endpoint', function() {
	 console.log("test insert");
	 $httpBackend.expectPOST("http://localhost:8080/tasks/v1/lists/MDM4NjIwODI0NzAwNDQwMjQ2MjU6OTEzMzE4NTkxOjA/tasks");
	 DriveService.insert({title:'foo'});
	 $httpBackend.flush();
	 });
	 */

});
