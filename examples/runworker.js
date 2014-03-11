var net = require('net')
var sampworker = require('./sample-worker')()

var stream = net.connect({port:9999}, function() {
  var worker = require('../index').StreamWorker(sampworker, stream)
  worker.connect()
})
