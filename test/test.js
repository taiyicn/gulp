"use strict";

const gulp = require("gulp");

const { task, compilation } = require("../lib/index");
describe("gulp task test", () => {
  it("should return 2", () => {
    task.define(
      "compile",
      task.series(compilation.compileTask("./src", "./out", false))
    );
  });
});
