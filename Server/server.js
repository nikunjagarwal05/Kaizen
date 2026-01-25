import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import {connectDB} from './config/database.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import statsRoutes from './routes/stats.js';

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());


// connect to database
connectDB();

//Routers
app.use('./api/auth', authRoutes);
app.use('./api/tasks', taskRoutes);
app.use('./api/stats', statsRoutes);

// Health check
app.get('./api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Kaizen API is running' });
});

// Error handelling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.send(500).json({ error: 'Internal Server Error' });
});


// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

