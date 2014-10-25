Each piece is defined as having constraint on movement (cardinal directions)

Piece 1
movement: n, e, s, w
size: 1
range: 5
links: 3

Piece 2
movement: ne, nw, se, sw
size: 1
range: 3
links: 2

Piece 3
movement: n, e, s, w
size: 1
range: 16
links: 1

Piece 4
movement: n, e, s, w
size: 2
range: 2
links: 0

Piece 5
movement: n, e, s, w, ne, nw, se, sw
size: 1
range: 1
links: 0

Pieces cannot travel between links of the same piece
Pieces can only travel in a direction that is available for all spaces in all steps up to the desired space
Pieces can not backtrack over or cross their own links