var request = require('request')
  , url = process.env.URL

if (!url) {
  console.error('Specify URL')
  process.exit(1)
}

var byline = require('byline')
  , fs = require('fs')
  , whiteInput = byline(fs.createReadStream(__dirname + '/../lists/words-whitelist.txt', { encoding: 'utf8' }))
  , whiteCount = 0

whiteInput.on('data', function (word) {
  whiteInput.pause()

  request(
    { url: url + '/filter/word'
    , method: 'POST'
    , json: true
    , headers: { 'content-type': 'application/json' }
    , body: { msg: [ word ], type: 'whitelist' }
    }, function (error) {
      if (error) {
        console.error(error)
      } else {
        whiteCount++
      }

      whiteInput.resume()
    })
})

whiteInput.on('end', function () {
  console.log('Added ' + whiteCount + ' words to whitelist')

  var blackInput = byline(fs.createReadStream(__dirname + '/../lists/words-blacklist.txt', { encoding: 'utf8' }))
   , blackCount = 0

  blackInput.on('data', function (word) {
    blackInput.pause()

    request(
      { url: url + '/filter/word'
      , method: 'POST'
      , json: true
      , headers: { 'content-type': 'application/json' }
      , body: { msg: [ word ], type: 'blacklist' }
      }, function (error) {
        if (error) {
          console.error(error)
        } else {
          blackCount++
        }

        blackInput.resume()
      })
  })

  blackInput.on('end', function () {
    console.log('Added ' + blackCount + ' words to blacklist')
  })
})
