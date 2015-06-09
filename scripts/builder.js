var fs = require('fs')
  , byline = require('byline')
  , input = byline(fs.createReadStream('/usr/share/dict/words', { encoding: 'utf8' }))
  , output = fs.createWriteStream(__dirname + '/../lists/words-whitelist.txt', { encoding: 'utf8' })
  , blacklistedWords = fs.readFileSync(__dirname + '/../lists/words-blacklist.txt', { encoding: 'utf8' }).split(/\r?\n/)

input
  .on('data', function (word) {
    if (blacklistedWords.indexOf(word.toLowerCase()) !== -1) return

    output.write(word + '\n')
  })
  .on('end', output.end)
