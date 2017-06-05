var checkPWController = require('./checkPW/checkPWController.js');

module.exports = function(app) {

	// get code from vendor server
	let intervalObj = setInterval( checkPWController.updateCode, 15000 );

	// server routes ===========================================================
	// handle things like api calls
	// authentication routes
	app.get('/verify', checkPWController.checkPW );
	
	// frontend routes =========================================================
	// route to handle all angular requests
	// app.get('*', function(req, res) {
	//   res.sendfile('./public/index.html');
	// });

};