var extend = require('util')._extend;  
var inherits = require('util').inherits;  
var Transform = require('stream').Transform;

var Q = require('q');

var keyController = require('./app/pwKey/pwKeyController.js');
var codeController = require('./app/code/codeController.js');

var checkPW = function(event){
  var deferred = Q.defer();
  keyController.confirmPW( event, function(error, result) {
    if (error) deferred.reject(new Error(error));
    else deferred.resolve(result);
  });
  return deferred.promise;
};

var insertAES = function(event){
  var deferred = Q.defer();
  keyController.insertAESKey( event, function(error, result) {
    if (error) deferred.reject(new Error(error));
    else deferred.resolve(result);
  });
  return deferred.promise;
};

inherits(Gateway, Transform);

var defaultOptions = {  
  highWaterMark: 10,
  objectMode: true
};

function Gateway(options) {  
  if (! (this instanceof Gateway)) {
    return new Gateway(options);
  }

  options = extend({}, options || {});
  options = extend(options, defaultOptions);

  Transform.call(this, options);
}

/// _transform
Gateway.prototype._transform = _transform;

function _transform(event, encoding, callback) {  
  if( !event.mobileNumber )
    return handleError(new Error('event doesn\'t have an `mobileNumber` field'));

  pushToQueue( event, pushed );

  function pushed(err) {
    if( err ) {
      console.log('pushed err');
      handleError(err);
    }
    else {

      reply = {
        code: '-1',
        msg: ''
      };

      console.log('pushed success callback :: ', event );

      if( event.msgid === '10' ) {
        checkPW( event )
          .then(function(result){
            reply.code = result.code;
            reply.msg = result.msg;
            console.log('checkPW result[OK] = ', reply );
            callback(null, reply);
          })
          .fail(function(err){
            reply.code = err.code;
            reply.msg = err;
            console.log('checkPW result[ERR] = ', reply );
            callback(err, reply);
          });
      }
      else if( event.msgid === '20' ) {
        // save the AES key to db
        //keyController.insertAESKey( event );
        //callback( null, reply );
        insertAES( event )
          .then(function(result){
            reply.code = result.code;
            reply.msg = result.msg;
            console.log('insertAES result[OK] = ', reply );
            callback(null, reply);
          })
          .fail(function(err){
            reply.code = err.code;
            reply.msg = err;
            console.log('insertAES result[ERR] = ', reply );
            callback(err, reply);
          });
      }
      
    }
  }

  function handleError(err) {
    var reply = {
      code: '100',
      msg: err.message
    };

    callback(null, reply);
  }
};


/// Fake push to queue
function pushToQueue(object, callback) {  
  callback();
};

module.exports = Gateway;