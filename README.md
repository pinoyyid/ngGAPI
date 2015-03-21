## ngGAPI - Google APIs for AngularJS done the Angular way

### Notes on Cloning this repo (thanks Sam)
* Decide if you want to work in this repo (make sure you understand git first), or you want to fork a private copy
* Clone with `git clone https://github.com/pinoyyid/ngGAPI.git`
* Once the download is finished (24MB or so), you will need to extract the node_modules with `cd ngGAPI ; tar zxf node_modules.tar.gz`. 
* Test your environment is working with `grunt test`
* You can also run up a web server `python -m SimpleHTTPServer  8888&` and connect to my dev app at `http://dev.clevernote.co:8888/nggapi-lib/index.html`. NB You will need to add dev.clevernote.co as an alias of localhost in your /etc/hosts file. This is because Google OAuth will only run from pre-configured origins.

### Dev tools
If you're writing in TypeScript, you'll need the tsc compiler vers 1.4. If you're using WebStorm, you'll need the beta of WS10.
