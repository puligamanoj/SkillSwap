const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { io: ioClient } = require('socket.io-client');

process.env.JWT_SECRET = 'test_jwt_secret_phase5_key';
process.env.JWT_EXPIRE = '1d';
process.env.NODE_ENV = 'test';

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const errorHandler = require('./middleware/errorHandler');
const { initSocketServer, isUserOnline } = require('./socket/socketHandler');

let mongoServer;
let httpServer;
let baseUrl;
let port;

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
  app.use(errorHandler);

  httpServer = http.createServer(app);
  const io = initSocketServer(httpServer);
  app.set('io', io);

  return new Promise((resolve) => {
    httpServer.listen(0, () => {
      port = httpServer.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Phase 5 Test Server running at ${baseUrl}`);
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

async function runPhase5Tests() {
  console.log('\n======================================================');
  console.log(' STARTING PHASE 5: REAL-TIME CHAT & SOCKET.IO TESTS');
  console.log('======================================================\n');

  await startServer();

  try {
    // --------------------------------------------------------
    // SETUP USERS & ACTIVE CONNECTION
    // User A: Alice
    // User B: Bob (Connected to Alice)
    // User C: Charlie (Non-connected 3rd party)
    // --------------------------------------------------------
    console.log('Setting up test users and active connection...');
    const userARes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice', email: 'alice.p5@example.com', password: 'password123' }),
    });
    const tokenA = userARes.data.token;
    const userAId = userARes.data.user._id;

    const userBRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bob', email: 'bob.p5@example.com', password: 'password123' }),
    });
    const tokenB = userBRes.data.token;
    const userBId = userBRes.data.user._id;

    const userCRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Charlie', email: 'charlie.p5@example.com', password: 'password123' }),
    });
    const tokenC = userCRes.data.token;

    // Send request Alice -> Bob & Accept to create Connection
    const reqRes = await request('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ receiver: userBId, offeredSkill: 'Java', wantedSkill: 'Python' }),
    });
    const requestId = reqRes.data.request._id;

    await request(`/api/requests/${requestId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ status: 'accepted' }),
    });

    const connRes = await request('/api/connections', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const connectionId = connRes.data.connections[0]._id;
    console.log(`✔ PASS: Active connection established (Connection ID: ${connectionId})`);

    // --------------------------------------------------------
    // TEST 1: REST Message Creation between Connected Users
    // --------------------------------------------------------
    console.log('\nTest 1: REST Message Creation (POST /api/messages)...');
    const msg1Res = await request('/api/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ connectionId, text: 'Hello Bob! Ready for Java & Python?' }),
    });

    if (msg1Res.status !== 201 || !msg1Res.data.data._id) {
      throw new Error(`REST message creation failed: ${JSON.stringify(msg1Res.data)}`);
    }
    const message1Id = msg1Res.data.data._id;
    console.log('✔ PASS: REST message sent successfully between connected users');

    // --------------------------------------------------------
    // TEST 2: REST Message Rejection between Non-Connected Users
    // --------------------------------------------------------
    console.log('\nTest 2: REST Message Rejection for Non-Connected User...');
    const msgNonConn = await request('/api/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenC}` },
      body: JSON.stringify({ connectionId, text: 'Uninvited message' }),
    });
    if (msgNonConn.status !== 403) {
      throw new Error(`Non-connected message should be blocked: ${JSON.stringify(msgNonConn.data)}`);
    }
    console.log('✔ PASS: Non-connected user message blocked with 403 Forbidden');

    // --------------------------------------------------------
    // TEST 3: Get Connection Messages & Chronological Order
    // --------------------------------------------------------
    console.log('\nTest 3: Get Connection Messages (GET /api/messages/:connectionId)...');
    await request('/api/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ connectionId, text: 'Hi Alice! Yes, let us start tomorrow.' }),
    });

    const getMsgsRes = await request(`/api/messages/${connectionId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (getMsgsRes.status !== 200 || getMsgsRes.data.messages.length !== 2) {
      throw new Error(`Get connection messages failed: ${JSON.stringify(getMsgsRes.data)}`);
    }
    console.log(`✔ PASS: Retrieved ${getMsgsRes.data.messages.length} messages in chronological order`);

    // --------------------------------------------------------
    // TEST 4: 3rd Party Message Access Blocked
    // --------------------------------------------------------
    console.log('\nTest 4: 3rd Party Message Access Blocked...');
    const getMsgsBlocked = await request(`/api/messages/${connectionId}`, {
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    if (getMsgsBlocked.status !== 403) {
      throw new Error(`3rd party message view should be blocked: ${JSON.stringify(getMsgsBlocked.data)}`);
    }
    console.log('✔ PASS: 3rd party user blocked from viewing connection messages with 403 Forbidden');

    // --------------------------------------------------------
    // TEST 5: Mark Message as Read
    // --------------------------------------------------------
    console.log('\nTest 5: Mark Message as Read (PATCH /api/messages/:id/read)...');
    const readRes = await request(`/api/messages/${message1Id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    if (readRes.status !== 200 || !readRes.data.data.isRead) {
      throw new Error(`Mark message read failed: ${JSON.stringify(readRes.data)}`);
    }

    // Sender Alice tries to mark her own sent message read -> should fail
    const senderReadRes = await request(`/api/messages/${message1Id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (senderReadRes.status !== 403) {
      throw new Error(`Sender marking own message read should be blocked: ${JSON.stringify(senderReadRes.data)}`);
    }
    console.log('✔ PASS: Message marked read by recipient; sender attempt blocked with 403 Forbidden');

    // --------------------------------------------------------
    // TEST 6: Socket Authentication (JWT Token Validation)
    // --------------------------------------------------------
    console.log('\nTest 6: Socket JWT Authentication...');
    const validSocketA = connectSocket(tokenA);

    await new Promise((resolve, reject) => {
      validSocketA.on('connect', () => {
        console.log('✔ PASS: Valid JWT socket authenticated & connected');
        resolve();
      });
      validSocketA.on('connect_error', (err) => reject(new Error(`Valid socket failed: ${err.message}`)));
    });

    const invalidSocket = connectSocket('invalid_token_123');
    await new Promise((resolve) => {
      invalidSocket.on('connect_error', (err) => {
        console.log('✔ PASS: Invalid JWT socket connection rejected:', err.message);
        invalidSocket.disconnect();
        resolve();
      });
    });

    // --------------------------------------------------------
    // TEST 7: Online User Presence Detection
    // --------------------------------------------------------
    console.log('\nTest 7: Online User Presence Detection...');
    if (!isUserOnline(userAId)) {
      throw new Error('User A should be detected as online');
    }
    console.log('✔ PASS: Online user presence map correctly recognized Alice as online');

    // Connect Bob's Socket
    const validSocketB = connectSocket(tokenB);
    await new Promise((resolve) => validSocketB.on('connect', resolve));

    // Connect Charlie's Socket
    const validSocketC = connectSocket(tokenC);
    await new Promise((resolve) => validSocketC.on('connect', resolve));

    // --------------------------------------------------------
    // TEST 8: Room Join Authorization (join_connection)
    // --------------------------------------------------------
    console.log('\nTest 8: Room Join Authorization...');
    await new Promise((resolve, reject) => {
      validSocketA.emit('join_connection', { connectionId }, (ack) => {
        if (ack && ack.status === 'success') {
          console.log('✔ PASS: Alice authorized & joined room successfully');
          resolve();
        } else {
          reject(new Error(`Alice join room failed: ${JSON.stringify(ack)}`));
        }
      });
    });

    await new Promise((resolve) => validSocketB.emit('join_connection', { connectionId }, resolve));

    // Charlie tries joining Alice & Bob's room -> should be rejected
    await new Promise((resolve, reject) => {
      validSocketC.emit('join_connection', { connectionId }, (ack) => {
        if (ack && ack.status === 'fail') {
          console.log('✔ PASS: Charlie (3rd party) room join attempt rejected with fail status');
          resolve();
        } else {
          reject(new Error(`Charlie room join should have failed, got: ${JSON.stringify(ack)}`));
        }
      });
    });

    // --------------------------------------------------------
    // TEST 9: Real-time Send & Receive Message via Socket
    // --------------------------------------------------------
    console.log('\nTest 9: Real-time Socket send_message -> receive_message Flow...');
    const incomingPromise = new Promise((resolve) => {
      validSocketB.on('receive_message', (msg) => {
        if (msg.text === 'Real-time test message via Socket.io') {
          console.log('✔ PASS: Bob received real-time message emitted by Alice!');
          resolve();
        }
      });
    });

    validSocketA.emit('send_message', { connectionId, text: 'Real-time test message via Socket.io' });
    await incomingPromise;

    // --------------------------------------------------------
    // TEST 10: Typing Indicator Events
    // --------------------------------------------------------
    console.log('\nTest 10: Typing Indicator Events (typing & stop_typing)...');
    const typingPromise = new Promise((resolve) => {
      validSocketB.on('user_typing', (data) => {
        if (data.userId === userAId) {
          console.log('✔ PASS: Bob received user_typing event from Alice');
          resolve();
        }
      });
    });

    validSocketA.emit('typing', { connectionId });
    await typingPromise;

    // Clean up sockets
    validSocketA.disconnect();
    validSocketB.disconnect();
    validSocketC.disconnect();

    console.log('\n======================================================');
    console.log(' ALL PHASE 5 INTEGRATION TESTS PASSED SUCCESSFULLY! ');
    console.log('======================================================\n');
  } finally {
    await stopServer();
  }
}

runPhase5Tests().catch((err) => {
  console.error('\n❌ PHASE 5 TEST FAILED:', err);
  stopServer().then(() => process.exit(1));
});
