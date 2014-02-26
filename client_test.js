suite('client', function() {
  var client = require('swagger-client');

  var swagger;
  setup(function(done) {
    swagger = new client.SwaggerApi({
      url: 'http://treeherder-dev.allizom.org/docs/api-docs/api/project',
      success: done
    });
  });

  test('', function() {
    console.log(swagger);
  });
});
