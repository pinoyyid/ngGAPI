## ngGAPI - Google APIs for AngularJS done the Angular way

### Usage notes
* There are 2 js files that are required from `nggapi-lib/dist-lib/`
* In your HTML, `nggapi-base.min.js` must be loaded before your app declaration, and `nggapi-drive.min.js` must be loaded afterwards. e.g.
```
        <script src="nggapi-base.min.js"></script>
        <script src="app.js"></script>
        <script src="nggapi-drive.js"></script>
```
* If you are developing in TypeScript, you'll probably want the definition file from `nggapi-interfaces/drive_interfaces.d.ts`
* A simple app.js looks something like 
```
var myApp = angular.module('MyApp', ['ngm.NgGapi']);

angular.module('ngm.NgGapi')
	.provider('OauthService', NgGapi.Config)
	.config(function (OauthServiceProvider) {
		OauthServiceProvider.setScopes('https://www.googleapis.com/auth/drive.file');
		OauthServiceProvider.setClientID('223129968-nrf447vfs92bvf1.apps.googleusercontent.com');
		OauthServiceProvider.setTokenRefreshPolicy(NgGapi.TokenRefreshPolicy.ON_DEMAND);
		OauthServiceProvider.setNoAccessTokenPolicy(999);                 // 0 = fail, > 0 = retry after x
	});
```
* A simple ngGAPI call to create a new file looks something like :-
```
  DriveService.files.insert({title: 'file title', mimeType:'text/plain'})
  .promise.then(()=>{console.log('new file inserted')})
```

NB. We will be creating distributions for npm and bower soon.

### Notes on Cloning this repo (thanks Sam)
* Decide if you want to work in this repo (make sure you understand git first), or you want to fork a private copy
* Clone with `git clone https://github.com/pinoyyid/ngGAPI.git`
* Once the download is finished (24MB or so), you will need to extract the node_modules with `cd ngGAPI ; tar zxf node_modules.tar.gz`. 
* Test your environment is working with `grunt test`
* You can also run up a web server `python -m SimpleHTTPServer  8888&` and connect to my dev app at `http://dev.clevernote.co:8888/nggapi-lib/index.html`. NB You will need to add dev.clevernote.co as an alias of localhost in your /etc/hosts file. This is because Google OAuth will only run from pre-configured origins.

### Dev tools
If you're writing in TypeScript, you'll need the tsc compiler vers 1.4. If you're using WebStorm, you'll need the beta of WS10.
