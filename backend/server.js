require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Default route to serve the app shell
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Routes will be mounted here
const authRoutes = require('./routes/auth');
const proxmoxRoutes = require('./routes/proxmox');
const settingsRoutes = require('./routes/settings');
const bgpToolsRoutes = require('./routes/bgpTools');
const usersRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/proxmox', proxmoxRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/bgp-tools', bgpToolsRoutes);
app.use('/api/users', usersRoutes);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  const http = require('http');
  const server = http.createServer(app);
  const wsHub = require('./websocket/wsHub');
  wsHub.init(server);
  
  const proxmoxService = require('./services/proxmoxService');
  proxmoxService.startPolling(5000); // 5s frequency

  const failoverService = require('./services/failoverService');
  failoverService.start();
  
  server.listen(PORT, () => {
    console.log(`NOD Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
