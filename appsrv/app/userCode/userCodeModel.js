// grab the mongoose module
var mongoose = require('mongoose');

// define our word model
// module.exports allows us to pass this to other files when it is called
var UserCodeSchema = new mongoose.Schema({
  mobileNumber : {
  	type : String, required: true
  },

	code : {
		type : String, default: ''
	}

});

module.exports = mongoose.model('userCode', UserCodeSchema);
