'use strict';

const koa         = require('koa')
    , Router      = require('koa-router')
    , session     = require('koa-session-store')
    , mongoStore  = require('koa-session-mongo')
    , bodyParser  = require('koa-bodyparser')
    , serve       = require('koa-static')
    , mount       = require('koa-mount')
    , mongoose    = require('mongoose-q')(require('mongoose'), { spread:true })
    , fs          = require('fs')
    , auth        = require('./auth')
    , api         = require('./api')
    , app         = koa()
;

mongoose.connect('mongodb://' + (process.env.MONGO_HOST || 'mongo') + '/' + (process.env.MONGO_DB || 'dragon'), function(err) {
  if (err) throw err;
  
  var sessionStore = session({
    store: mongoStore.create({
      mongoose: mongoose.connection
    })
  });
  
  app.use(bodyParser());
  
  app.keys = [process.env.COOKIE_SECRET || Math.random().toString()];
  app.use(sessionStore);
  
  app.use(auth.passport.initialize());
  app.use(auth.passport.session(sessionStore));
  
  //Request logger
  app.use(function *reqlogger(next){
    console.log('%s - %s %s', new Date().toISOString(), this.req.method, this.req.url);
    yield next;
  });
  
  app.use(Router(app));
  
  app.use(function *(next){ //serve index page for 404s
    yield next;
    
    if(this.status === 404){
      this.type = 'text/html';
      this.body = fs.createReadStream(__dirname + '/public/index.html');
      this.status = 200;
    }
  });
  
  app.get('/dragon.js', function *(next){
    this.body = fs.readFileSync(__dirname + '/dragon.js');
  });
  
  app.use(mount('/default-games', serve(__dirname + '/default-games')));
  
  app.use(serve(__dirname + '/public'));
  
  app.use(mount('/auth', auth));
  app.use(mount('/api', api));
  
  app.listen(process.env.WEB_PORT || 80, function(){
    console.log('Listening on port ', process.env.WEB_PORT || 80);
  });
  
});