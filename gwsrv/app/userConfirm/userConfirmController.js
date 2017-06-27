var fs = require('fs');
var Q = require('q');
var UserConfirm = require('./userConfirmModel.js');
//var unirest = require('unirest');

// Promisify a few mongoose methods with the `q` promise library
var insertUserConfirm = Q.nbind( UserConfirm.create, UserConfirm );

function isExistVendor( mobileNumber ) {
  return true;
};

var confirmPW = function(keyInf){
  var deferred = Q.defer();
  checkPW( keyInf, function(error, result) {
    if (error) deferred.reject(new Error(error));
    else deferred.resolve(result);
  });
  return deferred.promise;
};

var tls = require('tls');

var server = process.env.HOST || 'www.fordicpro.com' || '128.199.172.16';
var port = process.env.PORT || 8100;

var sslPath = '/etc/letsencrypt/live/www.fordicpro.com/';

var options = {  
  key: fs.readFileSync( sslPath + 'privkey.pem' ),
  cert: fs.readFileSync( sslPath + 'fullchain.pem' ),
  //ca: fs.readFileSync( sslPath + 'fullchain.pem' )
};

function checkPW( keyInf, callback ) {

  // verify the LPW to the LPW PWServer.
  keyInf['msgid'] = '10';
  
  console.log('checkPW keyInf = ', keyInf );

  var client = tls.connect( port, 'www.fordicpro.com', options, function () {
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

	verifyUser: function( req, res, next ) {

    // confirm the mobile vendor
    // not exist return 'novendor'
    var mobileNumber = req.body.mobileNumber;
    var CID = req.body.CID;
    var LPW = req.body.LPW;
    var timestamp = req.body.timestamp;

    console.log('verifyUser:: ', mobileNumber, CID, LPW, timestamp );

    var ret = {
      code: 0,
      msg: '인증 암호 검증에 성공했습니다.',
      val: ''
    };

    if( !mobileNumber || !LPW || timestamp ) {
      ret.code = 999;
      ret.msg = '입력 정보가 없습니다.';
      
      var obj = {
        'mobileNumber': mobileNumber,
        'CID': CID,
        'LPW': LPW,
        'timestamp': timestamp
      };

      ret.val = JSON.stringify( obj );

      res.json( ret );
    }
    else if( !isExistVendor( mobileNumber ) ) {
      console.log('no vendor is exist for the mobile number. ', mobileNumber );
      ret.code = 800;
      ret.msg = '통신 사업자가 존재하지 않습니다.';
      res.json( ret );
    }
    else {
      // ask verification to the L-PW PW server
      var userConfirm = {};

      userConfirm['mobileNumber'] = mobileNumber;
      userConfirm['CID'] = CID;

      var now = new Date();
      var jsonDate = now.toJSON().substring(0, 10).replace(/[\-]/g, '');
      var localtime = now.toLocaleTimeString().replace(/[\:]/g, ''); // now.getMilliseconds();
      var current = jsonDate + localtime;

      userConfirm['createDate'] = current;

      var keyInf = {};
      keyInf['mobileNumber'] = mobileNumber;
      keyInf['lpw'] = LPW;
      keyInf['timestamp'] = timestamp;
      
      confirmPW( keyInf )
        .then( function( result ) {
          console.log('confirmPW result = ', result );
          ret.code = result.code;
          ret.msg = result.msg;

          userConfirm['verifyResult'] = result.code === '0' ? true : false;

          console.log('userConfirm ', userConfirm );

          insertUserConfirm( userConfirm )
            .then( function( insertResult ) {
              console.log('the userConfirm created successfully.', insertResult );
            })
            .fail( function( error ) {
              console.log('create userConfirm Error.', error );
            }); 

          res.json( ret );
          
        })
        .fail( function( error ) {
          console.log('confirmPW fail : ', error );
          ret.code = 110;
          ret.msg = '인증 암호가 검증에 실패했습니다.'
          ret.val = error;
          res.json( ret );
        });

    } // exist movile newtwork operator

  } // verify user

};
