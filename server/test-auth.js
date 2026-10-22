const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Set environment variables for test
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
process.env.JWT_EXPIRE = '1d';
process.env.NODE_ENV = 'test';

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
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
  app.use(errorHandler);

  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}`);
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

async function runTests() {
  console.log('\n==========================================');
  console.log(' STARTING PHASE 2 AUTH & USER PROFILE TESTS');
  console.log('==========================================\n');

  await startServer();

  try {
    // TEST 1: Successful Registration
    console.log('Test 1: Successful Registration (POST /api/auth/register)...');
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alice Cooper',
        email: 'alice@example.com',
        password: 'password123',
        institution: 'Tech University',
        bio: 'Java enthusiast learning Python',
        skillsOffered: [{ skillName: 'Java', proficiency: 'Advanced', experienceYears: 2 }],
        skillsWanted: [{ skillName: 'Python', targetProficiency: 'Intermediate' }],
      }),
    });

    if (regRes.status !== 201 || !regRes.data.token || !regRes.data.user) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    }
    console.log('✔ PASS: Registration successful, returned token & user object (without password)');
    const aliceToken = regRes.data.token;
    const aliceId = regRes.data.user._id;

    // TEST 2: Password Hashing Verification in MongoDB
    console.log('\nTest 2: Verify Password Hashing in MongoDB...');
    const dbUser = await User.findById(aliceId).select('+password');
    if (!dbUser || (!dbUser.password.startsWith('$2a$') && !dbUser.password.startsWith('$2b$'))) {
      throw new Error(`Password was not properly hashed with bcrypt: ${dbUser.password}`);
    }
    console.log(`✔ PASS: Password in database is hashed with bcrypt (${dbUser.password.substring(0, 15)}...)`);

    // TEST 3: Duplicate Email Registration Rejection
    console.log('\nTest 3: Duplicate Email Registration Rejection...');
    const dupRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alice Impostor',
        email: 'alice@example.com',
        password: 'anotherpassword',
      }),
    });
    if (dupRes.status !== 400 || dupRes.data.message !== 'User with this email already exists') {
      throw new Error(`Duplicate email handling failed: ${JSON.stringify(dupRes.data)}`);
    }
    console.log('✔ PASS: Duplicate email rejected with 400 Bad Request');

    // TEST 4: Wrong Password Login Rejection
    console.log('\nTest 4: Wrong Password Login Rejection...');
    const wrongPassRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'alice@example.com',
        password: 'wrongpassword',
      }),
    });
    if (wrongPassRes.status !== 401 || wrongPassRes.data.message !== 'Invalid email or password') {
      throw new Error(`Wrong password handling failed: ${JSON.stringify(wrongPassRes.data)}`);
    }
    console.log('✔ PASS: Wrong password login rejected with 401 Unauthorized');

    // TEST 5: Successful Login
    console.log('\nTest 5: Successful Login (POST /api/auth/login)...');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'alice@example.com',
        password: 'password123',
      }),
    });
    if (loginRes.status !== 200 || !loginRes.data.token || loginRes.data.user.password) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
    }
    console.log('✔ PASS: Login successful, returned token & safe user profile');

    // TEST 6: Protected /api/auth/me - Missing Token Rejection
    console.log('\nTest 6: Missing Token Protection (GET /api/auth/me)...');
    const noTokenRes = await request('/api/auth/me');
    if (noTokenRes.status !== 401) {
      throw new Error(`Missing token protection failed: ${JSON.stringify(noTokenRes.data)}`);
    }
    console.log('✔ PASS: Missing token rejected with 401 Unauthorized');

    // TEST 7: Protected /api/auth/me - Invalid Token Rejection
    console.log('\nTest 7: Invalid Token Protection (GET /api/auth/me)...');
    const invalidTokenRes = await request('/api/auth/me', {
      headers: { Authorization: 'Bearer invalid_token_xyz' },
    });
    if (invalidTokenRes.status !== 401) {
      throw new Error(`Invalid token protection failed: ${JSON.stringify(invalidTokenRes.data)}`);
    }
    console.log('✔ PASS: Invalid token rejected with 401 Unauthorized');

    // TEST 8: Authenticated /api/auth/me Request
    console.log('\nTest 8: Authenticated GET /api/auth/me...');
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    if (meRes.status !== 200 || meRes.data.user.email !== 'alice@example.com') {
      throw new Error(`GET /api/auth/me failed: ${JSON.stringify(meRes.data)}`);
    }
    console.log('✔ PASS: GET /api/auth/me returned correct authenticated user profile');

    // TEST 9: Authenticated Profile Update (PUT /api/users/profile)
    console.log('\nTest 9: Authenticated Profile Update (PUT /api/users/profile)...');
    const updateRes = await request('/api/users/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({
        bio: 'Updated bio: Java expert teaching Python & React',
        institution: 'MIT Student',
        skillsOffered: [
          { skillName: 'Java', proficiency: 'Expert', experienceYears: 4 },
          { skillName: 'React', proficiency: 'Intermediate', experienceYears: 1 },
        ],
      }),
    });
    if (updateRes.status !== 200 || updateRes.data.user.bio !== 'Updated bio: Java expert teaching Python & React') {
      throw new Error(`Profile update failed: ${JSON.stringify(updateRes.data)}`);
    }
    console.log('✔ PASS: Profile updated successfully');

    // TEST 10: Fetch Users List & Get User by ID
    console.log('\nTest 10: Fetch Users List (GET /api/users) & Get User By ID (GET /api/users/:id)...');
    const usersListRes = await request('/api/users?skill=Java');
    if (usersListRes.status !== 200 || usersListRes.data.users.length === 0) {
      throw new Error(`Get users list failed: ${JSON.stringify(usersListRes.data)}`);
    }
    console.log(`✔ PASS: GET /api/users matched ${usersListRes.data.users.length} user(s) by skill 'Java'`);

    const userByIdRes = await request(`/api/users/${aliceId}`);
    if (userByIdRes.status !== 200 || userByIdRes.data.user.name !== 'Alice Cooper') {
      throw new Error(`Get user by ID failed: ${JSON.stringify(userByIdRes.data)}`);
    }
    console.log('✔ PASS: GET /api/users/:id returned expected profile');

    console.log('\n==========================================');
    console.log(' ALL 10 INTEGRATION TESTS PASSED SUCCESSFULLY! ');
    console.log('==========================================\n');
  } finally {
    await stopServer();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  stopServer().then(() => process.exit(1));
});
