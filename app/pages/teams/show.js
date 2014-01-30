'use strict';

angular.module('app')
  .config(function ($routeProvider) {
    $routeProvider
    .when('/teams/:id', {
      templateUrl: 'pages/teams/show.html',
      controller: 'BaseTeamController',
      reloadOnSearch: false
    });
  })
  .controller('TeamHomeController', function ($route, $scope, $routeParams, $api, $pageTitle, $location) {
    $scope.create_bounty_params = {};

    // pick off query string to show amount added to account
    if ($location.search().funds_added) {
      $scope.funds_added = parseInt($location.search().funds_added, 10) || undefined;
      $location.search({}).replace();
    }

    $scope.team_promise.then(function (team) {
      $pageTitle.set(team.name, 'Teams');

      // Set payment method on params so that team is the selected payment method on Bounty page
      $scope.create_bounty_params.checkout_method = "team/"+team.id;

      return team;
    });

    $scope.submit_search = function (query_url, amount) {
      $scope.create_bounty_params.amount = amount;

      if ((query_url || "").length > 0) {
        $api.search(query_url).then(function (response) {
          if (response.redirect_to) {
            var url = response.redirect_to;

            if (url[0] === '#') {
              url = '/' + url.slice(1);
            }
            url = url + "/bounty"; // take user directly to bounty create page

            //add in the amount params and redirect to create bounty page
            $location.path(url).search($scope.create_bounty_params);
          } else  if (response.create_issue) {
            $location.path("/issues/new").search({ url: query_url });
          } else {
            $location.path("/search").search({ query: query_url });
          }
        });
      }
    };
  });
