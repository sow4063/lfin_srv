var Q = require('q');
var PWKey = require('./pwKeyModel.js');

// Promisify a few mongoose methods with the `q` promise library
var createKey = Q.nbind( PWKey.create, PWKey );
var removeKey = Q.nbind( PWKey.remove, PWKey );

module.exports = {

  insertAESKey: function (event) {

    var keyinf = {};

    keyinf['key'] = event.key;
    keyinf['mobileNumber'] = event.mobileNumber;

    var now = new Date();
    var jsonDate = now.toJSON().substring(0, 10).replace(/[\-]/g, '');
    var localtime = now.toLocaleTimeString().replace(/[\:]/g, ''); // now.getMilliseconds();
    var current = jsonDate + localtime;

    keyinf['updateDate'] = current;

    console.log('insertAESKey keyinf = ', keyinf );

    removeKey( keyinf.mobileNumber )
      .then(function( result ){
        createKey( keyinf )
          .then(function( result ){
            console.log('Success on update AES key :: ', result );
            return result;
          })
          .fail(function( error ){
            console.log('Fail on update AES key :: ', error );
            return error;
          });
      })
      .fail(function( error ){
        console.log('Fail on remove AES key', error );
        return error;
      });
    
  }

};
