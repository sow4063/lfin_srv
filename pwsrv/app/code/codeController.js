var Q = require('q');
var Code = require('./codeModel.js');
var randomstring = require("randomstring");
var crypto = require("crypto");

// Promisify a few mongoose methods with the `q` promise library
var updateCode = Q.nbind( Code.update, Code );
var findCode = Q.nbind( Code.find, Code );

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

  
	searchCode: function( mobileNumber, callback ) {
    var code = '';
    
    Code.findOne({ 'mobileNumber': mobileNumber }, function (err, result) {
      if( err ) 
        callback( err, null );
      
      console.log('Code.findOne bsid, code is = ', result.bsid, code );
      
      callback( null, code );
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
