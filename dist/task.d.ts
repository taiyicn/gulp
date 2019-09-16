/// <reference types="node" />
export interface BaseTask {
    displayName?: string;
    taskName?: string;
    _tasks?: Task[];
}
export interface PromiseTask extends BaseTask {
    (): Promise<void>;
}
export interface StreamTask extends BaseTask {
    (): NodeJS.ReadWriteStream;
}
export interface CallbackTask extends BaseTask {
    (cb?: (err?: any) => void): void;
}
export declare type Task = PromiseTask | StreamTask | CallbackTask;
export declare function series(...tasks: Task[]): PromiseTask;
export declare function parallel(...tasks: Task[]): PromiseTask;
export declare function define(name: string, task: Task): Task;
