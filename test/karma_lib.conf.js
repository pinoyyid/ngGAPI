// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2015-03-10 using
// generator-karma 0.8.3






/// THIS IS THE KARMA.CONF FOR THE LIBRARY PROPER

module.exports = function(config) {
  'use strict';

  config.set({
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'nggapi_lib/bower_components/angular/angular.js',
      'nggapi_lib/bower_components/angular-mocks/angular-mocks.js',
      'nggapi_lib/bower_components/angular-sanitize/angular-sanitize.js',
      'nggapi_lib/bower_components/sinonjs/sinon.js',
      'nggapi_lib/bower_components/jasmine-sinon/lib/jasmine-sinon.js',
      'nggapi_lib/libscripts/services/oauth_s.js',
      'nggapi_lib/appscripts/**/*.js',
      'nggapi_lib/libscripts/**/*.js',
      //'test/spec_lib/**/*.js',
      'test/spec_lib/services/drive_files.js'
    ],

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 8080,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [
      'PhantomJS'
    ],

    // Which plugins to enable
    plugins: [
      'karma-phantomjs-launcher',
      'karma-jasmine'
    ],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
  });
};
