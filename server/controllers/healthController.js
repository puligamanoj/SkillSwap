const mongoose = require('mongoose');

// @desc    Check server & database health status
// @route   GET /api/health
// @access  Public
const getHealthStatus = (req, res) => {
  const dbStateMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const dbState = mongoose.connection.readyState;

  res.status(200).json({
    status: 'success',
    message: 'SkillSwap API Server is up and running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStateMap[dbState] || 'Unknown',
      connected: dbState === 1,
    },
  });
};

module.exports = {
  getHealthStatus,
};
