'use strict';

const koa     = require('koa')
    , mount   = require('koa-mount')
    , Users   = require('./users')
    , Games   = require('./games')
    , app     = koa()
;

app.use(function *(next){
  if (this.req.isAuthenticated()){
    this.api = {};
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

