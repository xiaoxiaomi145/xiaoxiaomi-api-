import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './server/routes/api.js';
import proxyRouter from './server/routes/proxy.js';
import cron from 'node-cron';
import db from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // Cron job for cleaning logs
  cron.schedule('0 0 * * *', () => {
    console.log('Running daily log cleanup...');
    try {
      const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
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
      
      console.log('Log cleanup completed.');
    } catch (e) {
      console.error('Error in log cleanup:', e);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
