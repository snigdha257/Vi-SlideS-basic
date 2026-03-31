import express from "express";
import authRoutes from './routes/authRoutes';
import sessionRoutes from './routes/sessionRoutes';
import cors from "cors";
import connectDB from "./config/db";
import dotenv from 'dotenv';
import { createSocketServer } from "./socketServer";
import { createServer } from 'http';
import os from 'os';
import passport from './config/passport';
import session from 'express-session';

const app = express();
const port = process.env.PORT || 5000;
dotenv.config();

app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
connectDB();

app.use("/", authRoutes);

const httpServer = createServer(app);
const { io } = createSocketServer(httpServer);

// Pass io instance to sessionRoutes
app.use("/", sessionRoutes(io));

// Helper endpoint to get server's local IP
app.get("/server-ip", (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    let localIp = "localhost";
    
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (iface) {
        for (const addr of iface) {
          // Skip internal and non-IPv4 addresses
          if (addr.family === 'IPv4' && !addr.internal) {
            localIp = addr.address;
            break;
          }
        }
      }
      if (localIp !== "localhost") break;
    }
    
    res.json({ ip: localIp, port: port });
  } catch (error) {
    console.error("Error getting server IP:", error);
    res.json({ ip: "localhost", port: port });
  }
});

app.get("/", (req, res) => {
  res.send("Server working");
});

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Socket.IO server running`);
});

