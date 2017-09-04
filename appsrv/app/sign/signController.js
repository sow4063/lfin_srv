var Q = require('q');
var User = require('./signModel.js');
var nodemailer = require('nodemailer');
var smtpPool = require('nodemailer-smtp-pool');

// Promisify a few mongoose methods with the `q` promise library
var findUser = Q.nbind( User.findOne, User );
var createUser = Q.nbind( User.create, User );
var updateUser= Q.nbind( User.update, User );

function handleEmail( email, password, code, msg, res ) {

  var sender = 'lfin_admin < lfin.devops@gmail.com >';
  var receiver = email;
  var mailTitle = 'Message for Lfin password';
  var html = '<h3>' + password + '</h3>';

  var mailOptions = {
    from: sender,
    to: receiver,
    subject: mailTitle,
    html: html
  };

  var transporter = nodemailer.createTransport( smtpPool( {
    service: "Gmail",
    host: "localhost",
    port: "465",
    auth: {
      user: 'lfin.devops@gmail.com',
      pass: '!@#$1q2w3e4r%T'
    },
    tls: {
      rejectUnauthorize: false
    },
    maxConnections: 5,
    maxMessages: 10
  }));

  transporter.sendMail( mailOptions, function ( err, response ) {
    
    if( err ) {
      
      console.log('failed sendding email... => ' + err );
      
      var ret = {};
      ret.code = 863;
      ret.msg = err; 

      res.json( ret );
    } 
    else {
      console.log('succeed sending email... => ' + response );
      
      var ret = {};
      ret.code = code;
      ret.msg = response; 

      res.json( ret );
    }

    transporter.close();
  
  });
        
};

function handleResult( code, msg, res ) {
          
  console.log( msg );

  var ret = {};
  ret.code = code;
  ret.msg = msg; 

  res.json( ret );

};

module.exports = {

  confirmPassword: function( req, res, next ) {

    var password = req.body.password;
    var email = req.body.email;

    if( !email ) {
      handleResult( 855, '이메일 정보가 없습니다.', res );
      return;
    }

    console.log('confirmPassword : ', email );

    // check to see if user already exists
    findUser( {'email': email} )
      .then( function( user ) {
        if( user ) {
          // send the password to the registered email.  
          handleEmail( email, user.password, 862, '등록된 이메일로 비밀번호를 보냈습니다.', res );
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

  updatePassword: function( req, res, next ) {

    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;
    var email = req.body.email;

    if( !email ) {
      handleResult( 855, '이메일 정보가 없습니다.', res );
      return;
    }
    else if( !oldPassword ) {
      handleResult( 857, '이전 비밀번호가 없습니다.', res );
      return; 
    }
    else if( !newPassword ) {
      handleResult( 858, '새로운 비밀번호가 없습니다.', res );
      return; 
    }
    else if( newPassword == oldPassword ) {
      handleResult( 859, '새로운 비밀번호와 기존 비밀번호가 같습니다.', res );
      return; 
    }

    console.log('updatePassword : ', oldPassword, newPassword, email );

    // check to see if user already exists
    findUser( {'email': email} )
      .then( function( user ) {
        if( user ) {
          if( user.password !== newPassword ) {
            return updateUser( {'password': newPassword, 'email': email } )
            .then( function( modifiedUser ) {
              console.log('modifiedUser => ', modifiedUser );
              handleResult( 810, '사용자 정보를 수정했습니다.', res );
            })
            .fail( function( error ) {
              handle( 820, error, res );
            });
          }
          else {
            handleResult( 821, '기존 비밀번호와 동일합니다.', res );
            return;
          }
          
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

  updateNumber: function( req, res, next ) {

    var newNumber = req.body.newNumber;
    var email = req.body.email;

    if( !email ) {
      handleResult( 855, '이메일 정보가 없습니다.', res );
      return;
    }
    else if( !newNumber ) {
      handleResult( 856, '새로운 전화번호가 없습니다.', res );
      return; 
    }

    console.log('updateNumber : ', newNumber, email );

    // check to see if user already exists
    findUser( {'email': email} )
      .then( function( user ) {
        if( user ) {
          return updateUser( {'mobileNumber': newNumber, 'email': email } )
          .then( function( modifiedUser ) {
            console.log('modifiedUser => ', modifiedUser );
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
            .then( function( modifiedUser ) {
              console.log('modifiedUser => ', modifiedUser );
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
