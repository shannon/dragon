
## Users

### Get current user
```
GET /user
```

### Get other user
```
GET /users/:username
```


## Friends

### Get list of friends
```
GET /user/friends
```

### Add user to friends
```
POST /user/friends
```

### Remove user from friends
```
DELETE /user/friends/:username
```



## Games

### Get list of games
```
GET /games
```

### Create game
```
POST /games
```

### Get game
```
GET /games/:game
```

### Add player to game
```
POST /games/:game/players
```

### Perform action on game, start, move, end
```
PUT /games/:game/actions
```


### Select General
```
PUT /games/:game/players/:username/general
```

### Leave game or decline to play, will end game if moves > 0
```
DELETE /games/:game/players/:username
```