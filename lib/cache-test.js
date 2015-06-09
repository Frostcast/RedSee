module.exports = function (client, filter, logger) {
  return function (results, type, done) {
    if (typeof type === 'function') done = type

    client.sscan('redsee-cache:filter:keys', { count: 100 })
      .on('data', function (hash) {
        client.del('redsee-cache:filter:' + hash)
        client.srem('redsee-cache:filter:keys', hash)
      })
      .on('error', logger.error)
      .on('end', function () {
        logger.info('Refreshed cache')

        done()
      })

  }
}
