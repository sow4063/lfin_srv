var net = require('net');
var JSONDuplexStream = require('json-duplex-stream');
var Gateway = require('./gateway');

var port = process.env.PORT || 8100;

var server = net.createServer();  
server.on('connection', handleConnection );

server.listen(port, function() {  
  console.log('server listening to %j', server.address());
});

function handleConnection(conn) {  
  var s = JSONDuplexStream();
  var gateway = Gateway();

  conn.setEncoding('utf8');

  conn.
    pipe(s.in).
    pipe(gateway).
    pipe(s.out).
    pipe(conn);

  s.in.on('error', onProtocolError);
  s.out.on('error', onProtocolError);
  conn.on('error', onConnError);

  function onProtocolError(err) {
    conn.end('protocol error:' + err.message);
  }
}

function onConnError(err) {  
  console.error('connection error:', err.stack);
};

