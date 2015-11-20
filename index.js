var replace = require('replacestream');
var StreamCache = require('stream-cache');
var digest = require('digest-stream');
var fs = require('fs');

var replaceMap = {
  'hello': 'goodbye',
  'world': 'earth'
};
// var replaceMap = {
//   'goodbye': 'welcome',
//   'earth': 'world'
// };

var files = [
  './test/one.txt',
  './test/two.txt',
  './test/three.txt'
];

// var inputStream = process.stdin;
var outputStream = process.stdout;

var report = {
  files: files,
  updatesFiles: [],
  replaceMap: replaceMap
};

function replaceInfile(file) {
  return new Promise(function(resolve, reject){
    var inputStream = fs.createReadStream(file, {});

    inputStream.on('open', function(){

      var inputHash;
      var outputHash;

      function pipeReplacer(stream, oldValue) {
        var newValue = replaceMap[oldValue];
        return stream.pipe(replace(oldValue, newValue));
      }

      var digestedStream = inputStream.pipe(digest('sha1', 'hex', function(hash){
        inputHash = hash;
      }));

      var replacers = Object.keys(replaceMap).reduce(pipeReplacer, digestedStream);

      var outputCache = replacers.pipe(new StreamCache());

      replacers.pipe(digest('sha1', 'hex', function(hash){
        outputHash = hash;
      })).on('finish', function(){

        if (inputHash === outputHash) {
          resolve(file);
        } else {
          report.updatesFiles.push(file);

          var outputStream = fs.createWriteStream(file , {
            flags: 'w',
            encoding: 'utf-8'
          });

          outputStream.on('open', function() {
            var dumpStream = outputCache.pipe(outputStream);

            dumpStream.on('finish', function(){
              resolve(file);
            });
            dumpStream.on('error', function(error){
              reject(error);
            });
          })
        }
      });

      replacers.on('error', reject);
    });
  });
}


Promise.all(files.map(replaceInfile)).then(function(data){
  console.log(report);
}).catch(function(err){
  console.log('Error', err);
});
