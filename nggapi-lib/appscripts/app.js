'use strict';

var myApp = angular
  .module('MyApp', []);


myApp.provider('OauthService', NgGapi.Config)
  .config(function (OauthServiceProvider) {
    OauthServiceProvider.setScopes('drive.file');
    OauthServiceProvider.setClientID('1234');
    OauthServiceProvider.setTokenRefreshPolicy(NgGapi.TokenRefreshPolicy.ON_DEMAND);
});


