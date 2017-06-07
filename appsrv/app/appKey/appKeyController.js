var Q = require('q');
var AppKey = require('./appKeyModel.js');

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

function addKey( keyInf, callback ) {

  // add appkey to the LPW PWServer.
  var result = 'no';
  
  console.log('addKey : ', keyInf );

  var net = require('net');

  var client = new net.Socket();

  client.setEncoding('utf8');

  client.connect(8100, '127.0.0.1', function() {
    console.log('Connected');
    client.write( JSON.stringify(keyInf) );
    client.write('\n');
  });

  client.on('data', function(data) {
    console.log('Received From LPW Server: ', data, JSON.parse(data).success );
    
    callback( null, JSON.parse(data).success ? 'pass' : 'fail' );

    client.destroy(); // kill client after server's response
  });

  client.on('close', function() {
    console.log('Connection closed!!');
  });

};

module.exports = {

  insertRSAKey: function (req, res, next) {

    var keyinf = {};

    keyinf['key'] = req.query.rsakey;
    keyinf['keyType'] = 'rsa';
    keyinf['mobileNumber'] = req.query.mobileNumber;

    console.log('key info = ', keyinf );

    removeKey( keyinf )
      .then(function(result){
        createKey( keyinf )
        .then(function(result){
          console.log('Success on update rsakey :: ', result );

          // create the RSA key of server and return it.
          res.json( result );
        })
        .fail(function(err){
          console.log('Fail on update rsakey :: ', error );
          res.json( error );
        });
      })
      .fail(function(err){
        console.log('Fail on remove rsakey');
        res.json( error );
      });
    
  }

};
