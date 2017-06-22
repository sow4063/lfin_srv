var Q = require('q');
var NodeRSA = require('node-rsa');
var AppKey = require('./appKeyModel.js');
var apprsakey = '';
var rsaprikey = '';

// Promisify a few mongoose methods with the `q` promise library
//var updateKey = Q.nbind( AppKey.update, AppKey );
var createKey = Q.nbind( AppKey.create, AppKey );
var removeKey = Q.nbind( AppKey.remove, AppKey );

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

// var options = {  
//   key: fs.readFileSync('../cert/key.pem'),
//   cert: fs.readFileSync('../cert/cert.pem')
// };
var sslPath = '/etc/letsencrypt/live/www.fordicpro.com/';

var options = {  
    key: fs.readFileSync(sslPath + 'privkey.pem'),
    cert: fs.readFileSync(sslPath + 'fullchain.pem')
};

function addKey( keyInf, callback ) {

  // add appkey to the LPW PWServer.
  keyInf['msgid'] = '20';
  
  console.log('addKey keyInf = ', keyInf );

  var client = tls.connect(8100, options, function () {
    console.log( client.authorized ? 'Authorized' : 'Not authorized' );
    client.write( JSON.stringify( keyInf ) );
    client.write('\n');
  });

  client.setEncoding('utf8');

  client.on('data', function( data ) {
    callback( null, JSON.parse( data ) );
    client.destroy(); // kill client after server's response
  });

  client.on('close', function() {
    console.log('Connection closed!!');
  });

  
  // var net = require('net');

  // var client = new net.Socket();

  // client.setEncoding('utf8');

  // client.connect(8100, '127.0.0.1', function() {
  //   console.log('Connected');
  //   client.write( JSON.stringify(keyInf) );
  //   client.write('\n');
  // });

  // client.on('data', function(data) {
  //   callback( null, JSON.parse(data) );
  //   client.destroy(); // kill client after server's response
  // });

  // client.on('close', function() {
  //   console.log('Connection closed!!');
  // });

};

module.exports = {

  insertAESKey: function(req, res, next){

    var keyinf = {};

    // decryption by appserver RSA Key.
    //console.log('apprsakey = ', apprsakey );
    var key = new NodeRSA( rsaprikey );

    //console.log( key.isPrivate() );

    //var decrypted = key.decrypt( req.query.aeskey, 'utf8');
    var encrypted = key.encrypt('AES Key', 'base64');
    var decrypted = key.decrypt( encrypted, 'utf8');
    console.log('decrypted: ', decrypted);

    keyinf['key'] = decrypted;
    keyinf['keyType'] = 'aes';
    keyinf['mobileNumber'] = req.query.mobileNumber;

    console.log('insertAESKey input = ', keyinf );

    sendKey( keyinf )
      .then(function(result){
        console.log('sendKey result =  ', result );
        res.json( result );
      })
      .fail(function(error){
        console.log('sendKey fail : ', error );
        res.json( error );
      });
  },

  makeRSAKey: function() {
    
    var key = new NodeRSA({b: 2048});
    apprsakey = key.exportKey('pkcs8-public-pem');
    rsaprikey = key.exportKey('pkcs8-private-pem');
 
    var text = 'Hello RSA!';
    var encrypted = key.encrypt(text, 'base64');
    
    // save the key to the db
    var keyinf = {};

    keyinf['key'] = apprsakey;
    keyinf['keyType'] = 'rsa';
    keyinf['mobileNumber'] = 'appserver';

    console.log('key info = ', keyinf );    
    
    var decrypted = key.decrypt(encrypted, 'utf8');
    console.log('decrypted: ', decrypted);

    createKey( keyinf )
      .then(function(result){
        console.log('Success on create RSA key for appserver :: ', result );

        // create the RSA key of server and return it to mobile.
        return result;
      })
      .fail(function(err){
        console.log('Fail on create the RSA key for appserver :: ', error );
        return error;
      });

  },

  insertRSAKey: function (req, res, next) {

    var keyinf = {};

    keyinf['key'] = req.query.rsakey;
    keyinf['keyType'] = 'rsa';
    keyinf['mobileNumber'] = req.query.mobileNumber;

    console.log('key info = ', keyinf );

    removeKey( keyinf.mobileNumber )
      .then(function(result){
        createKey( keyinf )
          .then(function(result){
            console.log('Success on update RSA key :: ', result );

            // create the RSA key of server and return it to mobile.
            res.json( apprsakey );
          })
          .fail(function( error ){
            console.log('Fail on update RSA key :: ', error );
            res.json( error );
          });
      })
      .fail(function( error ){
        console.log('Fail on remove RSA key');
        res.json( error );
      });
    
  }

};
