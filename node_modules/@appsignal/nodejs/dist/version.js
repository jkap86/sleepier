"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.AGENT_VERSION = void 0;
const pkg = require("../package.json");
exports.AGENT_VERSION = require("../scripts/extension/support/constants").AGENT_VERSION;
exports.VERSION = pkg.version;
