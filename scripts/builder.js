var fs = require('fs')
  , byline = require('byline')
  , filter = require('redsee-filter')
  , _ = require('lodash')
  , request = require('request')
  , input = byline(request('https://raw.githubusercontent.com/atebits/Words/master/Words/en.txt'))
  , output = require('../lists/additional-whitelist-words.json')
  , blacklistedWords = require('../lists/storage/words-blacklist.json')

input
  .on('data', function (buff) {
    var word = buff.toString()

    if (blacklistedWords.indexOf(word.toLowerCase()) !== -1) return
    filter.normalise(null, null, word, function (error, normalised) {
      if (error) console.error(error)

      output.push(normalised.toLowerCase())
    })
  })
  .on('end', function () {
    fs.writeFileSync(__dirname + '/../lists/storage/words-whitelist.json', JSON.stringify(_.uniq(output)), 'utf8')
  })
