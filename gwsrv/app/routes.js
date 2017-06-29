var userConfirmController = require('./userConfirm/userConfirmController.js');

module.exports = function(app) {

	// get code from vendor server
	//let intervalObj = setInterval( userConfirmController.checkResult, 3000 );

	// server routes ===========================================================
	// handle things like api calls
	// authentication routes
	app.post('/verify', userConfirmController.verifyUser );
	
	// frontend routes =========================================================
	// route to handle all angular requests
	// app.get('*', function(req, res) {
	//   res.sendfile('./public/index.html');
	// });

};