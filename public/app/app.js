angular.module( 'dragon', [
  // 'dragon.api.v1',
  'dragon.error',
  'dragon.game',
  // 'dragon.welcome',
  // 'dragon.home',
  'dragon.avatar',
  'dragon.board',
  'ngAnimate',
  'ngMaterial',
  'ngTouch',
  'ngCookies',
  'hmTouchEvents',
  'templateImport',
  'ui.router',
  'uuid4'
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
      defaultGame: ['$http', function($http){
        return $http.get('/default-games/game-0.0.1.json').then(function(result){
          return result.data;
        });
      }],
      games: function(){
        return [];
      }
    }
  });
  
})

.controller('DragonCtrl', function($scope, $mdBottomSheet, $cookies, $state, $window, uuid4, localDB, games, defaultGame){
  
  $scope.support = {
    cookies:        $window.navigator.cookieEnabled,
    indexedDB:      !!$window.indexedDB,
    serviceWorker:  !!$window.navigator.serviceWorker
  };
  
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
    if(save){
      localDB.open().then(function(){
        return localDB.sync($scope.games);
      }).catch(function(){
        $scope.data.saveLocal = false;
      });
    }
  });
  
  $scope.newGame = function(){
    var id = uuid4.generate();
    var game = new dragon.Game(defaultGame);
    
    game._id = id;
    game.created = new Date();
    game.modified = new Date();
    
    $scope.games.unshift(game);
    $scope.openGame(id);
  };
  
  $scope.openGame = function(game){
    $state.go('app.game', { game: game });
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

.factory('gameSync', function(){
  
  //mem -> localDB
  //if new in mem, add to localDB
  //if del in mem, remove from localDB and mem
  //if in localDB and not in mem, add to mem
  //if in both sync, latest move takes precedence
  
  function find(arr, iterator, context){
    for(var i = 0, l = arr.length; i < l; i++){
      if(iterator.call(context, arr[i], i, arr)){
        return arr[i];
      }
    }
  }
  
  function findById(arr, id){
    return find(arr, function(item){
      return item._id == id || item.id == id;
    });
  }
  
  return function(src, dest, onAdd){
    src.forEach(function(srcGame){
      var destGame = findById(dest, srcGame._id);
      if(!destGame){
        srcGame = angular.copy(srcGame);
        if(onAdd(srcGame)){
          dest.push(srcGame);
        }
      }
    });
  };
})

.directive('contenteditable', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {

      function read() {
        ngModel.$setViewValue(element.html());
      }

      ngModel.$render = function() {
        element.html(ngModel.$viewValue || '');
      };

      element.bind('blur keyup change', function() {
        scope.$apply(read);
      });
    }
  };
})

.factory('localDB', function($window, $q, $rootScope){
  var db = null, deferred = null;
  
  var api = {
    open: function(){
      deferred = $q.defer();
      
      var request = $window.indexedDB.open('dragon', 1);
  
      request.onerror = function(e){
        console.log(e);
        $rootScope.$apply(function(){
          deferred.reject(e);
        });
      };
    
      request.onsuccess = function(e){
        db = e.target.result;
        $rootScope.$apply(function(){
          deferred.resolve();
        });
      };
      
      request.onupgradeneeded = function(event) {
        var db = event.target.result;
        var objectStore = db.createObjectStore('games', { keyPath: '_id' });
      };
      
      return deferred.promise;
    },
    save: function(game){
      var deferred    = $q.defer();
      var transaction = db.transaction(['games'], 'readwrite');
      var store       = transaction.objectStore('games');
      
      store.put(game);
        
      transaction.oncomplete = function(event) {
        deferred.resolve(game);
      };
      
      transaction.onerror = function(event) {
        deferred.reject(event);
      };
      
      return deferred.promise;
    },
    remove: function(game){
      var deferred    = $q.defer();
      var transaction = db.transaction(['games'], 'readwrite');
      var store       = transaction.objectStore('games');
      
      store.delete(game._id);
        
      transaction.oncomplete = function(event) {
        deferred.resolve();
      };
      
      transaction.onerror = function(event) {
        deferred.reject(event);
      };
      
      return deferred.promise;
    },
    sync: function(localGames){
      var deferred    = $q.defer();
      var transaction = db.transaction(['games'], 'readwrite');
      var store       = transaction.objectStore('games');

      store.getAll().onsuccess = function(event) {
        var dbGames = event.target.result;
        
        dbGames.forEach(function(dbGame){
          var localGame = angular.findById(localGames, dbGame.value._id);
          if(!localGame){
            localGames.push(dbGame);
          } else {
            
          }
        });

      };
      
      transaction.oncomplete = function(event) {
        deferred.resolve();
      };
      
      transaction.onerror = function(event) {
        deferred.reject(event);
      };
      
      return deferred.promise;
    }
  };

  return api;
})
;