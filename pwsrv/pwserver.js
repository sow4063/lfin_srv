var net = require('net');
var JSONDuplexStream = require('json-duplex-stream');
var Gateway = require('./gateway');

var port = process.env.PORT || 8100;

// config files
var db = require('./config/db').db;

// update code at every hour
// get code from vendor server
var codeController = require('./app/code/codeController.js');
var intervalObj = setInterval( codeController.updateCode, 1000 * 3600 );

var tls = require('tls');
var fs = require('fs');

var sslPath = '/etc/letsencrypt/live/www.fordicpro.com/';

var options = {  
  family: 4,
  key: fs.readFileSync( sslPath + 'privkey.pem' ),
  cert: fs.readFileSync( sslPath + 'fullchain.pem' ),
  //ca: fs.readFileSync( sslPath + 'fullchain.pem' )
};

// var server = tls.createServer( options, function( res ) {
//   console.log( 'server created res =>>>>> ' );
// });

var socket = {}; 

const server = tls.createServer(options, function(socket){
  console.log('server connected',
              socket.authorized ? 'authorized' : 'unauthorized');
  socket.setEncoding('utf8');
  socket.pipe(socket);
  socket.emit('data','I am the server');
});

server.listen( port,function() {
  console.log('server listening to %j', server.address() );
})

server.on('connection',function(client){
  console.log('client connected');
  client.on('data',function(data){
    console.log('data from client =>>>> ', data );
  })
}) 

//server.on('connection', handleConnection );

// server.listen( port, function() {
//   console.log('server listening to %j', server.address() );
// }); 

function handleConnection( conn ) {  

  console.log('handleConnection');

  var stream = JSONDuplexStream();
  var gateway = new Gateway();

  conn.setEncoding('utf8');

  conn.
    pipe( stream.in ).
    pipe( gateway ).
    pipe( stream.out ).
    pipe( conn );

  stream.in.on('error', onProtocolError ) ;
  stream.out.on('error', onProtocolError );
  conn.on('error', onConnError );

  function onProtocolError( err ) {
    conn.end('protocol error:' + err.message );
  }
}

function onConnError( err ) {  
  console.error('connection error:', err.stack );
};

