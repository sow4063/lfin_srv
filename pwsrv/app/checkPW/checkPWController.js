var fs = require('fs');
var Q = require('q');
var CheckPW = require('./checkPWModel.js');
var unirest = require('unirest');

// Promisify a few mongoose methods with the `q` promise library
var updateCheckPW = Q.nbind( CheckPW.update, CheckPW );
var findUserCode = Q.nbind( CheckPW.find, CheckPW );

function getCellID(mobileNumber) {
  return 'cellID';
};

function makeLPW( mobileNumber, uuid ) {
  let query = {};

  query['mobileNumber'] = mobileNumber;

  // get the cellID from mobile vendor
  var cellID = getCellID( mobileNumber );
  let pw = ''; 
  
  return pw;
};

module.exports = {

	checkPW: function (req, res, next) {

    // make a L-PW from password info
    var mobileNumber = req.body.number;
    var LPW = makeLPW( mobileNumber, req.body.UUID );

    // compare input L-PW and maked L-PW
    // if the L-PW is same return 'yes' or return 'no'
    if( LPW === req.body.LPW ) {
      console.log('LPW is same.', mobileNumber, LPW );
      res.json('yes');
    }
    else {
      console.log('LPW is different', mobileNumber, LPW, req.body.LPW );
      res.json('no');
    }
  },

  updateCode: function() {
    console.log('updateCode');

    // get the code from mobile vendor.
    var LPW = {};

    // verify the LPW to the LPW PWServer.
    unirest.get('http://localhost:8200/update')
    .query({'lpw': LPW})
    .end(function(res) {
      if( res.error ) {
        console.log('Error on fetching the code', res.error );
        return false;
      } 
      else {
        console.log('success getting the code from the mobile vendor', res.body );
        if( res.body.result === 'yes' ){
          return true;
        }

        return false;
      }
    });
  }

};
