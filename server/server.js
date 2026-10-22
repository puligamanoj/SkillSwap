const dotenv = require('dotenv');
// Load environment variables immediately
dotenv.config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const requestRoutes = require('./routes/requestRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const { initSocketServer } = require('./socket/socketHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

// Connect to MongoDB
connectDB();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const isDevelopment = process.env.NODE_ENV !== 'production';
const localClientOrigin = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin === clientUrl || (isDevelopment && localClientOrigin.test(origin))) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Socket.io Server
const io = initSocketServer(httpServer, corsOptions);
app.set('io', io);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found - ${req.originalUrl}`,
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start HTTP & Socket.io Server
httpServer.listen(PORT, () => {
  console.log(`[SkillSwap Server & Sockets] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = httpServer;
