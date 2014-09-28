angular.module('dragon.welcome', [
  'ui.router'
])

.config(function($stateProvider) {
  $stateProvider.state('app.welcome', {
    url: 'welcome',
    controller: 'WelcomeCtrl',
    templateUrl: 'welcome/welcome.tpl.html'
  });
})

.controller('WelcomeCtrl', function($scope) {
  $scope.signin = function(){
    window.location.href = '/auth/google';
  };
})

;