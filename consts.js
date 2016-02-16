/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

var packageInfo = require('./package.json');

// Defaults for the treeherder service
module.exports = {
  userAgent: 'treeherder-nodeclient/' + packageInfo.version,
  baseUrl: process.env.TREEHERDER_URL ||
           'https://treeherder-dev.allizom.org/api/'
};
