angular.module( 'dragon', [
  // 'dragon.api.v1',
  'dragon.error',
  'dragon.welcome',
  'dragon.home',
  'dragon.avatar',
  'dragon.board',
  'ngAnimate',
  'ngMaterial',
  'ngTouch',
  'ngCookies',
  'hmTouchEvents',
  'templateImport',
  'ui.router'
])

.run(function($rootScope, $state, $location) {
  // $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
  //   if($state.is('app')){
  //     $state.go('app.home');
  //   }
  // });
  // $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
  //   if(error.status === 401){
  //     $state.go('app.home');
  //   } else if(error.status === 404) {
  //     $state.go('app.error.404');
  //   } else {
  //     console.log('Unknown stateChangeError', toState, fromState, error);
  //     $state.go('app.error', { status: error.status, error: error.data });
  //   }
  //   event.preventDefault();
  // });
})

.config(function($stateProvider, $urlRouterProvider, $locationProvider){
  $locationProvider.html5Mode(true).hashPrefix('!');
  $urlRouterProvider.otherwise('/');
  
  $stateProvider.state('app', {
    url: '/',
    controller: 'DragonCtrl',
    templateUrl: 'app.tpl.html',
    resolve: {
      games: function(){
        return [];
      }
    }
  });
  
})

.controller('DragonCtrl', function($scope, $mdBottomSheet, $cookies, games){
  $scope.$root.cookieEnabled = navigator.cookieEnabled;
  
  $scope.games = games;
  
  $scope.showBottomSheet = function($event) {
    $mdBottomSheet.show({
      controller: 'BottomSheetCtrl',
      templateUrl: 'bottom-sheet.tpl.html',
      targetEvent: $event
    }).then(function(item) {
      $scope.$broadcast(item.broadcast);
    });
  };
  
  $scope.data = {};
  $scope.data.saveLocal = $cookies.saveLocal === 'true';
  
  $scope.$watch('data.saveLocal', function(save){
    $cookies.saveLocal = save;
  });
  
  $scope.newGame = function(){
    $scope.games.unshift(new dragon.Game([1, 2]));
    $scope.openGame(0);
  };
  
  $scope.openGame = function(index){
    console.log('open game', index);
  };
})

.controller('BottomSheetCtrl', function($scope, $mdBottomSheet){
  $scope.items = [
    { name: 'Restart Game',  icon: '', broadcast: 'game:restart' },
  ];
  
  $scope.listItemClick = function($index) {
    $mdBottomSheet.hide($scope.items[$index]);
  };
  
})
;