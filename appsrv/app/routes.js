var codeController = require('./userCode/userCodeController.js');
var appKeyController = require('./appKey/appKeyController.js');
var policyController = require('./policy/policyController.js');

module.exports = function(app) {

	// server routes ===========================================================
	// handle things like api calls
	// authentication routes
	
	// create a RSA Key for server.
	var result = appKeyController.makeRSAKey();
	console.log('result of makeRSAKey', result );

  app.get('/Code', codeController.getCode );
  app.get('/Policy', policyController.searchPolicy );
  
	app.post('/RSAKey', appKeyController.insertRSAKey );
	app.post('/AESKey', appKeyController.insertAESKey );
	app.post('/insertPolicy', policyController.insertPolicy );

	// frontend routes =========================================================
	// route to handle all angular requests
	// app.get('*', function(req, res) {
	//   res.sendfile('./public/index.html');
	// });

};