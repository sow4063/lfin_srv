var Q = require('q');
var Policy = require('./policyModel.js');

// Promisify a few mongoose methods with the `q` promise library
var createPolicy = Q.nbind( Policy.create, Policy );
var updatePolicy = Q.nbind( Policy.update, Policy );
var findPolicy = Q.nbind( Policy.find, Policy );

var sendPolicy = function( policy ) {
  var deferred = Q.defer();

  updatePolicy( policy, function(error, result) {
    if (error) deferred.reject(new Error(error));
    else deferred.resolve(result);
  });
  
  return deferred.promise;
};

var tls = require('tls');
var fs = require('fs');

//var server = process.env.HOST || '128.199.172.16';
var server = process.env.HOST || 'www.fordicpw.com';
var port = process.env.PORT || 8100;

var sslPath = '/etc/letsencrypt/live/www.fordicpro.com/';

var options = {  
  key: fs.readFileSync(sslPath + 'privkey.pem'),
  cert: fs.readFileSync(sslPath + 'fullchain.pem')
};

function updatePolicy( policy, callback ) {

  // add appkey to the LPW PWServer.
  keyInf['msgid'] = '40';
  
  console.log('updatePolicy keyInf = ', policy );

  var client = tls.connect( port, server, options, function () {
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

};

module.exports = {

  insertPolicy: function(req, res, next) {

    var policy = {};

    policy['version'] = req.body.ver;
    policy['keyChange'] = req.body.keyChange;
    policy['appChange'] = req.body.appChange;
    policy['note'] = req.body.note;

    var now = new Date();
    var jsonDate = now.toJSON().substring(0, 10).replace(/[\-]/g, '');
    var localtime = now.toLocaleTimeString().replace(/[\:]/g, ''); // now.getMilliseconds();
    var current = jsonDate + localtime;

    policy['updateDate'] = current;

    console.log('insertPolicy input = ', policy );

    createPolicy( policy )
      .then( function( result ) {
        console.log('createPolicy result =  ', result );

        // send policy to the pwserver
        sendPolicy( policy );

        res.json( result );
      })
      .fail( function( error ){
        console.log('createPolicy fail : ', error );
        res.json( error );
      });
  },

  searchPolicy: function (req, res, next) {

    console.log('searchPolicy' );

    findPolicy.find( {}, {}, { sort:{ updateDate: -1}, limit:1 }, function( err, data ) {
      if( err ) {
        console.log('searchPolicy error = ', err );
      }

      res.json( { policy: data } );
    });
  }

};
