var fs = require('fs');
var Q = require('q');
var UserConfirm = require('./userConfirmModel.js');
//var unirest = require('unirest');

// Promisify a few mongoose methods with the `q` promise library
var insertUserConfirm = Q.nbind( UserConfirm.create, UserConfirm );

function isExistVendor( mobileNumber ) {
  return true;
};

// var confirmPW = function(mobileNumber, lpw){
//   return Q.Promise( function(resolve, reject, notify ) {
//     checkPW(mobileNumber, lpw, function(error, buffer) {
//       console.log(error, buffer);
//       if (error) reject(error);
//       else resolve(buffer);
//     });
//   });
// };

var confirmPW = function(mobileNumber, lpw){
  var deferred = Q.defer();
  checkPW( mobileNumber, lpw, function(error, result) {
    if (error) deferred.reject(new Error(error));
    else deferred.resolve(result);
  });
  return deferred.promise;
};

function checkPW( mobileNumber, LPW, callback ) {

  // verify the LPW to the LPW PWServer.
  // through TCP
  var result = 'no';
  var obj = {};
  obj['mobileNumber'] = mobileNumber;
  obj['LPW'] = LPW;

  var net = require('net');

  var client = new net.Socket();

  client.setEncoding('utf8');

  client.connect(8100, '127.0.0.1', function() {
    console.log('Connected');
    client.write( JSON.stringify(obj) );
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

	verifyUser: function (req, res, next) {

    // confirm the mobile vendor
    // not exist return 'novendor'
    var mobileNumber = req.query.mobileNumber;
    var CID = req.query.CID;
    var LPW = req.query.LPW;
    var cellID = req.query.cellID;

    console.log('verifyUser:: ', mobileNumber, CID, LPW, cellID );
    
    if( !isExistVendor( mobileNumber ) ) {
      console.log('no vendor is exist for the mobile number. ', mobileNumber );
      res.json( 'novendor' );
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
      
      confirmPW( mobileNumber, LPW )
        .then(function(buffer){
          userConfirm['verifyResult'] = buffer === 'pass' ? true : false;

          console.log('userConfirm ', userConfirm );

          //updateUserConfirm( userConfirm, { upsert: true }  )
          insertUserConfirm( userConfirm )
            .then(function(result){
              console.log('the userConfirm created successfully.', result );
            })
            .fail(function(err){
              console.log('create userConfirm Error.', err );
            }); 

          res.json( buffer );
          
        })
        .fail(function(error){
          console.log('confirmPW fail : ', error );
          res.json(error);
        });

    } // exist movile newtwork operator

  } // verify user

};
