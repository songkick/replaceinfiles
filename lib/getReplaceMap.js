var fs = require('fs');

module.exports = function getReplaceMap(encoding, path) {
  return getReadStreamOrStdin(encoding, path)
    .then(parseStreamToJSON);
}

function getReadStreamOrStdin(encoding, path) {
  return new Promise(function(resolve, reject){
    try {
      var sourceStream;

      if (path) {
        sourceStream = fs.createReadStream(path, {
          autoclose: true,
          encoding: encoding
        });
      } else {
        process.stdin.setEncoding(encoding);
        sourceStream = process.stdin;
      }

      resolve(sourceStream);

    } catch(error) {
      reject(error);
    }
  });
}

function parseStreamToJSON(stream) {
  return new Promise(function(resolve, reject){

    var sourceChunks = [];

    try {
      stream.on('readable', function() {
        var chunk = stream.read();
        if (chunk) {
          sourceChunks.push(chunk);
        }
      });

      stream.on('end', function() {
        var replaceMap = JSON.parse(sourceChunks.join());
        resolve(replaceMap);
      });

      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}
