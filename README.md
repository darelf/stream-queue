Distributed Queue
=================
While not as cool as it sounds, it's a pretty straightforward
server/client work queue that depends on JSON messages being exchanged
to notify of work to be done and the status of that work.

    npm install stream-queue

This is supposed to work with any nodejs streams. Your code is responsible for
creating the streams and using the two main objects here to handle
all the communication.

Basically, have a process to act as the server using the `QueueMaster` object
to manage all the workers. You call `addWorker(workerObj)` to add a new worker.
If a worker has been quiet for too long, it will be removed. You can also
remove workers yourself if you want, such as when a socket disconnects.

The master keeps track of the list of jobs left to do, how many were originally
assigned, etc.

The worker just wraps around whatever object you use to do the actual work.
Your object has to implement a `recvMsg(msg)` and emit any messages it has
as `message` events. The wrapper will convert everything to JSON and back,
and pick up and send messages. Basically managing the queue.

There is some example code in the `examples` directory.

