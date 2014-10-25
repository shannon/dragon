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
    
    this.piece = null;
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
      return (!space.occupied || piece.head(space.x, space.y));
    }) && spaces) || null;
  };
  
  Space.prototype.path = function(dir, piece){
    var dest = this.adjacent(dir, piece.size);
    if(!dest || !dest.scan(piece)) return null;
    
    if(piece.size == 1 && dir.length === 2){ //block diagonal cross links
      var parts = dir.split('');
      var a = this.adjacent[parts[0]];
      var b = this.adjacent[parts[1]];
      if(a && b && a.occupied && b.occupied && a.occupied === b.occupied){ return null; }
    }
    
    return dest;
  };
  
  function Board(size){
    var board   = this;
    this.size   = size;
    this.spaces = [];
    this.rows   = [];
    this.cols   = [];
    this.pieces = [];
    
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
    var board   = this;
    var space   = piece.space || this.space(piece.x, piece.y);
    var spaces  = [space], link = space;
    
    piece = new Piece(space, piece);
    
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
      
      piece.space.piece = piece;
      
      //we use occupied instead of piece for spaces that the piece overlaps into based on size
      occupied.forEach(function(space){
        space.occupied = piece;
      });
      
      board.pieces.push(piece);
    }
    
    return valid && piece;
  };
  
  Board.prototype.removePiece = function(piece){
    this.spaces.forEach(function(space){
      if(space.piece === piece){
        space.piece = null;
      }
      if(space.occupied === piece){
        space.occupied = null;
      }
    });
    this.pieces.splice(this.pieces.indexOf(piece), 1);
  };
  
  Board.prototype.movePiece = function(piece, dir, steps){
    var dest = piece.space, s;
    
    for(s = 0; s < steps; s++){
      dest = dest.path(dir, piece);
      if(!dest) { return null }
    }
    
    
    this.removePiece(piece);
    
    piece.space = dest;
    
    if(piece.links.length){
      for(s = 0; s < steps; s++){
        piece.links.pop();
        piece.links.unshift(REVERSE[dir]);
      }
    }
    
    return this.addPiece(piece);
  };
  
  function Piece(space, opts){
    this.space    = space;
    this.type     = opts.type   || 0;
    this.range    = opts.range  || 1;
    this.size     = opts.size   || 1;
    this.dirs     = opts.dirs   || {};
    this.links    = (opts.links || []).slice(); //make a copy
  }
  
  Piece.prototype.validMoves = function(){
    var valid = {}, search;
    
    for(var dir in this.dirs){
      search = this.space;
      if(this.dirs[dir]){
        valid[dir] = 0;
        for(var i = 0; i < this.range; i++){
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
  
  
  
  exports.Board = Board;
})(typeof exports === 'undefined' ? this.dragon = {} : exports);