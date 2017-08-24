var Q = require('q');
var Tau = require('./tauModel.js');
var randomstring = require("randomstring");
var crypto = require("crypto");
var request = require('request');

// Promisify a few mongoose methods with the `q` promise library
var updateTau = Q.nbind( Tau.update, Tau );
var findTau = Q.nbind( Tau.find, Tau );
var findTauOne = Q.nbind( Tau.findOne, Tau );
var insertTau = Q.nbind( Tau.create, Tau );

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

module.exports = {

	searchCode: function( loc, callback ) {

    console.log('searchCode loc = ', loc );

    var query = {};
    query['tau'] = loc;

    findTauOne( query )
      .then( function( bsid ) {
        
        console.log('searchCode bsid = ', bsid );

        if( bsid ) {
          // make code with the bsid
          let code = makeCode36( bsid );
          
          console.log('searchCode code = ', code);
          
          callback( null, code );
        } 
        else {
          console.log('the bsid does not exist' );
          callback( null, '' );
        }
        
      })
      .fail( function( error ) {
        console.log('error on findTauOne =>> ', error );
        callback( error );
      });
    
  } // end of searchBsid

};
