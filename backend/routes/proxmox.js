const express = require('express');
const router = express.Router();
const proxmoxController = require('../controllers/proxmoxController');

router.get('/:node/history', proxmoxController.getHistory);

module.exports = router;
