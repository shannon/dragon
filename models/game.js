'use strict';

var mongoose    = require('mongoose')
  , Schema      = mongoose.Schema
  , ObjectId    = Schema.Types.ObjectId
;

var gameSchema = new Schema({
  players:  [ {
    user:     { type: ObjectId, ref: 'User' },
    general:  { type: Number }
  } ],
  
  moves:    [ {
    _id:      false,
    played:   { type: Date, default: Date.now },
    piece:    { type: Number },
    position: { x: Number, y: Number }
  } ],
  
  created:  { type: Date, default: Date.now },
  started:  { type: Date },
  owner:    { type: ObjectId, ref: 'User' }
}, {
  toJSON: {
    virtuals: true
  }
});

gameSchema.virtuals('turn').get(function(){
  var player = this.player[this.moves.length % this.players.length];
  return player._id || player;
});

gameSchema.virtuals('ready').get(function(){
  return this.players.every(function(player){
    return player.general !== undefined;
  });
});

module.exports = mongoose.model('Game', gameSchema);