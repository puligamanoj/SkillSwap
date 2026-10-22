const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { io: ioClient } = require('socket.io-client');

process.env.JWT_SECRET = 'test_jwt_secret_phase6_key';
process.env.JWT_EXPIRE = '1d';
process.env.NODE_ENV = 'test';

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler = require('./middleware/errorHandler');
const { initSocketServer } = require('./socket/socketHandler');

let mongoServer;
let httpServer;
let baseUrl;

async function startServer() {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/connections', connectionRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use(errorHandler);

  httpServer = http.createServer(app);
  const io = initSocketServer(httpServer);
  app.set('io', io);

  return new Promise((resolve) => {
    httpServer.listen(0, () => {
      const port = httpServer.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Phase 6 Test Server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopServer() {
  if (httpServer) await httpServer.close();
  if (mongoose.connection) await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
}

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });
  const data = await res.json();
  return { status: res.status, data };
}

function connectSocket(token) {
  return ioClient(baseUrl, {
    auth: { token },
    transports: ['websocket'],
  });
}

async function runPhase6Tests() {
  console.log('\n======================================================');
  console.log(' STARTING PHASE 6: REVIEWS, RATINGS & NOTIFICATIONS TESTS');
  console.log('======================================================\n');

  await startServer();

  try {
    // SETUP TEST USERS
    // User 1 (Alice)
    // User 2 (Bob)
    // User 3 (Charlie - 3rd party)
    console.log('Setting up test users...');
    const u1Res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice P6', email: 'alice.p6@example.com', password: 'password123' }),
    });
    const token1 = u1Res.data.token;
    const u1Id = u1Res.data.user._id;

    const u2Res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bob P6', email: 'bob.p6@example.com', password: 'password123' }),
    });
    const token2 = u2Res.data.token;
    const u2Id = u2Res.data.user._id;

    const u3Res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Charlie P6', email: 'charlie.p6@example.com', password: 'password123' }),
    });
    const token3 = u3Res.data.token;
    const u3Id = u3Res.data.user._id;

    // --------------------------------------------------------
    // TEST AUTOMATIC NOTIFICATION TRIGGERS (Exchange Request Flow)
    // --------------------------------------------------------
    console.log('\nTest 1: Automatic Notification Trigger on Exchange Request Creation...');
    const req1Res = await request('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ receiver: u2Id, offeredSkill: 'Java', wantedSkill: 'Python' }),
    });
    const req1Id = req1Res.data.request._id;

    // Verify Bob received notification for new exchange request
    const bobNotifs1 = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${token2}` },
    });
    if (bobNotifs1.status !== 200 || bobNotifs1.data.notifications.length !== 1 || bobNotifs1.data.notifications[0].type !== 'exchange_request') {
      throw new Error(`Exchange request notification failed: ${JSON.stringify(bobNotifs1.data)}`);
    }
    console.log('✔ PASS: Receiver (Bob) received notification for incoming exchange request');

    // Test Accept Notification
    console.log('\nTest 2: Automatic Notification Trigger on Request Acceptance...');
    await request(`/api/requests/${req1Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token2}` },
      body: JSON.stringify({ status: 'accepted' }),
    });

    const connRes = await request('/api/connections', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const connId = connRes.data.connections[0]._id;

    const aliceNotifs1 = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (aliceNotifs1.data.notifications[0].type !== 'request_accepted') {
      throw new Error(`Accept notification failed: ${JSON.stringify(aliceNotifs1.data)}`);
    }
    console.log('✔ PASS: Sender (Alice) received notification for accepted request');

    // --------------------------------------------------------
    // REVIEWS VALIDATION TESTS (BEFORE COMPLETION & INVALID INPUTS)
    // --------------------------------------------------------
    console.log('\nTest 3: Review Validation Rules (Incomplete connection, self review, invalid rating)...');
    
    // Incomplete connection review rejection
    const incompReview = await request('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ connectionId: connId, reviewedUser: u2Id, rating: 5, comment: 'Great!' }),
    });
    if (incompReview.status !== 400 || incompReview.data.message !== 'Reviews can only be submitted for completed skill exchanges') {
      throw new Error(`Incomplete review rejection failed: ${JSON.stringify(incompReview.data)}`);
    }
    console.log('✔ PASS: Review on incomplete connection rejected with 400 Bad Request');

    // Complete the connection
    await request(`/api/requests/${req1Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ status: 'completed' }),
    });
    console.log('✔ Exchange marked completed');

    // Self-review rejection
    const selfReview = await request('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ connectionId: connId, reviewedUser: u1Id, rating: 5 }),
    });
    if (selfReview.status !== 400 || selfReview.data.message !== 'You cannot review yourself') {
      throw new Error(`Self review rejection failed: ${JSON.stringify(selfReview.data)}`);
    }
    console.log('✔ PASS: Self-review rejected with 400 Bad Request');

    // Invalid rating rejection
    const invalidRating = await request('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ connectionId: connId, reviewedUser: u2Id, rating: 6 }),
    });
    if (invalidRating.status !== 400) {
      throw new Error(`Invalid rating rejection failed: ${JSON.stringify(invalidRating.data)}`);
    }
    console.log('✔ PASS: Invalid rating value (6) rejected with 400 Bad Request');

    // Non-participant review rejection
    const nonPartReview = await request('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token3}` },
      body: JSON.stringify({ connectionId: connId, reviewedUser: u2Id, rating: 5 }),
    });
    if (nonPartReview.status !== 403) {
      throw new Error(`Non-participant review should be blocked: ${JSON.stringify(nonPartReview.data)}`);
    }
    console.log('✔ PASS: 3rd party review blocked with 403 Forbidden');

    // --------------------------------------------------------
    // TEST 4: Create Valid Review & User Rating Average Recalculation
    // --------------------------------------------------------
    console.log('\nTest 4: Create Valid Review & Verify User Rating Average Recalculation...');
    const validReviewRes = await request('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        connectionId: connId,
        reviewedUser: u2Id,
        rating: 5,
        comment: 'Alice: Bob was an awesome Python teacher!',
      }),
    });
    if (validReviewRes.status !== 201 || validReviewRes.data.review.rating !== 5) {
      throw new Error(`Valid review creation failed: ${JSON.stringify(validReviewRes.data)}`);
    }
    const reviewId = validReviewRes.data.review._id;

    // Verify Bob's profile average rating updated to 5.0 (count: 1)
    const bobProfile = await request(`/api/users/${u2Id}`);
    if (bobProfile.data.user.rating.average !== 5 || bobProfile.data.user.rating.count !== 1) {
      throw new Error(`Bob rating average update failed: ${JSON.stringify(bobProfile.data)}`);
    }
    console.log(`✔ PASS: Review created and Bob rating average updated to ${bobProfile.data.user.rating.average}★ (${bobProfile.data.user.rating.count} review)`);

    // Verify Duplicate Review Rejection
    const dupReview = await request('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ connectionId: connId, reviewedUser: u2Id, rating: 4 }),
    });
    if (dupReview.status !== 409) {
      throw new Error(`Duplicate review should be blocked: ${JSON.stringify(dupReview.data)}`);
    }
    console.log('✔ PASS: Duplicate review rejected with 409 Conflict');

    // --------------------------------------------------------
    // TEST 5: Get Reviews (User Reviews & Connection Reviews)
    // --------------------------------------------------------
    console.log('\nTest 5: Get User Reviews & Connection Reviews...');
    const userReviews = await request(`/api/reviews/user/${u2Id}`);
    if (userReviews.status !== 200 || userReviews.data.reviews.length !== 1) {
      throw new Error(`Get user reviews failed: ${JSON.stringify(userReviews.data)}`);
    }

    const connReviews = await request(`/api/reviews/connection/${connId}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (connReviews.status !== 200 || connReviews.data.reviews.length !== 1) {
      throw new Error(`Get connection reviews failed: ${JSON.stringify(connReviews.data)}`);
    }
    console.log('✔ PASS: User reviews and connection reviews retrieved successfully');

    // --------------------------------------------------------
    // TEST 6: Edit & Delete Review with Rating Stats Recalculation
    // --------------------------------------------------------
    console.log('\nTest 6: Edit & Delete Review with Rating Stats Recalculation...');
    // 3rd party edit attempt -> 403 Forbidden
    const unauthEdit = await request(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token3}` },
      body: JSON.stringify({ rating: 2 }),
    });
    if (unauthEdit.status !== 403) {
      throw new Error(`Unauthorized review edit should be blocked: ${JSON.stringify(unauthEdit.data)}`);
    }

    // Reviewer edit -> rating 4
    const editRes = await request(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ rating: 4, comment: 'Updated: Bob was good!' }),
    });
    if (editRes.status !== 200 || editRes.data.review.rating !== 4) {
      throw new Error(`Edit review failed: ${JSON.stringify(editRes.data)}`);
    }

    const bobProfile2 = await request(`/api/users/${u2Id}`);
    if (bobProfile2.data.user.rating.average !== 4) {
      throw new Error(`Bob rating should be updated to 4.0, got ${bobProfile2.data.user.rating.average}`);
    }
    console.log('✔ PASS: Review edited and Bob rating recalculated to 4.0★');

    // Delete review
    const delRes = await request(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (delRes.status !== 200) {
      throw new Error(`Delete review failed: ${JSON.stringify(delRes.data)}`);
    }

    const bobProfile3 = await request(`/api/users/${u2Id}`);
    if (bobProfile3.data.user.rating.average !== 0 || bobProfile3.data.user.rating.count !== 0) {
      throw new Error(`Bob rating should reset to 0 after review deletion`);
    }
    console.log('✔ PASS: Review deleted and Bob rating reset to 0.0★ (0 reviews)');

    // --------------------------------------------------------
    // TEST 7: Notifications Management APIs (Read, Read-All, Delete)
    // --------------------------------------------------------
    console.log('\nTest 7: Notifications Management APIs (Read, Read-All, Delete)...');
    const bobNotifs = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const notifId = bobNotifs.data.notifications[0]._id;

    // 3rd party modify attempt -> 403 Forbidden
    const unauthNotifMod = await request(`/api/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token3}` },
    });
    if (unauthNotifMod.status !== 403) {
      throw new Error(`Unauthorized notification modification should be blocked: ${JSON.stringify(unauthNotifMod.data)}`);
    }

    // Mark single notification read
    const read1Res = await request(`/api/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token2}` },
    });
    if (read1Res.status !== 200 || !read1Res.data.notification.isRead) {
      throw new Error(`Mark notification read failed: ${JSON.stringify(read1Res.data)}`);
    }

    // Mark all read
    await request('/api/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token2}` },
    });
    console.log('✔ PASS: Mark single & mark-all notifications read verified');

    // --------------------------------------------------------
    // TEST 8: Real-Time Socket Notification Event (`notification_received`)
    // --------------------------------------------------------
    console.log('\nTest 8: Real-Time Socket Notification Event (`notification_received`)...');
    const socketCharlie = connectSocket(token3);
    await new Promise((resolve) => socketCharlie.on('connect', resolve));

    const notifPromise = new Promise((resolve) => {
      socketCharlie.on('notification_received', (notif) => {
        if (notif.type === 'exchange_request') {
          console.log('✔ PASS: Charlie received real-time `notification_received` socket event!');
          resolve();
        }
      });
    });

    // Alice sends exchange request to online Charlie
    await request('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ receiver: u3Id, offeredSkill: 'React', wantedSkill: 'Design' }),
    });

    await notifPromise;
    socketCharlie.disconnect();

    console.log('\n======================================================');
    console.log(' ALL PHASE 6 INTEGRATION TESTS PASSED SUCCESSFULLY! ');
    console.log('======================================================\n');
  } finally {
    await stopServer();
  }
}

runPhase6Tests().catch((err) => {
  console.error('\n❌ PHASE 6 TEST FAILED:', err);
  stopServer().then(() => process.exit(1));
});
