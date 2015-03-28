'use strict';
//
// tests for the HttpService. Simply test that each method makes the correct
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
	}));

	beforeEach(inject(function (_HttpService_) {
		HttpService= _HttpService_;
	}));


	it('should be instantiated', function () {
		expect(!!HttpService).toBe(true);
	});

	it('should have the correct sig', function () {
		expect(HttpService.sig).toBe('HttpService');
	});

	it('errorhandler should reject a 404', function () {
		var def = $q.defer();
		HttpService.errorHandler({error: 'error message'}, 404, undefined, undefined, undefined, def, 0);
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
		HttpService.errorHandler({error: {message: 'error text'}}, 501, undefined, undefined, undefined, def, retryCount);
		//def.promise.catch(function (status) {
		//	expect(status).toBe(404);
		//});
		var promiseError = 'foo';

		def.promise.then(
			function ()
			{
				console.error('shouldnt be here')
				expect('promise resolved for 501!!').toBe('promise catched for 501!');
			},
			function (status) {
				promiseError = status;
			}
		)
		$timeout(function () {
			$rootScope.$digest();
			expect(promiseError).toBe('501 error text');
		}, 3000);
	});

});
