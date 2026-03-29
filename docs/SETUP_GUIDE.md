# Vi-SlideS Setup and Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** v16+ ([Download](https://nodejs.org/))
- **MongoDB** v5.0+ (Local or MongoDB Atlas cloud)
- **npm** or **yarn**
- A code editor (VS Code recommended)

## Project Structure

```
Vi-SlideS-basic/
├── Backend/                 # Express.js + Socket.IO server
├── Frontend/               # React + Vite application
├── docs/                   # Documentation files
└── package.json            # Root package.json (optional)
```

---

## Backend Setup

### 1. Installation

Navigate to the Backend directory and install dependencies:

```bash
cd Backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `Backend/` directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/Vi-SlideS
# For MongoDB Atlas: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/Vi-SlideS

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here_min_32_chars

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Groq AI API
GROQ_API_KEY=your_groq_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 3. MongoDB Setup

**Option A: Local MongoDB**

```bash
# Install MongoDB Community Server
# macOS: brew install mongodb-community
# Windows: Download from https://www.mongodb.com/try/download/community
# Ubuntu: sudo apt-get install -y mongodb

# Start MongoDB
mongod
```

**Option B: MongoDB Atlas (Cloud)**

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string and add to `.env` as `MONGODB_URI`

### 4. Get API Keys

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized URIs and redirect URIs
6. Copy Client ID and Secret to `.env`

**Groq AI API:**
1. Sign up at [Groq Console](https://console.groq.com/)
2. Generate API key
3. Add to `.env`

### 5. Database Initialization

The database will auto-initialize on first connection. Models are defined in `Backend/src/models/`:
- `userModels.ts` – User credentials and roles
- `sessionModels.ts` – Session data with questions and students

### 6. Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production build and start
npm run build
npm run start
```

Backend will be available at: `http://localhost:5000`

---

## Frontend Setup

### 1. Installation

Navigate to the Frontend directory and install dependencies:

```bash
cd Frontend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `Frontend/` directory:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=same_as_backend_google_client_id

# API Configuration
VITE_API_URL=http://localhost:5000
```

### 3. Start Frontend Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
# Output: Frontend/dist/
```

---

## Complete Startup Process

### Terminal 1: Backend
```bash
cd Backend
npm run dev
# Output: Server running on port 5000
```

### Terminal 2: Frontend
```bash
cd Frontend
npm run dev
# Output: ➜  Local:   http://localhost:5173/
```

### Verify Setup
1. Open browser: `http://localhost:5173`
2. Register or login
3. Create a session (as teacher) or join session (as student)
4. Test Socket.IO real-time communication

---

## Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`
- For Atlas: verify IP whitelist includes your machine

### Port Already in Use
```bash
# Find process using port 5000 (or 5173)
# Windows:
netstat -ano | findstr :5000

# Kill process
taskkill /f /im node.exe
```

### Socket.IO Connection Errors
- Check CORS settings in `Backend/src/socketServer.ts`
- Add your frontend URL to allowed origins
- Verify backend and frontend are on same network

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Google OAuth Fails
- Verify `GOOGLE_CLIENT_ID` is correct
- Check redirect URIs in Google Console
- Ensure frontend URL is in authorized origins

---

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed with bcrypt),
  role: "student" | "teacher",
  createdAt: Date,
  updatedAt: Date
}
```

### Session Collection
```javascript
{
  _id: ObjectId,
  code: String (unique, 6 characters),
  name: String,
  createdBy: String (teacher email),
  status: "active" | "ended",
  startTime: Date,
  endTime: Date,
  duration: String,
  students: [
    {
      name: String,
      email: String,
      joinedAt: Date,
      leftAt: Date
    }
  ],
  questions: [
    {
      id: String,
      studentName: String,
      question: String,
      answer: String,
      aiAnswer: String,
      source: "session" | "qr",
      timestamp: Date,
      aiAnsweredAt: Date
    }
  ]
}
```

---

## Development Tips

### Hot Reload
- Backend: `npm run dev` with TypeScript watch
- Frontend: Vite provides automatic hot reload

### Debugging
- Use VS Code Debugger for Node.js
- Browser DevTools for frontend (F12)
- Socket.IO DevTools for real-time events

### Code Structure
- Backend: `src/` → `controllers/` → `services/` → `models/`
- Frontend: `src/` → `components/` → `hooks/` → `services/`

---

## Deployment

### Frontend (Vercel/Netlify)
```bash
cd Frontend
npm run build
# Deploy dist/ folder
```

### Backend (Heroku/Railway/Render)
```bash
cd Backend
git push heroku main
# Or use deployment platform's CLI
```

### Environment Variables on Production
Update `.env` variables for production URLs and API keys.

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review server logs: `npm run dev` output
3. Check browser console (DevTools)
4. Verify all environment variables are set
