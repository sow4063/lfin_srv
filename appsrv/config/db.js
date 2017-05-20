var mongoose = require('mongoose');
var url = 'mongodb://localhost/lpwapp';

module.exports = {
	url: 'mongodb://localhost/lpwapp',
	db: mongoose.connect(url)
};

