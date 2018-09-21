const Brahin = {
  loadPluginScript: (name, version) => {
    switch (name) {
      case 'brahin-pouchdb-storage':
        return Promise.resolve(require('./pouchdb-storage')())
      default:
        throw new Error(`Mock loadPluginScript does not know about ${name}`)
    }
  }
}
const storage = require('./storage.js')(Brahin)

test('can store and retrieve', () => {
  return storage.save({ url: 'http://any/_local/N1/P1', name: 'Alice' })
    .then(() => storage.load('http://any/_local/N1/P1'))
    .then(loadedResource => {
      expect(loadedResource.name).toEqual('Alice')
    })
})
