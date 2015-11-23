var child_process = require('child_process');
var path = require('path');
var fs = require('fs');
var tap = require('tap');
var rimraf = require('rimraf');

function cleanDist() {
  rimraf.sync(path.join(__dirname, 'test/dist/*.txt'));
  rimraf.sync(path.join(__dirname, 'test/dist/*.json'));
}

function getContent(filePath) {
  return fs.readFileSync(path.join(__dirname, filePath)).toString();
}

function getReport() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'test/dist/report.json')));
}

var expectations = {
  one: getContent('test/expected/one.txt'),
  two: getContent('test/expected/two.txt'),
  three: getContent('test/expected/three.txt')
}

tap.test('CLI', function(test){
  test.plan(3);
  cleanDist();
  child_process.execFile('./cli.js', [
    "-s", "test/src/*.txt",
    "-r", "test/replace-map.json",
    "-d", "test/dist/%base%-test-output",
    "-o", "test/dist/report.json"
  ], function(error, stdout, stderr){
    test.equal(error, null, 'returned without an error code');

    test.test('Generated files', function(test){
      test.plan(3);
      test.equal(getContent('test/dist/one.txt-test-output'), expectations.one, 'content matches expectations');
      test.equal(getContent('test/dist/two.txt-test-output'), expectations.two, 'content matches expectations');
      test.equal(getContent('test/dist/three.txt-test-output'), expectations.three, 'content matches expectations');
    });

    test.test('Report', function(test){
      var report = getReport();
      test.plan(3);
      test.ok(report, 'a report is written');
      test.test('options', function(test){
        var options = report.options;
        test.plan(5);
        test.equal(options.source, 'test/src/*.txt', 'contains source');
        test.equal(options.replaceMapPath, 'test/replace-map.json', 'contains replace map path');
        test.equal(options.destPattern, 'test/dist/%base%-test-output', 'contains dest pattern');
        test.equal(options.outputPath, 'test/dist/report.json', 'contains output dest path');
        test.same(options.replaceMap, {
            "hello": "goodbye",
            "world": "earth"
          }, 'contains the replace map');
      });

      test.test('result', function(test){
        var result = report.result;
        test.plan(4);
        test.ok(Array.isArray(result), 'is an array');

        test.same(result[0], {
          src: 'test/src/one.txt',
          dest: 'test/dist/one.txt-test-output',
          changed: true,
        }, 'contains correct data for one.txt');

        test.same(result[1], {
          src: 'test/src/three.txt',
          dest: 'test/dist/three.txt-test-output',
          changed: false,
        }, 'contains correct data for three.txt');

        test.same(result[2], {
          src: 'test/src/two.txt',
          dest: 'test/dist/two.txt-test-output',
          changed: true,
        }, 'contains correct data for two.txt');
      });
    });
  });
});
