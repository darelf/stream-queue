var master = require('../index').QueueMaster()
var net = require('net')
var es = require('event-stream')

//Let's create some work to do...
var joblist = [{data: 1}, {data: 2}, {data: 3}, {data: 4}]
master.processJob(joblist, "Bogus Job")
// We're going to exit when the job list is complete...
master.on('workend', process.exit)

var server = net.createServer(function(stream) {
  // we console log a few things to give us something to look at during a test run
  console.log("connected")
  stream.on('end', function() { console.log("disconnected") })
  es.pipeline(
      stream,
      es.split(),
      es.parse(),
      es.map(function(parsed, cb) {
        console.log(parsed)
        // We look for the registration, pass everything else on...
        if (parsed && parsed.action == 'register' && parsed.clientID) {
          master.addWorker({clientID: parsed.clientID, stream: stream})
        } else if (parsed) {
          master.recvMsg(parsed)
        }
        cb()
      })
  )
})

server.listen(9999, function() { console.log("successfully bound to port 9999") })
