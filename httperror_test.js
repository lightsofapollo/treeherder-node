/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

suite('httperror', function() {
  var HttpError = require('./httperror');
  var fixture = require('./test/fixtures/error_body');

  test('error with body', function() {
    var response = {
      // error as returned by the server
      body: fixture,

      // error as defined by superagent
      error: {
        message: 'xfoo',
        status: 500,
        method: 'GET',
        path: '/path/to/thing'
      }
    };

    var subject = new HttpError(response);
    assert.ok(
      subject.message.indexOf(fixture.message) !== -1,
      'contains error from treeherder'
    );
    assert.equal(subject.status, response.error.status);
  });

  test('error without body', function() {
    var response = {
      error: {
        message: 'xfoo',
        status: 500,
        method: 'GET',
        path: '/path/to/thing'
      }
    };

    var subject = new HttpError(response);
    assert.ok(
      subject.message.indexOf(response.error.message) !== -1
    );
  });
});
