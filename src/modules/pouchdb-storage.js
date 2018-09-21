const _ = require('lodash')
const PouchDB = require('pouchdb')

module.exports = (Brahin) => {
  class PouchDBStrategy {
    // private db
    // private remotedb
    // private name
    // private handleChange
    // private opts: IOptions
    // private adapter
    // public sync

    /**
     * adapter - the PouchDB adapter – 'idb', 'memory'
     * name
     */
    constructor(adapter = 'idb', name = 'brahin', opts = {}) {
      this.adapter = adapter
      this.name = name
      this.opts = opts
      this.createDb()
    }

    createDb() {
      if (this.adapter === 'memory') {
        PouchDB.plugin(require('pouchdb-adapter-memory'))
      }
      // debug('PouchDB database name', this.name)
      this.db = new PouchDB(this.name, { adapter: this.adapter })
    }

    save(resource, updatedAttributes) {
      const doc = transformOut(_.assign(resource, updatedAttributes))
      return this._save(doc)
    }

    _save(doc, level = 1) {
      return new Promise((resolve, reject) => {
        this.db
          .put(doc)
          .then(resp => {
            // debugChanges('saved', res)
            // if (this.sync) this.sync.notifyChange()
            resolve(_.assign(doc, { id: resp.id, rev: resp.rev }))
          })
          .catch(err => {
            if (err.name === 'conflict') {
              console.warn('conflict', err)
              if (level > 100) {
                throw new Error('conflict resolution stack too deep')
              }
              this.db.get(doc._id).then(latestDoc => {
                this._save(_.assign(doc, { _rev: latestDoc._rev }), level + 1)
                  .then(resolve)
                  .catch(reject)
              })
            } else {
              console.error(
                `Error while saving to PouchDB: ${JSON.stringify(
                  err
                )} (document: ${JSON.stringify(doc)})`
              )
              reject(err)
            }
          })
      })
    }

    load({ id }) {
      return new Promise((resolve, reject) => {
        this.db
          .get(id)
          .then(doc => {
            resolve(transformIn(doc))
          })
          .catch(err => {
            if (err.name === 'not_found') {
              reject({ error: 'not_found', pouchdb_error: err })
            } else {
              reject({ pouchdb_error: err })
            }
          })
      })
    }

    create(resource) {
      const doc = transformOut(resource)
      return new Promise((resolve, reject) => {
        this.db
          .put(doc)
          .then(resp => {
            // debugChanges('saved', res)
            // if (this.sync) this.sync.notifyChange()
            resolve(_.assign(doc, { id: resp.id, rev: resp.rev }))
          })
          .catch(err => {
            if (err.name === 'conflict') {
              reject({ error: 'already_exists' })
            } else {
              console.error(
                `Error while saving to PouchDB: ${JSON.stringify(
                  err
                )} (document: ${JSON.stringify(doc)})`
              )
              reject(err)
            }
          })
      })
    }

    delete({ id, rev }) {
      return new Promise((resolve, reject) => {
        this.db
          .remove({ _id: id, _rev: rev})
          .then(res => {
            resolve(res)
          })
          .catch(err => {
            if (err.name === 'not_found') {
              // wanted to delete it's, it's not there => all good
              return resolve(err)
            }
            console.error(
              `Error while deleting from PouchDB: ${JSON.stringify(
                err
              )} (document: ${id}, ${JSON.stringify(body)})`
            )
            reject(err)
          })
      })
    }

    clear() {
      return new Promise((resolve, reject) => {
        this.db.destroy().then(() => {
          this.createDb()
          resolve()
        })
      })
    }
  }

  function transformIn(doc) {
    return _(doc)
      .assign({ id: doc._id, rev: doc._rev })
      .omit(['_id', '_rev'])
      .value()
  }

  function transformOut(doc) {
    return _(doc)
      .assign({ _id: doc.id, _rev: doc.rev })
      .omit(['id', 'rev'])
      .value()
  }

  return PouchDBStrategy
}
