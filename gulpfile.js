var gulp = require('gulp')
    , gls = require('gulp-live-server')
    , rjs = require('gulp-requirejs')
    , minifyCss = require('gulp-clean-css')
    , rename = require('gulp-rename')
    , uglify = require('gulp-uglify')
    , protractor = require('gulp-protractor').protractor
    , del = require('del')
    , shell = require('gulp-shell')
    , gutil = require('gulp-util')
    , rename = require("gulp-rename");

gulp.task('minify-js', function () {
    return rjs({
        baseUrl: 'src/static/js',
        mainConfigFile: 'src/static/js/main.js',
        out: 'main.min.js',
        name: 'main',
        paths: {
            'angular': "empty:",
            'angular-route': "empty:",
            'jquery': "empty:",
            'bootstrap': "empty:"
        }
    })
        .pipe(uglify())
        .pipe(gulp.dest('src/static/js'));
});

gulp.task('minify-css', function () {
    return gulp.src('src/static/stylesheets/style.css')
        .pipe(minifyCss())
        .pipe(rename('style.min.css'))
        .pipe(gulp.dest('src/static/stylesheets'));
});

gulp.task('build', gulp.parallel('minify-js', 'minify-css'), function () {

});

var server = gls('src/node/minutedock.js', {
    env: {
        NODE_ENV: 'test',
        NODE_CONFIG_DIR: 'config',
        NODE_CONFIG: process.env.NODE_CONFIG || {}
    }
});

gulp.task('serve', function () {
    server.start();
    gulp.watch(['src/**/*'], function () {
        server.start.apply(server);
    });
});

gulp.task('test', function () {
    return gulp.src(['./test/**/*.js'])
        .pipe(protractor({
            'configFile': 'test/conf.js',
            'debug': true,
            'autoStartStopServer': true
        }))
        .on('error', function (e) {
            console.error(e);
            server.stop().then(function () {
                console.log("Error.. Stopping servers");
                process.exit(1);
            });
        })
        .on('end', function () {
            server.stop().then(function () {
                console.log("Done..Stopping servers");
                process.exit();
            });
        });
});

gulp.task('clean', function () {
    return del('dist');
});

function string_src(filename, string) {
    var src = require('stream').Readable({objectMode: true})
    src._read = function () {
        this.push(new gutil.File({cwd: "", base: "", path: filename, contents: new Buffer(string)}))
        this.push(null)
    }
    return src
}

gulp.task('package-src', function () {
    var distFiles = [
        './LICENSE.txt',
        './src/**/*'];

    return gulp.src(distFiles, {base: './'})
        .pipe(gulp.dest('dist'));
});

gulp.task('package-config', function () {
    var configFiles = [
        'config/default.json',
        'config/production.json'
    ];

    return gulp.src(configFiles, {base: './'})
        .pipe(gulp.dest('dist'));
});

gulp.task('package-README', function () {
    var instructions = "1) Install pm2 \n2) Set NODE_CONFIG with config vars\n3) Run 'npm start'";
    return string_src('README.txt', instructions)
        .pipe(gulp.dest('dist'));
});

gulp.task('package-dependencies', function () {
    var npm_pkg = require('./package.json');
    delete npm_pkg.scripts.test;
    delete npm_pkg.scripts.postinstall;
    delete npm_pkg.devDependencies;
    npm_pkg.scripts.start = 'pm2 start src/node/minutedock.js';

    return string_src('_package.json', JSON.stringify(npm_pkg))
        .pipe(rename('package.json'))
        .pipe(gulp.dest('dist'));
});

gulp.task('package', gulp.series['package-src', 'package-config', 'package-dependencies', 'package-README'], shell.task(['cd dist && mkdir -p logs']));

gulp.task('default', gulp.series['build', 'start']);
