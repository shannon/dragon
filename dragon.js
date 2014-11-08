(function(exports){
  'use strict';
  
  exports.version = '0.0.1';
  
  var REVERSE = {
    n:  's',
    ne: 'sw',
    e:  'w',
    se: 'nw',
    s:  'n',
    sw: 'ne',
    w:  'e',
    nw: 'se'
  };
  
  function general(opts){
    return {
      x: opts.x || 0,
      y: opts.y || 0,
      dirs: { n: true, e: true, s: true, w: true, ne: true, nw: true, se: true, sw: true },
      range: 1,
      size: 1,
      links: [],
      player: opts.player || 1,
      type: 0
    };
  }
  
  function assassin(opts){
    return {
      x: opts.x || 0,
      y: opts.y || 0,
      dirs: { n: true, e: true, s: true, w: true, ne: true, nw: true, se: true, sw: true },
      range: 16,
      size: 1,
      player: opts.player || 1,
      type: 1
    };
  }
  
  function titan(opts){
    return {
      x: opts.x || 0,
      y: opts.y || 0,
      dirs: { n: true, e: true, s: true, w: true, ne: true, nw: true, se: true, sw: true },
      range: 1,
      size: 2,
      links: [],
      player: opts.player || 1,
      type: 2
    };
  }
  
  function ranger(opts){
    return {
      x: opts.x || 0,
      y: opts.y || 0,
      dirs: { n: true, e: true, s: true, w: true },
      range: 12,
      size: 1,
      links:  opts.links || ['n'],
      player: opts.player || 1,
      type: 3
    };
  }
  
  function sidewinder(opts){
    return {
      x: opts.x || 0,
      y: opts.y || 0,
      dirs: { ne: true, nw: true, se: true, sw: true },
      range: 2,
      size: 1,
      links:  opts.links || ['ne', 'ne'],
      player: opts.player || 1,
      type: 4
    };
  }
  
  function grand(opts){
    return {
      x: opts.x || 0,
      y: opts.y || 0,
      dirs: { n: true, e: true, s: true, w: true },
      range: 4,
      size: 1,
      links:  opts.links || ['n', 'n', 'n', 'n'],
      player: opts.player || 1,
      type: 5
    };
  }
  
  /**
   * Initial board setup and linking references for convenience
   */
  function Space(x, y, i){
    this.x = x;
    this.y = y;
    this.i = i;
    this.adjacent = function(dir, steps){
      var search = this;
      for(var s = 0; s < (steps || 1); s++){
        search = search.adjacent[dir];
        if(!search) { return; }
      }
      return search;
    };
    
    this.occupied = null;
  }
  
  Space.prototype.area = function(size){
    var spaces = [this], search;
    
    function sweep(dir){
      return function(space){
        for(var s = 1; s < size; s++){
          search = space.adjacent(dir, s);
          search && spaces.push(search);
        }
      };
    }
    
    if(size > 1){
      spaces.slice().forEach(sweep('e'));
      spaces.slice().forEach(sweep('s'));
    }
    
    return (spaces.length === (size * size) && spaces) || null;
  };
  
  //returns spaces only if all spaces are valid empty spaces excluding specified piece head
  Space.prototype.scan = function(piece){
    var search;
    var spaces = this.area(piece.size);
    
    return (spaces && spaces.every(function(space){
      return (!space.occupied || piece.head(space.x, space.y)
              || (space.occupied.type === 0 && space.occupied.player !== piece.player));
    }) && spaces) || null;
  };
  
  Space.prototype.path = function(dir, piece){
    var dest;
    for(var s = 0; s < piece.size; s++){
      dest = this.adjacent(dir, s + 1);
      if(!dest || !dest.scan(piece)) return null;
    }
    
    if(piece.size == 1 && dir.length === 2){ //block diagonal cross links
      var parts = dir.split('');
      var a = this.adjacent[parts[0]];
      var b = this.adjacent[parts[1]];
      if(a && b && a.occupied && b.occupied && a.occupied === b.occupied){ return null; }
    }
    
    return dest;
  };
  
  function Board(size, players){
    var board     = this;
    this.size     = size;
    this.spaces   = [];
    this.rows     = [];
    this.cols     = [];
    this.pieces   = [];
    
    for(var x = 0; x < size; x++){
      for(var y = 0; y < size; y++){
        this.spaces[x + y * size] = new Space(x, y, x + y * size);
      }
    }
    
    for(var i = 0; i < size; i ++){
      this.rows.push(this.row(i));
      this.cols.push(this.col(i));
    }
    
    this.spaces.forEach(function(space){
      space.adjacent.n   = board.space(space.x + 0, space.y - 1);
      space.adjacent.ne  = board.space(space.x + 1, space.y - 1);
      space.adjacent.e   = board.space(space.x + 1, space.y + 0);
      space.adjacent.se  = board.space(space.x + 1, space.y + 1);
      space.adjacent.s   = board.space(space.x + 0, space.y + 1);
      space.adjacent.sw  = board.space(space.x - 1, space.y + 1);
      space.adjacent.w   = board.space(space.x - 1, space.y + 0);
      space.adjacent.nw  = board.space(space.x - 1, space.y - 1);
      
      for(var dir in space.adjacent){
        if(!space.adjacent[dir]){
          delete space.adjacent[dir];
        }
      }
    });
  }
  
  Board.prototype.space = function(x, y){
    if(x < 0 || y < 0 || x >= this.size || y >= this.size) { return; }
    return this.spaces[x + y * this.size];
  };
  
  Board.prototype.row = function(r){
    var spaces = [];
    for(var x = 0; x < this.size; x++){
      spaces.push(this.space(x, r));
    }
    return spaces;
  };
  
  Board.prototype.col = function(c){
    var spaces = [];
    for(var y = 0; y < this.size; y++){
      spaces.push(this.space(c, y));
    }
    return spaces;
  };
  
  Board.prototype.addPiece = function(piece){
    if(!(piece instanceof Piece)){
      piece = new Piece(this, this.space(piece.x, piece.y), piece);
    }
    
    if(piece.set()){
      this.pieces.push(piece);
      return piece;
    }
    
    return null;
  };
  
  Board.prototype.removePiece = function(piece){
    piece.lift();
    this.pieces.splice(this.pieces.indexOf(piece), 1);
  };
  
  Board.prototype.default = function(){
    
    this.pieces.forEach(function(piece){
      if(!piece.origin) piece.lift();
    });
    
    this.pieces.length = 0;
    
    //generals
    this.addPiece(general({ x: 5, y: 1,  player: 1 }));
    this.addPiece(general({ x: 6, y: 10, player: 2 }));
    
    //assassins
    this.addPiece(assassin({ x: 6, y: 1,  player: 1 }));
    this.addPiece(assassin({ x: 5, y: 10, player: 2 }));
    
    //titans
    this.addPiece(titan({ x: 0,  y: 0,  player: 1 }));
    this.addPiece(titan({ x: 10, y: 0,  player: 1 }));
    this.addPiece(titan({ x: 0,  y: 10, player: 2 }));
    this.addPiece(titan({ x: 10, y: 10, player: 2 }));
    
    //rangers
    this.addPiece(ranger({ x: 4, y: 0,  player: 1, links: ['e'] }));
    this.addPiece(ranger({ x: 7, y: 0,  player: 1, links: ['w'] }));
    this.addPiece(ranger({ x: 4, y: 11, player: 2, links: ['e'] }));
    this.addPiece(ranger({ x: 7, y: 11, player: 2, links: ['w'] }));
    
    //sidewinders
    this.addPiece(sidewinder({ x: 5, y: 2, player: 1, links: ['nw', 'nw'] }));
    this.addPiece(sidewinder({ x: 6, y: 2, player: 1, links: ['ne', 'ne'] }));
    this.addPiece(sidewinder({ x: 5, y: 9, player: 2, links: ['sw', 'sw'] }));
    this.addPiece(sidewinder({ x: 6, y: 9, player: 2, links: ['se', 'se'] }));
    
    //grands
    this.addPiece(grand({ x: 4, y: 2, player: 1, links: ['w', 'n', 'w', 'n'] }));
    this.addPiece(grand({ x: 7, y: 2, player: 1, links: ['e', 'n', 'e', 'n'] }));
    this.addPiece(grand({ x: 4, y: 9, player: 2, links: ['w', 's', 'w', 's'] }));
    this.addPiece(grand({ x: 7, y: 9, player: 2, links: ['e', 's', 'e', 's'] }));
    
    return this;
  };
  
  function Piece(board, space, opts){
    this.board    = board;
    this.space    = space;
    this.player   = opts.player || 1;
    this.type     = opts.type   || 0;
    this.range    = opts.range  || 1;
    this.size     = opts.size   || 1;
    this.dirs     = opts.dirs   || {};
    this.links    = (opts.links || []).slice(); //make a copy
  }
  
  Piece.prototype.moves = function(){
    var valid = {}, search;
    for(var dir in this.dirs){
      search = this.space;
      if(!search) { break; }
      if(this.dirs[dir]){
        valid[dir] = 0;
        for(var i = 0, l = this.range; i < l; i++){
          search = search.path(dir, this);
          if(!search) { break; }
          valid[dir] = i + 1;
        }
      }
    }
    return valid;
  };
  
  Piece.prototype.head = function(x, y){
    var dx = x - this.space.x;
    var dy = y - this.space.y;
    return dx >= 0 && dy >= 0 && dx < this.size && dy < this.size;
  };
  
  Piece.prototype.set = function(){
    var piece   = this;
    var space   = piece.space;
    var spaces  = [space], link = space;
    
    //scan space area and all link areas
    for(var l = 0; l < piece.links.length; l++){
      link = link.adjacent(piece.links[l], piece.size);
      if(!link) return null;
      spaces.push(link);
    }
    
    var occupied = spaces.reduce(function(valid, space){
      return valid.concat(space.scan(piece) || []);
    }, []);
    
    var valid = occupied.length === (piece.size * piece.size) * (1 + piece.links.length);
    if(valid){
      
      //we use occupied instead of piece for spaces that the piece overlaps into based on size
      occupied.forEach(function(space){
        if(space.occupied && space.occupied.type === 0){
          space.occupied.space = null;
        }
        space.occupied = piece;
      });
      
      this.origin = null;
    }
    
    return valid && piece;
  };
  
  Piece.prototype.lift = function(){
    if(this.origin) { throw 'already lifted'; }
    
    this.origin = {
      space: this.space,
      links: this.links.slice(),
      moves: this.moves()
    };
    
    this.board.spaces.forEach(function(space){
      if(space.occupied === this){
        space.occupied = null;
      }
    }, this);
    
    return this.origin;
  };
  
  Piece.prototype.reset = function(){
    if(!this.origin) { throw 'can only reset lifted piece'; }
    
    this.space  = this.origin.space;
    this.links  = this.origin.links.slice();
    return this.set();
  };
  
  Piece.prototype.move = function(dir, steps){
    if(!this.origin) { return 'can only move lifted piece'; }
    
    var piece = this;
    
    piece.space   = piece.origin.space;
    piece.links   = piece.origin.links.slice();
    
    var moves = piece.origin.moves;
    var dest  = piece.space, s;
    
    if(steps){
      if(moves && moves[dir] >= steps){
          
        for(s = 0; s < steps; s++){
          dest = dest.path(dir, piece);
          if(!dest) { return null }
        }
        
        piece.space = dest;
        
        if(piece.links.length){
          for(s = 0; s < steps; s++){
            piece.links.pop();
            piece.links.unshift(REVERSE[dir]);
          }
        }
        
        
      } else {
        throw 'invalid move';
      }
    }
    
    return piece;
  };
  
  function Game(players, board){
    this.players  = players;
    this.turn     = players[0];
    this.board    = board || new Board(12).default();
    this.calcControl();
    this.countdown = 12;
  }
  
  Game.prototype.kill = function(player){
    this.players.splice(this.players.indexOf(player), 1);
  };
  
  Game.prototype.restart = function(players){
    this.players  = players;
    this.turn     = players[0];
    this.board.default();
    this.calcControl();
  };
  
  Game.prototype.calcControl = function(){
    var game = this;
    
    game.control = {};
    game.players.forEach(function(player){
      game.control[player] = 0;
    });
    
    game.board.pieces.forEach(function(piece){
      if(piece.type === 0 && !piece.space){
        delete game.control[piece.player];
        return ;
      }
      
      var moves = piece.moves();
      return Object.keys(moves).forEach(function(dir){
        if(game.control !== undefined){
          game.control[piece.player] += moves[dir] * (piece.size * piece.size);
        }
      });
    });
    
    game.controlling = game.players[0];
    game.players.slice(1).forEach(function(player){
      if(game.controlling === null){ return; }
      if(game.control[player] > game.control[game.controlling]){
        game.controlling = player;
      } else if(game.control[player] === game.control[game.controlling]){
        game.controlling = null;
      }
    });
  };
  
  Game.prototype.play = function(piece){
    var game    = this;
    var board   = this.board;
    var pieces  = this.board.pieces;
    var lastControl = game.controlling;
    
    piece.set();
    
    game.control = {};
    
    game.calcControl();
    
    (function checkNextTurn(){
      if(game.players.length > 1){
        
        game.turn = game.players[(game.players.indexOf(game.turn) + 1) % game.players.length];
        
        if(!game.control[game.turn]){
          game.kill(game.turn);
          return checkNextTurn();
        }
      }
      
    })();
    
    if(lastControl === game.controlling){
      game.countdown--;
    } else {
      game.countdown = 12;
    }
    
    // if(!game.countdown){
    //   return game.controlling;
    // }
    
    if(game.players.length === 1){
      return game.players[0];
    } else if(!game.players.length){
      return 0;
    }
    return null;
  };
  
  exports.Board   = Board;
  exports.Game    = Game;
  exports.REVERSE = REVERSE;
  
})(typeof exports === 'undefined' ? this.dragon = {} : exports);