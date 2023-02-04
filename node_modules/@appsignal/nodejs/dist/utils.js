"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processGetuid = exports.installReportPath = exports.hrTime = exports.isWritable = exports.getAgentTimestamps = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const perf_hooks_1 = tslib_1.__importDefault(require("perf_hooks"));
const NANOSECOND_DIGITS = 9;
const SECOND_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS);
/**
 * Given a valid POSIX `timestamp` in milliseconds since the UNIX epoch,
 * return an object containing a representation if that timestamps in
 * seconds and nanoseconds.
 *
 * @function
 */
function getAgentTimestamps(timestamp) {
    const sec = Math.round(timestamp / 1000);
    return {
        sec: sec,
        nsec: timestamp * 1e6 - sec * 1e9 // nanoseconds
    };
}
exports.getAgentTimestamps = getAgentTimestamps;
/**
 * Checks if the given path is writable by the process.
 */
function isWritable(path) {
    try {
        fs_1.default.accessSync(path, fs_1.default.constants.W_OK);
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.isWritable = isWritable;
/**
 * Returns a high-resolution time tuple containing the current time in seconds and nanoseconds.
 *
 * @function
 */
function hrTime(performance = perf_hooks_1.default.performance) {
    const origin = numberToHrtime(performance.timeOrigin);
    const now = numberToHrtime(performance.now());
    return { sec: origin[0] + now[0], nsec: origin[1] + now[1] };
}
exports.hrTime = hrTime;
function numberToHrtime(epochMillis) {
    const epochSeconds = epochMillis / 1000;
    const seconds = Math.trunc(epochSeconds);
    const nanoseconds = Number((epochSeconds - seconds).toFixed(NANOSECOND_DIGITS)) *
        SECOND_TO_NANOSECONDS;
    return [seconds, nanoseconds];
}
// This implementation should match the `scripts/extension/report.js`
// implementation to generate the same path.
function installReportPath() {
    return path_1.default.join(__dirname, "../ext/install.report");
}
exports.installReportPath = installReportPath;
function processGetuid() {
    var _a;
    return ((_a = process.getuid) !== null && _a !== void 0 ? _a : (() => -1))();
}
exports.processGetuid = processGetuid;
