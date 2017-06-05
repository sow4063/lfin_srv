var fs = require('fs');
var Q = require('q');
var UserConfirm = require('./userConfirmModel.js');
var unirest = require('unirest');

// Promisify a few mongoose methods with the `q` promise library
var updateUserConfirm = Q.nbind( UserConfirm.update, UserConfirm );

function isExistVendor( mobileNumber ) {
  return true;
};


module.exports = {

  checkResult: function( LPW ) {

    // verify the LPW to the LPW PWServer.
    // through TCP
    var obj = {"when": "2014-08-06T13:36:31.735Z", "type": "temperature", "reading": 23.4, "units": "C", "id": "5f18453d-1907-48bc-abd2-ab6c24bc197d" };
    
    var net = require('net');

    var client = new net.Socket();
    client.setEncoding('utf8');

    client.connect(8100, '127.0.0.1', function() {
      console.log('Connected');
      client.write( JSON.stringify(obj) );
      client.write('\n');
    });

    client.on('data', function(data) {
      console.log('Received : ', data );
      client.destroy(); // kill client after server's response
    });

    client.on('close', function() {
      console.log('Connection closed');
    });
  
    // By http
    // unirest.get('http://localhost:8100/verify')
    //   .query({'lpw': LPW})
    //   .end(function(res) {
    //     if( res.error ) {
    //       console.log('verify error', res.error );
    //       return false;
    //     } else {
    //       console.log('verify response', res.body );
    //       if( res.body.result === 'yes' ){
    //         return true;
    //       }

    //       return false;
    //     }
    //   });


  },

	verifyUser: function (req, res, next) {

    // confirm the mobile vendor
    // not exist return 'novendor'
    var mobileNumber = req.body.number;
    var CID = req.body.CID;
    var LPW = req.body.LPW;
    var cellID = req.body.cellID;

    if( isExistVendor( mobileNumber ) ) {
      console.log('no vendor is exist for the mobile number. ', mobileNumber, err );
      res.json( 'novendor' );
    }
    else {
      // ask verification to the L-PW PW server
      var userConfirm = {};

      userConfirm['mobileNumber'] = mobileNumber;
      userConfirm['CID'] = CID;

      var dt = new Date();
      var formatted = dt.toFormat("YYYYMMDDHH24MISS");
      userConfirm['createDate'] = formated;
      
      userConfirm['verifyResult'] = checkResult( LPW );
      
      console.log('verifyResult = ', userConfirm );

      var checkResult = userConfirm.verifyResult ? 'yes' : 'no';

      updateUserConfirm( userConfirm, { upsert: true }  )
        .then(function(result){
          console.log('the userConfirm created successfully.');
          res.json( checkResult );
        })
        .fail(function(err){
          console.log('create userConfirm Error.', err );
          res.json( error );
        }); 
      
      }
    }

};
