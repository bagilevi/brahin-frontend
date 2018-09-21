const PouchDBStrategy = require('./pouchdb-storage.js')({})

const s = new PouchDBStrategy('memory')

test('can store and retrieve', () => {
  return s.clear()
    .then(() => s.save({ id: 'P1', name: 'Alice' }))
    .then(() => s.load({ id: 'P1' }))
    .then(doc => {
      expect(doc.name).toEqual('Alice')
    })
})

describe('saving', () => {
  test('returns saved attribute', () => {
    return s.clear()
      .then(() => s.save({ id: 'P1', name: 'Alice' }))
      .then(doc => {
        expect(doc.name).toEqual('Alice')
      })
  })
  test('returns id', () => {
    return s.clear()
      .then(() => s.save({ id: 'P1', name: 'Alice' }))
      .then(doc => {
        expect(doc.id).toEqual('P1')
      })
  })
  test('returns rev', () => {
    return s.clear()
      .then(() => s.save({ id: 'P1', name: 'Alice' }))
      .then(doc => {
        expect(doc.rev).toBeDefined()
      })
  })
  test('increments the first part of the rev', () => {
    return s.clear()
      .then(() => s.save({ id: 'P1', name: 'Alice' }))
      .then(doc => {
        expect(doc.rev).toMatch(/^1\-/)
        return doc
      })
      .then(doc => s.save(doc))
      .then(doc => {
        expect(doc.rev).toMatch(/^2\-/)
      })
  })
})

describe('loading', () => {
  test('does not return deleted item', () => {
    return s.clear()
      .then(() => s.save({ id: 'P1', name: 'Alice' }))
      .then(({ id, rev }) => s.delete({ id, rev }))
      .then(() => {
        expect(s.load({ id: 'P1' })).rejects.toMatchObject({ error: 'not_found' })
      })
  })
})

describe('creating', () => {
  test('returns saved attribute', () => {
    return s.clear()
      .then(() => s.create({ id: 'P1', name: 'Alice' }))
      .then(doc => {
        expect(doc.name).toEqual('Alice')
      })
  })
  test('returns error if already exists', () => {
    return s.clear()
      .then(() => s.save({ id: 'P1', name: 'Alice' }))
      .then(() => {
        expect(s.create({ id: 'P1', name: 'Bob' }))
          .rejects.toMatchObject({ error: 'already_exists' })
      })
      .then(() => s.load({ id: 'P1' }))
      .then(doc => {
        expect(doc.name).toEqual('Alice')
      })
  })
})


describe('deleting', () => {
  test('returns document with new revision', () => {
    return s.clear()
      .then(() => s.save({ id: 'P1', name: 'Alice' }))
      .then(({ id, rev }) => s.delete({ id, rev }))
      .then(doc => {
        expect(doc.id).toEqual('P1')
        expect(doc.rev).toMatch(/^2\-/)
      })
  })
})
