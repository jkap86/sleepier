"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseIntegrationLogger = void 0;
const tslib_1 = require("tslib");
const winston_1 = tslib_1.__importDefault(require("winston"));
const { combine, timestamp, printf } = winston_1.default.format;
class BaseIntegrationLogger {
    constructor(type, level, filename) {
        this.type = type;
        this.level = this.translateLogLevel(level);
        let transport;
        if (type == "file") {
            transport = new winston_1.default.transports.File({ filename: filename });
        }
        else {
            transport = new winston_1.default.transports.Console();
        }
        const logFormat = printf(({ level, message, timestamp }) => {
            if (type == "file") {
                return `[${timestamp} (process) #${process.pid}][${level}] ${message}`;
            }
            else {
                return `[${timestamp} (process) #${process.pid}][appsignal][${level}] ${message}`;
            }
        });
        this.logger = winston_1.default.createLogger({
            format: combine(timestamp({ format: "YYYY-MM-DDTHH:mm:ss" }), logFormat),
            level: this.level,
            transports: [transport]
        });
    }
    error(message) {
        this.logger.error(message);
    }
    warn(message) {
        this.logger.warn(message);
    }
    info(message) {
        this.logger.info(message);
    }
    debug(message) {
        this.logger.debug(message);
    }
    trace(message) {
        this.logger.silly(message);
    }
    /**
     * Translates our logLevel to the one supported by Winston
     */
    translateLogLevel(level) {
        switch (level) {
            case "error":
                return "error";
            case "warning":
                return "warn";
            case "info":
                return "info";
            case "debug":
                return "debug";
            case "trace":
                return "silly";
            default:
                return "info";
        }
    }
}
exports.BaseIntegrationLogger = BaseIntegrationLogger;
