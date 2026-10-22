# SkillSwap — Peer-to-Peer Student Skill Exchange Platform

> SkillSwap is a full-stack peer-to-peer skill exchange platform that matches students based on complementary skills, enabling exchange requests, real-time communication, notifications, and post-exchange ratings.

---

## 📌 Problem Statement
Students and learners often possess valuable knowledge in specific domains (e.g., Web Development, Python, UI Design, Mathematics) while simultaneously desiring to learn new skills. However, traditional tutoring services are costly, and existing platforms lack automated compatibility matching based on direct mutual skill swaps.

## 💡 Solution
SkillSwap eliminates financial barriers by enabling students to trade skills directly with peers. Utilizing an intelligent compatibility matching engine, SkillSwap pairing algorithm calculates dynamic match scores, detects direct mutual swaps (User A teaches what User B wants AND vice versa), and provides an end-to-end workflow from discovery to completion and peer reviews.

---

## ✨ Key Features
- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing.
- **Profile & Skill Management**: Customizable student profiles with searchable offered and wanted skills.
- **Compatibility Matching Engine**: Dynamic match scoring (0–100%) and direct mutual exchange identification.
- **Exchange Requests & Workflow**: Lifecycle management for requests (`pending`, `accepted`, `rejected`, `cancelled`, `completed`).
- **Active Connections**: Automated workspace creation for paired students upon request acceptance.
- **Real-Time Messaging**: Websocket-driven instant messaging powered by Socket.io with typing indicators and unread read receipts.
- **Notification System**: Real-time push notifications over WebSockets and persistent REST storage for all platform events (`exchange_request`, `request_accepted`, `request_rejected`, `exchange_completed`, `new_message`, `new_review`).
- **Reviews & Ratings**: Post-exchange 1–5 star ratings and comments with automatic aggregate rating recalculation.
- **Dark Glassmorphism UI**: Premium visual aesthetics built with React, Vanilla CSS, Lucide icons, and responsive layouts.

---

## 🛠️ Tech Stack

### **Frontend**
- **Core**: React 18, Vite
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Real-Time Client**: Socket.io-client
- **Icons & Styling**: Lucide React, Vanilla CSS3 (CSS Variables, Flexbox, CSS Grid, Glassmorphism, Neon Dark Tokens)

### **Backend**
- **Runtime**: Node.js, Express.js
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT), bcryptjs
- **Real-Time Server**: Socket.io
- **Security**: CORS, Environment Variable Isolation

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      Vite React Client                      │
└──────────────┬───────────────────────────────▲──────────────┘
               │                               │
               │ REST HTTP API                 │ Socket.io WebSockets
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Node.js / Express Server                  │
└──────────────┬───────────────────────────────▲──────────────┘
               │                               │
               │ Mongoose ODM                  │ Real-Time Events
               ▼                               │
┌──────────────────────────────┐ ┌─────────────┴──────────────┐
│     MongoDB Atlas Database   │ │     Socket.io Event Bus    │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 🔄 Complete Application Flow

```text
Register / Login
       ↓
Setup Profile & Skills (Offered & Wanted)
       ↓
Explore Compatibility Matches
       ↓
Send Exchange Request ──► Receiver Gets Real-Time Notification
       ↓
Accept Request ──► Active Connection Created
       ↓
Real-Time Chat & Collaboration (Socket.io)
       ↓
Mark Exchange Complete
       ↓
Leave 1–5 Star Review ──► Aggregate Rating Recalculated & Notification Sent
```

---

## 📁 Project Structure

```text
SkillSwap/
├── client/                     # Vite React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Modal, Cards)
│   │   ├── context/            # AuthContext & SocketContext
│   │   ├── hooks/              # Custom React hooks (useAuth, useSocket)
│   │   ├── pages/              # Route pages (Dashboard, Explore, Chat, etc.)
│   │   ├── services/           # Axios API service layer
│   │   ├── index.css           # Global design system & theme tokens
│   │   └── App.jsx             # React router configuration
│   ├── .env.example
│   └── package.json
│
├── server/                     # Node.js Express Backend
│   ├── config/                 # MongoDB database configuration
│   ├── controllers/            # API Controllers (Auth, User, Skill, Request, etc.)
│   ├── middleware/             # Auth middleware & Global error handler
│   ├── models/                 # Mongoose Data Schemas
│   ├── routes/                 # Express API Route handlers
│   ├── services/               # Matching engine algorithm
│   ├── socket/                 # Socket.io connection & event handlers
│   ├── server.js               # Application entry point
│   └── .env.example
│
├── API.md                      # Complete API Reference Documentation
└── README.md                   # Project Documentation & Architecture
```

---

## 🚀 Installation & Setup

### **Prerequisites**
- Node.js (v16+ recommended)
- npm or yarn
- MongoDB Instance (Local or MongoDB Atlas)

### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/SkillSwap.git
cd SkillSwap
```

### **2. Setup Server Environment**
```bash
cd server
npm install
```
Create a `.env` file in `server/` using `.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/skillswap
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
```

Start the backend server:
```bash
npm start
```

### **3. Setup Client Environment**
```bash
cd ../client
npm install
```
Create a `.env` file in `client/` using `.env.example`:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```

---

## 🔑 Environment Variables Overview

| Variable | Description | Example Placeholder |
| :--- | :--- | :--- |
| `PORT` | Server HTTP listening port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `super_secret_jwt_key` |
| `JWT_EXPIRE` | JWT token expiration duration | `30d` |
| `CLIENT_URL` | Allowed CORS frontend origin | `http://localhost:5173` |
| `VITE_API_URL` | Axios REST API base URL | `http://localhost:5000/api` |

---

## 🧪 Testing

The repository includes standalone, automated integration test suites for all phases:

| Test Script | Tested Features | Command |
| :--- | :--- | :--- |
| `test-phase7b-auth.js` | User Registration, Login, Profile Fetch, Auth Middleware | `node scratch/test-phase7b-auth.js` |
| `test-phase7c-full.js` | Dashboard Stats, Skill Addition/Removal, Compatibility Algorithm | `node scratch/test-phase7c-full.js` |
| `test-phase7d-full.js` | Request Lifecycle, Connections, Request Cancellation/Rejection | `node scratch/test-phase7d-full.js` |
| `test-phase7e-chat.js` | Real-Time Socket.io Messaging, Room Authorization, Typing Indicators | `node scratch/test-phase7e-chat.js` |
| `test-phase7f-notifications.js` | Real-Time Notifications, Unread Counters, Mark Read/Delete | `node scratch/test-phase7f-notifications.js` |
| `test-phase7g-reviews.js` | Reviews Creation, Editing, Deletion, Aggregate Rating Calculation | `node scratch/test-phase7g-reviews.js` |
| `test-final-e2e.js` | Complete End-to-End User Journey (Phases 1–7G) | `node scratch/test-final-e2e.js` |

---

## 🔮 Future Improvements
- **AI-Powered Skill Recommendations**: Intelligent career pathway and skill suggestion based on market trends.
- **Calendar & Scheduling Integration**: Built-in scheduling for video call skill swap sessions.
- **Advanced Match Filtering**: Filter peers by availability, institution, or verified badges.
- **Email & Push Notifications**: Web Push & SMTP notification delivery for offline users.
