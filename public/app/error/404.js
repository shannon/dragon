angular.module('dragon.error.404', [
  'ui.router'
])

.config(function($stateProvider) {
  $stateProvider.state('app.error.404', {
    controller: '404Ctrl',
    templateUrl: 'error/404.tpl.html'
  });
})

.controller('404Ctrl', function($scope) {
})

;