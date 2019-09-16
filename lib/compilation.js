"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gulp = require("gulp");
const tsb = require("gulp-tsb");
const bom = require("gulp-bom");
const util = require("taiyi-util");
const _ = require("underscore");
const es = require("event-stream");
const reporter_1 = require("./reporter");
const typesDts = [
    "node_modules/typescript/lib/*.d.ts",
    "node_modules/@types/**/*.d.ts",
    "!node_modules/@types/webpack/**/*",
    "!node_modules/@types/uglify-js/**/*"
];
const reporter = reporter_1.createReporter();
function _createCompile(src, build, emitError) {
    const opts = _.clone(util.getTypeScriptCompilerOptions(src));
    console.log(opts);
    opts.inlineSources = !!build;
    opts.noFilesystemLookup = true;
    const ts = tsb.create(opts, true, undefined, err => reporter(err.toString()));
    return function (token) {
        const utf8Filter = util.filter(data => /(\/|\\)test(\/|\\).*utf8/.test(data.path));
        const tsFilter = util.filter(data => /\.ts$/.test(data.path));
        const noDeclarationsFilter = util.filter(data => !/\.d\.ts$/.test(data.path));
        const input = es.through();
        const output = input
            .pipe(utf8Filter)
            .pipe(bom())
            .pipe(utf8Filter.restore)
            .pipe(tsFilter)
            .pipe(ts(token))
            .pipe(noDeclarationsFilter)
            .pipe(reporter.end(!!emitError));
        return es.duplex(input, output);
    };
}
function compileTask(src, out, build) {
    return function () {
        const compile = _createCompile(src, build, true);
        const srcPipe = es.merge(gulp.src(`${src}/**`, { base: `${src}` }), gulp.src(typesDts));
        return srcPipe.pipe(compile()).pipe(gulp.dest(out));
    };
}
exports.compileTask = compileTask;
