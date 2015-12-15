var request = require('request')
  , ProgressBar = require('progress')
  , async = require('async')
  , byline = require('byline')
  , fs = require('fs')
  , url = process.env.URL

if (!url) {
  console.error('Specify URL')
  process.exit(1)
}

var blacklist = __dirname + '/../lists/words-blacklist.txt'
  , ascii = __dirname + '/../lists/ascii-blacklist.txt'

async.waterfall(
  [ async.apply(getTotal, blacklist)
  , function (total, cb) {
    processFile(blacklist, 'blacklist', total, cb)
  }
  , async.apply(getTotal, ascii)
  , function (total, cb) {
    processFile(ascii, 'ascii', total, cb)
  }
  ]
  , function (error) {
    if (error) {
      console.error(error)
      process.exit(1)
    }

    process.exit()
  }
)

function getTotal(filePath, callback) {
  var total = 0

  // TODO Handle error
  byline(fs.createReadStream(filePath, { encoding: 'utf8' }))
    .on('data', function () {
      total++
    }).on('end', function () {
      callback(null, total)
    })
}

function processFile(filePath, type, total, callback) {
  var wordInc = 20
    , requestCount = 0
    , words = []
    , totalRequests = 40
    , bar = new ProgressBar('inserting :total ' + type + ' [:bar] :percent :etas'
    , { complete: '='
      , incomplete: ' '
      , width: 50
      , total: total
      }
    )
    , stream = byline(fs.createReadStream(filePath, { encoding: 'utf8' }))

  stream.on('data', function (word) {
    words.push(word)

    if (words.length === wordInc) {
      requestCount++

      if (requestCount >= totalRequests) stream.pause()

      request(
        { url: url + '/filter/' + (type !== 'ascii' ? 'word' : 'ascii')
        , method: 'POST'
        , json: true
        , headers: { 'content-type': 'application/json' }
        , body: { msg: words, type: type }
        }
        , function (error) {
          if (error) {
            console.error(error)
          } else {
            bar.tick(wordInc)
          }

          requestCount--

          if (requestCount < totalRequests) {
            stream.resume()
          }
        })

      words = []
    }
  })

  stream.on('end', function () {
    if (words.length !== 0) {
      request(
        { url: url + '/filter/' + (type !== 'ascii' ? 'word' : 'ascii')
        , method: 'POST'
        , json: true
        , headers: { 'content-type': 'application/json' }
        , body: { msg: words, type: type }
        }
        , function (error) {
          if (error) return callback(error)

          bar.tick(words.length)

          console.log('Added ' + total + ' words to', type)

          callback()
        })
    } else {
      console.log('Added ' + total + ' words to', type)
      callback()
    }
  })
}
