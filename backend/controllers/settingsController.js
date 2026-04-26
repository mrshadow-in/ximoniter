const fs = require('fs').promises;
const path = require('path');

const configPath = path.join(__dirname, '../config/default.json');

const getSandboxMode = async (req, res) => {
    try {
        const data = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(data);
        res.json({ sandboxMode: config.sandboxMode });
    } catch (error) {
        console.error('Error reading config:', error);
        res.status(500).json({ error: 'Failed to read sandbox mode' });
    }
};

const toggleSandboxMode = async (req, res) => {
    try {
        const data = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(data);
        config.sandboxMode = !config.sandboxMode;
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        res.json({ sandboxMode: config.sandboxMode });
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Failed to toggle sandbox mode' });
    }
};

module.exports = {
    getSandboxMode,
    toggleSandboxMode
};
