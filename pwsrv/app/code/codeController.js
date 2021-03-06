var Q = require('q');
var Code = require('./codeModel.js');
var randomstring = require("randomstring");
var crypto = require("crypto");
var request = require('request');
var Tau = require('../tau/tauController.js');

// Promisify a few mongoose methods with the `q` promise library
var updateCode = Q.nbind( Code.update, Code );
var findCode = Q.nbind( Code.find, Code );
var findCodeOne = Q.nbind( Code.findOne, Code );
var insertUserCode = Q.nbind( Code.create, Code );

function makeCode36( bsid ) {
  // generate 18 bytes according to bsid
  var len = 18 - ('' + bsid ).length;

  var priCode = randomstring.generate({
    length: len,
    charset: 'alphanumeric'
  });

  priCode += bsid; // 18
  
  console.log( 'priCode = ', priCode, priCode.length );
  
  // create the hash value with SHA256
  var hash = crypto.createHash('SHA256').update(priCode, 'utf8').digest('base64').slice(-18); // 18

  var code = priCode + hash;
  
  console.log('hash = ', hash, hash.length );
  console.log('code = ', code, code.length );

  return code;
};

function makeCode( bsid ) {
  // generate 120 bytes according to bsid
  var len = 120 - ('' + bsid ).length;

  var priCode = randomstring.generate({
    length: len,
    charset: 'alphanumeric'
  });

  priCode += bsid; // 120
  
  console.log( 'priCode = ', priCode );
  
  // create the hash value with SHA256
  var hash = crypto.createHash('sha256').update(priCode, 'utf8').digest('base64'); // 44

  // add padding
  var padCode = randomstring.generate({
    length: 16,
    charset: 'alphanumeric'
  });

  var code = priCode + hash + padCode; // 180
  
  console.log('hash = ', hash.length );
  console.log('code = ', code.length );
  console.log('code = ', code );

  return code;
};

function sendUserCode( codes ) {

  console.log('codes.length => ', codes.length );

  var postData = {
    'codes': codes
  };

  var headersOpt = {  
    'content-type': 'application/json'
  };

  var url = 'https://www.fordicpro.com:8200/updateCodes';

  var options = {
    method: 'post',
    form: postData, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: url,
    headers: headersOpt
  };

  request( options, function( err, res, body ) {
    if( err ) {
      console.log('Error :', err );
    }
    else {
      console.log(' Body :', body );  
    }

  });

};

module.exports = {

  insertCode: function( event, callback ) {

    console.log('insertCode event =>> ', event );

    var res = {
      'code': 'default',
      'msg': 'default'
    };

    var query = {};
    query['mobileNumber'] = event.mobileNumber;

    findCodeOne( query )
      .then( function( userCode ) {
        console.log('userCode =>>>>>>> ', userCode );

        if( userCode ) {
          updateCode( userCode, event, {upsert: true} )
          .then( function( result ) {
            console.log('Success on updateCode = ', result );
            res.code = 0;
            res.msg = 'the userCode updated successfully.';
            callback( null, res );
          })
          .fail( function( error ) {
            console.log('Error on updateCode = ', error );
            res.code = 9999;
            res.msg = 'updateCode Error.';
            callback( err, res );
          });
        }
        else {
          insertUserCode( event )
          .then( function( result ) {
            console.log('Success on insertCode = ', result );
            res.code = 0;
            res.msg = 'the userCode created successfully.';
            callback( null, res );
          })
          .fail( function( error ) {
            console.log('Error on insertCode = ', error );
            res.code = 9999;
            res.msg = 'create userCode Error.';
            callback( err, res );
          });
        }
        
      })
      .fail( function( error ) {
        console.log('error on findCodeOne =>> ', error );
        res.code = 9998;
        res.msg = 'error on findCodeOne';
        callback( err, res );
      }); 

  },
  
	searchCode: function( mobileNumber, callback ) {
    var code = '';
    
    var query = {};
    query['mobileNumber'] = mobileNumber;

    findCodeOne( query )
      .then( function( userCode ) {
        console.log('userCode =>>>>>>> ', userCode );
        if( userCode.code ) {
          console.log('userCode exist !!! = ', userCode );
          callback( null, userCode.code );
        } 
        else {
          console.log('the userCode does not exist' );
          callback( null, '' );
        }
        
      })
      .fail( function( error ) {
        console.log('error on findCodeOne =>> ', error );
        callback( error );
      });
    
  },

  updateCode: function() {

    console.log('updateCode');

    findCode()
      .then(function(codes){

        console.log('founded codes = ', codes );

        var now = new Date();
        var jsonDate = now.toJSON().substring(0, 10).replace(/[\-]/g, '');
        var localtime = now.toLocaleTimeString().replace(/[\:]/g, '');
        var current = jsonDate + localtime;

        var sendCodes = [];

        for( var i = 0; i < codes.length; i ++ ) {
          var obj = {};
        
          obj.mobileNumber = codes[i].mobileNumber;
          obj.bsid = codes[i].bsid;
          //obj.code = makeCode( obj.bsid );
          obj.code = makeCode36( obj.bsid );
          obj.updateDate = current;

          sendCodes.push( obj );

          updateCode( codes[i], obj )
            .then(function(result){
              console.log('Success on updateCode = ', i, result );
            })
            .fail(function(error){
              console.log('Error on updateCode = ', i, error );
            });
        }

        // send updated user code to appserver by https request
        sendUserCode( sendCodes );
        
      })
      .fail(function(error){
        console.log('Error on findCode at upateCode = ', error );
      });
  }

};
