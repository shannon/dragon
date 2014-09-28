'use strict';

const koa     = require('koa')
    , mount   = require('koa-mount')
    , Router  = require('koa-router')
    , User    = require('../../models/user')
    , Game    = require('../../models/game')
    , app     = koa()
;

var router = new Router();

// DELETE /games/:game
router.param('game', function *(id, next) {
  this.api.game = Game.findById(id).populate('players.user').execQ();
  if(!this.api.game) { return this.throw('game not found', 404); }
  yield next;
});
  

// GET /games
router.get('/games', function *(next){
  this.body = yield Game.findQ({ 'players.user': this.req.user._id });
});

// POST /games
router.post('/games', function *(next){
  this.body = yield new Game({ owner: this.req.user._id, players: [{ user: this.req.user._id }] }).saveQ();
});

router.get('/games/:game', function *(next){
  this.body = this.api.game;
});

router.register('/games/:game/*', ['post', 'put', 'delete'], function *(next){
  //only game players can perform these actions
  var canAct = this.api.game.players.some(function(player){
    return player.user._id.equals(this.req.user._id);
  }, this);
  
  if(!canAct){
    return this.throw('access denied', 403);
  }
  
  yield next;
});


app.use(mount(router.middleware()));

module.exports = app;