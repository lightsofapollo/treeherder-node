# mozilla-treeherder

NodeJS interface for treeherder.

## Usage

```js
var Project = require('mozilla-treeherder/project');

// this configuration can be aquired from an ateam member working on
// treeherder (jeads).
var project = new Project('gaia', {
  consumerKey: '...',
  consumerSecret: ''
});
```

## Notes

  - `TREEHERDER_URL` environment variable can be used to configure the
     base url for treeherder.

