'use strict';

const koa   = require('koa')
    , mount = require('koa-mount')
    , v1    = require('./v1')
    , app   = koa()
;

app.use(mount('/v1', v1));

module.exports = app;