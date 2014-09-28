'use strict';

var mongoose    = require('mongoose')
  , Schema      = mongoose.Schema
  , ObjectId    = Schema.Types.ObjectId
  , Q           = require('q')
  , crypto      = require('crypto')
;
 
var userSchema = new Schema({
  superadmin: Boolean,
  
  auth: { type: {
    id:           String,
    provider:     String
  }, select: false },
  
  profile: {
    username: { type: String, index: { text: true } },
    name:     { type: String, index: { text: true } },
    picture:  { type: String }
  },

  private: { type: {
    email:              { type: String },
    verifiedEmails:     { type: [ String ] },
    dismissedMessages:  { type: [ String ] },
  }, select: false },
  
  friends: { type: [{ type: ObjectId, ref: 'User' }], select: false },
  
  indexedName:    { type: String, unique: true, required: true }, //unique and always lowercase
  
  modified: { type: Date, default: Date.now },
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

userSchema.statics.REGEX_USERNAME = /(?:^-|[^a-zA-Z0-9\-])/g;

userSchema.virtual('profile.gravatar').get(function(){
  var id = this.get('profile.email') || this._id.toString();
  return crypto.createHash('md5').update(id.trim().toLowerCase()).digest('hex');
});

userSchema.statics.signIn = function(provider, id, name, email, picture){
  var User = this;
  var query = { 'auth.provider': provider, 'auth.id': id };
  
  return this.findOne(query).execQ().then(function(user){
    return user || User.register(provider, id, name, email, picture);
  });

};

userSchema.statics.register = function(provider, id, name, email, picture){
  var User = this;
  var username = name.toLowerCase().replace(User.REGEX_USERNAME, '');
  
  var user = new User({
    auth: {
      id:       id,
      provider: provider
    },
    profile: {
      username: username,
      name:     name,
      picture:  picture
    },
    private: {
      email:    email,
      verifiedEmails: [ email ]
    },
    indexedName: username
  });
  
  return user.saveQ().catch(function recurse(error){
    if(error.lastErrorObject.code === 11000 || error.lastErrorObject.code === 11001){
      //increment a numeral at the end of the username
      var numeral = parseInt(($set['profile.username'].match(/(\d+?)$/) || [0])[0], 10) + 1;
      
      user.profile.username = user.profile.username + numeral;
      user.indexedName      = user.profile.username;
      
      return user.saveQ().catch(recurse);
    }
    return Q.reject(error);
    
  }).thenResolve(user);
};

module.exports = mongoose.model('User', userSchema);