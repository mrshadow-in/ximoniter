const assert = require('assert');
const ping = require('ping');
const bgpService = require('../../../backend/services/bgpService');
const wsHub = require('../../../backend/websocket/wsHub');
const failoverService = require('../../../backend/services/failoverService');

async function testFailover() {
    console.log("Running Failover Service tests...");
    
    const originalProbe = ping.promise.probe;
    const originalSetPeerState = bgpService.setPeerState;
    const originalBroadcast = wsHub.broadcast;

    let pingAlive = true;
    let bgpState = null;
    let broadcastEvent = null;

    ping.promise.probe = async () => ({ alive: pingAlive });
    bgpService.setPeerState = async (config, name, state) => { bgpState = state; };
    wsHub.broadcast = (channel, event, data) => { broadcastEvent = event; };

    try {
        // Ensure we start in PRIMARY state
        failoverService.setState('PRIMARY');
        assert.strictEqual(failoverService.getState(), 'PRIMARY');

        // Verify steady state broadcast
        pingAlive = true;
        await failoverService.checkPing();
        assert.strictEqual(broadcastEvent, 'steady');

        // Simulate 3 failures (should still be PRIMARY)
        pingAlive = false;
        for (let i = 0; i < 3; i++) {
            await failoverService.checkPing();
            assert.strictEqual(broadcastEvent, 'warning');
        }
        assert.strictEqual(failoverService.getState(), 'PRIMARY');

        // 4th failure should trigger FAILOVER
        await failoverService.checkPing();
        assert.strictEqual(failoverService.getState(), 'FAILOVER');
        assert.strictEqual(bgpState, false);
        assert.strictEqual(broadcastEvent, 'triggered');

        // Reset tracking
        bgpState = null;
        broadcastEvent = null;

        // Simulate 9 successes (should still be FAILOVER)
        pingAlive = true;
        for (let i = 0; i < 9; i++) {
            await failoverService.checkPing();
        }
        assert.strictEqual(failoverService.getState(), 'FAILOVER');
        assert.strictEqual(bgpState, null);

        // 10th success should trigger recovery
        await failoverService.checkPing();
        assert.strictEqual(failoverService.getState(), 'PRIMARY');
        assert.strictEqual(bgpState, true);
        assert.strictEqual(broadcastEvent, 'recovery');

        console.log("Failover Service tests PASSED");
    } catch (err) {
        console.error("Failover Service tests FAILED:", err);
        throw err;
    } finally {
        ping.promise.probe = originalProbe;
        bgpService.setPeerState = originalSetPeerState;
        wsHub.broadcast = originalBroadcast;
    }
}

if (require.main === module) {
    testFailover().catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { testFailover };
