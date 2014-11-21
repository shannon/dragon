'use strict';

var mongoose    = require('mongoose')
  , Schema      = mongoose.Schema
  , ObjectId    = Schema.Types.ObjectId
  , Q           = require('q')
  , crypto      = require('crypto')
  , google      = require('googleapis')
  , OAuth2      = google.auth.OAuth2
;
 
var userSchema = new Schema({
  auth: { type: {
    id:           String,
    provider:     String,
    accessToken:  String,
    refreshToken: String
  } },
  created:  { type: Date, default: Date.now }
}, {
  toJSON: {
    virtuals: true,
    transform: function(doc, ret, options) {
      delete ret.auth; //We don't need/want to accidentally send any oauth data across the wire
      return ret;
    }
  }
});

userSchema.statics.signIn = function(id, provider, accessToken, refreshToken){
  var User = this;
  var query = { 'auth.provider': provider, 'auth.id': id };
  
  return this.findOne(query).execQ().then(function(user){
    return user || User.register(id, provider, accessToken, refreshToken);
  });

};

userSchema.statics.register = function(id, provider, accessToken, refreshToken){
  var User = this;
  
  var user = new User({
    auth: {
      id:           id,
      provider:     provider,
      accessToken:  accessToken,
      refreshToken: refreshToken
    }
  });
  
  return user.saveQ().thenResolve(user);
};

userSchema.methods.googleAuth = function(){
  var client = new OAuth2(process.env.OAUTH_GOOGLE_ID, process.env.OAUTH_GOOGLE_SECRET, process.env.OAUTH_RETURN);
  client.setCredentials({
    access_token: this.auth.accessToken,
    refresh_token: this.auth.refreshToken
  });
  return client;
};

module.exports = mongoose.model('User', userSchema);