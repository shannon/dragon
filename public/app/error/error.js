angular.module('dragon.error', [
  'dragon.error.404',
  'ui.router'
])

.config(function($stateProvider) {
  $stateProvider.state('app.error', {
    params: ['status', 'error'],
    controller: 'ErrorCtrl',
    templateUrl: 'error/error.tpl.html'
  });
})

.controller('ErrorCtrl', function($scope, $stateParams) {
  $scope.status = $stateParams.status;
  $scope.error = $stateParams.error;
})

;