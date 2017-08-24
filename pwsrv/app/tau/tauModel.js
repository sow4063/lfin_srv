// grab the mongoose module
var mongoose = require('mongoose');

// define our word model
// module.exports allows us to pass this to other files when it is called
var TauSchema = new mongoose.Schema({
	tau : { // loc = tracking area unit : get from android, iOS, or from vendors(skt, kt, lg).
		type : String, required: true
	},
	
  bsid : { // self-defined id which wil be used for making code.
		type : String, required: true
	},

	updateDate : {
		type : String, default: ''
	}

});

module.exports = mongoose.model( 'tau', TauSchema );
