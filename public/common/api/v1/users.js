angular.module('dragon.api.v1.users', [
  'ngResource'
])

.factory('CurrentUser', ['$resource', '$http', 'ApiConfig',
  function($resource, $http, ApiConfig) {
    
    return $resource(ApiConfig.base + '/user').$subresource({
      Friend: $resource(ApiConfig.base + '/user/friends/:username', { username: '@profile.username' })
    });
    
  }
])

.factory('User', ['$resource', 'ApiConfig', function($resource, ApiConfig) {
  return $resource(ApiConfig.base + '/users/:user', { user: '@profile.username' }, {
    //search: { method: 'GET', isArray: true, url: ApiConfig.base + '/search/users' }
  });
}])

;