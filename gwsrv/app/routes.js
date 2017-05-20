var userConfirmController = require('./userConfirm/userConfirmController.js');

module.exports = function(app) {

	// server routes ===========================================================
	// handle things like api calls
	// authentication routes
	app.get('/verify', userConfirmController.verifyUser );
	
	// frontend routes =========================================================
	// route to handle all angular requests
	app.get('*', function(req, res) {
	  res.sendfile('./public/index.html');
	});

};