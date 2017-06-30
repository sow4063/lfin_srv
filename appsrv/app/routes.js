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

  app.get('/appkey', appKeyController.getAppkey );
  app.get('/policy', policyController.searchPolicy );

  app.post('/code', codeController.getCode );
  app.post('/aes', appKeyController.getAESKey );
  app.post('/rsa', appKeyController.insertRSAKey );
	
	app.post('/insertPolicy', policyController.insertPolicy );
	app.post('/insertCode', codeController.insertCode );

	// frontend routes =========================================================
	// route to handle all angular requests
	// app.get('*', function(req, res) {
	//   res.sendfile('./public/index.html');
	// });

};