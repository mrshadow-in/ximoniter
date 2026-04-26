const express = require('express');
const router = express.Router();
const bgpToolsController = require('../controllers/bgpToolsController');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT);
router.get('/asn/:asn', bgpToolsController.getASN);

module.exports = router;
