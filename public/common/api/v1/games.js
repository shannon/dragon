angular.module('dragon.api.v1.games', [
  'ngResource'
])

.factory('Game', ['$resource', '$http', 'ApiConfig',
  function($resource, $http, ApiConfig) {
    return $resource(ApiConfig.base + '/games/:game', { game: '@id' });
  }
])

;