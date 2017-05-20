var mongoose = require('mongoose');
var url = 'mongodb://localhost/lpwgw';

module.exports = {
	url: 'mongodb://localhost/lpwgw',
	db: mongoose.connect(url)
};

