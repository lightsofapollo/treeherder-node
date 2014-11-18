/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

global.assert = require('assert');

// Default url exported by the vagrant treeherder image.
process.env.TREEHERDER_URL =
  process.env.TREEHERDER_URL || 'http://192.168.33.10/api/';
