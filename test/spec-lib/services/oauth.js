'use strict';

'use strict';

describe('Service: OauthService', function () {

  // load the service's module
  beforeEach(module('MyApp'));

  // instantiate service
  var $httpBackend;
  var OauthService;
  var $window;
  var LIST_URL = "https://www.googleapis.com/drive/v2/files?maxResults=1000&q=trashed%3Dtrue&fields=items(id%2Ctitle)%2CnextPageToken";

  myApp.provider('oauthService', NgGapi.Config)
    .config(function (OauthServiceProvider) {
      OauthServiceProvider.setScopes('drive.file');
      OauthServiceProvider.setClientID('1234');
      OauthServiceProvider.setTokenRefreshPolicy(NgGapi.TokenRefreshPolicy.ON_DEMAND);
    });
  console.log(1,NgGapi);
  console.log(1,NgGapi.OauthService);
  console.log(1,NgGapi.OauthService.scopes);
  beforeEach(inject(function (_OauthService_) {
    console.log(2,NgGapi);
    OauthService= _OauthService_;
  }));

  // Set up the mock window service so we can dump a mock gapi onto it
  beforeEach(inject(function($injector) {
    $window = $injector.get('$window');
    $window.gapi = {auth:{}};
    $window.gapi.auth.getToken = function (token2return) {return token2return};
    $window.gapi.auth.authorize = function () {return "faked authorization"};
  }));


  // --- tests ---
  it('should be instantiated', function () {
    expect(!!OauthService).toBe(true);
  });

  it('should have the correct sig', function () {
    expect(OauthService.sig).toBe('OauthService');
  });

  it('should have the scopes correctly set', function () {
    expect(OauthService.scopes).toBe('drive.file');
  });


});

