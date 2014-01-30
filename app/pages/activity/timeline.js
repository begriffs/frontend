'use strict';

angular.module('app')
  .config(function ($routeProvider, $person) {
    $routeProvider
      .when('/activity', {
        templateUrl: 'pages/activity/timeline.html',
        controller: 'Activity',
        resolve: $person
      });
  })
  .controller('Activity', function($scope, $routeParams, $api, $pageTitle) {
    $pageTitle.set('Timeline', 'Activity');

    $api.person_activity($scope.current_person.id).then(function(timeline) {
      $scope.timeline = timeline;
      return timeline;
    });
  });

