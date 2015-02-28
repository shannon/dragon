(function(exports){
  'use strict';
  
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
  
  function Board(size){
    var board     = this;
    this.size     = size;
    this.spaces   = [];
    this.rows     = [];
    this.cols     = [];
    
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
  
  
  //=========================================================================
  
  function PieceType(data, index){
    if(data){
      this.deserialize(data, index);
    }
  }
  
  PieceType.prototype.deserialize = function(data, index){
    this.index  = index;
    this.size   = data.size;
    this.range  = data.range;
    this.links  = data.links;
    this.dirs   = data.dirs.slice();
    return this;
  };
  
  PieceType.prototype.serialize = function(){
    return {
      size:   this.size,
      range:  this.range,
      links:  this.links,
      dirs:   this.dirs.slice()
    };
  };
  
  function Piece(data, game){
    if(data){
      this.deserialize(data, game);
    }
  }
  
  Piece.prototype.deserialize = function(data, game){
    this.type   = game.types[data.type];
    this.space  = game.board.space(data.x, data.y);
    this.links  = (data.links || []).slice();
    this.player = data.player;
    return this;
  };
  
  Piece.prototype.serialize = function(){
    return {
      type:   this.type.index,
      x:      this.space.x,
      y:      this.space.y,
      player: this.player
    };
  };
  
  Piece.prototype.head = function(x, y){
    var dx = x - this.space.x;
    var dy = y - this.space.y;
    return dx >= 0 && dy >= 0 && dx < this.type.size && dy < this.type.size;
  };
  
  Piece.prototype.scan = function(spaces){
    return spaces.every(function(space){
      return !space.occupied || this.head(space.x, space.y)
              || (space.occupied.type === 0 && space.occupied.player !== this.player);
    }, this);
  };
  
  Piece.prototype.steps = function(dir){
    var piece = this;
    var space = this.space;
    var steps = 0, dest = space, spaces;
    
    for(var r = 0; r < this.type.range; r++){
      
      dest    = dest.adjacent(dir, this.type.size);
      spaces  = dest && dest.area(this.type.size);
      
      if(spaces && this.scan(spaces)){

        if(this.type.size == 1 && dir.length === 2){ //block diagonal cross links
          var parts = dir.split('');
          var a = dest.adjacent[parts[0]];
          var b = dest.adjacent[parts[1]];
          if(a && b && a.occupied && b.occupied && a.occupied === b.occupied){ continue; }
        }
        
        steps = r + 1;
      } else {
        break;
      }
    }
    
    return steps;
  };
  
  
  Piece.prototype.moves = function(){
    var moves = {}, search;
    
    this.type.dirs.forEach(function(dir){
      moves[dir] = this.steps(dir);
    }, this);
    
    return moves;

  };
  
  function Game(data){
    if(data){
      this.deserialize(data);
    }
    
    // this.players  = game.players;
    // this.turn     = game.turn;
    // this.board    = new Board(game.board);
    // this.calcControl();
    // this.countdown = 12;
  }
  
  Game.prototype.deserialize = function(data){
    this.version  = data.version;
    this.rules    = data.rules;
    this.players  = data.players.slice();
    this.board    = new Board(data.board);
    
    this.types    = data.types.map(function(type, i){
      return new PieceType(type, i);
    }, this);
    this.pieces   = data.pieces.map(function(piece){
      return this.set(new Piece(piece, this));
    }, this);
    
    this.surrender  = { threshold: data.surrender.threshold, turns: data.surrender.turns };
    this.turn       = data.turn;
    this.moves      = data.moves.slice();
    this.control    = data.control.slice();
    this.winner     = data.winner;
    this.created    = data.created;
    this.modified   = data.modified;
    this.metadata   = JSON.parse(JSON.stringify(data.metadata));
    return this;
  };
  
  Game.prototype.serialize = function(){
    var serial = {};
    
    serial.version  = this.version;
    serial.rules    = this.rules;
    serial.players  = this.players.slice();
    serial.board    = this.board.size;
    
    serial.types    = this.types.map(function(type){
      return type.serialize();
    });
    serial.pieces   = this.pieces.map(function(piece){
      return piece.serialize();
    });
    
    serial.surrender  = { threshold: this.surrender.threshold, turns: this.surrender.turns };
    serial.turn       = this.turn;
    serial.moves      = this.moves.slice();
    serial.control    = this.control.slice();
    serial.winner     = this.winner;
    serial.created    = this.created;
    serial.modified   = this.modified;
    serial.metadata   = JSON.parse(JSON.stringify(this.metadata));
    
    return serial;
  };
  
  Game.prototype.set = function(piece){
    var space   = piece.space;
    var spaces  = [space], link = space;
    
    this.board.spaces.forEach(function(space){
      if(space.occupied === piece){
        space.occupied = null;
      }
    });
    
    //scan space area and all link areas
    for(var l = 0; l < piece.links.length; l++){
      link = link.adjacent(piece.links[l], piece.size);
      if(!link) return null;
      spaces.push(link);
    }
    
    var occupied = spaces.reduce(function(valid, space){
      var spaces = space.area(piece.type.size);
      return valid.concat(piece.scan(spaces) ? spaces : []);
    }, []);
    
    var valid = occupied.length === (piece.type.size * piece.type.size) * (1 + piece.links.length);
    if(valid){
      
      //we use occupied instead of piece for spaces that the piece overlaps into based on size
      occupied.forEach(function(space){
        if(space.occupied && space.occupied.type === 0){
          space.occupied.space = null;
        }
        space.occupied = piece;
      });
    }
    
    return valid && piece;
  };
  
  Game.prototype.move = function(piece, dir, steps){
    var dest;
    
    if(piece.moves()[dir] >= steps){
      this.moves.push([this.pieces.indexOf(piece), dir, steps]);
      
      piece.space = piece.space.adjacent(dir, steps * piece.type.size);
      
      if(piece.links.length){
        for(s = 0; s < steps; s++){
          piece.links.pop();
          piece.links.unshift(REVERSE[dir]);
        }
      }
      
      game.set(piece);
      
    } else {
      throw 'invalid move';
    }
    
  };
  
  Game.prototype.restart = function(players){
    // this.players  = players;
    // this.turn     = players[0];
    // this.board.default();
    // this.calcControl();
  };
  
  Game.prototype.calcControl = function(){
    // var game = this;
    
    // game.control = {};
    // game.players.forEach(function(player){
    //   game.control[player] = 0;
    // });
    
    // game.board.pieces.forEach(function(piece){
    //   if(piece.type === 0 && !piece.space){
    //     delete game.control[piece.player];
    //     return ;
    //   }
      
    //   var moves = piece.moves();
    //   return Object.keys(moves).forEach(function(dir){
    //     if(game.control !== undefined){
    //       game.control[piece.player] += moves[dir] * (piece.size * piece.size);
    //     }
    //   });
    // });
    
    // game.controlling = game.players[0];
    // game.players.slice(1).forEach(function(player){
    //   if(game.controlling === null){ return; }
    //   if(game.control[player] > game.control[game.controlling]){
    //     game.controlling = player;
    //   } else if(game.control[player] === game.control[game.controlling]){
    //     game.controlling = null;
    //   }
    // });
  };
  
  Game.prototype.play = function(){
    // var game    = this;
    // var board   = this.board;
    // var pieces  = this.board.pieces;
    // var lastControl = game.controlling;
    
    // game.control = {};
    
    // game.calcControl();
    
    // (function checkNextTurn(){
    //   if(game.players.length > 1){
        
    //     game.turn = game.players[(game.players.indexOf(game.turn) + 1) % game.players.length];
        
    //     if(!game.control[game.turn]){
    //       game.kill(game.turn);
    //       return checkNextTurn();
    //     }
    //   }
      
    // })();
    
    
    // if(game.players.length && lastControl === game.controlling){
    //   game.countdown -= 1 / game.players.length;
    // } else {
    //   game.countdown = 12;
    // }
    
    // if(!game.countdown){
    //   return game.controlling;
    // }
    
    // if(game.players.length === 1){
    //   return game.players[0];
    // } else if(!game.players.length){
    //   return 0;
    // }
    // return null;
  };
  
  exports.Board   = Board;
  exports.Game    = Game;
  exports.REVERSE = REVERSE;
  exports.version = '0.0.1';
  
})(typeof exports === 'undefined' ? this.dragon = {} : exports);


//rules
//  movement
//    collision
//  win condition