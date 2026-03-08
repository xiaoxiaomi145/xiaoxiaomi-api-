import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './server/routes/api.js';
import proxyRouter from './server/routes/proxy.js';
import cron from 'node-cron';
import db from './server/db.js';
import helmet from 'helmet';
import hpp from 'hpp';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled to allow Vite HMR and inline scripts during dev
    crossOriginEmbedderPolicy: false,
  }));
  app.use(hpp()); // Prevent HTTP Parameter Pollution
  app.use(cors()); // Enable CORS

  // Global Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again later.' }
  });
  
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 login/register requests per windowMs
    message: { error: 'Too many authentication attempts, please try again later.' }
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth', authLimiter);
  app.use('/v1', apiLimiter);

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api', apiRouter);
  
  // Proxy Routes (OpenAI compatible)
  app.use('/v1', proxyRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Check daily reset on startup
  try {
    const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
    const setSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    
    const lastResetStr = getSetting.get('last_daily_reset') as { value: string } | undefined;
    const today = new Date().toISOString().split('T')[0];
    
    if (lastResetStr?.value !== today) {
      const dailyResetPointsStr = getSetting.get('daily_reset_points') as { value: string } | undefined;
      const dailyResetPoints = parseFloat(dailyResetPointsStr?.value || '0');
      
      if (dailyResetPoints > 0) {
        console.log(`Performing daily points reset to ${dailyResetPoints}...`);
        db.prepare(`UPDATE users SET points = ? WHERE points < ?`).run(dailyResetPoints, dailyResetPoints);
      }
      
      setSetting.run('last_daily_reset', today);
    }
  } catch (e) {
    console.error('Error during startup daily reset check:', e);
  }

  // Cron job for cleaning logs and daily reset
  cron.schedule('0 0 * * *', () => {
    console.log('Running daily tasks...');
    try {
      const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
      const setSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      
      // Daily Reset Points
      const today = new Date().toISOString().split('T')[0];
      const dailyResetPointsStr = getSetting.get('daily_reset_points') as { value: string } | undefined;
      const dailyResetPoints = parseFloat(dailyResetPointsStr?.value || '0');
      
      if (dailyResetPoints > 0) {
        console.log(`Performing daily points reset to ${dailyResetPoints}...`);
        db.prepare(`UPDATE users SET points = ? WHERE points < ?`).run(dailyResetPoints, dailyResetPoints);
      }
      setSetting.run('last_daily_reset', today);

      // Log Cleanup
      const retentionDaysStr = getSetting.get('log_retention_days') as { value: string } | undefined;
      const retentionDays = parseInt(retentionDaysStr?.value || '30');
      
      // Delete old logs
      const deleteOldLogs = db.prepare(`
        DELETE FROM request_logs 
        WHERE created_at < datetime('now', '-' || ? || ' days')
      `);
      deleteOldLogs.run(retentionDays);
      
      // Compress logs older than 7 days
      const compressLogs = db.prepare(`
        UPDATE request_logs 
        SET request_content = NULL, response_content = NULL, is_compressed = 1
        WHERE created_at < datetime('now', '-7 days') AND is_compressed = 0
      `);
      compressLogs.run();
      
      // Reclaim disk space
      db.exec('VACUUM');
      
      console.log('Daily tasks completed.');
    } catch (e) {
      console.error('Error in daily tasks:', e);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
