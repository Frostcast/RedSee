# RedSee

An implementation of [redsee-filter](https://github.com/confuser/node-redsee-filter) and [redsee-server](https://github.com/confuser/node-redsee-server) to provide a REST API server for english profanity, email and url filtering.

[Demo](http://redsee.frostcast.net)

## Installation
```
npm install --production

REDIS_HOST=127.0.0.1 PORT=3000 node app.js
```

Build your whitelist (important!) and blacklists. Examples are provided within `lists/`, see below for instructions on how to generate your own.

## Scripts

### builder
Generates words-whitelist.txt based on `/usr/share/dict/words` and ignores any words contained within words-blacklist.txt. May require sudo rights for word access.

#### Usage
```
node scripts/builder.js
```

### insert
Inserts blacklist and whitelist words stored in `list/` via API

#### Usage
```
URL=http://localhost:3000 node scripts/insert.js
```
