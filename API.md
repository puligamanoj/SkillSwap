# SkillSwap REST & WebSocket API Documentation

All REST endpoints are prefixed with `/api`. Authenticated endpoints require a JWT Bearer token supplied in the HTTP `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
- **Auth Required**: No
- **Purpose**: Register a new student user.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@university.edu",
    "password": "Password123!",
    "institution": "Stanford University",
    "bio": "CS Major interested in AI"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "60d5ec49b10b2c0015f8a123",
      "name": "Jane Doe",
      "email": "jane@university.edu"
    }
  }
  ```
- **Errors**: `400 Bad Request` (Email already exists / Validation failure).

### `POST /api/auth/login`
- **Auth Required**: No
- **Purpose**: Authenticate user and issue JWT token.
- **Request Body**:
  ```json
  {
    "email": "jane@university.edu",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**: Returns JWT token and user profile object.
- **Errors**: `401 Unauthorized` (Invalid email or password).

### `GET /api/auth/me`
- **Auth Required**: Yes
- **Purpose**: Fetch currently authenticated user details.
- **Response (200 OK)**: Returns current user object.

---

## 2. User & Skill Endpoints (`/api/users` & `/api/skills`)

### `GET /api/users/:id`
- **Auth Required**: No
- **Purpose**: Fetch public profile details of any user.

### `PUT /api/users/profile`
- **Auth Required**: Yes
- **Purpose**: Update profile information (bio, institution, avatar, social links).

### `POST /api/users/skills/offered`
- **Auth Required**: Yes
- **Purpose**: Add a skill that the user can teach.
- **Request Body**: `{ "skillName": "React", "category": "Web Dev", "proficiency": "Expert", "experienceYears": 2 }`

### `DELETE /api/users/skills/offered/:skillId`
- **Auth Required**: Yes
- **Purpose**: Remove an offered skill from user profile.

### `POST /api/users/skills/wanted`
- **Auth Required**: Yes
- **Purpose**: Add a skill that the user wants to learn.
- **Request Body**: `{ "skillName": "Python", "category": "Programming Languages", "targetProficiency": "Intermediate" }`

### `DELETE /api/users/skills/wanted/:skillId`
- **Auth Required**: Yes
- **Purpose**: Remove a wanted skill from user profile.

### `GET /api/users/matches`
- **Auth Required**: Yes
- **Purpose**: Run compatibility matching algorithm against all registered peers.
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "count": 5,
    "matches": [
      {
        "user": { "_id": "...", "name": "Bob", "avatar": "..." },
        "matchScore": 95,
        "isDirectMutualSwap": true,
        "mutualSkills": {
          "teachingToThem": ["React"],
          "learningFromThem": ["Python"]
        }
      }
    ]
  }
  ```

---

## 3. Exchange Requests (`/api/requests`)

### `POST /api/requests`
- **Auth Required**: Yes
- **Purpose**: Send a skill exchange request to a peer.
- **Request Body**:
  ```json
  {
    "receiver": "60d5ec49b10b2c0015f8a456",
    "offeredSkill": "React",
    "wantedSkill": "Python",
    "message": "Hey! Would love to trade React knowledge for Python tutoring."
  }
  ```
- **Errors**: `400 Bad Request` (Self request / Invalid skills), `409 Conflict` (Duplicate pending request exists).

### `GET /api/requests`
- **Auth Required**: Yes
- **Query Params**: `?type=incoming` or `?type=outgoing` or `?status=pending`
- **Purpose**: Fetch all requests involving the current user.

### `PATCH /api/requests/:id/status`
- **Auth Required**: Yes
- **Purpose**: Accept, reject, or cancel an exchange request.
- **Request Body**: `{ "status": "accepted" }` (Supported values: `accepted`, `rejected`, `cancelled`).
- **Behavior**: Accepting a request automatically creates an **Active Connection**.

---

## 4. Connections (`/api/connections`)

### `GET /api/connections`
- **Auth Required**: Yes
- **Purpose**: List all active and completed connections for the authenticated user.

### `GET /api/connections/:id`
- **Auth Required**: Yes
- **Purpose**: Get details of a single connection (Must be a participant).

### `PATCH /api/connections/:id/status`
- **Auth Required**: Yes
- **Purpose**: Update connection status. (e.g. `{ "status": "completed" }`).

---

## 5. Messaging (`/api/messages`)

### `POST /api/messages`
- **Auth Required**: Yes
- **Purpose**: Send a message in an active connection.
- **Request Body**: `{ "connectionId": "...", "text": "Hello!" }`
- **Behavior**: Saves message in DB and emits real-time `receive_message` event over Socket.io.

### `GET /api/messages/:connectionId`
- **Auth Required**: Yes
- **Purpose**: Retrieve chat history for a connection.

---

## 6. Reviews & Ratings (`/api/reviews`)

### `POST /api/reviews`
- **Auth Required**: Yes
- **Purpose**: Submit a 1–5 star rating and comment for a completed exchange.
- **Request Body**:
  ```json
  {
    "connectionId": "60d5ec49b10b2c0015f8a789",
    "reviewedUser": "60d5ec49b10b2c0015f8a456",
    "rating": 5,
    "comment": "Outstanding teaching skills!"
  }
  ```
- **Errors**: `400 Bad Request` (Connection not completed / Self review), `409 Conflict` (Duplicate review for connection).

### `GET /api/reviews/user/:userId`
- **Auth Required**: No
- **Purpose**: Fetch all reviews received by a target user.

### `PATCH /api/reviews/:id`
- **Auth Required**: Yes (Reviewer only)
- **Purpose**: Edit review rating or comment.

### `DELETE /api/reviews/:id`
- **Auth Required**: Yes (Reviewer only)
- **Purpose**: Delete review and automatically recalculate target user's aggregate rating.

---

## 7. Notifications (`/api/notifications`)

### `GET /api/notifications`
- **Auth Required**: Yes
- **Purpose**: Fetch notifications in reverse chronological order.

### `PATCH /api/notifications/:id/read`
- **Auth Required**: Yes
- **Purpose**: Mark a specific notification as read.

### `PATCH /api/notifications/read-all`
- **Auth Required**: Yes
- **Purpose**: Mark all user notifications as read.

### `DELETE /api/notifications/:id`
- **Auth Required**: Yes
- **Purpose**: Delete a notification.

---

## 8. Real-Time Socket.io Events

### **Client -> Server Events**
- `join_connection(connectionId)`: Join real-time room for a connection.
- `typing({ connectionId, userName })`: Broadcast typing indicator.
- `stop_typing({ connectionId })`: Stop typing indicator.
- `mark_message_read({ messageId, connectionId })`: Send read receipt.

### **Server -> Client Events**
- `receive_message(messageData)`: Emitted when new message is sent.
- `user_typing({ userName })`: Emitted when peer is typing.
- `user_stop_typing()`: Emitted when peer stops typing.
- `notification_received(notificationData)`: Emitted for real-time alerts.
