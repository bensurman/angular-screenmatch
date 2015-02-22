var gulp = require('gulp');
var plug = require('gulp-load-plugins')();

var source = [
    './src/angular-screenmatch.js'
];

gulp.task('makeDist', function(){
    return gulp
        .src(source)
        .pipe(plug.ngAnnotate({add: true, single_quotes: true}))
        .pipe(plug.uglify())
        .pipe(plug.rename('angular-screenmatch.min.js'))
        .pipe(gulp.dest('./dist'));
});