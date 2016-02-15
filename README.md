# mozilla-treeherder [![Build Status](https://travis-ci.org/mozilla/treeherder-node.png?branch=master)](https://travis-ci.org/mozilla/treeherder-node)

NodeJS interface for [treeherder](https://treeherder.mozilla.org).

## Usage

```js
var Project = require('mozilla-treeherder/project');

// this configuration can be acquired from an ateam member working on
// treeherder (mdoglio).
var project = new Project('gaia', {
  clientId: '...',
  secret: '',
  // Disabled by default but will retry post / put requests if a 429 is
  // returned.
  throttleRetries: 2
});
```

## CLI

See all the options with:

```sh
./bin/treeherder --help
```

## Reporting Treeherder bugs

[treeherder](https://github.com/mozilla/treeherder) api errors will
include a traceback from the server. Most times these errors are simply
something you did wrong (no hawk credentials, wrong parameters, etc...)
but there are times when there are actually bugs in treeherder... Submit
an [issue](https://bugzilla.mozilla.org/enter_bug.cgi?product=Tree%20Management&component=Treeherder) with the traceback.


## Tests

(you must run npm install first)

```sh
// run all the tests
npm test

// run one test
./node_modules/.bin/mocha path_to_test.js
```

Tests use nock so we can test some of our logic on CI without hitting
real servers but they are also designed to work with nock disabled... To
test against real servers do this:

```sh
// XXX: Testing this way is potentially buggy use at your own risk...
NOCK_OFF=true ./node_modules/.bin/mocha path_to_test
```

## Notes

  - `TREEHERDER_URL` environment variable can be used to configure the
     base url for treeherder.

