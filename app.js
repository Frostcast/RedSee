var express = require('express')
  , bodyParser = require('body-parser')
  , responseTime = require('response-time')
  , redis = require('redis')
  , filter = require('redsee-filter')
  , redseeServer = require('redsee-server')
  , bunyanMiddleware = require('bunyan-middleware')
  , bunyanLogger = require('bunyan').createLogger(
    { name: 'site'
    , stream: process.stdout
    , level: 'debug'
    })
  , domain = require('domain').create()
  , shutdownGracefullyMiddleware = require('express-graceful-shutdown')
  , debounce = require('async-debounce')
  , cacheTest = require('./lib/cache-test')
  , createPhoneticCleaner = require('./lib/phonetic-cleaner')
  , host = process.env.REDIS_HOST || '127.0.0.1'
  , port = process.env.PORT || 3000

require('redis-scanstreams')(redis)

domain.on('error', function (error) {
  bunyanLogger.error(error)
})

domain.run(function () {

  var app = express()
    , client = redis.createClient(6379, host)
    , server = redseeServer(client, filter)

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

  // Listeners
  var cacheCleaner = debounce(cacheTest(client, filter, bunyanLogger), 60000) // 1 minute
    , phoneticCleaner = debounce(createPhoneticCleaner(client, filter, bunyanLogger), 60000) // 1 minute

  server.on('redsee-created:emails', cacheCleaner)
  server.on('redsee-deleted:emails', cacheCleaner)

  server.on('redsee-created:phrases', cacheCleaner)
  server.on('redsee-deleted:phrases', cacheCleaner)

  server.on('redsee-created:urls', cacheCleaner)
  server.on('redsee-deleted:urls', cacheCleaner)

  server.on('redsee-created:words', cacheCleaner)
  server.on('redsee-deleted:words', cacheCleaner)
  server.on('redsee-deleted:words', phoneticCleaner)

  var appServer = app.listen(app.get('port'), function() {
    bunyanLogger.info('Server listening on port', app.get('port'))
  })

  shutdownGracefullyMiddleware(appServer, { logger: bunyanLogger })
})
