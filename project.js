/**
@module mozilla-treeherder/project
*/

var assert = require('assert');
var consts = require('./consts');
var crypto = require('crypto');
var request = require('superagent-promise');

var OAuth = require('oauth').OAuth;

/**
@kind constant
default treeherder user.
*/
var TREEHERDER_USER = 'treeherder-node ' + require('./package').version;

function buildRequest(oauth, user, method, url, body) {
  // we need to directly sign the body since oauth node does not do this for us.
  body = JSON.stringify(body || '');

  var queryParams = oauth._prepareParameters(
    null, // no tokens in 2 legged oauth
    null, // ^
    method,
    url,
    /**

    */
    {
      // future book keeping for treeherder not sure what it's going to be used
      // for...
      user: user,

      // node oauth does not provide body hasing but its easy to do so... its
      // always sha1 as far as I can tell (at least the server only cares about
      // sha1)
      oauth_body_hash: crypto.createHash('sha1').update(body).digest('base64'),

      // per http://tools.ietf.org/html/rfc5849#section-2.1 it must be empty if
      // not used to indicate two legged oauth...
      oauth_token: ''
    }
  );

  var req = request(method, url).
    set('Content-Type', 'application/json').
    send(body);

  // map the query parameters in order into an object
  var query = {};
  queryParams.reduce(function(result, value) {
    result[value[0]] = value[1];
    return result;
  }, query);

  req.query(query);

  // return a promise for the result...
  return req.end();
}

/**
Generic helper for resolving http request promises.
@private
*/
function handleResponse(res) {
  if (res.ok) return res.body;
  throw res.error;
}

/**

```js

var Project = require('mozilla-treeherder/project');
var project = new Project('gaia', {
  consumerKey: 'key',
  consumerSecret: 'yes'
});

```


@param {String} project name.
@param {Object} config for project.
@param {String} config.consumerKey for oauth.
@param {String} config.consumerSecret also for oauth.
@constructor
@alias module:mozilla-treeherder/project
*/
function Project(project, config) {
  assert(project, 'project is required');
  assert(config.consumerKey, '.consumerKey is required');
  assert(config.consumerSecret, '.consumerSecret is required');

  this.project = project;

  this.user = config.user || TREEHERDER_USER;

  // https://github.com/ciaranj/node-oauth/blob/171e668f386a3e1ba0bcb915b8dc7fdc9335aa62/lib/oauth.js#L9
  this.oauth = new OAuth(
    null, // 2 legged oauth has no urls
    null, // ^
    config.consumerKey, // per project key
    config.consumerSecret, // per project secret
    '1.0', // oauth version
    null, // no callbacks in 2 legged oauth
    'HMAC-SHA1' // signature type expected by the treeherder server.
  );

  var url = config.baseUrl || consts.baseUrl;
  this.url = url + 'project/' + project + '/';
}

Project.prototype = {
  /**
  Issue a project specific api request

  @param {String} method http method type.
  @param {String} path the subpath in the project.
  @param {Object} body of the http request.
  @return {Promise<Object>}
  */
  request: function(method, path, body) {
    return buildRequest(
      this.oauth,
      this.user,
      method,
      this.url + path,
      body
    );
  },

  /**
  Fetch all resultset(s) for this project.

  @see http://treeherder-dev.allizom.org/docs/#!/project/Result_Set_get_10
  @return {Promise<Array>}
  */
  getResultset: function() {
    return this.request('GET', 'resultset/').then(handleResponse);
  },

  /**
  Update or create a resultset.

  @see http://treeherder-dev.allizom.org/docs/#!/project/Result_Set_post_9
  @param {Object} resultset full resultset object.
  @return {Promise<Object>}
  */
  postResultset: function(resultset) {
    return this.request('POST', 'resultset/', resultset).then(handleResponse);
  },

  /**
  Fetch all the objectstore results for this project.
  @return {Promise<Array>}
  */
  getObjectstore: function() {
    return this.request('GET', 'objectstore/').then(handleResponse);
  }
};

module.exports = Project;
