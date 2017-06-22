var fs = require('fs');
var Q = require('q');
var UserCode = require('./userCodeModel.js');

// Promisify a few mongoose methods with the `q` promise library
var findUserCodes = Q.nbind(UserCode.find, UserCode);
var updateUserCode = Q.nbind(UserCode.update, UserCode);
var removeUserCodes = Q.nbind(UserCode.remove, UserCode);

var askCode = function( mobileNumber ) {
  var deferred = Q.defer();

  requestCode( mobileNumber, function(error, result) {
    if (error) deferred.reject(new Error(error));
    else deferred.resolve(result);
  });
  
  return deferred.promise;
};

var tls = require('tls');
var fs = require('fs');

var server = process.env.HOST || '128.199.172.16';
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

  getCode: function(req, res, next) {

    var mobileNumber = req.query.mobileNumber;

    console.log('getCode mobileNumber = ', mobileNumber );

    askCode( mobileNumber )
      .then(function(buffer){
        console.log('askCode result = ', buffer );
        res.json( buffer );
        
      })
      .fail(function(error){
        console.log('askCode fail : ', error );
        ret.code = 100;
        ret.msg = error;
        res.json( ret );
      });
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

  removeCodes: function(req, res, next){
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

  updateCodes: function (req, res, next) {

    var codes = req.body.codes;

    var codeArr = [];
      
    for( var i = 0; i < codes.length; i++ ){
      var newCode = {};

      newCode['mobileNumber'] = codes[i][0];         
      newCode['code'] = codes[i][1];

      codeArr.push( newCode );
    }
    
    console.log('the codes length = ', codeArr.length );

    updateUserCode( codeArr, { upsert: true, multi: true }  )
      .then(function(result){
        console.log('the codes created successfully.');
        res.json( result.length );
      })
      .fail(function(err){
        console.log('create UserCode Error.', err);
        res.json( error );
      }); 
    
  }

};
