const { test, describe, mock } = require('node:test');
const assert = require('node:assert');
const axios = require('axios');
const proxmoxService = require('../../../backend/services/proxmoxService');

describe('Proxmox Connection Test', () => {
    test('testConnection should return success on valid response', async (t) => {
        const mockResponse = {
            data: {
                data: {
                    version: '7.4-3'
                }
            }
        };

        // Mock axios.get
        const axiosGetMock = t.mock.method(axios, 'get', async () => mockResponse);

        const config = {
            host: '1.2.3.4',
            port: 8006,
            token_id: 'user!token',
            token_secret: 'secret-key',
            reject_unauth: 0
        };

        const result = await proxmoxService.testConnection(config);

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.version, '7.4-3');
        
        // Verify axios.get was called with correct parameters
        assert.strictEqual(axiosGetMock.mock.callCount(), 1);
        const call = axiosGetMock.mock.calls[0];
        assert.strictEqual(call.arguments[0], 'https://1.2.3.4:8006/api2/json/version');
        assert.strictEqual(call.arguments[1].headers.Authorization, 'PVEAPIToken=user!token=secret-key');
    });

    test('testConnection should throw error on failure', async (t) => {
        const mockError = new Error('Network Error');
        t.mock.method(axios, 'get', async () => { throw mockError; });

        const config = {
            host: '1.2.3.4',
            port: 8006,
            token_id: 'user!token',
            token_secret: 'secret-key',
            reject_unauth: 0
        };

        await assert.rejects(
            proxmoxService.testConnection(config),
            {
                message: 'Proxmox connection failed: Network Error'
            }
        );
    });
});
