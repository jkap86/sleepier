/// <reference types="node" />
import perf_hooks from "perf_hooks";
/**
 * Given a valid POSIX `timestamp` in milliseconds since the UNIX epoch,
 * return an object containing a representation if that timestamps in
 * seconds and nanoseconds.
 *
 * @function
 */
export declare function getAgentTimestamps(timestamp: number): {
    sec: number;
    nsec: number;
};
/**
 * Checks if the given path is writable by the process.
 */
export declare function isWritable(path: string): boolean;
/**
 * Returns a high-resolution time tuple containing the current time in seconds and nanoseconds.
 *
 * @function
 */
export declare function hrTime(performance?: perf_hooks.Performance): {
    sec: number;
    nsec: number;
};
export declare function installReportPath(): string;
export declare function processGetuid(): number;
