var natural = require('natural')
  , dm = natural.DoubleMetaphone

module.exports = function (client, filter, logger) {
  return function (results, type, done) {
    if (type !== 'blacklist') return

    client.del('redsee-blacklist:phonetic-words')

    client.sscan('redsee-blacklist:words', { count: 100 })
      .on('data', function (word) {
        var phonetics = dm.process(word)

        if (!phonetics || !phonetics[0]) return

        if (phonetics[0]) client.hmset('redsee-blacklist:phonetic-words', phonetics[0], word)
        if (phonetics[1]) client.hmset('redsee-blacklist:phonetic-words', phonetics[1], word)
      })
      .on('error', logger.error)
      .on('end', function () {
        logger.info('Refreshed phonetic cache')

        done()
      })

  }
}
