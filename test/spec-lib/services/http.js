'use strict';
//
// tests for the RestService. Simply test that each method makes the correct
// call to $http
//
// Once this class is certified, it can be replaced by a mock equivalent that either mocks out
// all of its methods, or includes with $httpBackend to mock the server
describe('Service: HttpService', function () {

	// load the service's module
	beforeEach(module('MyApp'));

	// instantiate service
	var $rootScope;
	var $q;
	var $timeout;
	var HttpService;
	var $httpBackend;
	var authRequestHandlerGet;
	var authRequestHandlerPost;

	beforeEach(inject(function($injector) {
		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');
		$q = $injector.get('$q');
		$rootScope = $injector.get('$rootScope');
		$timeout = $injector.get('$timeout');
		// backend definition common for all tests
		// this configures the backed to return specified responses in response to specified http calls
		authRequestHandlerGet = $httpBackend.when('GET', '')
			.respond({kind: 'tasks#tasks'}, {'A-Token': 'xxx'});
		authRequestHandlerPost = $httpBackend.when('POST', '')
			.respond(200,{id:'id_from_mock_httpbackend',title:'title'});
	}));

	beforeEach(inject(function (_HttpService_) {
		HttpService= _HttpService_;
	}));


	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});


	it('should be instantiated', function () {
		expect(!!HttpService).toBe(true);
	});

	it('should have the correct sig', function () {
		expect(HttpService.sig).toBe('HttpService');
	});

	it('errorhandler should reject a 404', function () {
		var def = $q.defer();
		HttpService.errorHandler(undefined, 404, undefined, undefined, undefined, def, 0);
		//def.promise.catch(function (status) {
		//	expect(status).toBe(404);
		//});
		def.promise.then(
			function ()
			{
				console.error('shouldnt be here')
				expect('promise resolved for 404!!').toBe('promise catched for 404!');
			},
			function (status) {
				expect(status).toBe(404);
			}
		)
	});


	// TODO the test below is false because it isn't waiting for the retry before karma exits

	it('errorhandler should retry a 501', function () {
		var def = $q.defer();
		// override the _doHttp function to track retries
		var retryCount = 1;
		HttpService._doHttp = function (c, d, retryCount) {
			console.log('in dohttp mock');
			retryCount--;
		}
		HttpService.errorHandler(undefined, 501, undefined, undefined, undefined, def, retryCount);
		//def.promise.catch(function (status) {
		//	expect(status).toBe(404);
		//});
		var promiseError = 'foo';

		def.promise.then(
			function ()
			{
				console.error('shouldnt be here')
				expect('promise resolved for 404!!').toBe('promise catched for 404!');
			},
			function (status) {
				promiseError = status;
			}
		)
		$timeout(function () {
			$rootScope.$digest();
			expect(promiseError).toBe('501-0a');
		}, 3000);
	});



	/*
	// test each method by first defining what we expect it to send to $http
	// and then call the method
	it('list should call GET on the drive endpoint', function() {
		$httpBackend.expectGET("http://localhost:8080/tasks/v1/lists/MDM4NjIwODI0NzAwNDQwMjQ2MjU6OTEzMzE4NTkxOjA/tasks");
		HttpService.list();
		$httpBackend.flush();
	});



	it('insert should call POST on the tasks endpoint', function() {
		console.log("test insert");
		$httpBackend.expectPOST("http://localhost:8080/tasks/v1/lists/MDM4NjIwODI0NzAwNDQwMjQ2MjU6OTEzMzE4NTkxOjA/tasks");
		HttpService.insert({title:'foo'});
		$httpBackend.flush();
	});
*/

});
