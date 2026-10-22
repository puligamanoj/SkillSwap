const Notification = require('../models/Notification');
const { isUserOnline } = require('../socket/socketHandler');

/**
 * Create a notification in MongoDB and emit real-time Socket.io event if recipient is online
 * @param {Object} params - { recipient, sender, type, title, message, relatedId, app }
 * @returns {Object} Created notification document
 */
const createAndSendNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  relatedId = null,
  app = null,
}) => {
  try {
    if (!recipient || !sender || !type || !title || !message) {
      return null;
    }

    // Do not notify self
    if (recipient.toString() === sender.toString()) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      relatedId,
    });

    const populatedNotif = await Notification.findById(notification._id)
      .populate('sender', 'name avatar email')
      .populate('recipient', 'name email');

    // Real-time dispatch via Socket.io if recipient is online
    if (app) {
      const io = app.get('io');
      if (io) {
        // Emit to all sockets connected by recipient user
        io.to(recipient.toString()).emit('notification_received', populatedNotif);
      }
    }

    return populatedNotif;
  } catch (error) {
    console.error('[Notification Service Error]', error.message);
    return null;
  }
};

module.exports = {
  createAndSendNotification,
};
