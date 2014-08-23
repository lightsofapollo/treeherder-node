global.assert = require('assert');

// Default url exported by the vagrant treeherder image.
process.env.TREEHERDER_URL =
  process.env.TREEHERDER_URL || 'http://192.168.33.10/api/';
