var fs = require('fs');
var Q = require('q');
var CheckPW = require('./checkPWModel.js');
var unirest = require('unirest');

// Promisify a few mongoose methods with the `q` promise library
var updateCheckPW = Q.nbind( CheckPW.update, CheckPW );
var findUserCode = Q.nbind( CheckPW.find, CheckPW );

function makeLPW( mobileNumber ) {
  var pw = '';

  let query = {};

  query['mobileNumber'] = mobileNumber;

  findUserCodes( query )
    .then(function(userCode) {
      if( userCode.length ) {
        console.log('userCode exist !!! = ', userCode );
        // how to make lpw???
        pw = 'lpw';
      } 
      else {
        console.log('the userCode does not exist');
        pw = 'nolpw';
      }
      
    })
    .fail(function (error) {
      console.log('fail to find the user code ' , error );
      pw = 'nolpw';
    });

  return pw;
};

module.exports = {

	checkPW: function (req, res, next) {

    // make a L-PW from password info
    var mobileNumber = req.body.number;
    var LPW = makeLPW( mobileNumber );

    // compare input L-PW and maked L-PW
    // if the L-PW is same return 'yes' or return 'no'
    if( LPW === req.body.LPW ) {
      res.json('yes');
    }
    else {
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
        console.log('verify error', res.error );
        return false;
      } else {
        console.log('verify response', res.body );
        if( res.body.result === 'yes' ){
          return true;
        }

        return false;
      }
    });
  }

};
