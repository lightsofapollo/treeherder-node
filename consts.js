/**
Defaults for the treeherder service.
*/
module.exports = {
  baseUrl: process.env.TREEHERDER_URL ||
           'https://treeherder-dev.allizom.org/api/'
};
