import express from "express";
import authRoutes from './routes/authRoutes';
import sessionRoutes from './routes/sessionRoutes';
import cors from "cors";
import connectDB from "./config/db";
import dotenv from 'dotenv';
import { createSocketServer } from "./socketServer";
import { createServer } from 'http';
import os from 'os';


const app = express();
const port = process.env.PORT || 5000;
dotenv.config();
app.use(cors());
app.use(express.json());
connectDB();
app.use("/", authRoutes);
app.use("/", sessionRoutes);
app.get("/", (req, res) => {
  res.send("Server working");
});
app.use("/api/session", sessionRoutes);

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
