const config = require('../config/default.json');

async function setPeerState(routerConfig, peerName, enabled) {
    if (config.sandboxMode) {
        console.log(`[SANDBOX] Mocking setPeerState: ${peerName} -> ${enabled}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
    }
    // Real implementation would use node-routeros
    console.log(`Setting peer ${peerName} to ${enabled}`);
    return;
}

module.exports = {
    setPeerState
};
