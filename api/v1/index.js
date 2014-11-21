'use strict';

const koa     = require('koa')
    , mount   = require('koa-mount')
    , Users   = require('./users')
    , Games   = require('./games')
    , app     = koa()
    , google  = require('googleapis')
;

app.use(function *(next){
  var self = this;
  
  if (this.req.isAuthenticated()){
    this.api = {};
    this.api.plus   = google.plus({ version: 'v1', auth: this.req.user.googleAuth() });
    this.api.games  = google.games({ version: 'v1', auth: this.req.user.googleAuth() });
    
    this.api.error = function(error){
      this.status = error.code;
      return error.message;
    }.bind(this);
    
    yield next;
    
    if(this.status === 404){
      this.status = 501;
    }
    
  } else {
    this.throw('not logged in', 401);
  }
});

app.use(mount(Users));
app.use(mount(Games));

module.exports = app;

