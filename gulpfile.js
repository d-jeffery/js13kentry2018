const gulp = require('gulp');
const butternut = require('gulp-butternut');
const htmlmin = require('gulp-htmlmin');
const pump = require('pump');

gulp.task('compress', function(cb) {
    pump([gulp.src('src/public/*.js'), butternut({ sourceMap: true }), gulp.dest('public')]);
    pump(
        [gulp.src('src/public/*.html'), htmlmin({ collapseWhitespace: true }), gulp.dest('public')],
        cb
    );
});