// grab the mongoose module
var mongoose = require('mongoose');

// define our word model
// module.exports allows us to pass this to other files when it is called
var UserConfirmSchema = new mongoose.Schema({
  mobileNumber : {
  	type : String, required: true
  },

	CID : {
		type : String, required: true
	},

	createDate : {
		type : String, default: ''
	},

  verifyResult : {
  	type : Boolean, default: false
  }

});

module.exports = mongoose.model( 'userConfirm', UserConfirmSchema );
