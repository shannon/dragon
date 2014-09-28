'use strict';

const koa             = require('koa')
    , passport        = require('koa-passport')
    , Router          = require('koa-router')
    , mount           = require('koa-mount')
    , GoogleStrategy  = require('passport-google-oauth').OAuth2Strategy
    , User            = require('./models/user')
    , app             = koa()
;

passport.use(new GoogleStrategy({
    clientID:     process.env.OAUTH_GOOGLE_ID,
    clientSecret: process.env.OAUTH_GOOGLE_SECRET,
    callbackURL:  'https://' + process.env.HOSTNAME +'/auth/google/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    User.signIn('google', profile.id , profile.displayName, profile.emails[0].value, profile._json.picture).then(function(user){
      done(null, user);
    }).catch(function(error){
      return done(error, false);
    });
  })
);

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id).select('+private +friends').exec(function(err, user){
    done(err, user);
  });
});

var auth = new Router();

// Google OAUTH2 //////////////////////////////////////////////////////
auth.get('/google', passport.authenticate('google', {
  scope: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
}));

auth.get('/google/callback', passport.authenticate('google', { successRedirect:'/', failureRedirect: '/' }));

auth.get('/logout', function *(){
  this.session = null;
});

app.use(mount(auth.middleware()));

module.exports = app;
module.exports.passport = passport;