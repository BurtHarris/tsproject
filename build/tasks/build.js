var gulp = require('gulp');
var runSequence = require('run-sequence');
var paths = require('../paths');
var tsproject = require( 'tsproject' );
var tsd = require('gulp-tsd');

gulp.task('tsd', function (callback) {
  return gulp.src('./gulp_tsd.json').pipe( tsd() );
});

gulp.task('compile', ['tsd'], function () {
  return tsproject.src( paths.sourceTsConfig )
    .pipe( gulp.dest( paths.output ) );
});

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    ['compile'],
    callback
  );
});
