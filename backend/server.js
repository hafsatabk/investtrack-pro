import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/init.js';
import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import analyticsRoutes from './routes/analytics.js';
import settingsRoutes from './routes/settings.js';
import activityRoutes from './routes/activity.js';
import { verifyToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Initialize database
await initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', verifyToken, memberRoutes);
app.use('/api/analytics', verifyToken, analyticsRoutes);
app.use('/api/settings', verifyToken, settingsRoutes);
app.use('/api/activity', verifyToken, activityRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});