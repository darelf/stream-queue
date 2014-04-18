var es = require('event-stream')

module.exports = StreamWorker

function StreamWorker(worker, stream, opts) {
  var self = this
  if (!(self instanceof StreamWorker)) return new StreamWorker(worker, stream, opts)
  self.worker = worker
  self.stream = stream
  self.opts = opts
  if (!opts || !opts.heartbeat) self.opts = {heartbeat: 30000}
  
  self.ID = [1,1,1].map(function() { return Math.random().toString(16).substring(2).toUpperCase() }).join('')
}

StreamWorker.prototype.sendMsg = function(msg) {
  var self = this
  
  msg.clientID = self.ID
  //console.log("writing: " + JSON.stringify(msg))
  self.stream.write(JSON.stringify(msg) + '\n')
}

StreamWorker.prototype.connect = function() {
  var self = this
  if (!self.worker) console.log("No worker object")
  if (!self.stream) console.log("No stream object")
  if (!self.worker || !self.stream) return
  // Set the message callback
  self.worker.on('message', self.sendMsg.bind(self))

  // Let's do a couple of things to get everything started
  self.sendMsg({action: 'register'})
  setInterval(function() {
    self.sendMsg({heartbeat: new Date() })
  }, self.opts.heartbeat)

  // Let's go ahead and parse the json and pass the object on
  es.pipeline(
    self.stream, es.split(), es.parse(),
    es.map(function(parsed,cb) {
      if (parsed) {
        self.worker.recvMsg(parsed)
      }
      cb()
    })
  )
}
