import { decompress } from '../utils/compression.js';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import nodemailer from 'nodemailer';
import os from 'os';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_prod';

// Middleware to authenticate JWT
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Middleware for admin access
export const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Auth Routes
router.post('/auth/register', async (req, res) => {
  const { email, password, code } = req.body;
  if (!email || !password || !code) return res.status(400).json({ error: 'Missing fields' });

  // Verify code
  const verifyCode = db.prepare('SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > datetime("now")').get(email, code);
  if (!verifyCode) return res.status(400).json({ error: 'Invalid or expired code' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const defaultPoints = db.prepare('SELECT value FROM settings WHERE key = "default_user_points"').get() as {value: string};
    
    // Check if first user, make them admin
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as {count: number};
    const role = userCount.count === 0 ? 'admin' : 'user';

    db.prepare('INSERT INTO users (id, email, password_hash, role, points) VALUES (?, ?, ?, ?, ?)').run(
      userId, email, hashedPassword, role, parseFloat(defaultPoints?.value || '0')
    );

    // Generate API Key
    const apiKey = 'sk-' + uuidv4().replace(/-/g, '');
    db.prepare('INSERT INTO api_keys (id, user_id, key) VALUES (?, ?, ?)').run(uuidv4(), userId, apiKey);

    // Delete code
    db.prepare('DELETE FROM verification_codes WHERE email = ?').run(email);

    res.json({ message: 'Registration successful' });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  
  if (!user || user.is_active === 0) return res.status(401).json({ error: 'Invalid credentials or inactive account' });

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, points: user.points } });
});

router.post('/auth/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  try {
    db.prepare('INSERT OR REPLACE INTO verification_codes (email, code, expires_at) VALUES (?, ?, datetime("now", "+15 minutes"))').run(email, code);
    
    // Send email (mock if not configured)
    const smtpHost = db.prepare('SELECT value FROM settings WHERE key = "smtp_host"').get() as {value: string};
    if (smtpHost?.value) {
      const transporter = nodemailer.createTransport({
        host: smtpHost.value,
        port: parseInt((db.prepare('SELECT value FROM settings WHERE key = "smtp_port"').get() as any)?.value || '587'),
        auth: {
          user: (db.prepare('SELECT value FROM settings WHERE key = "smtp_user"').get() as any)?.value,
          pass: (db.prepare('SELECT value FROM settings WHERE key = "smtp_pass"').get() as any)?.value,
        }
      });
      await transporter.sendMail({
        from: (db.prepare('SELECT value FROM settings WHERE key = "smtp_from"').get() as any)?.value,
        to: email,
        subject: 'Your Verification Code',
        text: `Your verification code is ${code}`
      });
    } else {
      console.log(`Mock Email: Code for ${email} is ${code}`);
    }
    
    res.json({ message: 'Code sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send code' });
  }
});

router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  try {
    db.prepare('INSERT OR REPLACE INTO verification_codes (email, code, expires_at) VALUES (?, ?, datetime("now", "+15 minutes"))').run(email, code);
    
    // Send email (mock if not configured)
    const smtpHost = db.prepare('SELECT value FROM settings WHERE key = "smtp_host"').get() as {value: string};
    if (smtpHost?.value) {
      const transporter = nodemailer.createTransport({
        host: smtpHost.value,
        port: parseInt((db.prepare('SELECT value FROM settings WHERE key = "smtp_port"').get() as any)?.value || '587'),
        auth: {
          user: (db.prepare('SELECT value FROM settings WHERE key = "smtp_user"').get() as any)?.value,
          pass: (db.prepare('SELECT value FROM settings WHERE key = "smtp_pass"').get() as any)?.value,
        }
      });
      await transporter.sendMail({
        from: (db.prepare('SELECT value FROM settings WHERE key = "smtp_from"').get() as any)?.value,
        to: email,
        subject: 'Password Reset Code',
        text: `Your password reset code is ${code}`
      });
    } else {
      console.log(`Mock Email: Password reset code for ${email} is ${code}`);
    }
    
    res.json({ message: 'Code sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send code' });
  }
});

router.post('/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'Missing fields' });

  const verifyCode = db.prepare('SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > datetime("now")').get(email, code);
  if (!verifyCode) return res.status(400).json({ error: 'Invalid or expired code' });

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(hashedPassword, email);
    db.prepare('DELETE FROM verification_codes WHERE email = ?').run(email);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User info
router.get('/user/me', authenticateToken, (req: any, res) => {
  const user = db.prepare('SELECT id, email, role, points, is_active, daily_token_limit, daily_request_limit FROM users WHERE id = ?').get(req.user.id) as any;
  const apiKey = db.prepare('SELECT key FROM api_keys WHERE user_id = ?').get(req.user.id) as any;
  const models = db.prepare(`
    SELECT m.model_id, m.name 
    FROM models m 
    JOIN user_models um ON m.id = um.model_id 
    WHERE um.user_id = ? AND m.is_active = 1
  `).all(req.user.id);
  
  res.json({ ...user, apiKey: apiKey?.key, models });
});

router.post('/user/reset-key', authenticateToken, (req: any, res) => {
  const prefixSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('api_key_prefix') as any;
  const prefix = prefixSetting ? prefixSetting.value : 'sk-';
  const newKey = prefix + uuidv4().replace(/-/g, '');
  db.prepare('UPDATE api_keys SET key = ? WHERE user_id = ?').run(newKey, req.user.id);
  res.json({ key: newKey });
});

router.post('/user/password', authenticateToken, async (req: any, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id) as any;
  
  const validPassword = await bcrypt.compare(oldPassword, user.password_hash);
  if (!validPassword) return res.status(401).json({ error: '旧密码错误' });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashedPassword, req.user.id);
  res.json({ message: '密码修改成功' });
});

// Stats
router.get('/user/stats', authenticateToken, (req: any, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_requests,
      SUM(prompt_tokens) as total_prompt_tokens,
      SUM(completion_tokens) as total_completion_tokens
    FROM request_logs 
    WHERE user_id = ?
  `).get(req.user.id);
  
  const dailyStats = db.prepare(`
    SELECT 
      date(l.created_at) as date,
      m.name as model_name,
      SUM(l.prompt_tokens) as prompt_tokens,
      SUM(l.completion_tokens) as completion_tokens,
      COUNT(l.id) as requests
    FROM request_logs l
    JOIN models m ON l.model_id = m.id
    WHERE l.user_id = ? AND l.created_at >= datetime('now', '-30 days')
    GROUP BY date(l.created_at), m.name
    ORDER BY date(l.created_at) ASC
  `).all(req.user.id);

  res.json({ stats, dailyStats });
});

router.get('/user/logs', authenticateToken, (req: any, res) => {
  const logs = db.prepare(`
    SELECT l.id, m.name as model_name, l.prompt_tokens, l.completion_tokens, l.points_deducted, l.created_at, l.request_content, l.response_content
    FROM request_logs l
    JOIN models m ON l.model_id = m.id
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
    LIMIT 100
  `).all(req.user.id).map((log: any) => ({
    ...log,
    request_content: decompress(log.request_content),
    response_content: decompress(log.response_content)
  }));
  res.json(logs);
});

// Admin Routes
router.get('/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, email, role, points, is_active, created_at, daily_token_limit, daily_request_limit FROM users').all();
  res.json(users);
});

router.post('/admin/users/:id/limits', authenticateToken, requireAdmin, (req, res) => {
  const { points, daily_token_limit, daily_request_limit } = req.body;
  db.prepare('UPDATE users SET points = ?, daily_token_limit = ?, daily_request_limit = ? WHERE id = ?').run(
    points, daily_token_limit, daily_request_limit, req.params.id
  );
  res.json({ success: true });
});

router.post('/admin/users/:id/toggle', authenticateToken, requireAdmin, (req, res) => {
  const { is_active } = req.body;
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, req.params.id);
  res.json({ success: true });
});

router.get('/admin/models', authenticateToken, requireAdmin, (req, res) => {
  const models = db.prepare('SELECT * FROM models').all();
  res.json(models);
});

router.post('/admin/models', authenticateToken, requireAdmin, (req, res) => {
  const { name, model_id, upstream_url, upstream_key, billing_mode, prompt_price, completion_price, request_price, rpm_limit, alias } = req.body;
  const id = uuidv4();
  db.prepare(`
    INSERT INTO models (id, name, model_id, upstream_url, upstream_key, billing_mode, prompt_price, completion_price, request_price, rpm_limit, alias)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, model_id, upstream_url, upstream_key, billing_mode, prompt_price, completion_price, request_price, rpm_limit, alias || '');
  res.json({ id });
});

router.put('/admin/models/:id', authenticateToken, requireAdmin, (req, res) => {
  const { name, upstream_url, upstream_key, billing_mode, prompt_price, completion_price, request_price, is_active, rpm_limit, alias } = req.body;
  db.prepare(`
    UPDATE models 
    SET name=?, upstream_url=?, upstream_key=?, billing_mode=?, prompt_price=?, completion_price=?, request_price=?, is_active=?, rpm_limit=?, alias=?
    WHERE id=?
  `).run(name, upstream_url, upstream_key, billing_mode, prompt_price, completion_price, request_price, is_active ? 1 : 0, rpm_limit, alias || '', req.params.id);
  res.json({ success: true });
});

router.get('/admin/user-models/:userId', authenticateToken, requireAdmin, (req, res) => {
  const models = db.prepare('SELECT model_id FROM user_models WHERE user_id = ?').all(req.params.userId);
  res.json(models.map((m: any) => m.model_id));
});

router.post('/admin/user-models/:userId', authenticateToken, requireAdmin, (req, res) => {
  const { modelIds } = req.body;
  const userId = req.params.userId;
  
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM user_models WHERE user_id = ?').run(userId);
    const insert = db.prepare('INSERT INTO user_models (user_id, model_id) VALUES (?, ?)');
    for (const modelId of modelIds) {
      insert.run(userId, modelId);
    }
  });
  transaction();
  res.json({ success: true });
});

router.get('/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const globalStats = db.prepare(`
    SELECT 
      COUNT(*) as total_requests,
      SUM(prompt_tokens) as total_prompt_tokens,
      SUM(completion_tokens) as total_completion_tokens
    FROM request_logs
  `).get();
  
  const userStats = db.prepare(`
    SELECT 
      u.email,
      COUNT(l.id) as requests,
      SUM(l.prompt_tokens) as prompt_tokens,
      SUM(l.completion_tokens) as completion_tokens
    FROM users u
    LEFT JOIN request_logs l ON u.id = l.user_id
    GROUP BY u.id
    ORDER BY requests DESC
    LIMIT 50
  `).all();

  res.json({ globalStats, userStats });
});

router.get('/admin/logs', authenticateToken, requireAdmin, (req, res) => {
  const logs = db.prepare(`
    SELECT l.id, u.email as user_email, m.name as model_name, l.prompt_tokens, l.completion_tokens, l.points_deducted, l.created_at, l.request_content, l.response_content
    FROM request_logs l
    JOIN users u ON l.user_id = u.id
    JOIN models m ON l.model_id = m.id
    ORDER BY l.created_at DESC
    LIMIT 100
  `).all().map((log: any) => ({
    ...log,
    request_content: decompress(log.request_content),
    response_content: decompress(log.response_content)
  }));
  res.json(logs);
});

router.get('/admin/settings', authenticateToken, requireAdmin, (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all();
  const settingsObj: any = {};
  settings.forEach((s: any) => settingsObj[s.key] = s.value);
  res.json(settingsObj);
});

router.post('/admin/settings', authenticateToken, requireAdmin, (req, res) => {
  const settings = req.body;
  const transaction = db.transaction(() => {
    const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(settings)) {
      update.run(key, String(value));
    }
  });
  transaction();
  res.json({ success: true });
});

router.post('/admin/models/fetch', authenticateToken, requireAdmin, async (req, res) => {
  const { upstream_url, upstream_key } = req.body;
  try {
    const response = await fetch(`${upstream_url}/v1/models`, {
      headers: { 'Authorization': `Bearer ${upstream_key}` }
    });
    const data = await response.json();
    res.json(data.data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/system', authenticateToken, requireAdmin, (req, res) => {
  const cpus = os.cpus();
  const cpuUsage = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total);
  }, 0) / cpus.length;

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const topModels = db.prepare(`
    SELECT m.name, COUNT(l.id) as requests 
    FROM request_logs l 
    JOIN models m ON l.model_id = m.id 
    GROUP BY m.id 
    ORDER BY requests DESC 
    LIMIT 5
  `).all();

  res.json({
    cpu: (cpuUsage * 100).toFixed(2),
    memory: {
      total: (totalMem / 1024 / 1024 / 1024).toFixed(2),
      used: (usedMem / 1024 / 1024 / 1024).toFixed(2),
      percent: ((usedMem / totalMem) * 100).toFixed(2)
    },
    uptime: os.uptime(),
    topModels
  });
});

router.post('/admin/verify', authenticateToken, requireAdmin, (req: any, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: '密码错误' });
  }
});

export default router;
