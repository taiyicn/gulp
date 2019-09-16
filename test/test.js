'use strict';

var expect = require('expect');
const task = require('../dist/task');

describe('gulp task test', () => {
	it('should return 2', () => {
		var tsk = task.define('compile', () => {
        });
	});
});
