import { IntegrationLogger } from "../integration_logger";
export declare class NoopIntegrationLogger implements IntegrationLogger {
    error(_message: string): void;
    warn(_message: string): void;
    info(_message: string): void;
    debug(_message: string): void;
    trace(_message: string): void;
}
export declare const noopIntegrationLogger: NoopIntegrationLogger;
