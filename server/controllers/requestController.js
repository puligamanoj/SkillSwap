const ExchangeRequest = require('../models/ExchangeRequest');
const Connection = require('../models/Connection');
const User = require('../models/User');
const { createAndSendNotification } = require('../services/notificationService');

/**
 * @desc    Send a skill exchange request to another student
 * @route   POST /api/requests
 * @access  Private (Protected by JWT)
 */
const createRequest = async (req, res, next) => {
  try {
    const { receiver, offeredSkill, wantedSkill, message } = req.body;

    // 1. Validation
    if (!receiver || !offeredSkill || !wantedSkill) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide receiver, offeredSkill, and wantedSkill',
      });
    }

    // 2. Prevent sending request to self
    if (req.user._id.toString() === receiver.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot send a skill exchange request to yourself',
      });
    }

    // 3. Verify receiver user exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'Receiver user not found',
      });
    }

    // 4. Prevent duplicate pending or active exchange requests between same users
    const existingRequest = await ExchangeRequest.findOne({
      $or: [
        { sender: req.user._id, receiver, status: { $in: ['pending', 'accepted'] } },
        { sender: receiver, receiver: req.user._id, status: { $in: ['pending', 'accepted'] } },
      ],
    });

    if (existingRequest) {
      return res.status(409).json({
        status: 'fail',
        message: 'A pending or active exchange request already exists between you and this user',
        existingRequest,
      });
    }

    // 5. Create request
    const request = await ExchangeRequest.create({
      sender: req.user._id,
      receiver,
      offeredSkill: offeredSkill.trim(),
      wantedSkill: wantedSkill.trim(),
      message: message ? message.trim() : '',
      status: 'pending',
    });

    const populatedRequest = await ExchangeRequest.findById(request._id)
      .populate('sender', '-password')
      .populate('receiver', '-password');

    // Notify receiver about new exchange request
    await createAndSendNotification({
      recipient: receiver,
      sender: req.user._id,
      type: 'exchange_request',
      title: 'New Skill Exchange Request',
      message: `${req.user.name} sent you a skill exchange request (${offeredSkill} for ${wantedSkill})`,
      relatedId: request._id,
      app: req.app,
    });

    res.status(201).json({
      status: 'success',
      message: 'Exchange request sent successfully',
      request: populatedRequest,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid receiver user ID format',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get user's incoming & outgoing exchange requests
 * @route   GET /api/requests
 * @access  Private (Protected by JWT)
 */
const getRequests = async (req, res, next) => {
  try {
    const { type, status } = req.query;

    const query = {};

    if (type === 'incoming') {
      query.receiver = req.user._id;
    } else if (type === 'outgoing') {
      query.sender = req.user._id;
    } else {
      query.$or = [{ sender: req.user._id }, { receiver: req.user._id }];
    }

    if (status) {
      query.status = status;
    }

    const requests = await ExchangeRequest.find(query)
      .populate('sender', '-password')
      .populate('receiver', '-password')
      .sort({ createdAt: -1 });

    const formattedRequests = requests.map((reqItem) => {
      const item = reqItem.toObject();
      item.isSender = reqItem.sender._id.toString() === req.user._id.toString();
      item.isReceiver = reqItem.receiver._id.toString() === req.user._id.toString();
      return item;
    });

    res.status(200).json({
      status: 'success',
      count: formattedRequests.length,
      requests: formattedRequests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get exchange request details by ID
 * @route   GET /api/requests/:id
 * @access  Private (Protected by JWT)
 */
const getRequestById = async (req, res, next) => {
  try {
    const request = await ExchangeRequest.findById(req.params.id)
      .populate('sender', '-password')
      .populate('receiver', '-password');

    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Exchange request not found',
      });
    }

    // Authorization check: Only sender or receiver can access
    const isSender = request.sender._id.toString() === req.user._id.toString();
    const isReceiver = request.receiver._id.toString() === req.user._id.toString();

    if (!isSender && !isReceiver) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view this exchange request',
      });
    }

    const item = request.toObject();
    item.isSender = isSender;
    item.isReceiver = isReceiver;

    res.status(200).json({
      status: 'success',
      request: item,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid exchange request ID format',
      });
    }
    next(error);
  }
};

/**
 * @desc    Update exchange request status (accept, reject, complete, cancel)
 * @route   PATCH /api/requests/:id/status
 * @access  Private (Protected by JWT)
 */
const updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['accepted', 'rejected', 'completed', 'cancelled'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: `Status must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const request = await ExchangeRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Exchange request not found',
      });
    }

    const isSender = request.sender.toString() === req.user._id.toString();
    const isReceiver = request.receiver.toString() === req.user._id.toString();

    if (!isSender && !isReceiver) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this exchange request',
      });
    }

    // 1. Accept or Reject transition
    if (status === 'accepted' || status === 'rejected') {
      if (!isReceiver) {
        return res.status(403).json({
          status: 'fail',
          message: 'Only the request receiver can accept or reject this request',
        });
      }
      if (request.status !== 'pending') {
        return res.status(400).json({
          status: 'fail',
          message: `Cannot ${status} a request that is currently '${request.status}'`,
        });
      }
    }

    // 2. Complete transition
    if (status === 'completed') {
      if (request.status !== 'accepted') {
        return res.status(400).json({
          status: 'fail',
          message: `Only accepted exchange requests can be marked as completed`,
        });
      }
    }

    // 3. Cancel transition
    if (status === 'cancelled') {
      if (!isSender) {
        return res.status(403).json({
          status: 'fail',
          message: 'Only the request sender can cancel this request',
        });
      }
      if (request.status !== 'pending') {
        return res.status(400).json({
          status: 'fail',
          message: `Cannot cancel a request that is currently '${request.status}'`,
        });
      }
    }

    // Apply status change
    request.status = status;
    await request.save();

    // AUTOMATIC CONNECTION CREATION UPON ACCEPTANCE
    if (status === 'accepted') {
      const existingConnection = await Connection.findOne({
        exchangeRequest: request._id,
      });

      if (!existingConnection) {
        await Connection.create({
          users: [request.sender, request.receiver],
          exchangeRequest: request._id,
          status: 'active',
          connectedAt: new Date(),
        });
      }
    }

    // UPDATE CONNECTION STATUS UPON COMPLETION
    if (status === 'completed') {
      await Connection.findOneAndUpdate(
        { exchangeRequest: request._id },
        { status: 'completed', completedAt: new Date() }
      );
    }

    // AUTOMATIC NOTIFICATIONS ON STATUS CHANGE
    if (status === 'accepted') {
      await createAndSendNotification({
        recipient: request.sender,
        sender: req.user._id,
        type: 'request_accepted',
        title: 'Skill Exchange Accepted!',
        message: `${req.user.name} accepted your skill exchange request!`,
        relatedId: request._id,
        app: req.app,
      });
    } else if (status === 'rejected') {
      await createAndSendNotification({
        recipient: request.sender,
        sender: req.user._id,
        type: 'request_rejected',
        title: 'Skill Request Declined',
        message: `${req.user.name} declined your skill exchange request.`,
        relatedId: request._id,
        app: req.app,
      });
    } else if (status === 'completed') {
      const targetPeer = isSender ? request.receiver : request.sender;
      await createAndSendNotification({
        recipient: targetPeer,
        sender: req.user._id,
        type: 'exchange_completed',
        title: 'Skill Exchange Completed!',
        message: `${req.user.name} marked your skill exchange as completed.`,
        relatedId: request._id,
        app: req.app,
      });
    }

    const updatedRequest = await ExchangeRequest.findById(request._id)
      .populate('sender', '-password')
      .populate('receiver', '-password');

    res.status(200).json({
      status: 'success',
      message: `Exchange request ${status} successfully`,
      request: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
};
