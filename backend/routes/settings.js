const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/sandbox', settingsController.getSandboxMode);
router.post('/sandbox/toggle', settingsController.toggleSandboxMode);

module.exports = router;
