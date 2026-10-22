const Message = require('../models/Message');
const Connection = require('../models/Connection');
const { createAndSendNotification } = require('../services/notificationService');

/**
 * @desc    Send a REST message in a connection
 * @route   POST /api/messages
 * @access  Private (Protected by JWT)
 */
const sendMessage = async (req, res, next) => {
  try {
    const { connectionId, connection: altConnectionId, text } = req.body;
    const targetConnectionId = connectionId || altConnectionId;

    if (!targetConnectionId || !text || text.trim().length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide connectionId and message text',
      });
    }

    const connection = await Connection.findById(targetConnectionId);
    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection not found',
      });
    }

    // Authorization check: User must be a member of the connection
    const isMember = connection.users.some(
      (u) => u.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not a participant in this connection',
      });
    }

    if (connection.status === 'terminated') {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot send messages in a terminated connection',
      });
    }

    // Determine receiver
    const receiverId = connection.users.find(
      (u) => u.toString() !== req.user._id.toString()
    );

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      connection: connection._id,
      text: text.trim(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', '-password')
      .populate('receiver', '-password');

    // Emit Socket.io real-time event if io instance is attached to app
    const io = req.app.get('io');
    if (io) {
      io.to(connection._id.toString()).emit('receive_message', populatedMessage);
    }

    // Trigger notification to receiver
    await createAndSendNotification({
      recipient: receiverId,
      sender: req.user._id,
      type: 'new_message',
      title: 'New Chat Message',
      message: `${req.user.name}: "${text.length > 40 ? text.substring(0, 40) + '...' : text}"`,
      relatedId: message._id,
      app: req.app,
    });

    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: populatedMessage,
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
 * @desc    Get messages belonging to a connection
 * @route   GET /api/messages/:connectionId
 * @access  Private (Protected by JWT)
 */
const getMessagesByConnection = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const { page = 1, limit = 100 } = req.query;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection not found',
      });
    }

    // Authorization check: User must be a member of the connection
    const isMember = connection.users.some(
      (u) => u.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view messages in this connection',
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ connection: connectionId })
      .populate('sender', '-password')
      .populate('receiver', '-password')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ connection: connectionId });

    res.status(200).json({
      status: 'success',
      count: messages.length,
      total,
      messages,
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
 * @desc    Mark a message as read
 * @route   PATCH /api/messages/:id/read
 * @access  Private (Protected by JWT)
 */
const markMessageAsRead = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        status: 'fail',
        message: 'Message not found',
      });
    }

    // Authorization check: Only receiver can mark as read
    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only the message recipient can mark it as read',
      });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(message.connection.toString()).emit('mark_message_read', {
        messageId: message._id,
        readAt: message.readAt,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Message marked as read',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getMessagesByConnection,
  markMessageAsRead,
};
