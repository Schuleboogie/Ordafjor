var gulp = require('gulp'),
		less = require('gulp-less'),
		path = require('path'),
		browserSync = require('browser-sync').create(),
		nodemon = require('gulp-nodemon');

gulp.task('less', function () {
	return gulp.src('./public/css/less/main.less')
				.pipe(less())
				.pipe(gulp.dest('./public/css'))
				.pipe(browserSync.stream());
});

gulp.task('watch', function () {
		gulp.watch('./public/css/less/**/*.less', ['less']);
		gulp.watch(['./*.html', './scripts/*.js', './css/*.css']).on('change', browserSync.reload);
});


gulp.task('browser-sync', ['nodemon'], function() {
		browserSync.init(null, {
				proxy: "http://localhost:3000",
				files: ["public/**/*.*"],
				browser: "google chrome",
				port: 7000,
		});
});

gulp.task('nodemon', function (cb) {
		var started = false;
		return nodemon({
				script: 'index.js'
		}).on('start', function () {
				if (!started) {
					cb();
					started = true;
				}
		});
});

gulp.task('default', ['less', 'watch','browser-sync']);
