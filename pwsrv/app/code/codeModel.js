// grab the mongoose module
var mongoose = require('mongoose');

// define our word model
// module.exports allows us to pass this to other files when it is called
var CodeSchema = new mongoose.Schema({
	mobileNumber : {
		type : String, required: true
	},
	
  bsid : {
		type : String, required: true
	},

	code : {
		type : String, required: true
	},

	updateDate : {
		type : String, default: ''
	}

});

module.exports = mongoose.model( 'code', CodeSchema );
