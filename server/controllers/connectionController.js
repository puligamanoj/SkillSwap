const Connection = require('../models/Connection');
const ExchangeRequest = require('../models/ExchangeRequest');

/**
 * @desc    Get logged-in user's active/completed connections
 * @route   GET /api/connections
 * @access  Private (Protected by JWT)
 */
const getConnections = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = { users: req.user._id };
    if (status) {
      query.status = status;
    }

    const connections = await Connection.find(query)
      .populate('users', '-password')
      .populate('exchangeRequest')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: connections.length,
      connections,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get connection details by ID
 * @route   GET /api/connections/:id
 * @access  Private (Protected by JWT)
 */
const getConnectionById = async (req, res, next) => {
  try {
    const connection = await Connection.findById(req.params.id)
      .populate('users', '-password')
      .populate('exchangeRequest');

    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection not found',
      });
    }

    // Authorization check: Only connected users can access
    const isConnected = connection.users.some(
      (u) => u._id.toString() === req.user._id.toString()
    );

    if (!isConnected) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to access this connection',
      });
    }

    res.status(200).json({
      status: 'success',
      connection,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid connection ID format',
      });
    }
    next(error);
  }
};

/**
 * @desc    Update connection status (e.g. mark active, completed, or terminated)
 * @route   PATCH /api/connections/:id/status
 * @access  Private (Protected by JWT)
 */
const updateConnectionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['active', 'completed', 'terminated'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: `Status must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection not found',
      });
    }

    // Authorization check: Only connected users can update
    const isConnected = connection.users.some(
      (u) => u.toString() === req.user._id.toString()
    );

    if (!isConnected) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this connection',
      });
    }

    connection.status = status;
    if (status === 'completed') {
      connection.completedAt = new Date();

      // Synchronize ExchangeRequest status if not already completed
      await ExchangeRequest.findByIdAndUpdate(connection.exchangeRequest, {
        status: 'completed',
      });
    }

    await connection.save();

    const updatedConnection = await Connection.findById(connection._id)
      .populate('users', '-password')
      .populate('exchangeRequest');

    res.status(200).json({
      status: 'success',
      message: `Connection status updated to '${status}' successfully`,
      connection: updatedConnection,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConnections,
  getConnectionById,
  updateConnectionStatus,
};
