// grab the mongoose module
var Q = require('q');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var SALT_WORK_FACTOR = 10;

// define our word model
// module.exports allows us to pass this to other files when it is called
var SignSchema = new mongoose.Schema({
  mobileNumber : {
		type : String, required: true, unique: true
	},
	
  email : {
		type : String, required: true, unique: true
	},

	password : {
		type : String, required: true
	},

	salt: String

});

SignSchema.methods.comparePasswords = function( candidatePassword ) {
  
  var savedPassword = this.password;

  return Q.Promise( function( resolve, reject ) {
    
    bcrypt.compare( candidatePassword, savedPassword, function( err, isMatch ) {
      if( err ) {
        reject( err );
      } 
      else {
        resolve( isMatch );
      }
    });

  });

}; // end of comparePasswords

SignSchema.pre('save', function( next ) {

  var user = this;

  // only hash the password if it has been modified (or is new)
  if( !user.isModified('password') ) {
    return next();
  }

  // generate a salt
  bcrypt.genSalt( SALT_WORK_FACTOR, function( err, salt ) {
    if( err ) {
      return next( err );
    }

    // hash the password along with our new salt
    bcrypt.hash( user.password, salt, null, function( err, hash ) {
      if( err ) {
        return next( err );
      }

      // override the cleartext password with the hashed one
      user.password = hash;
      user.salt = salt;
      next();
    });

  });

}); // end of SignSchema.pre

module.exports = mongoose.model('sign', SignSchema);
