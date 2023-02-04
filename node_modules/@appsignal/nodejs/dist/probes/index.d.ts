/**
 * The Minutely probes object.
 */
export declare class Probes {
    #private;
    constructor({ run }?: {
        run?: boolean | undefined;
    });
    stop(): this;
    get isRunning(): boolean;
    get count(): number;
    register(name: string, fn: () => void): this;
    unregister(name: string): this;
    clear(): this;
}
