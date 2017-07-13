var Q = require('q');
var PWKey = require('./pwKeyModel.js');
var codeModel = require('../code/codeModel.js');
var codeController = require('../code/codeController.js');
var crypto = require("crypto");

// Promisify a few mongoose methods with the `q` promise library
var createKey = Q.nbind( PWKey.create, PWKey );
var removeKey = Q.nbind( PWKey.remove, PWKey );
var findKey   = Q.nbind( PWKey.findOne, PWKey );

var searchCode = function(mobileNumber) {
  var deferred = Q.defer();
  codeController.searchCode( mobileNumber, function(error, result) {
    if (error) deferred.reject(new Error(error));
    else deferred.resolve(result);
  });
  return deferred.promise;
};

var hashCode = function(str) {
  var hash = 0;
  var len = str.length;
  var i = 0;

  if( len > 0 ) {
    while( i < len )
      hash = ( hash << 5 ) - hash + str.charCodeAt( i++ ) | 0;
  }

  return hash;
};

function comparePW( key, code, mobileNumber, timestamp, lpw ) {
  // 암호 = AES( key, code + mobileNumber + timestamp )
  var cipher = crypto.createCipher('aes192', key );    // Cipher 객체 생성
  cipher.update( code + mobileNumber + timestamp, 'utf8', 'base64' );      // 인코딩 방식에 따라 암호화
  var encrypted = cipher.final('base64');              // 암호화된 결과 값

  //var ret = ( lpw == encrypted );

  console.log('comparePW key = ', key );
  console.log('comparePW code = ', code );
  console.log('comparePW mobileNumber = ', mobileNumber );
  console.log('comparePW timestamp = ', timestamp );
  console.log('comparePW lpw = ', lpw );
  console.log('comparePW encrypted = ', encrypted );

  var numHash = hashCode( encrypted ) + '';
  console.log('hashCode =>> ', numHash );

  numHash = numHash.slice(-8);
  console.log('hashCode 8 digits =>> ', numHash );

  var ret = ( lpw == numHash );

  console.log('comparePW result =  ', ret );

  return ret;
}

module.exports = {

  confirmPW: function( event, callback ) {
    var res = {
      'code': 'default',
      'msg': 'default'
    };

    findKey( event.mobileNumber )
      .then( function(pwKey) {
        var aeskey = pwKey.key;
        console.log('aes key is exist = ', aeskey );

        // get the code
        searchCode( event.mobileNumber )
          .then(function(result){
            var code = result;
            
            console.log('searchCode = ', code );

            if( comparePW( aeskey, code, event.mobileNumber, event.timestamp, event.lpw ) ) {
              console.log('comparePW pass');
              res.code = '0';
              res.msg = '인증 암호 검증에 성공했습니다.';
            }
            else {
              console.log('confirmPW fail');
              res.code = '100';
              res.msg = '인증 암호가 다릅니다.';
            }

            callback( null, res );
          })
          .fail(function(error){
            console.log('fail to create code = ', error );
            res.code = '700';
            res.msg = '해당 사용자의 위치 정보가 없습니다.';

            callback( error, res );
          });

      })
      .fail( function(error) {
        console.log('aes key is not exist ', error );
        res.code = '600';
        res.msg = '해당 전화의 사용자 정보가 없습니다.';
        callback( error, res );
      });
  },

  insertAESKey: function( event, callback ) {

    var keyinf = {};

    keyinf['key'] = event.key;
    keyinf['keyType'] = event.keyType;
    keyinf['mobileNumber'] = event.mobileNumber;

    var now = new Date();
    var jsonDate = now.toJSON().substring(0, 10).replace(/[\-]/g, '');
    var localtime = now.toLocaleTimeString().replace(/[\:]/g, ''); // now.getMilliseconds();
    var current = jsonDate + localtime;

    keyinf['updateDate'] = current;

    console.log('insertAESKey keyinf = ', keyinf );

    var res = {
      'code': 'default',
      'msg': 'default'
    };

    removeKey( keyinf.mobileNumber )
      .then( function( result ) {
        createKey( keyinf )
          .then( function( result ) {
            console.log('Success on update AES key :: ', result );
            res.code = '0';
            res.msg = 'AES키 등록에 성공했습니다.';
            callback( null, res );
          })
          .fail( function( error ) {
            console.log('Fail on update AES key :: ', error );
            res.code = '120';
            res.msg = 'AES키 등록에 실패했습니다.';
            callback( error, res );
          });
      })
      .fail( function( error ) {
        console.log('Fail on remove AES key', error );
        res.code = '520';
        res.msg = 'DB 추가시 오류가 발생했습니다.';
        callback( error, res );
      });
    
  }

};
