const express = require('express');
const app = express();

app.use(express.json());

// Routes will be mounted here
const proxmoxRoutes = require('./routes/proxmox');
const settingsRoutes = require('./routes/settings');
app.use('/api/proxmox', proxmoxRoutes);
app.use('/api/settings', settingsRoutes);

module.exports = app;
