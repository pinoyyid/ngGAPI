'use strict';

var myApp = angular
	.module('MyApp', ['ngm.NgGapi']);

angular.module('ngm.NgGapi')
	.provider('OauthService', NgGapi.Config)
	.config(function (OauthServiceProvider) {
		OauthServiceProvider.setScopes('https://www.googleapis.com/auth/drive.file');
		//OauthServiceProvider.setClientID('700995682262-2kk81vdcu8j83j0ahjmk84u1drcbg5di.apps.googleusercontent.com');
		OauthServiceProvider.setClientID('292329129968-nrf447v3m1jqknroi1naii0kfs92bvf1.apps.googleusercontent.com');
		OauthServiceProvider.setTokenRefreshPolicy(NgGapi.TokenRefreshPolicy.ON_DEMAND);
		OauthServiceProvider.setNoAccessTokenPolicy(999);                 // 0 = fail, > 0 = retry after x
		//OauthServiceProvider.setGetAccessTokenFunction(function () {console.log('heee haaaa')});  // see below for pseudo code
	});




/*
 If the dev wants to provide access tokens other than from gapi.auth, this is how. The most likely alternative to gapi.auth is that the app has a server component with
 refresh keys and the server is generating access tokens. It could also be used for testing.

 pseudo code for own getAccessTokeFunction ...
 |  if validStoredAccessToken, return validStoredAccessToken   // if he has a valid token, return it
 |  // here if no current token
 |  do whatever is required to fetch a token, oncomplete (eg callback or promise) store token
 |  return "!RETRY=1000"                                       // this will cause ngGapi to retry every 1s until there is a valid token. There are 10 retry attempts before failing
  */

