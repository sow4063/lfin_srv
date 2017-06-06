var extend = require('util')._extend;  
var inherits = require('util').inherits;  
var Transform = require('stream').Transform;

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

  pushToQueue(event, pushed);

  function pushed(err) {
    if (err) {
      console.log('pushed err');
      handleError(err);
    }
    else {

      reply = {
        id: event.mobileNumber,
        success: true
      };

      console.log('pushed success callback :: ', event );
      callback(null, reply);
    }
  }

  function handleError(err) {
    var reply = {
      id: event.mobileNumber,
      success: false,
      error: err.message
    };

    callback(null, reply);
  }
};


/// Fake push to queue
function pushToQueue(object, callback) {  
  callback();
};

module.exports = Gateway;