var fs = require('fs');
var Q = require('q');
var UserCode = require('./userCodeModel.js');

// Promisify a few mongoose methods with the `q` promise library
var findUserCodes = Q.nbind(UserCode.find, UserCode);
var updateUserCode = Q.nbind(UserCode.update, UserCode);
var removeUserCodes = Q.nbind(UserCode.remove, UserCode);

module.exports = {

	searchCodes: function(req, res, next){

    console.log('keyword = ', req.query.keyword );

    let query = {};

    query['mobileNumber'] = req.query.keyword;

		findUserCodes( query )
      .then(function(userCode) {
      	if( userCode.length ) {
      		console.log('userCode exist !!! = ', userCode );
          res.send( userCode );
        } 
        else {
          console.log('the userCode does not exist');
          res.json( [] );
        }
      	
      })
      .fail(function (error) {
      	res.json( error );
      });
	},

  removeCodes: function(req, res, next){
    removeUserCodes({mobileNumber: req.query.keyword})
      .then(function(result){
        console.log('UserCode removed successfully.');
        res.json( result );
      })
      .fail(function(err){
        console.log('remove UserCode Error.', err);
        res.json( error );
      });
  },

  updateCodes: function (req, res, next) {

    var codes = req.body.codes;

    var codeArr = [];
      
    for( let i = 0; i < codes.length; i++ ){
      let newCode = {};

      newCode['mobileNumber'] = codes[i][0];         
      newCode['code'] = codes[i][1];

      codeArr.push( newCode );
    }
    
    console.log('the codes length = ', codeArr.length );

    updateUserCode( codeArr, { upsert: true, multi: true }  )
      .then(function(result){
        console.log('the codes created successfully.');
        res.json( result.length );
      })
      .fail(function(err){
        console.log('create UserCode Error.', err);
        res.json( error );
      }); 
    
  }

};
