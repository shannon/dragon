angular.module('dragon.home', [
  'ui.router'
])

.config(function($stateProvider) {
  $stateProvider.state('app.home', {
    url: '',
    resolve: {
      currentUser: ['CurrentUser', function(CurrentUser){
        return CurrentUser.get().$promise;
      }]
    },
    controller: 'HomeCtrl',
    templateUrl: 'home/home.tpl.html'
  });
})

.controller('HomeCtrl', function($scope, currentUser, $materialSidenav) {
  $scope.currentUser = currentUser;
  
  $scope.toggleMenu = function() {
    $materialSidenav('menu').toggle();
  };
})

.controller('LeftCtrl', function($scope, $timeout, $materialSidenav) {
  $scope.close = function() {
    $materialSidenav('menu').close();
  };
})

;