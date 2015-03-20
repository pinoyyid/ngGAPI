'use strict';

var myApp = angular
  .module('MyApp', ['ngm.NgGapi']);

angular.module('ngm.NgGapi')
.provider('OauthService', NgGapi.Config)
  .config(function (OauthServiceProvider) {
    OauthServiceProvider.setScopes('https://www.googleapis.com/auth/drive.file');
    OauthServiceProvider.setClientID('700995682262-2kk81vdcu8j83j0ahjmk84u1drcbg5di.apps.googleusercontent.com');
    OauthServiceProvider.setTokenRefreshPolicy(NgGapi.TokenRefreshPolicy.ON_DEMAND);
});


