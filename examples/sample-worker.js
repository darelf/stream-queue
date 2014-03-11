var util = require('util')

var events = require('events')

module.exports = MyWorker

function MyWorker() {
  var self = this
  if (!(self instanceof MyWorker)) return new MyWorker()
  
  events.EventEmitter.call(this)
}
util.inherits(MyWorker, events.EventEmitter)

MyWorker.prototype.recvMsg = function(msg) {
  var self = this
  
  if (msg.type && msg.type != 'work') return
  // Tell everyone that we are busy right now, call back later...
  self.emit('message', {status:'busy'})
  // Do something with the data...
  
  // We will wait and pretend something happened...
  setTimeout(function() {
    self.emit('message', {type:'done', status:'idle'})
  }, 500)
}
