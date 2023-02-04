import winston from "winston";
export interface IntegrationLogger {
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
    debug(message: string): void;
    trace(message: string): void;
}
export declare class BaseIntegrationLogger {
    type: string;
    level: string;
    logger: winston.Logger;
    constructor(type: string, level: string, filename?: string);
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
    debug(message: string): void;
    trace(message: string): void;
    /**
     * Translates our logLevel to the one supported by Winston
     */
    private translateLogLevel;
}
