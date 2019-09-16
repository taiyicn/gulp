"use strict";

import * as gulp from "gulp";
import * as tsb from "gulp-tsb";
import * as bom from "gulp-bom";
import * as util from "taiyi-util";
import * as _ from "underscore";
import * as es from "event-stream";
import { createReporter } from "./reporter";

const typesDts = [
  "node_modules/typescript/lib/*.d.ts",
  "node_modules/@types/**/*.d.ts",
  "!node_modules/@types/webpack/**/*",
  "!node_modules/@types/uglify-js/**/*"
];

export interface ICancellationToken {
  isCancellationRequested(): boolean;
}

const reporter = createReporter();

/**
 *
 *
 * @param {string} src
 * @param {boolean} build
 * @param {boolean} [emitError]
 * @returns {(token?: ICancellationToken) => NodeJS.ReadWriteStream}
 */
function _createCompile(
  src: string,
  build: boolean,
  emitError?: boolean
): (token?: ICancellationToken) => NodeJS.ReadWriteStream {
  // 获取目录下ts配置
  const opts = _.clone(util.getTypeScriptCompilerOptions(src));
  opts.inlineSources = !!build;
  opts.noFilesystemLookup = true;

  const ts = tsb.create(opts, true, undefined, err => reporter(err.toString()));

  return function(token?: ICancellationToken) {
    // 过滤条件
    const utf8Filter = util.filter(data =>
      /(\/|\\)test(\/|\\).*utf8/.test(data.path)
    );
    const tsFilter = util.filter(data => /\.ts$/.test(data.path));
    const noDeclarationsFilter = util.filter(
      data => !/\.d\.ts$/.test(data.path)
    );

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

/**
 * 编译任务
 *
 * @export
 * @param {string} src
 * @param {string} out
 * @param {boolean} build
 * @returns {() => NodeJS.ReadWriteStream}
 */
export function compileTask(
  src: string,
  out: string,
  build: boolean
): () => NodeJS.ReadWriteStream {
  return function() {
    const compile = _createCompile(src, build, true);
    const srcPipe = es.merge(
      gulp.src(`${src}/**`, { base: `${src}` }),
      gulp.src(typesDts)
    );
    return srcPipe.pipe(compile()).pipe(gulp.dest(out));
  };
}
