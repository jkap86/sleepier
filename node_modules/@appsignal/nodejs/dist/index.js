"use strict";
/**
 * AppSignal for Node.js
 * @module Appsignal
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WinstonTransport = exports.expressErrorHandler = exports.IORedisDbStatementSerializer = exports.RedisDbStatementSerializer = exports.SpanProcessor = exports.Appsignal = void 0;
const tslib_1 = require("tslib");
var client_1 = require("./client");
Object.defineProperty(exports, "Appsignal", { enumerable: true, get: function () { return client_1.Client; } });
var span_processor_1 = require("./span_processor");
Object.defineProperty(exports, "SpanProcessor", { enumerable: true, get: function () { return span_processor_1.SpanProcessor; } });
var serializer_1 = require("./instrumentation/redis/serializer");
Object.defineProperty(exports, "RedisDbStatementSerializer", { enumerable: true, get: function () { return serializer_1.RedisDbStatementSerializer; } });
var serializer_2 = require("./instrumentation/redis/serializer");
Object.defineProperty(exports, "IORedisDbStatementSerializer", { enumerable: true, get: function () { return serializer_2.RedisDbStatementSerializer; } });
var error_handler_1 = require("./instrumentation/express/error_handler");
Object.defineProperty(exports, "expressErrorHandler", { enumerable: true, get: function () { return error_handler_1.expressErrorHandler; } });
var winston_transport_1 = require("./winston_transport");
Object.defineProperty(exports, "WinstonTransport", { enumerable: true, get: function () { return winston_transport_1.WinstonTransport; } });
tslib_1.__exportStar(require("./helpers"), exports);
