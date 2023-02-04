import type { Context } from "@opentelemetry/api";
import type { Span, ReadableSpan, SpanProcessor as OpenTelemetrySpanProcessor } from "@opentelemetry/sdk-trace-base";
import { Client } from "./client";
export declare class SpanProcessor implements OpenTelemetrySpanProcessor {
    client: Client;
    constructor(client: Client);
    forceFlush(): Promise<void>;
    onStart(_span: Span, _parentContext: Context): void;
    onEnd(span: ReadableSpan): void;
    shutdown(): Promise<void>;
}
export declare class TestModeSpanProcessor implements OpenTelemetrySpanProcessor {
    #private;
    constructor(testModeFilePath: string);
    forceFlush(): Promise<void>;
    onStart(_span: any, _parentContext: any): void;
    onEnd(span: any): void;
    shutdown(): Promise<void>;
}
