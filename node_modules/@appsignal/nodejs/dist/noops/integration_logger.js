"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noopIntegrationLogger = exports.NoopIntegrationLogger = void 0;
class NoopIntegrationLogger {
    error(_message) {
        // noop
    }
    warn(_message) {
        // noop
    }
    info(_message) {
        // noop
    }
    debug(_message) {
        // noop
    }
    trace(_message) {
        // noop
    }
}
exports.NoopIntegrationLogger = NoopIntegrationLogger;
exports.noopIntegrationLogger = new NoopIntegrationLogger();
