// grab the mongoose module
var mongoose = require('mongoose');

// define our word model
// module.exports allows us to pass this to other files when it is called
var PolicySchema = new mongoose.Schema({
  version : {
  	type : String, required: true
  },

  keyChange : {
		type : Boolean, default: false
	},
  
  appChange : {
		type : Boolean, default: false
	},

	note : {
    type : String
	},

	updateDate : {
		type : String
	}


});

module.exports = mongoose.model('policy', PolicySchema );
