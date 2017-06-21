var Q = require('q');
var Policy = require('./policyModel.js');

// Promisify a few mongoose methods with the `q` promise library
var createPolicy = Q.nbind( Policy.create, Policy );
var updatePolicy = Q.nbind( Policy.update, Policy );
var findPolicy = Q.nbind( Policy.find, Policy );

module.exports = {

  insertPolicy: function( event ) {

    var policy = {};

    policy['version'] = event.ver;
    policy['keyChange'] = event.keyChange;
    policy['appChange'] = event.appChange;
    policy['note'] = event.note;

    var now = new Date();
    var jsonDate = now.toJSON().substring(0, 10).replace(/[\-]/g, '');
    var localtime = now.toLocaleTimeString().replace(/[\:]/g, '');
    var current = jsonDate + localtime;

    policy['updateDate'] = current;

    console.log('insertPolicy input = ', policy );

    createPolicy( policy )
      .then( function( result ) {
        console.log('createPolicy result =  ', result );
        res.json( result );
      })
      .fail( function( error ){
        console.log('createPolicy fail : ', error );
        res.json( error );
      });
  },

  searchPolicy: function () {
    findPolicy( { sort:{ updateDate: -1}, limit:1 } )
      .then( function( result ) {
        console.log('findPolicy result =  ', result );
        res.json( result );
      })
      .fail( function( error ){
        console.log('findPolicy fail : ', error );
        res.json( error );
      });

  }

};
