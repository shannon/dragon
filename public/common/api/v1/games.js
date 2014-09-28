angular.module('dragon.api.v1.games', [
  'ngResource'
])

.factory('Game', ['$resource', '$http', 'ApiConfig', 'Player',
  function($resource, $http, ApiConfig) {
    
    return $resource(ApiConfig.base + '/games/:game', { game: '@_id' }).$subresource({
      Action: $resource(ApiConfig.base + '/games/:game/action'),
      Player: Player
    });
    
  }
])

.factory('Player', ['$resource', '$http', 'ApiConfig',
  function($resource, $http, ApiConfig) {
    
    return $resource(ApiConfig.base + '/games/:game/players/:username', { username: '@profile.username'}).$subresource({
      General: $resource(ApiConfig.base + '/games/:game/players/:username/general')
    });
    
  }
])

;