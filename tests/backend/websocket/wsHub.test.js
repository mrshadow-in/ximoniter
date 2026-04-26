const assert = require('assert');
const WebSocket = require('ws');
const app = require('../../../backend/server');
const http = require('http');

async function testWS() {
    const server = http.createServer(app);
    try {
        require('../../../backend/websocket/wsHub').init(server);
    } catch (e) {
        // Expected to fail if wsHub doesn't exist yet
        console.error("Initialization failed as expected:", e.message);
        throw e;
    }
    
    server.listen(3001);
    
    try {
        const ws = new WebSocket('ws://localhost:3001/ws');
        await new Promise((resolve, reject) => {
            ws.on('open', resolve);
            ws.on('error', reject);
            setTimeout(() => reject(new Error('Timeout')), 2000);
        });
        assert.ok(true, "WebSocket connected");
        ws.close();
    } finally {
        server.close();
    }
    console.log("Task 6.1 WebSocket Test Passed");
}
testWS().catch(err => { 
    console.error("Test failed as expected:", err.message); 
    process.exit(1); 
});
