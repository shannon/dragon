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

.controller('HomeCtrl', function($scope, currentUser, $mdSidenav) {
  $scope.currentUser = currentUser;
  $scope.board = new dragon.Board(16);
  
  $scope.toggleMenu = function() {
    $mdSidenav('menu').toggle();
  };
})

.controller('LeftCtrl', function($scope, $timeout, $mdSidenav) {
  $scope.close = function() {
    $mdSidenav('menu').close();
  };
})

;