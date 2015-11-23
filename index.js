var replace = require('replacestream');
var StreamCache = require('stream-cache');
var digest = require('digest-stream');
var fs = require('fs');
var glob = require('glob');

var pathTransformer = require('./lib/pathTransformer');
var getReplaceMap = require('./lib/getReplaceMap');
var createWriteStream = require('./lib/createWriteStream');

function getReadStream(file) {
  return new Promise(function(resolve, reject){
    var inputStream = fs.createReadStream(file, {});

    inputStream.on('open', function(){
      resolve(inputStream);
    });

    inputStream.on('error', function(error){
      reject(error);
    });
  });
}

function chainReplacers(replaceMap) {
  function pipeReplacer(stream, oldValue) {
    var newValue = replaceMap[oldValue];
    return stream.pipe(replace(oldValue, newValue));
  }

  return function(inputStream) {
    return Object.keys(replaceMap).reduce(pipeReplacer, inputStream);
  }
}

function interceptHash(callback) {
  return function intercept(inputStream){
    return inputStream.pipe(digest('sha1', 'hex', callback));
  }
}

function waitForFinish(stream) {
  return new Promise(function(resolve, reject){
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function readAndReplaceStream(file, replaceMap) {

  var result = {
    inputHash: null,
    outputHash: null,
    cache: null,
    stream: null
  }

  return getReadStream(file)
    .then(interceptHash(function(hash) {
      result.inputHash = hash;
    }))
    .then(chainReplacers(replaceMap))
    .then(interceptHash(function(hash) {
      result.outputHash = hash;
    }))
    .then(function(stream){
      result.cache = stream.pipe(new StreamCache());
      result.stream = stream;
      return stream;
    })
    .then(waitForFinish)
    .then(function(){
      return result;
    });
}

function createDumpStream(cache) {
  return function dumpStream(outputStream) {
    return new Promise(function(resolve, reject) {
      var dumpStream = cache.pipe(outputStream);
      dumpStream.on('finish', resolve);
      dumpStream.on('error', reject);
    });
  };
}

function runSinglePath(sourcePath, destPath, options) {

  return readAndReplaceStream(sourcePath, options.replaceMap)
    .then(function handleReadAndReplace(result){
      return createWriteStream(destPath, options.encoding)
        .then(createDumpStream(result.cache))
        .then(function(){
          return {
            src: sourcePath,
            dest: destPath,
            changed: result.inputHash !== result.outputHash
          };
        });
    });
}

function listPaths(globStr) {
  return new Promise(function(resolve, reject){
    glob(globStr, function (err, paths) {
      if (err) {
        reject(err);
      } else {
        resolve(paths);
      }
    });
  });
}

function runPaths(sourcePaths, options) {
  var getDestPath = options.destPattern ?
    pathTransformer(options.destPattern) :
    identity;

  return Promise.all(sourcePaths.map(function(sourcePath){
    var destPath = getDestPath(sourcePath);
    return runSinglePath(sourcePath, destPath, options);
  }));
}

module.exports = function run(options) {
  return Promise.all([
    listPaths(options.source),
    getReplaceMap(options.encoding, options.replaceMapPath)
  ]).then(function(results){
    var sourcePaths = results[0];
    var replaceMap = results[1];
    options.replaceMap = replaceMap;
    return runPaths(sourcePaths, options);
  }).then(function(result){
    return {
      options: options,
      result: result
    };
  });
}

function identity(i) {
  return i;
}
