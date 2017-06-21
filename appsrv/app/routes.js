var userCodeController = require('./userCode/userCodeController.js');
var appKeyController = require('./appKey/appKeyController.js');

module.exports = function(app) {

	// server routes ===========================================================
	// handle things like api calls
	// authentication routes
	//app.post('/update', userCodeController.updateCodes );
	//app.post('/remove', userCodeController.removeCodes );

	// create a RSA Key for server.
	var result = appKeyController.makeRSAKey();
	console.log('result of makeRSAKey', result );

  app.get('/getCode', userCodeController.getCode );
	
	app.post('/RSAKey', appKeyController.insertRSAKey );
	app.post('/AESKey', appKeyController.insertAESKey );

	// frontend routes =========================================================
	// route to handle all angular requests
	// app.get('*', function(req, res) {
	//   res.sendfile('./public/index.html');
	// });

};