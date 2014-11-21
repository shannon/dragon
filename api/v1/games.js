'use strict';

const koa     = require('koa')
    , mount   = require('koa-mount')
    , Router  = require('koa-router')
    , User    = require('../../models/user')
    , Game    = require('../../models/game')
    , app     = koa()
    , Q       = require('q')
;

var router = new Router();

router.param('game', function *(id, next) {
  this.api.game = yield Q.ninvoke(this.api.games.turnBasedMatches, 'get', { matchId: id }).spread(function(game){
    return game;
  }).catch(this.api.error);

  yield next;
});

// GET /games
router.get('/games', function *(next){
  this.body = yield Q.ninvoke(this.api.games.turnBasedMatches, 'list', { }).spread(function(results){
    return results.items;
  }).catch(this.api.error);
});

// POST /games
router.post('/games', function *(next){
  this.body = yield Q.ninvoke(this.api.games.turnBasedMatches, 'create', {
    'kind': 'games#turnBasedMatchCreateRequest',
    'invitedPlayerIds':     this.req.body.players,
    'autoMatchingCriteria': this.req.body.players ? {
      'kind': 'games#turnBasedAutoMatchingCriteria',
      'minAutoMatchingPlayers': 1,
      'maxAutoMatchingPlayers': 1
    } : undefined
  }).spread(function(results){
    return results;
  }).catch(this.api.error);
});

// GET /game/:game
router.get('/games/:game', function *(next){
  this.body = this.api.game;
});

app.use(mount(router.middleware()));

module.exports = app;