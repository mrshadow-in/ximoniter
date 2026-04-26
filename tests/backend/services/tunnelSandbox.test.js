const tunnelService = require('../../../backend/services/tunnelService');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function testSandboxTunnel() {
    const configPath = path.join(__dirname, '../../../backend/config/default.json');
    const originalConfig = fs.readFileSync(configPath, 'utf8');
    
    try {
        fs.writeFileSync(configPath, JSON.stringify({ sandboxMode: true }));
        delete require.cache[require.resolve('../../../backend/config/default.json')];
        delete require.cache[require.resolve('../../../backend/services/tunnelService')];
        
        const service = require('../../../backend/services/tunnelService');
        await service.switchTunnel({}, "mock-tunnel", "enable");
        console.log("Task 2.3 Tunnel Sandbox Test Passed");
    } finally {
        fs.writeFileSync(configPath, originalConfig);
    }
}
testSandboxTunnel().catch(err => {
    console.error(err);
    process.exit(1);
});
