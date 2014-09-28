angular.module('dragon.api.v1', [
  'dragon.api.v1.users',
  'dragon.api.v1.games',
  'ngResource'
])

.provider('ApiConfig', function(){
  var config = {
    base: '/api/v1'
  };
  
  return {
    set: function(values){
      angular.extend(config, values);
    },
    $get: function(){
      return config;
    }
  };
})

.factory('api', [
  function(){
    var REGEX_RANGE = /(\d+)-(\d+)\/(\d+)/;
    
    return {
      parseRangeHeader: function(results, getResponseHeaders){
        var range = getResponseHeaders()['content-range'];
        if(range){
          var match = range.match(REGEX_RANGE);
          results.$range = {
            start:  match[1],
            end:    match[2],
            total:  match[3]
          };
        }
        return results;
      }
    };
  }
])

.config(['$provide', '$httpProvider', function($provide, $httpProvider){
  $httpProvider.defaults.withCredentials = true;
  
  $provide.decorator('$resource', function($delegate){
    /**
     * ngResource does not provide us with any easy way to extend options passed into a resource so creating
     * subresources is very difficult. This first thing we do is store a reference to the options on $def.
     * Then we have to determine when a new instance is created (i.e. the only way a sub resource makes any sense)
     * so we wrap the hasOwnProperty method which is called during a angular.forEach call within ngResource.
     * It also just so happens that this happens before anything else so it's a good place to start. Then we
     * create new subresource objects on the prototype with extended param functions that wrap the correct
     * instance for retrieving data. The $def references allow us to do this recursively and lazily.
     *
     * TL:DR; Black.Fucking.Magic.
     *
     * --Shannon
     */
     
     
    /********************* Borrowed code from https://github.com/angular/angular.js *********************/
    var $resourceMinErr = angular.$$minErr('$resource');

    var MEMBER_NAME_REGEX = /^(\.[a-zA-Z_$][0-9a-zA-Z_$]*)+$/;
    
    function isValidDottedPath(path) {
      return (path !== null && path !== '' && path !== 'hasOwnProperty' &&
          MEMBER_NAME_REGEX.test('.' + path));
    }
    
    function lookupDottedPath(obj, path) {
      if (!isValidDottedPath(path)) {
        throw $resourceMinErr('badmember', 'Dotted member path "@^{0}" is invalid.', path);
      }
      var keys = path.split('.');
      for (var i = 0, ii = keys.length; i < ii && obj !== undefined; i++) {
        var key = keys[i];
        obj = (obj !== null) ? obj[key] : undefined;
      }
      return obj;
    }
    /*************************************************************************************************/
    
    return function $resource(url, params, actions){
      var resource = $delegate.apply(null, arguments);
      
      //store references to options
      resource.$def = {
        url: url,
        params: angular.copy(params) || {},
        actions: angular.copy(actions) || {},
        sub: {}
      };
      
      //we can use this to detect when a new instance has been initiated
      resource.prototype['hasOwnProperty'] = function(){
        if(!this.$def){
          
          this.$def = angular.copy(resource.$def);
          
          angular.forEach(this.$def.params, function(value, key){
            var instance = this;
            
            if(typeof value === 'string' && value.charAt(0) === '@'){
              this.$def.params[key] = function(){
                return lookupDottedPath(instance, value.substr(1));
              };
            }
          }, this);
          
          //go through subresources and attach references
          angular.forEach(this.$def.sub, function(sub, name){
            
            sub = $resource(sub.$def.url, angular.extend({}, sub.$def.params, this.$def.params), sub.$def.actions)
                          .$subresource(sub.$def.sub);
            
            //use Object.defineProperty to avoid enumeration and subsequent deletion by ng-resource
            Object.defineProperty(this, name, {
              get: function(){
                return sub;
              },
              configurable: true
            });
          }, this);
          
        }
        return Object.prototype.hasOwnProperty.apply(this, arguments);
      };
      
      resource.$subresource = function $subresource(subresources){
        resource.$def.sub = angular.extend({}, resource.$def.sub, subresources);
        return resource;
      };
      
      return resource;
    };
  });
}])

;