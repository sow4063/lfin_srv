var mongoose = require('mongoose');
var url = 'mongodb://localhost/lpwpw';

module.exports = {
	url: url,
	db: mongoose.connect(url)
};

