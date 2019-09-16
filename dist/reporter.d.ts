/// <reference types="node" />
export interface IReporter {
    (err: string): void;
    hasErrors(): boolean;
    end(emitError: boolean): NodeJS.ReadWriteStream;
}
export declare function createReporter(): IReporter;
