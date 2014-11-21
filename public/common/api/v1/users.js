angular.module('dragon.api.v1.users', [
  'ngResource'
])

.factory('CurrentUser', ['$resource', '$http', 'ApiConfig',
  function($resource, $http, ApiConfig) {
    
    return $resource(ApiConfig.base + '/user').$subresource({
      Friend: $resource(ApiConfig.base + '/user/friends/:friend', { friend: '@id' })
    });
    
  }
])

;