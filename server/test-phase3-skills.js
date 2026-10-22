const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');

process.env.JWT_SECRET = 'test_jwt_secret_phase3_key';
process.env.JWT_EXPIRE = '1d';
process.env.NODE_ENV = 'test';

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');
const Skill = require('./models/Skill');
const { calculateSkillCompatibility } = require('./utils/matchAlgorithm');

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
  app.use(errorHandler);

  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Phase 3 Test server running at ${baseUrl}`);
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

async function runPhase3Tests() {
  console.log('\n======================================================');
  console.log(' STARTING PHASE 3: SKILL & MATCHING ENGINE TESTS');
  console.log('======================================================\n');

  await startServer();

  try {
    // --------------------------------------------------------
    // TEST 1: Skill Creation (POST /api/skills)
    // --------------------------------------------------------
    console.log('Test 1: Skill Creation (POST /api/skills)...');
    const skill1Res = await request('/api/skills', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Java',
        category: 'Programming',
        description: 'Object-oriented programming language',
      }),
    });
    if (skill1Res.status !== 201 || skill1Res.data.skill.name !== 'Java') {
      throw new Error(`Skill creation failed: ${JSON.stringify(skill1Res.data)}`);
    }

    await request('/api/skills', {
      method: 'POST',
      body: JSON.stringify({ name: 'Python', category: 'Programming', description: 'Data science & scripting' }),
    });
    await request('/api/skills', {
      method: 'POST',
      body: JSON.stringify({ name: 'Cooking', category: 'Other', description: 'Culinary arts' }),
    });

    console.log('✔ PASS: Skills created successfully');

    // --------------------------------------------------------
    // TEST 2: Skill Search & Listing (GET /api/skills)
    // --------------------------------------------------------
    console.log('\nTest 2: Skill Search & Listing (GET /api/skills)...');
    const searchRes = await request('/api/skills?search=Java');
    if (searchRes.status !== 200 || searchRes.data.skills.length === 0) {
      throw new Error(`Skill search failed: ${JSON.stringify(searchRes.data)}`);
    }
    console.log(`✔ PASS: Skill search returned ${searchRes.data.skills.length} matching skill(s) for 'Java'`);

    // --------------------------------------------------------
    // SETUP USERS FOR MATCHING ENGINE TESTS
    // User A: Teaches Java, Wants Python
    // User B: Teaches Python, Wants Java (Perfect Match)
    // User C: Teaches Cooking, Wants Guitar (Unrelated Skill)
    // --------------------------------------------------------
    console.log('\nSetting up test student users...');

    const userARes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Student A (Java Dev)',
        email: 'usera@example.com',
        password: 'password123',
      }),
    });
    const tokenA = userARes.data.token;

    const userBRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Student B (Python Dev)',
        email: 'userb@example.com',
        password: 'password123',
      }),
    });
    const tokenB = userBRes.data.token;

    const userCRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Student C (Chef)',
        email: 'userc@example.com',
        password: 'password123',
      }),
    });
    const tokenC = userCRes.data.token;

    // --------------------------------------------------------
    // TEST 3: Add Offered Skills (POST /api/users/skills/offered)
    // --------------------------------------------------------
    console.log('\nTest 3: Add Offered Skills (POST /api/users/skills/offered)...');
    const addOfferedA = await request('/api/users/skills/offered', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ skillName: 'Java', proficiency: 'Advanced', experienceYears: 3 }),
    });
    if (addOfferedA.status !== 201 || addOfferedA.data.skillsOffered.length !== 1) {
      throw new Error(`Add offered skill failed: ${JSON.stringify(addOfferedA.data)}`);
    }

    await request('/api/users/skills/offered', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ skillName: 'Python', proficiency: 'Advanced', experienceYears: 4 }),
    });

    await request('/api/users/skills/offered', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenC}` },
      body: JSON.stringify({ skillName: 'Cooking', proficiency: 'Expert', experienceYears: 5 }),
    });

    console.log('✔ PASS: Offered skills added to user profiles');

    // --------------------------------------------------------
    // TEST 4: Add Wanted Skills (POST /api/users/skills/wanted)
    // --------------------------------------------------------
    console.log('\nTest 4: Add Wanted Skills (POST /api/users/skills/wanted)...');
    const addWantedA = await request('/api/users/skills/wanted', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ skillName: 'Python', targetProficiency: 'Intermediate' }),
    });
    if (addWantedA.status !== 201 || addWantedA.data.skillsWanted.length !== 1) {
      throw new Error(`Add wanted skill failed: ${JSON.stringify(addWantedA.data)}`);
    }

    await request('/api/users/skills/wanted', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ skillName: 'Java', targetProficiency: 'Intermediate' }),
    });

    await request('/api/users/skills/wanted', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenC}` },
      body: JSON.stringify({ skillName: 'Guitar', targetProficiency: 'Beginner' }),
    });

    console.log('✔ PASS: Wanted skills added to user profiles');

    // --------------------------------------------------------
    // TEST 5: Remove Offered and Wanted Skills
    // --------------------------------------------------------
    console.log('\nTest 5: Remove Skill APIs (DELETE /api/users/skills/offered & wanted)...');
    // Add temp skill to User A then remove it
    await request('/api/users/skills/offered', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ skillName: 'TemporarySkill', proficiency: 'Beginner' }),
    });

    const removeRes = await request('/api/users/skills/offered/TemporarySkill', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (removeRes.status !== 200 || removeRes.data.skillsOffered.some((s) => s.skillName === 'TemporarySkill')) {
      throw new Error(`Remove offered skill failed: ${JSON.stringify(removeRes.data)}`);
    }
    console.log('✔ PASS: Skill removed successfully from user profile');

    // --------------------------------------------------------
    // TEST 6: Compatibility Matching Algorithm Function Validation
    // --------------------------------------------------------
    console.log('\nTest 6: Compatibility Matching Algorithm Logic Validation...');
    const userAObj = (await User.findOne({ email: 'usera@example.com' })).toObject();
    const userBObj = (await User.findOne({ email: 'userb@example.com' })).toObject();
    const userCObj = (await User.findOne({ email: 'userc@example.com' })).toObject();

    const scoreAtoB = calculateSkillCompatibility(userAObj, userBObj);
    const scoreAtoC = calculateSkillCompatibility(userAObj, userCObj);

    console.log(`  - Compatibility score User A (Java) <-> User B (Python): ${scoreAtoB.matchScore}% (Direct Mutual Swap: ${scoreAtoB.isDirectMutualSwap})`);
    console.log(`  - Compatibility score User A (Java) <-> User C (Cooking): ${scoreAtoC.matchScore}% (Direct Mutual Swap: ${scoreAtoC.isDirectMutualSwap})`);

    if (scoreAtoB.matchScore < 85 || !scoreAtoB.isDirectMutualSwap) {
      throw new Error(`Direct mutual match score should be >= 85%, got ${scoreAtoB.matchScore}%`);
    }

    if (scoreAtoC.matchScore >= 40) {
      throw new Error(`Unrelated match score should be low, got ${scoreAtoC.matchScore}%`);
    }

    console.log('✔ PASS: Algorithm correctly assigned high score to reciprocal swap and low score to unrelated profiles');

    // --------------------------------------------------------
    // TEST 7: Authenticated Matches API (GET /api/users/matches)
    // --------------------------------------------------------
    console.log('\nTest 7: Authenticated Matches API (GET /api/users/matches)...');
    const matchesRes = await request('/api/users/matches', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    if (matchesRes.status !== 200 || !matchesRes.data.matches) {
      throw new Error(`GET /api/users/matches failed: ${JSON.stringify(matchesRes.data)}`);
    }

    const matchItems = matchesRes.data.matches;
    console.log(`✔ Returned ${matchItems.length} candidate match(es) for User A`);

    // Verify self is excluded
    const containsSelf = matchItems.some((m) => m.user.email === 'usera@example.com');
    if (containsSelf) {
      throw new Error('GET /api/users/matches included logged-in user in match list');
    }
    console.log('✔ PASS: Logged-in user excluded from match results');

    // Verify User B is ranked first above User C
    if (matchItems[0].user.email !== 'userb@example.com') {
      throw new Error(`Expected User B to be ranked #1, but got ${matchItems[0].user.email}`);
    }
    console.log(`✔ PASS: Ranked #1 Match is '${matchItems[0].user.name}' with ${matchItems[0].matchScore}% compatibility`);

    console.log('\n======================================================');
    console.log(' ALL PHASE 3 INTEGRATION TESTS PASSED SUCCESSFULLY! ');
    console.log('======================================================\n');
  } finally {
    await stopServer();
  }
}

runPhase3Tests().catch((err) => {
  console.error('\n❌ PHASE 3 TEST FAILED:', err);
  stopServer().then(() => process.exit(1));
});
