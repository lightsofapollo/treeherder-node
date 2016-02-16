/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

/**
@module mozilla-treeherder/project
*/

var assert = require('assert');
var consts = require('./consts');
var crypto = require('crypto');
var request = require('superagent-promise');
var debug = require('debug')('mozilla-treeherder:project');

var Promise = require('promise');
var hawk = require('hawk');
var HttpError = require('./httperror');
var utf8 = require('utf8');

function buildRequest(credentials, user, method, url, body) {
  body = JSON.stringify(body || '');

  var payload = {
    credentials: credentials,
    contentType: 'application/json',
    payload: utf8.encode(body)
  };

  var header = hawk.client.header(url, method.toUpperCase(), payload);
  var req = request(method, url).
    set('User-Agent', consts.userAgent).
    set('Content-Type', 'application/json').
    set('Authorization', header.field).
    send(body);

  // return a promise for the result...
  return req.end();
}

/**
Generic helper for resolving http request promises.
@private
*/
function handleResponse(res) {
  if (res.ok) return res.body;
  throw new HttpError(res);
}

function sleep(time) {
  return new Promise(function(accept) {
    setTimeout(accept, time);
  });
}

/**
Handles retries/sleeping when encountering throttling.

@private
*/
function throttleDecorator(method) {
  return function() {
    var ctx = this;
    var args = Array.prototype.slice.call(arguments);
    var currentRetry = 0;

    if (
      typeof args[args.length - 1] === 'object' &&
      args[args.length - 1].currentRetry
    ) {
      currentRetry = args[args.length - 1].currentRetry;
    }

    return method.apply(this, args).catch(function(err) {
      if (err.status == 429 && ctx.throttleRetries) {
        debug('Handling throttle...')
        var sleepSeconds = parseInt(err.headers['x-throttle-wait-seconds'], 10);
        args.push({ currentRetry: ++currentRetry });

        debug('throttle', { sleepSeconds: sleepSeconds })
        return sleep(sleepSeconds * 1000).then(function() {
          debug('throttle run retry', currentRetry);
          return method.apply(ctx, args);
        });
      }
      throw err;
    });
  }
}

/**

@example

var Project = require('mozilla-treeherder/project');
var project = new Project('gaia', {
  consumerKey: 'key',
  consumerSecret: 'secret'
});

@param {String} project name.
@param {Object} config for project.
@param {String} config.clientId for hawk.
@param {String} config.secret also for hawk.
@param {Number} [config.throttleRetries=0]
@constructor
@alias module:mozilla-treeherder/project
*/
function Project(project, config) {
  assert(project, 'project is required');

  this.project = project;
  this.user = (config && config.user) || project;
  var url = (config && config.baseUrl) || consts.baseUrl;
  this.url = url + 'project/' + project + '/';
  this.throttleRetries = config.throttleRetries || 0;

  // generally authenticated requests are only required for posting so don't require it for all
  // requests...
  if ( config && config.clientId && config.secret) {
    this.credentials = {
        id: config.clientId,
        key: config.secret,
        algorithm: 'sha256'
    };
  }
}

Project.prototype = {
  /**
  Issue a project specific api request with hawk credentials.

  @param {String} method http method type.
  @param {String} path the subpath in the project.
  @param {Object} body of the http request.
  @return {Promise<Object>}
  */
  authRequest: function(method, path, body) {
    return new Promise(function(accept, reject) {
      if (!this.credentials) {
        return reject(
          new Error('Cannot issue secured request without client ID and secret')
        );
      }

      buildRequest(
        this.credentials,
        this.user,
        method,
        this.url + path,
        body
      ).then(
        accept,
        reject
      );
    }.bind(this));

  },

  /**
  Issue a project specific api request (which does not require credentials)

  @param {String} method http method type.
  @param {String} path the subpath in the project.
  @return {Promise<Object>}
  */
  request: function(method, path) {
    return request(
      method,
      this.url + path
    ).set(
      'User-Agent',
      consts.userAgent
    ).end();
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

  @example

  var resultset = [{
    revision_hash: '435323',
    // it's in seconds
    push_timestamp: 111111
    type: 'push',
    revisions: [{
      comment: 'I did stuff',
      files: [
        'dom/foo/bar',
      ],
      revision: '23333',
      // this must match the project name
      repository: 'gaia',
      author: 'jlal@mozilla.com'
    }]
  }];

  project.postResultset(resultset).then(function(result) {
    // ...
  });

  @see http://treeherder-dev.allizom.org/docs/#!/project/Result_Set_post_9
  @param {Object} resultset full resultset object.
  @return {Promise<Object>}
  */
  postResultset: throttleDecorator(function(resultset) {
    return this.authRequest('POST', 'resultset/', resultset).then(handleResponse);
  }),

  /**
  Fetch all the objectstore results for this project.
  @return {Promise<Array>}
  @see http://treeherder-dev.allizom.org/docs/#!/project/Jobs_get_5
  */
  getJobs: function() {
    return this.request('GET', 'jobs/').then(handleResponse);
  },

  /**
  Post a set of jobs.

  @example

  project.postJobs([
    'project': 'gaia',
    'revision_hash': 'sabc'
    'job': {
      'job_guid': 'unique_guid',
      'name': 'Testing gaia',
      'reason': 'scheduler',
      'job_symbol': '?',
      'submit_timestamp': 1387221298,
      'start_timestamp': 1387221345,
      'end_timestamp': 1387222817,
      'state': 'pending',
      'log_references': [],

      // You _must_ pass option collection until
      // https://github.com/mozilla/treeherder-service/issues/112
      'option_collection': {
        'opt': true
      }
    }
  ]);

  @return {Promise<Object>}
  @param {Object} jobs collection.
  @see http://treeherder-dev.allizom.org/docs/#!/project/Jobs_post_4
  */
  postJobs: throttleDecorator(function(jobs) {
    return this.authRequest('POST', 'jobs/', jobs).then(handleResponse);
  })

};

module.exports = Project;
