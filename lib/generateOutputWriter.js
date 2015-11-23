var createWriteStream = require('./createWriteStream');

module.exports = function generateOutputWriter(options) {

  if (options.silent) {
    return Promise.resolve.bind(Promise);
  }

  return function outputWriter(content){

    var writeStreamPromise;

    if (options.outputPath) {
      writeStreamPromise = createWriteStream(options.outputPath, options.encoding);
    } else {
      writeStreamPromise = Promise.resolve(process.stdout);
    }

    return writeStreamPromise.then(function(outputStream){
      return new Promise(function(resolve, reject){
        var method = outputStream === process.stdout ? 'write' : 'end';
        outputStream[method](JSON.stringify(content, null, 2) + '\n', resolve);
      });
    });
  }
}
