## ngGAPI - Google APIs for AngularJS done the Angular way

### Quick Start
* Download and unzip https://github.com/pinoyyid/ngGAPI/blob/nggapi_lib/nggapi_dist.zip?raw=true . 
This will create a folder `/nggapi_lib/dist_lib/` containing the two minified files that comprise the ngGAPI Drive library.
* In your HTML, `nggapi-base.min.js` must be loaded before your app declaration, and `nggapi-drive.min.js` must be loaded afterwards. e.g.
```
        <script src="nggapi-base.min.js"></script>
        <script src="app.js"></script>
        <script src="nggapi-drive.js"></script>
```
* If you are developing in TypeScript, you'll want to reference the definition file from `nggapi-interfaces/drive_interfaces.d.ts`
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
* The syntax of the ngGAPI Drive calls mimics the Google JavaScript library. 
So you'll be reading https://developers.google.com/drive/v2/reference/files#methods and then each sub page for each method, 
and looking at the JavaScript tab. See **API details** below for more detail. 
For example, a simple ngGAPI call to create a new, empty file looks something like :-
```
  DriveService.files.insert({title: 'file title', mimeType:'text/plain'})
  .promise.then(()=>{console.log('new file inserted')})
```

NB. We will be creating distributions for npm and bower soon.

### API details

The API that ngGAPI presents to your app is modelled on the Google gapi client. Generally this means that the syntax for calling a method looks like the Google JavaScript equivalent, but with the following differences:-

 | Google gapi  | ngGapi 
---| ------------- | ------------- 
call | gapi.client.drive.files.patch  | DriveService.files.patch <br>//(where "DriveService" is the injected service name)
return | A callback function  | A `ResponseObject` containing a promise and the response data ({promise:ng.IPromise, data:NgGapi.IDriveFile})   
validation | None. Whatever you submit is sent to Google | Some. We detect some common errors (eg. a missing fileId for a GET and throw an exception)

Example: Here is the Get method being used to retrieve a file in both Google gapi amd ngGAPI
```
// Google gapi
function getFile(fileId) {
 var request = gapi.client.drive.files.get({
    'fileId': fileId
  });
  request.execute(function(resp) {
    console.log('Title: ' + resp.title);
  });
}
```

```
// NgGAPI
function getFile(fileId) {
 var request = DriveService.files.get({
    'fileId': fileId
   }).then((resp)=>{console.log('Title: ' + resp.title)});
}
```

However, in AngularJS, you generally want to use data binding to display information in the same way that $resource does. 
In that case, the above example can be simplified to:-

```
// NgGapi assigning directly to the viewmodel
function getFile(fileId, $scope) {
 $scope.fetchedFile = DriveService.drive.files.get({ 'fileId': fileId }).data;
}
```

So the key points to remember are that all calls look like their gapi equivalents (so refer to the Google documentation for specifics on the parameters), 
and that they all return a ResponseObject containing a promise and the data.

### OAuth2
In order to access any Google API, your application needs an access token. 
With ngGAPI, this is as simple as setting your client ID and required scopes.
```
angular.module('ngm.NgGapi')
	.provider('OauthService', NgGapi.Config)
	.config(function (OauthServiceProvider) {
		OauthServiceProvider.setScopes('https://www.googleapis.com/auth/drive.file');
		OauthServiceProvider.setClientID('2231299-2bvf1.apps.googleusercontent.com');
	});
```
There are other options you can set to control the behaviour of OAuth if the defaults aren't appropriate.
```
angular.module('ngm.NgGapi')
	.provider('OauthService', NgGapi.Config)
	.config(function (OauthServiceProvider) {
	// Set the desired scopes using a space-separated list of scopes
		OauthServiceProvider.setScopes('https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly');
	// set the client ID as obtained from the Google API Console
		OauthServiceProvider.setClientID('2231299-2bvf1.apps.googleusercontent.com');
	// Configure how the access token should be refreshed, options are:-
	//     TokenRefreshPolicy.ON_DEMAND:        The token will be allowed to expire and then refreshed after a 401 failure
	//     TokenRefreshPolicy.PRIOR_TO_EXPIRY : The token will be refreshed shortly before it is due to expire, preventing any 401's
		OauthServiceProvider.setTokenRefreshPolicy(NgGapi.TokenRefreshPolicy.ON_DEMAND);
	// Configure what a request should do if there is no access token
	//    ms=0: The request will fail and return an error to the application to deal with
	//    ms>0: The request will be retried 10 times with a delay of ms milliseconds. The default is ms=500
		OauthServiceProvider.setNoAccessTokenPolicy(1000);                 
	// provide your own function to return an access token. myFunction should return a string which will be set into the Authorization Bearer header 
		OauthServiceProvider.setGetAccessTokenFunction: function (myFunction) {
	});
```

One of the problems developing applications that access Google Drive is how to achieve headless, end-to-end 
testing when acquiring an access token generally requires a logged in browser session. 
ngGAPI deals with this by allowing you to set a refresh token and client secret directly into the configuration, which allows your
app to acquire access tokens without being logged in. See [This StackOverflow answer](http://stackoverflow.com/questions/19766912/how-do-i-authorise-a-background-web-app-without-user-intervention-canonical/19766913#19766913)
for the steps required to get a refresh token.

	// set your own credentials for unattended e2e testing. NB, for security, the credentials should be stored in a separate .js file which is in .gitignore 
		OauthServiceProvider.setTestingRefreshToken(MY_REFRESHTOKEN).
		OauthServiceProvider.setTestingClientSecret(MY_CLIENTSECRET)


### FAQ
#### Does ngGAPI wrap Google the gapi library?
No. One of the motivations of writing ngGAPI was to reduce the dependency on unsupported, closed source libraries. By using ngGAPI (which is open), 
which directly calls AngularJS $http (which is also open), you have access to the source code of your entire stack. 
The other reason was that Google gapi hides the underlying http transport, so for example, timeouts are not configurable. 
With ngGAPI, the full stack is exposed to your application.

Note that we **do** use the gapi auth library for OAuth, as this deals with a lot of the Google specific session handling and iframing required.

#### So does this mean I don't need to read all the Google Documentation?
Not at all. In order to successfully use Google Drive, you still need to understand its capabilities and behaviours, as well as the specific parameters required
to invoke those capabilities and behaviours. What ngGAPI gives is a sensible way to deliver those parameters and deal with the response in an AngularJS fashion.
We've patterned our API on gapi to make it easier to migrate existing projects and to provide a "key" into the Google documentation.

#### I still don't get how to do OAuth?
You're not alone. Luckily, we think we've done a pretty good job of removing the need to know too much. 
If your project is set up on Google API Console (ie. you have a client ID), and you've set the client ID and scopes as described above, it will Just Work&trade;

#### Show me the code
We've created two sample apps for you to look at.

The first is [minimal app](https://github.com/pinoyyid/ngGAPI/blob/master/nggapi-lib/minimal.html) which strips it all down so all of the code lives within the HTML page.
This example shows fetching a list of Drive files and displaying the. 

The second is [fuller app](https://github.com/pinoyyid/ngGAPI/blob/master/nggapi-lib/index.html) which does most of its work in [this controller](https://github.com/pinoyyid/ngGAPI/blob/master/nggapi-lib/appscripts/controllers/maximal_c.ts).

If you want to run either of these, you'll need to:-
1. Replace the client ID with your own 
1. Serve them from a URL origin that has been configured into your Google API Console


#### How do I get help?
Post a question on StackOverflow using the "google-drive-sdk" tag. If you've found a problem, please raise an issue here on GitHub.

#### How do I thank you enough?
Just doing our job ma'am.

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