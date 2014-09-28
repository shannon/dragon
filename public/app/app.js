angular.module( 'dragon', [
  'dragon.api.v1',
  'dragon.error',
  'dragon.welcome',
  'dragon.home',
  'dragon.avatar',
  
  'ngAnimate',
  'ngMaterial',
  'templateImport',
  'ui.router'
])

.run(function($rootScope, $state, $location) {
  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
    if($state.is('app')){
      $state.go('app.home');
    }
  });
  $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
    if(error.status === 401){
      $state.go('app.welcome');
    } else if(error.status === 404) {
      $state.go('app.error.404');
    } else {
      console.log('Unknown stateChangeError', toState, fromState, error);
      $state.go('app.error', { status: error.status, error: error.data });
    }
    event.preventDefault();
  });
})

.config(function($stateProvider, $urlRouterProvider, $locationProvider){
  $locationProvider.html5Mode(true).hashPrefix('!');
  $urlRouterProvider.otherwise('/');
  
  $stateProvider.state('app', {
    url: '/',
    controller: 'DragonCtrl',
    templateUrl: 'app.tpl.html'
  });
  
})

.controller("DragonCtrl", function(){
  
})

;