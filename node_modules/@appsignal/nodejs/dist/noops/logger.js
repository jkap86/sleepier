"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noopLogger = exports.NoopLogger = void 0;
class NoopLogger {
    trace(_message, _attributes) {
        // noop
    }
    debug(_message, _attributes) {
        // noop
    }
    info(_message, _attributes) {
        // noop
    }
    log(_message, _attributes) {
        // noop
    }
    warn(_message, _attributes) {
        // noop
    }
    error(_message, _attributes) {
        // noop
    }
}
exports.NoopLogger = NoopLogger;
exports.noopLogger = new NoopLogger();
