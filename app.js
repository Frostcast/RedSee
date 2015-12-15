var express = require('express')
  , bodyParser = require('body-parser')
  , responseTime = require('response-time')
  , createClient = require('redsee-client')
  , filter = require('redsee-filter')
  , redseeServer = require('redsee-server')
  , bunyanMiddleware = require('bunyan-middleware')
  , bunyanLogger = require('bunyan').createLogger(
    { name: 'site'
    , stream: process.stdout
    , level: 'debug'
    })
  , http = require('http')
  , shutdownGracefully = require('express-graceful-shutdown')
  // , debounce = require('async-debounce')
  // , cacheTest = require('./lib/cache-test')
  // , createPhoneticCleaner = require('./lib/phonetic-cleaner')
  , port = process.env.PORT || 3000
  , opts =
  { whitelist:
    { words: { data: __dirname + '/lists/storage/words-whitelist.json' }
    , emails: { data: __dirname + '/lists/storage/emails-whitelist.json' }
    , phrases: { data: __dirname + '/lists/storage/phrases-whitelist.json' }
    , urls: { data: __dirname + '/lists/storage/urls-whitelist.json' }
    }
  , blacklist:
    { words: { data: __dirname + '/lists/storage/words-blacklist.json' }
    , ascii: { data: __dirname + '/lists/storage/ascii-blacklist.json' }
    , phrases: { data: __dirname + '/lists/storage/phrases-blacklist.json' }
    , phonetics: { data: __dirname + '/lists/storage/phonetics-blacklist.json' }
    , wordsBypass: { data: __dirname + '/lists/storage/words-bypass-blacklist.json' }
    }
  }

createClient(opts, function (error, client) {
  if (error) {
    bunyanLogger.error(error)
    process.exit(1)
  }

  var app = express()
    , server = redseeServer(client, filter)

  client.prefix = process.env.REDIS_PREFIX || ''

  app.set('port', port)

  // Don't tell people we are the express train
  app.disable('x-powered-by')

  app
    .use(responseTime())
    .use(bunyanMiddleware(
    { headerName: 'X-Request-Id'
    , propertyName: 'reqId'
    , logName: 'req_id'
    , obscureHeaders: []
    , logger: bunyanLogger
    }))
    .use(bodyParser.urlencoded({ extended: true }))
    .use(bodyParser.json({ limit: '1mb' }))

  // Routes
  app.post('/filter/email', server.routes.emails.create)
  app.delete('/filter/email', server.routes.emails.delete)

  app.post('/filter', server.routes.filter)

  app.post('/filter/phrase', server.routes.phrases.create)
  app.delete('/filter/phrase', server.routes.phrases.delete)

  app.post('/filter/url', server.routes.urls.create)
  app.delete('/filter/url', server.routes.urls.delete)

  app.post('/filter/word', server.routes.words.create)
  app.delete('/filter/word', server.routes.words.delete)

  app.post('/filter/ascii', server.routes.ascii.create)
  app.delete('/filter/ascii', server.routes.ascii.delete)

  // Listeners
  // var cacheCleaner = debounce(cacheTest(client, filter, bunyanLogger), 60000) // 1 minute
  // var phoneticCleaner = debounce(createPhoneticCleaner(client, filter, bunyanLogger), 60000) // 1 minute

  // server.on('redsee-created:emails', cacheCleaner)
  // server.on('redsee-deleted:emails', cacheCleaner)

  // server.on('redsee-created:phrases', cacheCleaner)
  // server.on('redsee-deleted:phrases', cacheCleaner)

  // server.on('redsee-created:urls', cacheCleaner)
  // server.on('redsee-deleted:urls', cacheCleaner)

  // server.on('redsee-created:words', cacheCleaner)
  // server.on('redsee-deleted:words', cacheCleaner)
  // server.on('redsee-deleted:words', phoneticCleaner)

  var appServer = http.createServer(app)

  app.use(shutdownGracefully(appServer, { logger: bunyanLogger }))

  appServer.listen(app.get('port'), function () {
    bunyanLogger.info('Server listening on port', app.get('port'))
  })

})
