const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Default route to serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html'));
});

// Routes will be mounted here
const proxmoxRoutes = require('./routes/proxmox');
const settingsRoutes = require('./routes/settings');
app.use('/api/proxmox', proxmoxRoutes);
app.use('/api/settings', settingsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NOD Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
