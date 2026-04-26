const { test, describe } = require('node:test');
const assert = require('assert');
const env = require('../../../backend/config/env');

describe('Environment Config', () => {
    test('should load PRIMARY_PING_TARGET', () => {
        assert.ok(env.PRIMARY_PING_TARGET, "PRIMARY_PING_TARGET should be defined");
    });
});
