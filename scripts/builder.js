var fs = require('fs')
  , byline = require('byline')
  , filter = require('redsee-filter')
  , _ = require('lodash')
  , input = byline(fs.createReadStream('/usr/share/dict/words', { encoding: 'utf8' }))
  , output = []
  , blacklistedWords = require('../lists/storage/words-blacklist.json')

input
  .on('data', function (word) {
    if (blacklistedWords.indexOf(word.toLowerCase()) !== -1) return
    filter.normalise(null, null, word, function (error, normalised) {
      if (error) console.error(error)

      output.push(normalised.toLowerCase())
    })
  })
  .on('end', function () {
    fs.writeFileSync(__dirname + '/../lists/storage/words-whitelist.json', JSON.stringify(_.uniq(output)), 'utf8')
  })
