const bgpToolsService = require('../services/bgpToolsService');

exports.getASN = async (req, res) => {
    try {
        const data = await bgpToolsService.lookup(req.params.asn);
        res.json({ success: true, data });
    } catch (err) {
        res.status(502).json({ success: false, error: err.message, code: 'EXTERNAL_API_ERROR' });
    }
};
