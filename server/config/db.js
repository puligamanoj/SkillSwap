const mongoose = require('mongoose');
const dns = require('dns');

// Fallback to Google/Cloudflare DNS if local Windows DNS server refuses SRV queries
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS servers set
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillswap',
      {
        serverSelectionTimeoutMS: 3000, // Timeout after 3s instead of 30s
      }
    );
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Warning] Could not connect to MongoDB (${error.message}). Server will continue running.`);
  }
};

module.exports = connectDB;
