// grab the mongoose module
var mongoose = require('mongoose');

// define our word model
// module.exports allows us to pass this to other files when it is called
var PWKeySchema = new mongoose.Schema({
  mobileNumber : {
  	type : String, required: true
  },

  key : {
		type : String, default: ''
	},

	updateDate : {
		type : String, default: ''
	}

});

module.exports = mongoose.model('pwKey', PWKeySchema );
