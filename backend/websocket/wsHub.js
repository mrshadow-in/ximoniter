const { WebSocketServer } = require('ws');
let wss;
exports.init = (server) => {
    wss = new WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws) => {
        console.log('WS Client connected');
        ws.on('message', (msg) => console.log('WS Received:', msg.toString()));
    });
};
exports.broadcast = (channel, event, data) => {
    if (!wss) return;
    const payload = JSON.stringify({ channel, event, timestamp: new Date().toISOString(), data });
    wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(payload);
    });
};
