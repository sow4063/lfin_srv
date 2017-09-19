var codeController = require('./userCode/userCodeController.js');
var appKeyController = require('./appKey/appKeyController.js');
var policyController = require('./policy/policyController.js');
var signController = require('./sign/signController.js');

module.exports = function(app) {

	// server routes ===========================================================
	// handle things like api calls
	// authentication routes
	
	// create a RSA Key for server.
	var result = appKeyController.makeRSAKey();
	console.log('result of makeRSAKey', result );

  app.get('/appkey', appKeyController.getAppkey );
  
  app.post('/code', codeController.getCode );
  app.post('/updateCodes', codeController.updateCodes );
  app.post('/aes', appKeyController.getAESKey );
  //app.post('/aes', appKeyController.getAES );
  app.post('/rsa', appKeyController.insertRSAKey );

	app.post('/policy', policyController.searchPolicy );
	app.post('/insertPolicy', policyController.insertPolicy );
	app.post('/insertCode', codeController.insertCode );

	// signin & signup
	app.post('/signin', signController.signin );
	app.post('/signup', signController.signup );
	app.post('/updateSign', signController.updateSign );
	app.post('/updateNumber', signController.updateNumber );
	app.post('/updatePassword', signController.updatePassword );
	app.post('/confirmPassword', signController.confirmPassword );

	app.post('/testaes', codeController.testaes );

	// frontend routes =========================================================
	// route to handle all angular requests
	// app.get('*', function(req, res) {
	//   res.sendfile('./public/index.html');
	// });

};