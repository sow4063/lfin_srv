
var Q = require('q');
var NodeRSA = require('node-rsa');
var AppKey = require('./appKeyModel.js');
var randomstring = require("randomstring");

var rsapubkey = '';
var rsaprikey = '';

// Promisify a few mongoose methods with the `q` promise library
//var updateKey = Q.nbind( AppKey.update, AppKey );
var createKey = Q.nbind( AppKey.create, AppKey );
var removeKey = Q.nbind( AppKey.remove, AppKey );
var findKeyOne = Q.nbind( AppKey.findOne, AppKey );

var sendKey = function( keyInf ) {
  var deferred = Q.defer();

  addKey( keyInf, function(error, result) {
    if (error) deferred.reject(new Error(error));
    else deferred.resolve(result);
  });
  
  return deferred.promise;
};

var tls = require('tls');
var fs = require('fs');

var server = process.env.HOST || 'www.fordicpro.com';
//var server = process.env.HOST || 'www.fordicpw.com';
var port = process.env.PORT || 8100;

var sslPath = '/etc/letsencrypt/live/www.fordicpro.com/';

var options = {  
  key: fs.readFileSync(sslPath + 'privkey.pem'),
  cert: fs.readFileSync(sslPath + 'fullchain.pem')
};

function addKey( keyInf, callback ) {

  // add appkey to the LPW PWServer.
  keyInf['msgid'] = '20';
  
  console.log('addKey keyInf = ', keyInf );

  var client = tls.connect( port, server, options, function () {
    console.log( client.authorized ? 'Authorized' : 'Not authorized' );
    client.write( JSON.stringify( keyInf ) );
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

module.exports = {

  getAppkey: function( req, res, next ) {
    var ret = {
      pub: rsapubkey,
      pri: rsaprikey
    };

    console.log('getAppkey => ', req.body.mobileNumber );

    res.json( ret );
  },

  getAESKey: function( req, res, next ) {

    var ret = {
      code: -1,
      msg: 'ng'
    };

    var mobileNumber = req.body.mobileNumber;
    
    if( !mobileNumber ) {
      ret.code = 121;
      ret.msg = '사용자의 RSA key가 존재하지 않습니다.';
      res.json( ret );  
      return;
    }
    
    // generate aes key for the client
    var aesKey = randomstring.generate({
      length: 6,
      charset: 'alphanumeric'
    });

    var keyinf = {};
    
    keyinf['key'] = aesKey;
    keyinf['keyType'] = 'aes';
    keyinf['mobileNumber'] = mobileNumber;

    console.log('sendAESKey input = ', keyinf );

    // send the key to the pwserver
    sendKey( keyinf )
      .then( function( result ) {
        console.log('sendKey result =  ', result );

        // return the key to the client
        findKeyOne( { 'mobileNumber': mobileNumber } )
          .then( function( rsaKey ) {

            ret.code = result.code;
            ret.msg = result.msg;

            var clientKey = new NodeRSA( rsaKey.key );
            var encrypted = clientKey.encrypt( aesKey, 'base64', 'utf8' );

            console.log('rsaKey.key ==>> ',  rsaKey.key );
            
            var serverKey = new NodeRSA( rsaprikey );
            var send = serverKey.encryptPrivate( encrypted, 'base64', 'utf8' );
            
            //console.log('encrypted ==>> ', encrypted );
            console.log('send ==>> ', send );
            
            //ret.val = send;
            ret.val = encrypted;
            ret.aes = aesKey;

            console.log('ret encrypted ===>>> ', encrypted );
            console.log('ret aeskey ===>>> ', aesKey );
            
            res.json( ret );
          })
          .fail( function( error ) {
            ret.code = 510;
            ret.msg = 'DB서버 접속 오류가 발생했습니다.';
            ret.val = error;
          });
        
      })
      .fail( function( error ) {
        console.log('sendKey fail : ', error );
        ret.code = 120;
        ret.msg = 'AES키 등록에 실패했습니다.';
        ret.val = error;
        res.json( ret );
      });
  },

  makeRSAKey: function() {
    
    var key = new NodeRSA( {b: 2048} );
    rsapubkey = key.exportKey('pkcs8-public-pem');
    rsaprikey = key.exportKey('pkcs8-private-pem');
 
    var text = 'Hello RSA!';
    var encrypted = key.encrypt( text, 'base64');
    
    // save the key to the db
    var keyinf = {};

    keyinf['key'] = rsapubkey;
    keyinf['keyType'] = 'rsa';
    keyinf['mobileNumber'] = 'appserver';

    console.log('key info = ', keyinf );    
    
    var decrypted = key.decrypt( encrypted, 'utf8' );
    console.log('decrypted: ', decrypted);

    createKey( keyinf )
      .then( function( result ) {
        console.log('Success on create RSA key for appserver :: ', result );

        // create the RSA key of server and return it to mobile.
        return result;
      })
      .fail( function( err ) {
        console.log('Fail on create the RSA key for appserver :: ', error );
        return error;
      });

  },

  insertRSAKey: function( req, res, next ) {

    var ret = {
      code: 110,
      msg: 'ng',
      val: ''
    };

    var rsakey = req.body.rsakey;
    var mobileNumber = req.body.mobileNumber;

    if( !mobileNumber || !rsakey ) {
      ret.code = 122;
      ret.msg = 'mobileNumber or rsakey is undefined.';
      res.json( ret );  
      return;
    }

    var keyinf = {};

    keyinf['key'] = req.body.rsakey;
    keyinf['keyType'] = 'rsa';
    keyinf['mobileNumber'] = req.body.mobileNumber;

    console.log('key info = ', keyinf );

    removeKey( keyinf.mobileNumber )
      .then( function( result ) {
        createKey( keyinf )
          .then( function( result ) {
            console.log('Success on update RSA key :: ', result );

            // create the RSA key of server and return it to mobile.
            ret.code = 0;
            ret.msg = 'RSA키 등록에 성공했습니다.';
            ret.val = rsapubkey;
            res.json( ret );
          })
          .fail(function( error ){
            console.log('Fail on update RSA key :: ', error );
            ret.msg = 'RSA키 등록에 실패했습니다.';
            ret.val = error;
            res.json( ret );
          });
      })
      .fail(function( error ){
        console.log('Fail on remove RSA key');
        ret.code = 520;
        ret.msg = 'DB 추가시 오류가 발생했습니다.';
        ret.val = error;
        res.json( ret );
      });
    
  }

};
