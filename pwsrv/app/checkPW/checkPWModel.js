// grab the mongoose module
var mongoose = require('mongoose');

// define our word model
// module.exports allows us to pass this to other files when it is called
var CheckPWSchema = new mongoose.Schema({
  cellID : {
		type : String, required: true
	},

	updateDate : {
		type : String, default: ''
	}

});

module.exports = mongoose.model( 'checkPW', CheckPWSchema );
