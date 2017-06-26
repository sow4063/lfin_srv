var net = require('net');
var tls = require('tls');
var fs = require('fs');

var JSONDuplexStream = require('json-duplex-stream');
var Gateway = require('./gateway');

var port = process.env.PORT || 8100;

// config files
var db = require('./config/db').db;

// update code at every hour
// get code from vendor server
var Q = require('q');
var keyController = require('./app/pwKey/pwKeyController.js');

var checkPW = function( event ) {
  var deferred = Q.defer();
  keyController.confirmPW( event, function( error, result ) {
    if( error ) deferred.reject( new Error( error ) );
    else deferred.resolve( result );
  });
  return deferred.promise;
};

var insertAES = function( event ) {
  var deferred = Q.defer();
  keyController.insertAESKey( event, function( error, result ) {
    if( error ) deferred.reject( new Error( error ) );
    else deferred.resolve( result );
  });
  return deferred.promise;
};

var codeController = require('./app/code/codeController.js');
var intervalObj = setInterval( codeController.updateCode, 1000 * 3600 );

var findCode = function( event ){
  var deferred = Q.defer();
  codeController.searchCode( event, function( error, result ) {
    if( error ) deferred.reject( new Error( error ) );
    else deferred.resolve( result );
  });
  return deferred.promise;
};

var addCode = function( event ){
  var deferred = Q.defer();
  codeController.insertCode( event, function( error, result ) {
    if( error ) deferred.reject( new Error( error ) );
    else deferred.resolve( result );
  });
  return deferred.promise;
};

var sslPath = '/etc/letsencrypt/live/www.fordicpro.com/';

var options = {  
  family: 4,
  key: fs.readFileSync( sslPath + 'privkey.pem' ),
  cert: fs.readFileSync( sslPath + 'fullchain.pem' ),
  //ca: fs.readFileSync( sslPath + 'fullchain.pem' )
};

const server = tls.createServer( options, (socket) => {
  
  console.log('server connected', socket.authorized ? 'authorized' : 'unauthorized');

  socket.on('data', function( data ) {
    
    var received = JSON.parse( data );

    console.log( 'parsed data from client = ', received );

    var reply = {
      code: '-1',
      msg: ''
    };

    if( received.msgid === '10' ) {
      checkPW( received )
        .then( function( result ) {
          reply.code = result.code;
          reply.msg = result.msg;
          console.log('checkPW result[OK] = ', reply );
          socket.write( JSON.stringify(reply) );
        })
        .fail( function( error ) {
          reply.code = 700;
          reply.msg = '해당 사용자의 위치 정보가 없습니다.';
          reply.val = error;
          console.log('checkPW result[ERR] = ', reply );
          socket.write( JSON.stringify( reply ) );
        });
    } // msgid = 10
    else if( event.msgid === '20' ) {
      insertAES( event )
        .then( function( result ) {
          reply.code = result.code;
          reply.msg = result.msg;
          console.log('insertAES result[OK] = ', reply );
          socket.write( JSON.stringify( reply ) );
        })
        .fail( function( error ) {
          reply.code = 120;
          reply.msg = 'AES키 등록에 실패했습니다.';
          console.log('insertAES result[ERR] = ', reply );
          socket.write( JSON.stringify( reply ) );
        });
    } // msgid = 20 
    else if( event.msgid === '30' ) {
      findCode( event )
        .then( function( result ) {
          reply.code = 0;
          reply.msg = '기본코드 요청에 성공했습니다.';
          reply.val = result;
          console.log('findCode result[OK] = ', reply );
          socket.write( JSON.stringify( reply ) );
        })
        .fail( function( error ){
          reply.code = 140;
          reply.msg = '기본코드 요청에 실패했습니다.';
          reply.val = error;
          console.log('findCode result[ERR] = ', reply );
          socket.write( JSON.stringify( reply ) );
        });
    } // msgid = 30
    else if( event.msgid === '33' ) {
      addCode( event )
        .then( function( result ) {
          console.log('addCode result[OK] = ', result );
          socket.write( JSON.stringify( result ) );
        })
        .fail( function( error ){
          reply.code = 140;
          reply.msg = '코드 추가에 실패했습니다.';
          reply.val = error;
          console.log('findCode result[ERR] = ', reply );
          socket.write( JSON.stringify( reply ) );
        });
    } // msgid = 33
    else {
      reply.code = 500;
      reply.msg = 'serve error';
      console.log('Invalid MessageID = ', reply );
      socket.write( JSON.stringify( reply ) );
    } // others

  });

});

server.listen( port, function() {
  console.log('server listening to %j', server.address() );
}); 


