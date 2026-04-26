const express = require('express');
const router = express.Router();
const proxmoxController = require('../controllers/proxmoxController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT);

router.get('/config', proxmoxController.getConfig);
router.post('/config', proxmoxController.addConfig);
router.delete('/config/:id', proxmoxController.deleteConfig);

router.get('/:node/history', proxmoxController.getHistory);

module.exports = router;
