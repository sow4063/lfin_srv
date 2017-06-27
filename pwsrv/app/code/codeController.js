var Q = require('q');
var Code = require('./codeModel.js');
var randomstring = require("randomstring");
var crypto = require("crypto");

// Promisify a few mongoose methods with the `q` promise library
var updateCode = Q.nbind( Code.update, Code );
var findCode = Q.nbind( Code.find, Code );
var findCodeOne = Q.nbind( Code.findOne, Code );
var insertUserCode = Q.nbind( Code.create, Code );

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
        
        updateCode( userCode, event, {upsert: true} )
          .then( function( result ) {
            console.log('Success on updateCode = ', result );
          })
          .fail( function( error ) {
            console.log('Error on updateCode = ', error );
          });
        
      })
      .fail( function( error ) {
        console.log('error on findCodeOne =>> ', error );
        callback( error );
      });

    // insertUserCode( event )
    //   .then(function( result ) {
    //     console.log('the userCode created successfully.', result );
    //     res.code = 0;
    //     res.msg = 'the userCode created successfully.';
    //     callback( null, res );
    //   })
    //   .fail( function( error ) {
    //     console.log('create userConfirm Error.', error );
    //     res.code = 9999;
    //     res.msg = 'create userConfirm Error.';
    //     callback( err, res );
    //   }); 

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

        for( var i = 0; i < codes.length; i ++ ) {
          var obj = {};
        
          obj.mobileNumber = codes[i].mobileNumber;
          obj.bsid = codes[i].bsid;
          obj.code = makeCode( obj.bsid );
          obj.updateDate = current;

          updateCode( codes[i], obj )
            .then(function(result){
              console.log('Success on updateCode = ', i, result );
            })
            .fail(function(error){
              console.log('Error on updateCode = ', i, error );
            });
        }
        
      })
      .fail(function(error){
        console.log('Error on findCode at upateCode = ', error );
      });
  }

};
