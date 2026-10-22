const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');

process.env.JWT_SECRET = 'test_jwt_secret_phase4_key';
process.env.JWT_EXPIRE = '1d';
process.env.NODE_ENV = 'test';

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const requestRoutes = require('./routes/requestRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');

let mongoServer;
let server;
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
  app.use('/api/skills', skillRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/connections', connectionRoutes);
  app.use(errorHandler);

  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Phase 4 Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopServer() {
  if (server) await server.close();
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

async function runPhase4Tests() {
  console.log('\n======================================================');
  console.log(' STARTING PHASE 4: REQUESTS & CONNECTIONS TESTS');
  console.log('======================================================\n');

  await startServer();

  try {
    // SETUP TEST USERS
    // User 1 (Sender): Alice
    // User 2 (Receiver): Bob
    // User 3 (Unauthorized 3rd party): Charlie
    const user1Res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice', email: 'alice.p4@example.com', password: 'password123' }),
    });
    const token1 = user1Res.data.token;
    const user1Id = user1Res.data.user._id;

    const user2Res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bob', email: 'bob.p4@example.com', password: 'password123' }),
    });
    const token2 = user2Res.data.token;
    const user2Id = user2Res.data.user._id;

    const user3Res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Charlie', email: 'charlie.p4@example.com', password: 'password123' }),
    });
    const token3 = user3Res.data.token;
    const user3Id = user3Res.data.user._id;

    // TEST 1: Send Exchange Request (POST /api/requests)
    console.log('Test 1: Send Exchange Request (POST /api/requests)...');
    const sendRes = await request('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        receiver: user2Id,
        offeredSkill: 'Java',
        wantedSkill: 'Python',
        message: 'Hi Bob, let us swap Java for Python!',
      }),
    });

    if (sendRes.status !== 201 || !sendRes.data.request) {
      throw new Error(`Send request failed: ${JSON.stringify(sendRes.data)}`);
    }
    console.log('✔ PASS: Exchange request created successfully (Status: pending)');
    const reqId = sendRes.data.request._id;

    // TEST 2: Cannot Request Yourself
    console.log('\nTest 2: Cannot Request Yourself...');
    const selfRes = await request('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ receiver: user1Id, offeredSkill: 'Java', wantedSkill: 'Java' }),
    });
    if (selfRes.status !== 400 || selfRes.data.message !== 'You cannot send a skill exchange request to yourself') {
      throw new Error(`Self-request validation failed: ${JSON.stringify(selfRes.data)}`);
    }
    console.log('✔ PASS: Self-request rejected with 400 Bad Request');

    // TEST 3: Duplicate Pending Request Rejection
    console.log('\nTest 3: Duplicate Pending Request Rejection...');
    const dupRes = await request('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ receiver: user2Id, offeredSkill: 'Java', wantedSkill: 'Python' }),
    });
    if (dupRes.status !== 409) {
      throw new Error(`Duplicate request validation failed: ${JSON.stringify(dupRes.data)}`);
    }
    console.log('✔ PASS: Duplicate request rejected with 409 Conflict');

    // TEST 4: Get User Requests List (GET /api/requests)
    console.log('\nTest 4: Get User Requests (GET /api/requests)...');
    const getSent = await request('/api/requests?type=outgoing', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (getSent.status !== 200 || getSent.data.requests.length !== 1 || !getSent.data.requests[0].isSender) {
      throw new Error(`Get outgoing requests failed: ${JSON.stringify(getSent.data)}`);
    }

    const getRecv = await request('/api/requests?type=incoming', {
      headers: { Authorization: `Bearer ${token2}` },
    });
    if (getRecv.status !== 200 || getRecv.data.requests.length !== 1 || !getRecv.data.requests[0].isReceiver) {
      throw new Error(`Get incoming requests failed: ${JSON.stringify(getRecv.data)}`);
    }
    console.log('✔ PASS: Incoming and outgoing request filtering works correctly');

    // TEST 5: Get Individual Request by ID & Unauthorized Access Blocking
    console.log('\nTest 5: Get Individual Request & Unauthorized Blocking...');
    const authorizedGet = await request(`/api/requests/${reqId}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (authorizedGet.status !== 200 || authorizedGet.data.request._id !== reqId) {
      throw new Error(`Get request by ID failed: ${JSON.stringify(authorizedGet.data)}`);
    }

    const unauthorizedGet = await request(`/api/requests/${reqId}`, {
      headers: { Authorization: `Bearer ${token3}` },
    });
    if (unauthorizedGet.status !== 403) {
      throw new Error(`Unauthorized request access was not blocked: ${JSON.stringify(unauthorizedGet.data)}`);
    }
    console.log('✔ PASS: Authorized user can access request; 3rd party blocked with 403 Forbidden');

    // TEST 6: Unauthorized Accept/Reject Rejection
    console.log('\nTest 6: Sender/3rd Party cannot accept request...');
    const senderAccept = await request(`/api/requests/${reqId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ status: 'accepted' }),
    });
    if (senderAccept.status !== 403) {
      throw new Error(`Sender accept should be blocked: ${JSON.stringify(senderAccept.data)}`);
    }
    console.log('✔ PASS: Sender accept attempt blocked with 403 Forbidden');

    // TEST 7: Receiver Accepts Request & Connection Auto-Created
    console.log('\nTest 7: Receiver Accepts Request & Auto-Creates Connection...');
    const acceptRes = await request(`/api/requests/${reqId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token2}` },
      body: JSON.stringify({ status: 'accepted' }),
    });
    if (acceptRes.status !== 200 || acceptRes.data.request.status !== 'accepted') {
      throw new Error(`Accept request failed: ${JSON.stringify(acceptRes.data)}`);
    }
    console.log('✔ PASS: Request status updated to accepted');

    // Verify Connection created automatically
    const connRes = await request('/api/connections', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (connRes.status !== 200 || connRes.data.connections.length !== 1) {
      throw new Error(`Connection auto-creation failed: ${JSON.stringify(connRes.data)}`);
    }
    const connectionId = connRes.data.connections[0]._id;
    console.log(`✔ PASS: Active connection auto-created (Connection ID: ${connectionId})`);

    // TEST 8: Verify Duplicate Connection Prevention
    console.log('\nTest 8: Duplicate Connection Prevention...');
    const reAcceptRes = await request(`/api/requests/${reqId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token2}` },
      body: JSON.stringify({ status: 'accepted' }),
    });
    const reConnRes = await request('/api/connections', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (reConnRes.data.connections.length !== 1) {
      throw new Error('Duplicate connection was created on re-accept');
    }
    console.log('✔ PASS: Duplicate connection prevented');

    // TEST 9: Unauthorized Connection Access Blocking
    console.log('\nTest 9: Unauthorized Connection Access Blocking...');
    const unauthConnGet = await request(`/api/connections/${connectionId}`, {
      headers: { Authorization: `Bearer ${token3}` },
    });
    if (unauthConnGet.status !== 403) {
      throw new Error(`Unauthorized connection access not blocked: ${JSON.stringify(unauthConnGet.data)}`);
    }
    console.log('✔ PASS: 3rd party blocked from accessing private connection with 403 Forbidden');

    // TEST 10: Complete Exchange Lifecycle
    console.log('\nTest 10: Complete Exchange Lifecycle...');
    const completeRes = await request(`/api/requests/${reqId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ status: 'completed' }),
    });
    if (completeRes.status !== 200 || completeRes.data.request.status !== 'completed') {
      throw new Error(`Complete request failed: ${JSON.stringify(completeRes.data)}`);
    }

    const checkConnCompleted = await request(`/api/connections/${connectionId}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (checkConnCompleted.data.connection.status !== 'completed' || !checkConnCompleted.data.connection.completedAt) {
      throw new Error(`Connection status should be completed: ${JSON.stringify(checkConnCompleted.data)}`);
    }
    console.log('✔ PASS: Exchange request & connection updated to completed state');

    // TEST 11: Rejection Flow Verification
    console.log('\nTest 11: Rejection Flow Verification...');
    const req2Res = await request('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ receiver: user3Id, offeredSkill: 'Java', wantedSkill: 'Singing' }),
    });
    const req2Id = req2Res.data.request._id;

    const rejectRes = await request(`/api/requests/${req2Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token3}` },
      body: JSON.stringify({ status: 'rejected' }),
    });
    if (rejectRes.status !== 200 || rejectRes.data.request.status !== 'rejected') {
      throw new Error(`Reject request failed: ${JSON.stringify(rejectRes.data)}`);
    }
    console.log('✔ PASS: Rejection workflow verified successfully');

    console.log('\n======================================================');
    console.log(' ALL PHASE 4 INTEGRATION TESTS PASSED SUCCESSFULLY! ');
    console.log('======================================================\n');
  } finally {
    await stopServer();
  }
}

runPhase4Tests().catch((err) => {
  console.error('\n❌ PHASE 4 TEST FAILED:', err);
  stopServer().then(() => process.exit(1));
});
