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

var findCode = function(event){
  var deferred = Q.defer();
  codeController.searchCode( event, function(error, result) {
    if (error) deferred.reject(new Error(error));
    else deferred.resolve(result);
  });
  return deferred.promise;
};

//inherits( Gateway, Transform );

var defaultOptions = {  
  highWaterMark: 10,
  objectMode: true
};

function Gateway( options ) {  

  console.log('gateway options = ', options );

  if( !( this instanceof Gateway ) ) {
    return new Gateway( options );
  }

  console.log('gateway before Transform = ', options );

  options = extend( {}, options || {} );
  options = extend( options, defaultOptions );

  console.log('gateway before Transform option set = ', options );

  //Transform.call( this, options );

  Transform.apply( this, options );
  this.buffer = []; //I guess an array will do

};

inherits( Gateway, Transform );
// Gateway.prototype = Object.create( Transform.prototype );
// Gateway.prototype.constructor = Gateway;

// _transform
Gateway.prototype._transform = _transform;

function _transform( event, encoding, callback ) {  

  console.log('_transform event = ', event );

  if( !event.mobileNumber )
    return handleError(new Error('event doesn\'t have an `mobileNumber` field'));

  pushToQueue( event, pushed );

  function pushed( err ) {
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
            callback( err, reply );
          });
      }
      else if( event.msgid === '30' ) {
        findCode( event )
          .then(function(result){
            reply.code = 0;
            reply.msg = '기본코드 요청에 성공했습니다.';
            reply.val = result;
            console.log('findCode result[OK] = ', reply );
            callback( null, reply );
          })
          .fail(function(err){
            reply.code = 140;
            reply.msg = '기본코드 요청에 실패했습니다.';
            reply.val = '';
            console.log('findCode result[ERR] = ', reply );
            callback( err, reply );
          });
      }
      else if( event.msgid === '40' ) {
        policyController.insertpolicy( event );
      }

    } // pushed

  } // _transform

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