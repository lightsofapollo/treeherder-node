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
      consumerKey: '3d3809b2-f656-4e24-ac10-3590e5cc4214',
      consumerSecret: 'e5dfb0b2-6559-4216-864b-bb87b51b4e10'
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
                 reply(200, { results: [] });

    return subject.getResultset().then(function(search) {
      assert.ok(Array.isArray(search.results));
    });
  });

  function setupResultset() {
    var resultset = [{
      revision_hash: uuid.v4(),
      // it's in seconds
      push_timestamp: Date.now() / 1000,
      type: 'push',
      revisions: [{
        comment: 'new job',
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

    return resultset;
  }

  suite('#postResultset', function() {
    var resultset = setupResultset();

    test('ensure resultset is saved', function() {
      buildNock().
        get(path('resultset/')).
        reply(200, { results: resultset });

      return subject.getResultset().then(function(search) {
        var hasResultset = search.results.some(function(item) {
          return item.revision_hash === resultset[0].revision_hash;
        });
        assert.ok(hasResultset, 'saves item as a resultset');
      });
    });
  });


  suite('#postJob', function() {
    var resultset = setupResultset();

    var jobs = [{
      'project': 'gaia',
      'revision_hash': resultset[0].revision_hash,
      'job': {
        'job_guid': uuid.v4(),
        'name': 'Testing gaia',
        'reason': 'scheduler',
        'job_symbol': '?',
        'submit_timestamp': 1387221298,
        'start_timestamp': 1387221345,
        'end_timestamp': 1387222817,
        'state': 'pending',
        'log_references': [],
        'option_collection': {
          'opt': true
        }
      }
    }];

    setup(function() {
      buildNock().
        post(path('jobs/')).
        reply(200, {});

      return subject.postJobs(jobs);
    });

    test('ensure job is saved', function() {
      assert.equal(
        resultset[0].revision_hash,
        jobs[0].revision_hash
      );

      buildNock().
        get(path('jobs/')).
        reply(200, [{
          job_guid: jobs[0].job.job_guid
        }]);

      return subject.getJobs().then(function(items) {
        var hasJob = items.some(function(item) {
          return item.job_guid === jobs[0].job.job_guid;
        });
        assert.ok(hasJob, 'saves job');
      });
    });
  });

  test('attempt to issue post without oauth', function() {
    var subject = new Project(PROJECT_NAME);

    return subject.postResultset().catch(function(err) {
      assert.ok(err);
    });
  });
});
