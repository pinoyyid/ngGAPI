## ngGAPI - Google APIs for AngularJS done the Angular way

### Quick Start
* There are 2 js files that are required from `nggapi-lib/dist-lib/`
* In your HTML, `nggapi-base.min.js` must be loaded before your app declaration, and `nggapi-drive.min.js` must be loaded afterwards. e.g.
```
        <script src="nggapi-base.min.js"></script>
        <script src="app.js"></script>
        <script src="nggapi-drive.js"></script>
```
* If you are developing in TypeScript, you'll want the definition file from `nggapi-interfaces/drive_interfaces.d.ts`
* A simple `app.js` looks something like
```
var myApp = angular.module('MyApp', ['ngm.NgGapi']);

angular.module('ngm.NgGapi')
	.provider('OauthService', NgGapi.Config)
	.config(function (OauthServiceProvider) {
		OauthServiceProvider.setScopes('https://www.googleapis.com/auth/drive.file');
		OauthServiceProvider.setClientID('2231299-2bvf1.apps.googleusercontent.com');
		OauthServiceProvider.setTokenRefreshPolicy(NgGapi.TokenRefreshPolicy.ON_DEMAND);
		OauthServiceProvider.setNoAccessTokenPolicy(999);                 // 0 = fail, > 0 = retry after x
	});
```
* The syntax of the ngGAPI Drive calls mimics the Google JavaScript library. So you'll be reading https://developers.google.com/drive/v2/reference/files#methods and then each sub page for each method, and looking at the JavaScript tab. See **API** below for more detail. For example, a simple ngGAPI call to create a new, empty file looks something like :-
```
  DriveService.files.insert({title: 'file title', mimeType:'text/plain'})
  .promise.then(()=>{console.log('new file inserted')})
```

NB. We will be creating distributions for npm and bower soon.

### API details

The API that ngGAPI presents to your app is modelled on the Google gapi client. Generally this means that the syntax for calling a method looks like the Google JavaScript equivalent, but with the following differences:-
 | Google gapi  | ngGapi |
--| ------------- | ------------- |
call | Content Cell  | Content Cell  |
return | Content Cell  | Content Cell  |
 


### Notes on cloning and hacking this repo 
* Clone with `git clone https://github.com/pinoyyid/ngGAPI.git`
* Once the download is finished , you will need to extract the node_modules with `cd ngGAPI ; tar zxf node_modules.tar.gz`. 
* Test your environment is working with `grunt test`
* You'll need to create your own project at the [Google API Console](https://code.google.com/apis/console/b/0/) and substitute your client id at `OauthServiceProvider.setClientID('2231299-2bvf1.apps.googleusercontent.com');`

### Dev tools
If you're writing in TypeScript, you'll need the tsc compiler vers 1.4. If you're using WebStorm, you'll need WS10.

### Contributors
The library was developed by members of the [ngManila](http://www.meetup.com/Manila-AngularJS-Group/) community, specifically Sam Ong and Roy Smith.
Contributions and PR's welcome. Please note that we have developed this library in TypeScript, so any contributions must also be in TS.