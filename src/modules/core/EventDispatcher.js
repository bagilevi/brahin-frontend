module.exports = function() {
  const subscriptions = {}

  this.on = (type, callback) => {
    if (!subscriptions[type]) subscriptions[type] = []
    subscriptions[type].push(callback)
  }

  this.dispatch = (type, event) => {
    if (!subscriptions[type]) return
    subscriptions[type].forEach(callback => callback(event))
  }
}
