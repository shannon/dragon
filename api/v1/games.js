'use strict';

const koa     = require('koa')
    , mount   = require('koa-mount')
    , Router  = require('koa-router')
    , User    = require('../../models/user')
    , Game    = require('../../models/game')
    , app     = koa()
;

var router = new Router();

router.param('game', function *(id, next) {
  this.api.game = yield Game.findById(id).populate('players.user').execQ();
  if(!this.api.game) { return this.throw('game not found', 404); }
  yield next;
});

router.param('player', function *(username, next) {
  var user = yield User.findQ({ indexedName: username.toLowerCase() });
  if(!user) { return this.throw('user not found', 404); }
  
  this.api.player = this.api.game.players.id(user._id);
  if(!this.api.player) { return this.throw('player not found', 404); }
  yield next;
});
  

// GET /games
router.get('/games', function *(next){
  this.body = yield Game.findQ({ 'players.user': this.req.user._id });
});

// POST /games
router.post('/games', function *(next){
  this.body = yield new Game({
    owner: this.req.user._id,
    players: [{ _id: this.req.user._id, user: this.req.user._id }]
  }).saveQ();
});

// GET /game/:game
router.get('/games/:game', function *(next){
  this.body = this.api.game;
});


router.register('/games/:game/*', ['post', 'put', 'delete'], function *(next){
  //only game players can perform these actions
  this.api.currentPlayer = this.api.game.players.id(this.req.user._id);
  
  if(!this.api.currentPlayer){
    return this.throw('access denied', 403);
  }
  
  yield next;
});

router.post('/games/:game/players', function *(next){
  if(!this.req.body.username) { return this.throw('username required', 406); }
  
  var user = yield User.findQ({ indexedName: this.req.body.username.toLowerCase() });
  if(!user) { return this.throw('user not found', 404); }
  
  var player = { _id: user._id, user: user._id };
  
  yield Game.updateQ({ $addToSet: { players: player } }).then(function(numModified){
    if(numModified){
      this.api.game.players.addToSet(player);
      //TODO: Send notification
    }
  });
  
  this.body = this.api.game;
});

router.delete('/games/:game/players/:player', function *(next){
  
  yield this.api.game.updateQ({ $pull: { players: { _id: this.api.player._id } } }).then(function(numModified){
    
  });
  
  this.body = 'player removed';
});


app.use(mount(router.middleware()));

module.exports = app;