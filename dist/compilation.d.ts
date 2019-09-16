/// <reference types="node" />
export interface ICancellationToken {
    isCancellationRequested(): boolean;
}
export declare function compileTask(src: string, out: string, build: boolean): () => NodeJS.ReadWriteStream;
