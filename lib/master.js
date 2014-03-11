var util = require('util')
var events = require('events')
var moment = require('moment')

module.exports = QueueMaster

function QueueMaster(options) {
  var self = this
  if (!(self instanceof QueueMaster)) return new QueueMaster(options)
  
  self.workname = 'None'
  self.currentWork = []
  self.currentAssignment = 0
  self.currentDone = 0
  self.workers = {}
  self.options = options
  
  events.EventEmitter.call(this)
}
util.inherits(QueueMaster, events.EventEmitter)

QueueMaster.prototype.addWorker = function(w) {
  var self = this
  self.workers[w.clientID] = {stream: w.stream, status: 'idle', heartbeat: new Date()}
  self.emit('status', self.getStatus())
  // We call assignCurrentWork() here because there may be work waiting and this
  // is the first worker to connect...
  self.assignCurrentWork()
}

// An object representing what's going on with this queue
QueueMaster.prototype.getStatus = function() {
  var self = this
  return {workers: Object.keys(self.workers).length, work: self.currentWork.length,
          assignment: self.currentAssignment, done: self.currentDone,
          name: self.workname}
}

QueueMaster.prototype.recvMsg = function(msg) {
  if (!msg) return
  var self = this
  if (msg.clientID && self.workers[msg.clientID]) {
    if (msg.heartbeat) {
      self.workers[msg.clientID].heartbeat = msg.heartbeat
    }
    if (msg.status) {
      self.workers[msg.clientID].status = msg.status
      if (msg.status == 'idle')
        self.assignCurrentWork()
    }
    if (msg.type == 'done') {
      self.currentDone += 1
      var statusMsg = self.getStatus()
      if (msg.data) statusMsg.data = msg.data
      self.emit('message', statusMsg)
    }
  }
  // Make sure the queue is empty AND all the work is done before emitting 'workend'
  if (self.currentWork.length < 1 && self.currentDone >= self.currentAssignment) {
    self.workname = 'None'
    self.emit('workend')
  }
}

QueueMaster.prototype.assignCurrentWork = function() {
  var self = this
  var now = moment()
  if (self.currentWork.length > 0) {
    var avail = []
    for (k in self.workers) {
      var hb = moment(self.workers[k].heartbeat)
      if (now.diff(hb) > 60000) {
        // serious, you guys, this stream is done...
        try {
          self.workers[k].stream.end()
          delete self.workers[k]
        } catch(e) {}
      } else if ( self.workers[k].status == 'idle' ) avail.push(self.workers[k])
    }
    if (avail.length > 0) {
      // choose a random, idle worker to do the job
      var w = avail[Math.floor(Math.random() * avail.length)]
      w.status = 'busy'
      var data = JSON.stringify(self.currentWork.shift()) + '\n'
      w.stream.write(data)
    }

  }
}

// job should be a list of objects that will be sent, one-by-one to the workers
QueueMaster.prototype.processJob = function(job, name) {
  var self = this
  if (!job || job.length < 1) return
  // TODO... need to come up with job queues
  if (self.currentWork.length > 0) return
  if (name) self.workname = name
  else self.workname = 'None'
  self.currentWork = job
  self.currentAssignment = job.length
  self.currentDone = 0
  self.emit('workbegin', self.currentWork.length)
  self.assignCurrentWork()
}
