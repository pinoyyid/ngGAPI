'use strict';

/**
 * @ngdoc overview
 * @name delme4App
 * @description
 * # delme4App
 *
 * Main module of the application.
 */
angular
  .module('delme4App', [
    'ngRoute',
    'ngSanitize'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
