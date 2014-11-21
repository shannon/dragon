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
    callbackURL:  process.env.OAUTH_RETURN +'/auth/google/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    User.signIn(profile.id, 'google', accessToken, refreshToken).then(function(user){
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
  User.findById(id, function(err, user){
    done(err, user);
  });
});

var auth = new Router();

// Google OAUTH2 //////////////////////////////////////////////////////
auth.get('/google', passport.authenticate('google', {
  scope: [
    'https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/games'
  ],
  accessType: 'offline'
}));

auth.get('/google/callback', passport.authenticate('google', { successRedirect:'/', failureRedirect: '/' }));

auth.get('/logout', function *(){
  this.session = null;
});

app.use(mount(auth.middleware()));

module.exports = app;
module.exports.passport = passport;