'use strict';

const koa     = require('koa')
    , mount   = require('koa-mount')
    , Router  = require('koa-router')
    , User    = require('../../models/user')
    , app     = koa()
;

var router = new Router();

router.get('/user', function *(next){
  this.body = this.req.user;
});

router.get('/user/friends', function *(next){
  this.body = yield this.req.user.populateQ('friends').thenResolve(this.req.user.friends);
});

// POST /friends
router.post('/user/friends', function *(next){
  if(!this.query.username){
    return this.throw('you must specify a username', 406);
  }
  var user = yield User.findOneQ({ 'profile.username': this.req.query.username });
  if(!user){
    return this.throw('user not found', 404);
  } else {
    yield this.req.user.updateQ({ $addToSet: { friends: user._id } });
    this.body = user;
  }
});

// DELETE /friends/:username
router.delete('/user/friends/:username', function *(next){
  var user = yield User.findOneQ({ 'profile.username': this.params.username });
  if(!user){
    return this.throw('user not found', 404);
  } else {
    yield this.req.user.updateQ({ $pull: { friends: user._id } });
    this.body = 'friend removed';
  }
});

router.get('/users/:username', function *(next){
  this.body = yield User.find({ 'profile.username': this.params.username }).execQ();
});

app.use(mount(router.middleware()));

module.exports = app;