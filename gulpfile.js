var gulp = require('gulp');
var plug = require('gulp-load-plugins')();

var source = [
    './src/*.js'
];

gulp.task('createPackage', function(){
    return gulp
        .src(source)
        .pipe(plug.ngAnnotate({add: true, single_quotes: true}))
        .pipe(plug.concat('angular-screenmatch.min.js'))
        .pipe(plug.uglify())
        .pipe(gulp.dest('./dist'));
});