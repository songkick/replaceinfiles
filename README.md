# replace-in-files [![Build Status](https://travis-ci.org/songkick/replaceinfiles.svg)](https://travis-ci.org/songkick/replaceinfiles)

Utility to replace a map of strings in many files

Use cases:

* pipe from [`hashmark`](https://github.com/keithamus/hashmark) to replace references to hashmarked files - see [example](./examples/hashmark)
* replace dev environment paths to production
* inject values in a config file
* _???_


## Usage

**Install**

```sh
npm i replaceinfiles
```

**Create or generate a replace map**, save in a file or pipe to stdin

```json
{
  "foo": "bar",
  "hello": "goodbye",
  "world": "earth",
  "%API_URL%": "https://myservice.com/api"
}
```

**Run**

```
Usage: replaceinfiles [options]

Options:

    -h, --help                     output usage information
    -V, --version                  output the version number
    -s, --source <glob>            glob matching files to be updated
    -d, --dest-pattern <path>      pattern to output files
    -o, --output-path <path>       path to output report file default: stdout
    -S, --silent                   do not output report
    -r, --replace-map-path <path>  path to replace map json, default: stdin
    -e, --encoding <string>        used for both read and write, default "utf-8"
```

**Examples**

* Streaming replace map from stdin

  ```sh
  cat replace-map.json | replaceinfiles -s src/*.css -d 'dist/{base}'
  ```
* Getting replace map from file

  ```sh
  replaceinfiles -r replace-map.json -s src/*.css -d 'dist/{base}'
  ```
* Write report to a file

  ```sh
  replaceinfiles -r replace-map.json -s src/*.css -d 'dist/{base}' > report.json
  # or
  replaceinfiles -r replace-map.json -s src/*.css -d 'dist/{base}' -o report.json
  ```

## Report

`replaceinfiles` generates a report on `stdout` or specified path for you to pipe other tools if you need to.

Here is an example:

```json
{
  "options": {
    "source": "test/src/*.txt",
    "destPattern": "test/dist/{base}",
    "outputPath": null,
    "replaceMapPath": null,
    "replaceMap": {
      "hello": "goodbye",
      "world": "earth"
    },
    "encoding": "utf-8"
  },
  "result": [
    {
      "src": "test/src/one.txt",
      "dest": "test/dist/one.txt",
      "changed": true
    },
    {
      "src": "test/src/three.txt",
      "dest": "test/dist/three.txt",
      "changed": false
    },
    {
      "src": "test/src/two.txt",
      "dest": "test/dist/two.txt",
      "changed": true
    }
  ]
}
```

## Options details

**-s, --source**: A [glob](https://github.com/isaacs/node-glob) matching the files you want to replace from

**-d, --dest-pattern**: A pattern to define updated files destination. You can use all the [`path.parse()`](https://nodejs.org/api/path.html#path_path_parse_pathstring) result values (`root, dir, name, base, ext`), example: `-d './dist/{dir}/{name}.build{ext}'`

**-r, --replace-map-path**: Path to a replace map JSON file (`{'stringToReplace': 'replaceWithThat', '..', '...'}`). `stdin` is used as default.

**-o, --output-path**: A path to write the report, default is `stdout`

**-S, --silent**: Do not output report, bypasses `-o`

**-e, --encoding**: Used for both read and write, default: `utf-8`

## API

You can also run `replaceinfiles` from node.

```js
var replaceinfiles = require('replaceinfiles');

var options = {
  source: './test/*.txt',
  destPattern: './test/dist/{base}',
  replaceMap: {
    foo: 'bar'
  }
};

replaceinfiles(options)
  .then(function(report){
    // ...
  })
  .catch(function(error) {
    // ...
  });
```
