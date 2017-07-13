var fs = require('fs');
var Q = require('q');
var UserCode = require('./userCodeModel.js');

// Promisify a few mongoose methods with the `q` promise library
var findUserCodes = Q.nbind( UserCode.find, UserCode );
var updateUserCode = Q.nbind( UserCode.updateMany, UserCode );
var removeUserCodes = Q.nbind( UserCode.remove, UserCode );

var askCode = function( mobileNumber ) {
  var deferred = Q.defer();

  requestCode( mobileNumber, function( error, result ) {
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

function requestCode( mobileNumber, callback ) {

  // add appkey to the LPW PWServer.
  var obj = {};
  obj['msgid'] = '30';
  obj['mobileNumber'] = mobileNumber;
  
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

module.exports = {

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
    
    console.log('getCode mobileNumber = ', mobileNumber );

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
      askCode( mobileNumber )
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

    updateUserCode( req.body.codes, { upsert: true, multi: true }  )
      .then( function( result ) {
        console.log('the codes updated successfully.');
        res.json( result.length );
      })
      .fail( function( err ) {
        console.log('updateCodes Error.', err );
        res.json( err );
      }); 
    
  }

};
