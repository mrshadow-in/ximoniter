const proxmoxService = require('../services/proxmoxService');

exports.getHistory = async (req, res) => {
  const { node } = req.params;
  const hours = parseInt(req.query.hours) || 1;
  
  if (isNaN(hours) || hours <= 0) {
    return res.status(422).json({
      success: false,
      error: 'Hours must be a positive integer',
      code: 'VALIDATION_ERROR'
    });
  }

  try {
    const data = await proxmoxService.getHistory(node, hours);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching proxmox history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical metrics',
      code: 'PROXMOX_ERROR'
    });
  }
};
