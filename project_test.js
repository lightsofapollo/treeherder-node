suite('project', function() {
  var PROJECT_NAME = 'gaia';

  var URL = require('url');
  var nock = require('nock');
  var uuid = require('uuid');
  var Project = require('./project');
  var subject;

  function path(part) {
    return URL.parse(subject.url).path + part;
  }

  function buildNock(path) {
    // remove the oauth credentials (we can't really verify this works 100%
    // anyway...)
    return nock(subject.url).filteringPath(/\?(.*)/, '');
  }

  suiteSetup(function() {
    nock.disableNetConnect();
  });

  suiteTeardown(function() {
    nock.enableNetConnect();
  });

  setup(function() {
    subject = new Project(PROJECT_NAME, {
      consumerKey: 'fee2fbb3-3b18-4731-b5f2-083511c49516',
      consumerSecret: 'bb1a0697-5d59-4462-91ab-f00ccd049f18'
    });
  });

  test('initialization', function() {
    var url = process.env.TREEHERDER_URL;
    assert.ok(subject.url.indexOf(url) !== -1, 'has ' + url);
    assert.ok(subject.url.indexOf('project/' + PROJECT_NAME) !== -1);
  });

  test('#getResultset', function() {
    var mock = buildNock().
                 get(path('resultset/')).
                 reply(200, []);

    return subject.getResultset().then(function(list) {
      assert.ok(Array.isArray(list));
    });
  });

  suite('#postResultset', function() {
    var resultset = [{
      revision_hash: uuid.v4(),
      // it's in seconds
      push_timestamp: Date.now() / 1000,
      type: 'push',
      revisions: [{
        comment: 'I did stuff',
        files: [
          'dom/foo/bar',
        ],
        revision: uuid.v1(),
        repository: PROJECT_NAME,
        author: 'jlal@mozilla.com'
      }]
    }];

    setup(function() {
      buildNock().
        post(path('resultset/')).
        reply(200, {});

      return subject.postResultset(resultset);
    });

    test('ensure resultset is saved', function() {
      buildNock().
        get(path('resultset/')).
        reply(200, resultset);

      return subject.getResultset().then(function(items) {
        var hasResultset = items.some(function(item) {
          return item.revision_hash === resultset[0].revision_hash;
        });
        assert.ok(hasResultset, 'saves item as a resultset');
      });
    });
  });
});
