import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import authRoutes from './routes/authRoutes';
import sessionRoutes from './routes/sessionRoutes';
import cors from "cors";
import connectDB from "./config/db";
import { createSocketServer } from "./socketServer";
import { createServer } from 'http';
import os from 'os';
import passport from './config/passport';
import session from 'express-session';

const app = express();
const port = process.env.PORT || 5000;

app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const isAllowed =
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('http://192.168.') ||
      origin.match(/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./) || // Private Class B
      origin.startsWith('http://10.'); // Private Class A

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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

