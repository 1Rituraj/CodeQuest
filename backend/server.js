import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './src/app.js';
import http from 'http';
import { setupSocket } from './src/socketServer.js'; 

dotenv.config();

console.log("GEMINI API KEY:", process.env.GEMINI_API_KEY);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/codequest";

// Creating HTTP server
const server = http.createServer(app);

// Setuping socket with external file
setupSocket(server);

// Connect DB then start server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
  });
