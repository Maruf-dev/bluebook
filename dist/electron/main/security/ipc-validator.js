"use strict";
// IPC message validation - strict allowlist to prevent arbitrary invocation
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAllowedChannel = isAllowedChannel;
exports.validateMessage = validateMessage;
exports.makeResponse = makeResponse;
const ALLOWED_CHANNELS = {
    'db:init': true,
    'db:get_tests': true,
    'db:get_test': true,
    'db:save_attempt': true,
    'db:get_attempt': true,
    'db:get_attempts': true,
    'db:save_response': true,
    'db:import_test': true,
    'window:minimize': true,
    'window:maximize': true,
    'window:close': true,
    'app:get_version': true,
    'app:get_path': true,
};
function isAllowedChannel(channel) {
    return ALLOWED_CHANNELS[channel] === true;
}
function validateMessage(message) {
    if (!message || typeof message !== 'object')
        return false;
    const m = message;
    return typeof m['type'] === 'string' && isAllowedChannel(m['type']);
}
function makeResponse(requestId, success, data, error) {
    return {
        success,
        data,
        error,
        requestId,
        timestamp: Date.now(),
    };
}
