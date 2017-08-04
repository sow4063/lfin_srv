var Q = require('q');
var User = require('./signModel.js');

// Promisify a few mongoose methods with the `q` promise library
var findUser = Q.nbind( User.findOne, User );
var createUser = Q.nbind( User.create, User );
var updateUser= Q.nbind( User.update, User );

function handleResult( code, msg, res ) {
          
  console.log( msg );

  var ret = {};
  ret.code = code;
  ret.msg = msg; 

  res.json( ret );

};

module.exports = {

  updateSign: function( req, res, next ) {

    var mobileNumber = req.body.mobileNumber;
    var email = req.body.email;
    var password = req.body.password;

    console.log('updateSign : ', mobileNumber, email, password );

    // check to see if user already exists
    findUser( {'email': email} )
      .then( function( user ) {
        if( user ) {
          return updateUser( {'mobileNumber': mobileNumber, 'email': email, 'password': password} )
            .then( function( updatedUser ) {
              console.log('updatedUser => ', updateUser );
              handleResult( 810, '사용자 정보를 수정했습니다.', res );
            })
            .fail( function( error ) {
              handle( 820, error, res );
            });
        } 
        else {
          handleResult( 850, '등록되지 않은 사용자 입니다.', res );
          return;
        }
      })
      .fail( function( error ) {
        handleResult( 840, error, res );
      });
  },

  signin: function( req, res, next ) {

    var mobileNumber = req.body.mobileNumber;
    var email = req.body.email;
    var password = req.body.password;

    console.log('signin : ', mobileNumber, email, password );

    findUser( {'email': email} )
      .then( function( user ) {
        if( !user ) {
          handleResult( 850, '등록되지 않은 사용자 입니다.', res );
          return;
        } 
        else {
          return user.comparePasswords( password )
            .then( function( foundUser ) {
              if( foundUser ) {
                handleResult( 0, '등록된 사용자 입니다.', res );
              } 
              else {
                handleResult( 860, '입력 정보를 다시 확인하시기 바랍니다.', res );
              }

            });
        }

      })
      .fail( function( error ) {
        handleResult( 870, 'DB 처리 에러가 발생했습니다.', res );
        return;
      });
  },

  signup: function( req, res, next ) {

    var mobileNumber = req.body.mobileNumber;
    var email = req.body.email;
    var password = req.body.password;

    console.log('signup : ', mobileNumber, email, password );

    // check to see if user already exists
    findUser( {'email': email} )
      .then( function( user ) {
        if( user ) {
          handleResult( 800, '이미 등록된 사용자 입니다.', res );
        } 
        else {
          // make a new user if not one
          return createUser( {'mobileNumber': mobileNumber, 'email': email, 'password': password} )
            .then( function( user ) {
              handleResult( 0, '정상 등록되었습니다.', res );
            })
            .fail( function( error ) {
              handleResult( 830, error, res );
            });
        }
      })
      .fail( function( error ) {
        handleResult( 840, error, res );
      });
  },

};
