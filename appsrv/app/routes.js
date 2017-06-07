var userCodeController = require('./userCode/userCodeController.js');
var appKeyController = require('./appKey/appKeyController.js');

module.exports = function(app) {

	// server routes ===========================================================
	// handle things like api calls
	// authentication routes
	//app.get('/search', userCodeController.searchCodes );
	//app.post('/update', userCodeController.updateCodes );
	//app.post('/remove', userCodeController.removeCodes );
	app.post('/RSAKey', appKeyController.insertRSAKey );

	// frontend routes =========================================================
	// route to handle all angular requests
	// app.get('*', function(req, res) {
	//   res.sendfile('./public/index.html');
	// });

};