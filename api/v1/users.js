'use strict';

const koa     = require('koa')
    , mount   = require('koa-mount')
    , Router  = require('koa-router')
    , Q       = require('q')
    , User    = require('../../models/user')
    , app     = koa()
    , google  = require('googleapis')
;

var router = new Router();

router.get('/user', function *(next){
  this.body = yield Q.ninvoke(this.api.plus.people, 'get', { userId: 'me' }).spread(function(results){
    return results;
  }).catch(this.api.error);
});

router.get('/user/friends', function *(next){
  this.body = yield Q.ninvoke(this.api.plus.people, 'list', { userId: 'me', collection: 'visible' }).spread(function(results){
    return results.items;
  }).catch(this.api.error);
});


router.get('/user/friends/:friend', function *(next){
  this.body = yield Q.ninvoke(this.api.plus.people, 'get', { userId: this.params.friend }).spread(function(results){
    return results;
  }).catch(this.api.error);
});

app.use(mount(router.middleware()));

module.exports = app;