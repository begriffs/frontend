'use strict';

angular.module('app')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/notifications/unsubscribe', {
        templateUrl: 'pages/notifications/unsubscribe.html',
        controller: 'NotificationsController'
      });
  }).controller('NotificationsController', function($scope, $routeParams, $api, $pageTitle) {
    $pageTitle.set("Unsubscribe from Bountysource Emails");

    $scope.email = $routeParams.email;
    $scope.approved = false;

    $scope.unsubscribe = function() {
      $scope.approved = true;
      $scope.processing = true;

      $api.notification_unsubscribe($routeParams.type, { email: $scope.email }).then(function(success) {
        $scope.processing = false;
        $scope.success = success;
        return success;
      });
    };
  });