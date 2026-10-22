const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwtHelper');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Message = require('../models/Message');

// In-memory online users map: userId -> Set of socket IDs
const onlineUsers = new Map();

/**
 * Check if a user is currently online
 * @param {string} userId
 * @returns {boolean}
 */
const isUserOnline = (userId) => {
  const userSockets = onlineUsers.get(userId.toString());
  return userSockets && userSockets.size > 0;
};

/**
 * Initialize Socket.io server and attach event handlers
 * @param {Object} httpServer - Node HTTP server instance
 * @param {Object} corsOptions - CORS config
 * @returns {Object} Socket.io server instance
 */
const initSocketServer = (httpServer, corsOptions) => {
  const io = new Server(httpServer, {
    cors: corsOptions || {
      origin: '*',
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Join personal user room for direct user notifications
    socket.join(userId);

    // 1. Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    io.emit('user_online', { userId });

    // 2. Join Connection Room (Authorized only)
    socket.on('join_connection', async (data, ack) => {
      try {
        const connectionId = typeof data === 'string' ? data : data?.connectionId;
        if (!connectionId) {
          if (ack) ack({ status: 'fail', message: 'connectionId is required' });
          return;
        }

        const connection = await Connection.findById(connectionId);
        if (!connection) {
          if (ack) ack({ status: 'fail', message: 'Connection not found' });
          return;
        }

        const isMember = connection.users.some((u) => u.toString() === userId);
        if (!isMember) {
          socket.emit('error_message', { message: 'Unauthorized connection room' });
          if (ack) ack({ status: 'fail', message: 'Unauthorized connection room' });
          return;
        }

        socket.join(connectionId.toString());
        if (ack) ack({ status: 'success', room: connectionId.toString() });
      } catch (err) {
        if (ack) ack({ status: 'fail', message: err.message });
      }
    });

    // 3. Send Real-time Message
    socket.on('send_message', async (data, callback) => {
      try {
        const { connectionId, text } = data || {};

        if (!connectionId || !text || text.trim().length === 0) {
          if (callback) callback({ status: 'fail', message: 'connectionId and text required' });
          return;
        }

        const connection = await Connection.findById(connectionId);
        if (!connection) {
          if (callback) callback({ status: 'fail', message: 'Connection not found' });
          return;
        }

        // Verify sender membership from authenticated socket user
        const isMember = connection.users.some((u) => u.toString() === userId);
        if (!isMember) {
          socket.emit('error_message', { message: 'Unauthorized message send' });
          if (callback) callback({ status: 'fail', message: 'Unauthorized' });
          return;
        }

        // Identify receiver
        const receiverId = connection.users.find((u) => u.toString() !== userId);

        const message = await Message.create({
          sender: socket.user._id,
          receiver: receiverId,
          connection: connection._id,
          text: text.trim(),
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', '-password')
          .populate('receiver', '-password');

        // Broadcast to room
        io.to(connectionId.toString()).emit('receive_message', populatedMessage);

        if (callback) callback({ status: 'success', data: populatedMessage });
      } catch (err) {
        if (callback) callback({ status: 'fail', message: err.message });
      }
    });

    // 4. Typing Indicators (Ephemeral, not stored in DB)
    socket.on('typing', async (data) => {
      const { connectionId } = data || {};
      if (connectionId) {
        socket.to(connectionId.toString()).emit('user_typing', {
          userId,
          connectionId,
        });
      }
    });

    socket.on('stop_typing', async (data) => {
      const { connectionId } = data || {};
      if (connectionId) {
        socket.to(connectionId.toString()).emit('user_stop_typing', {
          userId,
          connectionId,
        });
      }
    });

    // 5. Mark Message as Read
    socket.on('mark_message_read', async (data) => {
      try {
        const { messageId, connectionId } = data || {};
        if (!messageId) return;

        const message = await Message.findById(messageId);
        if (message && message.receiver.toString() === userId) {
          message.isRead = true;
          message.readAt = new Date();
          await message.save();

          io.to((connectionId || message.connection).toString()).emit('message_read', {
            messageId: message._id,
            readAt: message.readAt,
          });
        }
      } catch (err) {
        console.error('[Socket mark_message_read error]', err.message);
      }
    });

    // 6. Handle Disconnect
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_offline', { userId });
        }
      }
    });
  });

  return io;
};

module.exports = {
  initSocketServer,
  isUserOnline,
  onlineUsers,
};
