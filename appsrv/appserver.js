// modules =================================================
var fs             = require('fs');
var https          = require('https');
var express        = require('express');
var app            = express();
var mongoose       = require('mongoose');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var http = require('http');

// configuration ===========================================
var sslPath = '/etc/letsencrypt/live/www.fordicpro.com/';

var options = {  
  key: fs.readFileSync(sslPath + 'privkey.pem'),
  cert: fs.readFileSync(sslPath + 'fullchain.pem')
};
	
// config files
var db = require('./config/db').db;

var port = process.env.PORT || 8200;
var host = process.env.HOST || 'www.fordicpro.com';

// get all data/stuff of the body (POST) parameters
app.use(bodyParser.json()); // parse application/json 
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded

app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users

// routes ==================================================
require('./app/routes')(app); // pass our application into our routes

// start app ===============================================
https.createServer(options, app).listen( port, host, null, function() {
  console.log('Server listening on port %d in %s mode', this.address().port, app.settings.env );
});

exports = module.exports = app; 						// expose app