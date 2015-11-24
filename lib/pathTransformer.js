var path = require('path');

var fileDescRegExps = ['root', 'base', 'name', 'ext', 'dir'].map(function(key){
  return {
    reg: new RegExp('{' + key + '}', 'g'),
    key: key
  };
});

module.exports = function generatePathTransformer(pattern) {
  return function pathTransformed(file) {
    var fileDesc = path.parse(file);
    return fileDescRegExps.reduce(function(path, fileDescRegExp) {
      var key = fileDescRegExp.key;
      var reg = fileDescRegExp.reg;
      var value = fileDesc[key];
      return path.replace(reg, value);
    }, pattern);
  }
}
