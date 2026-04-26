const express = require('express');
const app = express();

app.use(express.json());

// Routes will be mounted here
const proxmoxRoutes = require('./routes/proxmox');
app.use('/api/proxmox', proxmoxRoutes);

module.exports = app;
