var net = require('net');
var JSONDuplexStream = require('json-duplex-stream');
var Gateway = require('./gateway');

var port = process.env.PORT || 8100;

// config files
var db = require('./config/db').db;

// update code at every hour
// get code from vendor server
var codeController = require('./app/code/codeController.js');
let intervalObj = setInterval( codeController.updateCode, 1000 * 3600 );

var tls = require('tls');
var fs = require('fs');

// var options = {  
//   key: fs.readFileSync('../cert/key.pem'),
//   cert: fs.readFileSync('../cert/cert.pem')
// };
var sslPath = '/etc/letsencrypt/live/www.fordicpro.com/';

var options = {  
    key: fs.readFileSync(sslPath + 'privkey.pem'),
    cert: fs.readFileSync(sslPath + 'fullchain.pem')
};

var server = tls.createServer(options, function (res) {
});

server.on('connection', handleConnection );

server.listen( port, function(){
  console.log('server listening to %j', server.address() );
}); 

//
// var server = net.createServer();  
// server.on('connection', handleConnection );

// server.listen(port, function() {  
//   console.log('server listening to %j', server.address());
// });

function handleConnection(conn) {  
  var s = JSONDuplexStream();
  var gateway = Gateway();

  conn.setEncoding('utf8');

  conn.
    pipe(s.in).
    pipe(gateway).
    pipe(s.out).
    pipe(conn);

  s.in.on('error', onProtocolError ) ;
  s.out.on('error', onProtocolError );
  conn.on('error', onConnError );

  function onProtocolError(err) {
    conn.end('protocol error:' + err.message );
  }
}

function onConnError(err) {  
  console.error('connection error:', err.stack );
};

