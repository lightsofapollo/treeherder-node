/**
@module mozilla-treeherder/gulpfile
*/

var gulp = require('gulp');
var jsdoc = require('gulp-jsdoc');
var pkg = require('./package.json');

gulp.task('doc', function() {
  var opts = {
    'private': true,
    monospaceLinks: true,
    cleverLinks: true,
    outputSourceFiles: true
  };

  var tpl = {
    path: 'ink-docstrap',
    systemName      : pkg.name,
    navType         : 'inline',
    theme           : 'spacelab',
    linenums        : true,
    collapseSymbols : false,
    inverseNav      : false
  };

  gulp.src([
      'README.md',
      'project.js',
      'factory/github.js'
    ])
    .pipe(jsdoc.parser())
    .pipe(jsdoc.generator('./doc', tpl, opts));
});

gulp.task('watch', function() {
  gulp.watch(['*.js', 'factory/*.js'], ['doc']);
});

gulp.task('default', ['doc']);
