const config = require('../config/default.json');

async function switchTunnel(routerConfig, tunnelId, action) {
    if (config.sandboxMode) {
        console.log(`[SANDBOX] Mocking switchTunnel: ${tunnelId} -> ${action}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        return;
    }
    console.log(`Switching tunnel ${tunnelId} to ${action}`);
    return;
}

module.exports = {
    switchTunnel
};
