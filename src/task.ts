/*---------------------------------------------------------------------------------------------
 * gulp任务发布扩展
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as fancyLog from 'fancy-log';
import * as ansiColors from 'ansi-colors';

/**
 * 基础任务类型
 *
 * @export
 * @interface BaseTask
 */
export interface BaseTask {
	displayName?: string;
	taskName?: string;
	_tasks?: Task[];
}

/**
 * 异步任务
 *
 * @export
 * @interface PromiseTask
 * @extends {BaseTask}
 */
export interface PromiseTask extends BaseTask {
	(): Promise<void>;
}

/**
 *
 *
 * @export
 * @interface StreamTask
 * @extends {BaseTask}
 */
export interface StreamTask extends BaseTask {
	(): NodeJS.ReadWriteStream;
}

/**
 *
 *
 * @export
 * @interface CallbackTask
 * @extends {BaseTask}
 */
export interface CallbackTask extends BaseTask {
	(cb?: (err?: any) => void): void;
}

export type Task = PromiseTask | StreamTask | CallbackTask;

/**
 *
 *
 * @param {(Promise<void> | NodeJS.ReadWriteStream)} p
 * @returns {p is Promise<void>}
 */
function _isPromise(p: Promise<void> | NodeJS.ReadWriteStream): p is Promise<void> {
	if (typeof (<any>p).then === 'function') {
		return true;
	}
	return false;
}

/**
 *
 *
 * @param {number} time
 * @returns {string}
 */
function _renderTime(time: number): string {
	return `${Math.round(time)} ms`;
}

/**
 *
 *
 * @param {Task} task
 * @returns {Promise<void>}
 */
async function _execute(task: Task): Promise<void> {
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

/**
 *
 *
 * @param {Task} task
 * @returns {Promise<void>}
 */
async function _doExecute(task: Task): Promise<void> {
	return new Promise((resolve, reject) => {
		if (task.length === 1) {
			// this is a callback task
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
			// this is a sync task
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

/**
 * 顺序执行任务
 *
 * @export
 * @param {...Task[]} tasks
 * @returns {PromiseTask}
 */
export function series(...tasks: Task[]): PromiseTask {
	const result = async () => {
		for (let i = 0; i < tasks.length; i++) {
			await _execute(tasks[i]);
		}
	};
	result._tasks = tasks;
	return result;
}

/**
 * 并发执行任务
 *
 * @export
 * @param {...Task[]} tasks
 * @returns {PromiseTask}
 */
export function parallel(...tasks: Task[]): PromiseTask {
	const result = async () => {
		await Promise.all(tasks.map(t => _execute(t)));
	};
	result._tasks = tasks;
	return result;
}

/**
 * 定义一个任务，但不立即执行
 *
 * @export
 * @param {string} name
 * @param {Task} task
 * @returns {Task}
 */
export function define(name: string, task: Task): Task {
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
