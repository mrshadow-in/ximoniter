const ping = require('ping');
const env = require('../config/env');
const bgpService = require('./bgpService');
const wsHub = require('../websocket/wsHub');

let state = 'PRIMARY';
let consecutiveFailures = 0;
let consecutiveSuccesses = 0;
let pollingInterval = null;

const TARGET = env.PRIMARY_PING_TARGET;
const FAILURE_THRESHOLD = 4;
const SUCCESS_THRESHOLD = 10;

async function checkPing() {
    try {
        const res = await ping.promise.probe(TARGET, { timeout: 2 });
        
        if (res.alive) {
            consecutiveFailures = 0;
            if (state === 'FAILOVER') {
                consecutiveSuccesses++;
                if (consecutiveSuccesses >= SUCCESS_THRESHOLD) {
                    console.log("Shifted");
                    state = 'PRIMARY';
                    consecutiveSuccesses = 0;
                    
                    // Trigger BGP switch
                    await bgpService.setPeerState({}, "primary-peer", true);
                    
                    // Broadcast to frontend
                    wsHub.broadcast('failover', 'recovery', {
                        message: "Shifted. Monitoring inbound connection for inbound DDoS",
                        target: TARGET
                    });
                } else {
                    // Broadcast waiting state
                    wsHub.broadcast('failover', 'waiting', {
                        message: "Primary upstream is back up, waiting for connectivity to shift to primary",
                        target: TARGET
                    });
                }
            } else if (state === 'PRIMARY') {
                // Broadcast steady state
                wsHub.broadcast('failover', 'steady', {
                    message: "Monitoring inbound connection for inbound DDoS",
                    target: TARGET
                });
            }
        } else {
            consecutiveSuccesses = 0;
            if (state === 'PRIMARY') {
                consecutiveFailures++;
                if (consecutiveFailures >= FAILURE_THRESHOLD) {
                    console.log("Detected DDoS Shifting to Fallback protected route");
                    state = 'FAILOVER';
                    consecutiveFailures = 0;
                    
                    // Trigger BGP switch
                    await bgpService.setPeerState({}, "primary-peer", false);
                    
                    // Broadcast to frontend
                    wsHub.broadcast('failover', 'triggered', {
                        message: "Detected DDoS Shifting to Fallback protected route",
                        target: TARGET
                    });
                } else {
                    // Broadcast warning
                    wsHub.broadcast('failover', 'warning', {
                        message: "Ping loss detected, validating connection...",
                        target: TARGET
                    });
                }
            } else if (state === 'FAILOVER') {
                // Broadcast steady fallback
                wsHub.broadcast('failover', 'steady_fallback', {
                    message: "Currently on Fallback route. Target IP is down.",
                    target: TARGET
                });
            }
        }
    } catch (err) {
        console.error('[Failover Engine] Ping error:', err.message);
    }
}

function start() {
    if (pollingInterval) clearInterval(pollingInterval);
    console.log(`[Failover Engine] Starting monitoring for ${TARGET}`);
    pollingInterval = setInterval(checkPing, 5000); // Check every 5 seconds
}

function stop() {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = null;
}

function getState() {
    return state;
}

// For testing purposes
function setState(s) {
    state = s;
    consecutiveFailures = 0;
    consecutiveSuccesses = 0;
}

module.exports = { start, stop, checkPing, getState, setState };
