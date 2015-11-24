# hashmark + replaceinfiles + injectassets

Demonstrate how to combine the three tools to:

1. copy your assets (images, fonts..) to a `dist` folder
1. bundle your scripts and style (here we just copy them from `src`)
1. mark assets, scripts and styles with their `hash`
1. updates all the assets references
1. inject updated references scripts and styles in your `index.html`

## Run

```bash
npm i && npm run build
```

Wil generate following output:

```bash
tree dist
dist
├── assets
│   └── images
│       └── background-e9053c.png
├── bundle-888f8b.js
├── critical-1f7511.css
├── index.html
└── style-0c2f83.css
```

Where:

* `critical-1f7511.css` have a proper reference to `/assets/images/background-e9053c.png`
* `index.html` as tag referring to:
  * `bundle-888f8b.js`
  * `critical-1f7511.css`
  * `style-0c2f83.css`

## Details

**Context:** You have a toolchain that produces following structure:

```bash
tree dist
dist
├── assets
│   └── images
│       └── background.png
├── bundle.js
├── critical.css
├── index.html
└── style.css
```

Where `critical.css` contains a reference to the image, i.e: `background: url(/assets/images/background.png)`.

For caching reasons, we want to had a hash to our assets by automatically renaming assets to include their content hash: `assets/images/background.png` becomes `assets/images/background-e9053c.png`. This can be achieved using [`hashmark`](https://github.com/keithamus/hashmark) and running the command:

```bash
hashmark -c dist -r -l 6 'assets/**/*.*' '{dir}/{name}-{hash}{ext}'
> {"assets/images/background.png":"assets/images/background-e9053c.png"}
```

The problem is that we now need to update `critical.css` reference to it. Fortunately, `hashmark` outputs an `asset-map` on `stdout` that `replaceinfiles`, you can simply pipe the two! (And you'll get a nice report you can output to a file, pipe to another tool or simply silence with `-S`).

```bash
hashmark -c dist -r -l 6 'assets/**/*.*' '{dir}/{name}-{hash}{ext}' | replaceinfiles -s 'dist/*.css' -d '{dir}/{base}'

> {
  "options": {
    "source": "dist/*.css",
    "destPattern": "{dir}/{base}",
    "silent": false,
    "outputPath": null,
    "replaceMapPath": null,
    "replaceMap": {
      "assets/images/background.png": "assets/images/background-e9053c.png"
    },
    "encoding": "utf-8"
  },
  "result": [
    {
      "src": "dist/critical.css",
      "dest": "dist/critical.css",
      "changed": true
    },
    {
      "src": "dist/style.css",
      "dest": "dist/style.css",
      "changed": false
    }
  ]
}
```

**Temporary caveat:** The `-c` working directory option isn't available yet on publish `hashmark` version but is critical to the two tools cooperation. Until the [pull requet]() is merged, you can simply use the upgrade version:

```
npm i -D arnaudrinquin/hashmark#feature/cwd-option
```

**Bonus:** If you also want to hashmark you `.css` and `.js` files, you are going to need to replace the references in `index.html`. You would need to follow these steps:

1. hashmark assets (images, fonts)
1. update assets reference in `css`
1. hashmark `css` and `js`
1. replace / inject hashmarked `css` and `js` references in HTML.

You can easily automate the last step using [`injectassets`](https://github.com/ArnaudRinquin/injectassets).

Simply write a source html with including injection instructions (in `src/index.html`):

```html
<html>
<head>
    <meta charset="UTF-8">
    <title>I love CLI tools</title>
    {{#css}}
    <link href="{{.}}" rel="stylesheet" type="text/css">
    {{/css}}
    {{#js}}
    <script src="{{.}}"></script>
    {{/js}}
</head>
<body>
    <!-- your regular stuff-->
</body>
</html>
```

And run:
```bash
injectassets -s src/index.html -o dist/index.html -d dist
```

To get a nice `dist/index.html` that includes hashmarked `css` and `js` files.

Please have a look at the example [package.json](./package.json) for a clean [`npm runscript`](https://docs.npmjs.com/cli/run-script) integration example.
