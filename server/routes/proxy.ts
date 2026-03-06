import { compress } from '../utils/compression.js';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { getEncoding } from 'js-tiktoken';
import crypto from 'crypto';

const router = express.Router();

// Simple in-memory rate limiter
const rateLimits: Record<string, { count: number, resetTime: number }> = {};
// Simple in-memory cache
const requestCache: Record<string, { data: any, expiresAt: number }> = {};

function checkRateLimit(key: string, limit: number, windowMs: number = 60000): boolean {
  const now = Date.now();
  if (!rateLimits[key] || rateLimits[key].resetTime < now) {
    rateLimits[key] = { count: 1, resetTime: now + windowMs };
    return true;
  }
  if (rateLimits[key].count >= limit) {
    return false;
  }
  rateLimits[key].count++;
  return true;
}

function countTokens(text: string): number {
  try {
    const enc = getEncoding('cl100k_base');
    const tokens = enc.encode(text);
    return tokens.length;
  } catch (e) {
    return Math.ceil(text.length / 4);
  }
}

async function fetchWithRetry(url: string, options: any, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        return response;
      }
    } catch (err) {
      if (i === retries - 1) throw err;
    }
    await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Exponential backoff
  }
  throw new Error('Upstream failed after retries');
}

async function handleProxyRequest(req: any, res: any, endpointType: 'chat' | 'completion' | 'embedding') {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Missing or invalid API key', type: 'invalid_request_error' } });
  }

  const apiKey = authHeader.split(' ')[1];
  
  const keyRecord = db.prepare(`
    SELECT k.user_id, u.points, u.is_active, u.daily_token_limit, u.daily_request_limit 
    FROM api_keys k 
    JOIN users u ON k.user_id = u.id 
    WHERE k.key = ?
  `).get(apiKey) as any;

  if (!keyRecord || !keyRecord.is_active) {
    return res.status(401).json({ error: { message: 'Invalid API key or inactive account', type: 'invalid_request_error' } });
  }

  const { model, stream } = req.body;
  if (!model) {
    return res.status(400).json({ error: { message: 'Model is required', type: 'invalid_request_error' } });
  }

  // Get model info (check alias first, then model_id)
  const modelRecord = db.prepare(`
    SELECT m.* 
    FROM models m 
    JOIN user_models um ON m.id = um.model_id 
    WHERE um.user_id = ? AND (m.model_id = ? OR m.alias = ?) AND m.is_active = 1
  `).get(keyRecord.user_id, model, model) as any;

  if (!modelRecord) {
    return res.status(403).json({ error: { message: 'Model not found or no permission', type: 'invalid_request_error' } });
  }

  // Check user daily limits
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dailyStats = db.prepare(`
    SELECT COUNT(*) as req_count, SUM(prompt_tokens + completion_tokens) as token_count
    FROM request_logs
    WHERE user_id = ? AND created_at >= ?
  `).get(keyRecord.user_id, todayStart.toISOString()) as any;

  if (keyRecord.daily_request_limit > 0 && dailyStats.req_count >= keyRecord.daily_request_limit) {
    return res.status(429).json({ error: { message: 'Daily request limit exceeded', type: 'rate_limit_error' } });
  }
  if (keyRecord.daily_token_limit > 0 && dailyStats.token_count >= keyRecord.daily_token_limit) {
    return res.status(429).json({ error: { message: 'Daily token limit exceeded', type: 'rate_limit_error' } });
  }

  // Check model rate limit
  if (modelRecord.rpm_limit > 0) {
    const limitKey = `${keyRecord.user_id}:${modelRecord.id}`;
    if (!checkRateLimit(limitKey, modelRecord.rpm_limit)) {
      return res.status(429).json({ error: { message: 'Rate limit exceeded for this model', type: 'rate_limit_error' } });
    }
  }

  if (keyRecord.points <= 0) {
    return res.status(402).json({ error: { message: 'Insufficient points', type: 'insufficient_quota' } });
  }

  const isStreaming = stream === true;
  let promptTokens = 0;
  let completionTokens = 0;
  let responseContent = '';
  const requestContent = JSON.stringify(req.body);

  // Estimate prompt tokens
  let promptText = '';
  if (endpointType === 'chat' && req.body.messages) {
    promptText = req.body.messages.map((m: any) => m.content).join(' ');
  } else if (endpointType === 'completion' && req.body.prompt) {
    promptText = req.body.prompt;
  } else if (endpointType === 'embedding' && req.body.input) {
    promptText = Array.isArray(req.body.input) ? req.body.input.join(' ') : req.body.input;
  }
  promptTokens = countTokens(promptText);

  // Check cache (only for non-streaming)
  const cacheKey = crypto.createHash('md5').update(requestContent).digest('hex');
  if (!isStreaming && requestCache[cacheKey] && requestCache[cacheKey].expiresAt > Date.now()) {
    return res.json(requestCache[cacheKey].data);
  }

  try {
    // Override model name if alias was used
    const upstreamBody = { ...req.body, model: modelRecord.model_id };
    
    let upstreamEndpoint = modelRecord.upstream_url;
    if (!upstreamEndpoint.endsWith('/')) upstreamEndpoint += '/';
    if (endpointType === 'chat') upstreamEndpoint += 'chat/completions';
    else if (endpointType === 'completion') upstreamEndpoint += 'completions';
    else if (endpointType === 'embedding') upstreamEndpoint += 'embeddings';

    const upstreamResponse = await fetchWithRetry(upstreamEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${modelRecord.upstream_key}`
      },
      body: JSON.stringify(upstreamBody)
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      return res.status(upstreamResponse.status).json({ error: { message: `Upstream error: ${errorText}`, type: 'upstream_error' } });
    }

    if (isStreaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = upstreamResponse.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
          
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  responseContent += data.choices[0].delta.content;
                }
              } catch (e) {}
            }
          }
        }
      }
      res.end();
      completionTokens = countTokens(responseContent);
    } else {
      const data = await upstreamResponse.json();
      res.json(data);
      
      // Cache the response for 1 hour
      requestCache[cacheKey] = { data, expiresAt: Date.now() + 3600000 };
      
      if (data.usage) {
        promptTokens = data.usage.prompt_tokens || promptTokens;
        completionTokens = data.usage.completion_tokens || 0;
      }
      if (data.choices && data.choices[0].message) {
        responseContent = data.choices[0].message.content;
      } else if (data.choices && data.choices[0].text) {
        responseContent = data.choices[0].text;
      }
    }

    // Calculate points deducted
    let pointsDeducted = 0;
    if (modelRecord.billing_mode === 'per_request') {
      pointsDeducted = modelRecord.request_price;
    } else {
      pointsDeducted = (promptTokens * modelRecord.prompt_price) + (completionTokens * modelRecord.completion_price);
    }

    // Log request and deduct points
    db.transaction(() => {
      db.prepare('UPDATE users SET points = points - ? WHERE id = ?').run(pointsDeducted, keyRecord.user_id);
      db.prepare(`
        INSERT INTO request_logs (id, user_id, model_id, prompt_tokens, completion_tokens, points_deducted, request_content, response_content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), keyRecord.user_id, modelRecord.id, promptTokens, completionTokens, pointsDeducted, compress(requestContent), compress(responseContent));
    })();

  } catch (error: any) {
    console.error('Proxy error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: { message: 'Internal server error during proxy', type: 'internal_error' } });
    }
  }
}

router.post('/chat/completions', (req, res) => handleProxyRequest(req, res, 'chat'));
router.post('/completions', (req, res) => handleProxyRequest(req, res, 'completion'));
router.post('/embeddings', (req, res) => handleProxyRequest(req, res, 'embedding'));

export default router;
