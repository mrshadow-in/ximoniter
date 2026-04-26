const express = require('express');
const router = express.Router();
const proxmoxController = require('../controllers/proxmoxController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT);

router.get('/:node/history', proxmoxController.getHistory);

module.exports = router;
