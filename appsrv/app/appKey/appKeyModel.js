// grab the mongoose module
var mongoose = require('mongoose');

// define our word model
// module.exports allows us to pass this to other files when it is called
var AppKeySchema = new mongoose.Schema({
  mobileNumber : {
  	type : String, required: true
  },

  keyType : {
  	type : String, required : true
  },

	key : {
		type : String, default: ''
	}

});

module.exports = mongoose.model('appKey', AppKeySchema );
