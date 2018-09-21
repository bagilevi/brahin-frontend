module.exports = function(key, Brahin) {
  const { loadPluginScript, VERSION } = Brahin

  return new Promise((resolve, reject) => {
    const [stratType, ...stratArgs] = key.split(':')

    switch (stratType) {
      case 'local':
        return loadPluginScript('brahin-pouchdb-storage', VERSION)
          .then((PouchDBStrategy) => {
            const [databaseName, ] = stratArgs
            const testing = (typeof global !== 'undefined') && global.test
            strategy = new PouchDBStrategy(testing ? 'memory' : 'idb', databaseName)
            resolve(strategy)
          })
          .catch(reject)

      case 'backend':
        return loadPluginScript('brahin-backend-storage', VERSION)
          .then((BackendStrategy) => {
            strategy = new BackendStrategy()
            resolve(strategy)
          })
          .catch(reject)

      default:
        reject(`Cannot find storage strategy for ${key}`)
    }
  })
}
