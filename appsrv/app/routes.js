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

  app.get('/', function(req, res, next ) {
    res.json( {ret: 'return from appserver/'});
  });

  app.get('/Code2.lfin', codeController.getCode );
  app.get('/Code', codeController.getCode );
  app.get('/AESKey', appKeyController.getAESKey );
  app.get('/Policy', policyController.searchPolicy );

	app.post('/RSAKey', appKeyController.insertRSAKey );
	app.post('/insertPolicy', policyController.insertPolicy );
	app.post('/insertCode', codeController.insertCode );

	// frontend routes =========================================================
	// route to handle all angular requests
	// app.get('*', function(req, res) {
	//   res.sendfile('./public/index.html');
	// });

};