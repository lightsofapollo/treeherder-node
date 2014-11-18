/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

/**
@fileoverview

Github factory which will convert github results into treeherder compatible
types.

@module mozilla-treeherder/factory/github
*/

function ghAuthorToThAuthor(author) {
  return author.name + ' <' + author.email + '>'
}

/**
@private
*/
function commitToRev(repository, record) {
  return {
    comment: record.commit.message,
    revision: record.sha,
    repository: repository,
    author: ghAuthorToThAuthor(record.commit.author)
  };
}

/**
@private
*/
function pushCommitToRev(repository, record) {
  return {
    comment: record.message,
    revision: record.id,
    repository: repository,
    author: ghAuthorToThAuthor(record.author)
  };
}

/**
@example

var factory = require('mozilla-treeherder/factory/github');
var commitsFromGithub = [
  // http://developer.github.com/v3/pulls/#list-commits-on-a-pull-request
]

factory.pullCommits('gaia', commitsFromGithub);

@see http://developer.github.com/v3/pulls/#list-commits-on-a-pull-request
@param {String} repository name of the project.
@param {Array<Object>} list of github commits.
@return {Array} 'revsions' portion of a resultset collection.
*/
function pullCommits(repository, list) {
  return list.map(commitToRev.bind(this, repository));
}

module.exports.pullCommits = pullCommits;

/**
@param {String} repository which treeherder results belong to.
@param {Object} list of commits from github push event.
*/
function pushCommits(repository, list) {
  return list.map(pushCommitToRev.bind(this, repository));
}

module.exports.pushCommits = pushCommits;

/**
@param {Object} githubPr pull request object.
@see https://developer.github.com/v3/pulls/#get-a-single-pull-request
@return {Object} partial resultset from single pull request object.
*/
function pull(repository, githubPr) {
  // created in seconds
  var timestamp = new Date(
    (githubPr.updated_at || githubPr.created_at)
  );
  timestamp = timestamp.valueOf() / 1000;

  return {
    revision_hash: githubPr.head.sha,
    push_timestamp: timestamp,
    author: githubPr.head.user.login,
    // XXX: not sure what the purpose of this or what other values we
    //      can expect...
    type: 'push'
  };
}

module.exports.pull = pull;
