'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fancyLog = require("fancy-log");
const ansiColors = require("ansi-colors");
function _isPromise(p) {
    if (typeof p.then === 'function') {
        return true;
    }
    return false;
}
function _renderTime(time) {
    return `${Math.round(time)} ms`;
}
async function _execute(task) {
    const name = task.taskName || task.displayName || `<anonymous>`;
    if (!task._tasks) {
        fancyLog('Starting', ansiColors.cyan(name), '...');
    }
    const startTime = process.hrtime();
    await _doExecute(task);
    const elapsedArr = process.hrtime(startTime);
    const elapsedNanoseconds = elapsedArr[0] * 1e9 + elapsedArr[1];
    if (!task._tasks) {
        fancyLog(`Finished`, ansiColors.cyan(name), 'after', ansiColors.magenta(_renderTime(elapsedNanoseconds / 1e6)));
    }
}
async function _doExecute(task) {
    return new Promise((resolve, reject) => {
        if (task.length === 1) {
            task(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
            return;
        }
        const taskResult = task();
        if (typeof taskResult === 'undefined') {
            resolve();
            return;
        }
        if (_isPromise(taskResult)) {
            taskResult.then(resolve, reject);
            return;
        }
        taskResult.on('end', _ => resolve());
        taskResult.on('error', err => reject(err));
    });
}
function series(...tasks) {
    const result = async () => {
        for (let i = 0; i < tasks.length; i++) {
            await _execute(tasks[i]);
        }
    };
    result._tasks = tasks;
    return result;
}
exports.series = series;
function parallel(...tasks) {
    const result = async () => {
        await Promise.all(tasks.map(t => _execute(t)));
    };
    result._tasks = tasks;
    return result;
}
exports.parallel = parallel;
function define(name, task) {
    if (task._tasks) {
        const lastTask = task._tasks[task._tasks.length - 1];
        if (lastTask._tasks || lastTask.taskName) {
            return define(name, series(task, () => Promise.resolve()));
        }
        lastTask.taskName = name;
        task.displayName = name;
        return task;
    }
    task.taskName = name;
    task.displayName = name;
    return task;
}
exports.define = define;
