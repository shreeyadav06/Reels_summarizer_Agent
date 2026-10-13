require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const reelsRouter = require('./routes/reels');

const fs = require('fs');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3005;
const HOST = '0.0.0.0';

// Basic security headers (defense against sniffing, clickjacking)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
});

// In-memory rate limiter to prevent API quota drain and DoS
const rateLimitMap = new Map();
function apiRateLimiter({ windowMs = 15 * 60 * 1000, max = 30 } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count++;
    rateLimitMap.set(ip, record);

    if (record.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please wait a few minutes before trying again.' });
    }
    next();
  };
}

// Periodically clean up expired rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

// Restrict CORS origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:3005'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(new Error('Blocked by CORS policy'));
  },
  credentials: true
}));

// Safe request body limits (prevent JSON DoS memory exhaustion)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply rate limiting to all analysis routes
app.use('/api/reels', apiRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }), reelsRouter);

// Serve dashboard frontend from client/public/dashboard
const dashboardPath = path.join(__dirname, '..', 'client', 'public', 'dashboard');
if (fs.existsSync(dashboardPath)) {
  app.use('/dashboard', express.static(dashboardPath));
}

// Health check for Render / monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Simple health check for the root URL
app.get('/', (req, res) => {
  res.send('ReelBrain API is running!');
});

// 404 handler for any other unrecognized routes
app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, HOST, () => {
  console.log(`\n🎬 Reel Summarizer Agent running at http://${HOST}:${PORT}\n`);
});
