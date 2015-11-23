var fs = require('fs');

module.exports = function createWriteStream(file, encoding) {
  return new Promise(function(resolve, reject){
    var outputStream = fs.createWriteStream(file , {
      flags: 'w',
      encoding: encoding
    });

    outputStream.on('open', function() {
      resolve(outputStream);
    });

    outputStream.on('error', function(error) {
      reject(error);
    });

  });
}
