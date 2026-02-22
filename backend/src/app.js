import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from './routes/userRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import gameRoutes from "./routes/gameRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

// Initialize app
const app = express();

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

//Routes
app.use("/api/users", userRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/analytics", analyticsRoutes);


// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../public')));

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: " Backend working with Express 5!" });
});
  

export default app;
