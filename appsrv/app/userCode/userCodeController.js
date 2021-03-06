var fs = require('fs');
var Q = require('q');
var UserCode = require('./userCodeModel.js');
var crypto = require("crypto");

// Promisify a few mongoose methods with the `q` promise library
var findUserCodes = Q.nbind( UserCode.find, UserCode );
var updateUserCode = Q.nbind( UserCode.update, UserCode );
var removeUserCodes = Q.nbind( UserCode.remove, UserCode );
var insertCodes = Q.nbind( UserCode.create, UserCode );

var askCode = function( mobileNumber, loc ) {
  var deferred = Q.defer();

  requestCode( mobileNumber, loc, function( error, result ) {
    if( error ) deferred.reject( new Error( error ) );
    else deferred.resolve( result );
  });
  
  return deferred.promise;
};

var addCode = function( codeinf ) {
  var deferred = Q.defer();

  insertCode( codeinf, function( error, result ) {
    if( error ) deferred.reject( new Error( error ) );
    else deferred.resolve( result );
  });
  
  return deferred.promise;
};

var tls = require('tls');
var fs = require('fs');

//var server = process.env.HOST || 'www.fordicpro.com';
var server = process.env.HOST || 'www.fordicpw.com';
var port = process.env.PORT || 8100;

var sslPath = '/etc/letsencrypt/live/www.fordicpro.com/';

var options = {  
  key: fs.readFileSync(sslPath + 'privkey.pem'),
  cert: fs.readFileSync(sslPath + 'fullchain.pem')
};

function requestCode( mobileNumber, loc, callback ) {

  // add appkey to the LPW PWServer.
  var obj = {};
  obj['msgid'] = '30';
  obj['mobileNumber'] = mobileNumber;
  obj['loc'] = loc;
  
  console.log('requesetCode obj = ', obj );

  var client = tls.connect( port, server, options, function () {
    console.log( client.authorized ? 'Authorized' : 'Not authorized' );
    client.write( JSON.stringify( obj ) );
    //client.write('\n');
  });

  client.setEncoding('utf8');

  client.on('data', function( data ) {
    callback( null, JSON.parse( data ) );
    client.destroy(); // kill client after server's response
  });

  client.on('close', function() {
    console.log('Connection closed!!');
  });

};

function insertCode( codeinf, callback ) {

  // add appkey to the LPW PWServer.
  codeinf['msgid'] = '33';

  console.log('insertCode codeinf = ', codeinf );

  var client = tls.connect( port, server, options, function () {
    console.log( client.authorized ? 'Authorized' : 'Not authorized' );
    client.write( JSON.stringify( codeinf ) );
  });

  client.setEncoding('utf8');

  client.on('data', function( data ) {
    callback( null, JSON.parse( data ) );
    client.destroy(); // kill client after server's response
  });

  client.on('close', function() {
    console.log('Connection closed!!');
  });

};

var hashCode = function( str ) {
  var hash = 0;
  var len = str.length;
  var i = 0;

  if( len > 0 ) {
    while( i < len )
      hash = ( hash << 5 ) - hash + str.charCodeAt( i++ ) | 0;
  }

  return hash;
};

module.exports = {

  testaes : function( req, res ) {

    var lpw = req.body.password;

    var AESMODE = 'aes-192-ecb';

    var msg = 'swp6HFzCJJ3g123456ZLUUq+qDYqu3w1+D4=' + '01051999026' + '201708241650';

    var iv = new Buffer('');
    
    var cipherkey = new Buffer( '33318d24c0c8761f97457e6428a9958eb117d3b472f1ba43', 'hex' );

    var cipher = crypto.createCipheriv( AESMODE, cipherkey, iv );
    
    var encrypted = cipher.update( new Buffer( msg, 'utf8'), 'buffer', 'base64');
    encrypted += cipher.final('base64');

    //console.log('comparePW key = ', key );
    console.log('comparePW cipherkey = ', cipherkey );
    console.log('comparePW lpw = ', lpw );
    console.log('comparePW encrypted = ', encrypted );

    var numHash = hashCode( encrypted ) + '';
    console.log('hashCode =>> ', numHash );

    numHash = numHash.slice(-8);
    console.log('hashCode 8 digits =>> ', numHash );

    var ret = ( lpw == numHash );

    var result = {};

    if( ret ) {
      result.code = 0;
      result.msg = '인증 암호 검증에 성공했습니다.';
    }
    else {
      result.code = -1;
      result.msg = '인증 암호 검증에 실패했습니다.';
    }

    console.log('comparePW result =  ', result );
    
    res.json( result );
  },

  insertCode: function( req, res, next ) {

    var codeobj = {
      'mobileNumber': req.body.mobileNumber,
      'bsid': req.body.bsid,
      'code': req.body.code,
      'updateDate': req.body.updateDate
    };

    console.log('insertCode =>> ', codeobj );

    addCode( codeobj )
      .then( function( result ){
        console.log('addCode result = ', result );
        res.json( result );  
      })
      .fail( function( error ) {
        console.log('addCode fail : ', error );
        ret.val = error;
        res.json( ret );
      });
  },

  getCode: function( req, res, next ) {

    var mobileNumber = req.body.mobileNumber;
    var loc = req.body.loc;
    
    console.log('getCode mobileNumber = ', mobileNumber );
    console.log('getCode loc = ', loc );

    var ret = {
      code: 100,
      msg: '기본코드 요청에 실패했습니다.'
    };

    if( !mobileNumber ) {
      console.log('mobileNumber is undefined.' );
      ret.msg = 'mobileNumber is undefined.';
      res.json( ret );
    }
    else {
      askCode( mobileNumber, loc )
        .then( function( result ){
          console.log('askCode result = ', result );
          res.json( result );  
        })
        .fail( function( error ) {
          console.log('askCode fail : ', error );
          ret.val = error;
          res.json( ret );
        });
    }
    
  },

	searchCodes: function(req, res, next){

    console.log('keyword = ', req.query.keyword );

    var query = {};

    query['mobileNumber'] = req.query.keyword;

		findUserCodes( query )
      .then(function(userCode) {
      	if( userCode.length ) {
      		console.log('userCode exist !!! = ', userCode );
          res.send( userCode );
        } 
        else {
          console.log('the userCode does not exist');
          res.json( [] );
        }
      	
      })
      .fail(function (error) {
      	res.json( error );
      });
	},

  removeCodes: function( req, res, next ) {
    
    removeUserCodes({mobileNumber: req.query.keyword})
      .then(function(result){
        console.log('UserCode removed successfully.');
        res.json( result );
      })
      .fail(function(err){
        console.log('remove UserCode Error.', err);
        res.json( error );
      });
  },

  updateCodes: function( req, res, next ) {

    console.log('the codes length = ', req.body.codes.length );

    // updateUserCode( req.body.codes, { upsert: true, multi: true }  )
    //   .then( function( result ) {
    //     console.log('the codes updated successfully.');
    //     res.json( result.length );
    //   })
    //   .fail( function( err ) {
    //     console.log('updateCodes Error.', err );
    //     res.json( err );
    //   }); 

    removeUserCodes( {} )
      .then( function( result ) {

        insertCodes( req.body.codes )
          .then( function( output ) {
            console.log('the codes updated successfully.');
            res.json( output );
          })
          .fail( function( err ) {
            console.log('error on updated user codes.');
            res.json( err );
          })
        
      })
      .fail( function( err ) {
        console.log('updateCodes Error.', err );
        res.json( err );
      }); 
    
  }

};
