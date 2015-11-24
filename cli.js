#!/usr/bin/env node

var commander = require('commander');
var replaceinfiles = require('./index');
var fs = require('fs');
var path = require('path');
var pkg = require('./package.json');

var generateOutputWriter = require('./lib/generateOutputWriter');

var DEFAULTS = {
  source: null,
  destPattern: null,
  silent: false,
  outputPath: null,
  replaceMapPath: null,
  replaceMap: null,
  encoding: 'utf-8'
};

commander
  .version(pkg.version)
  .option('-s, --source <glob>', 'glob matching files to be updated')
  .option('-d, --dest-pattern <path>', 'pattern to output files')
  .option('-o, --output-path <path>', 'path to output report file default: stdout')
  .option('-S, --silent', 'do not output report')
  .option('-r, --replace-map-path <path>', 'path to replace map json, default: stdin')
  .option('-e, --encoding <string>', 'used for both read and write, default "utf-8"')

commander.parse(process.argv);

var options = Object.keys(DEFAULTS).reduce(function(options, key){
  options[key] = commander[key] || DEFAULTS[key];
  return options;
}, {});

replaceinfiles(options)
  .then(generateOutputWriter(options))
  .catch(function(error){
    console.error(error.stack);
    process.exit(1);
  });
