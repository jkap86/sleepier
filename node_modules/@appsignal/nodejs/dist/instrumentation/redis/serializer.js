"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisDbStatementSerializer = void 0;
// dbStatementSerializer for OpenTelemetry node-redis and ioredis packages
// This ensures no sensitive data is sent in Redis queries.
function RedisDbStatementSerializer(command, args) {
    const values = [];
    if (args.length > 0) {
        for (let i = 0; i < args.length; i++) {
            values.push("?");
        }
        return `${command} ${values.join(" ")}`;
    }
    else {
        return command;
    }
}
exports.RedisDbStatementSerializer = RedisDbStatementSerializer;
