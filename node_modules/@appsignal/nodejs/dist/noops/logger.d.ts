import { Logger, LoggerAttributes } from "../logger";
export declare class NoopLogger implements Logger {
    trace(_message: string, _attributes?: LoggerAttributes): void;
    debug(_message: string, _attributes?: LoggerAttributes): void;
    info(_message: string, _attributes?: LoggerAttributes): void;
    log(_message: string, _attributes?: LoggerAttributes): void;
    warn(_message: string, _attributes?: LoggerAttributes): void;
    error(_message: string, _attributes?: LoggerAttributes): void;
}
export declare const noopLogger: NoopLogger;
