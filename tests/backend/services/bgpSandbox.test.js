const bgpService = require('../../../backend/services/bgpService');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function testSandboxBGP() {
    const configPath = path.join(__dirname, '../../../backend/config/default.json');
    const originalConfig = fs.readFileSync(configPath, 'utf8');
    
    try {
        // Enable sandbox mode
        fs.writeFileSync(configPath, JSON.stringify({ sandboxMode: true }));
        // Clear require cache for config
        delete require.cache[require.resolve('../../../backend/config/default.json')];
        delete require.cache[require.resolve('../../../backend/services/bgpService')];
        
        const service = require('../../../backend/services/bgpService');
        await service.setPeerState({}, "mock-peer", true);
        console.log("Task 2.2 BGP Sandbox Test Passed");
    } finally {
        fs.writeFileSync(configPath, originalConfig);
    }
}
testSandboxBGP().catch(err => {
    console.error(err);
    process.exit(1);
});
