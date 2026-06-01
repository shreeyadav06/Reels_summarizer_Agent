require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const reelsRouter = require('./routes/reels');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API routes
app.use('/api/reels', reelsRouter);

// Serve the old vanilla JS frontend at /dashboard
app.use('/dashboard', express.static(path.join(__dirname, '..', 'public')));

// Serve the new React frontend at / (We will build the React app into 'client/dist')
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// SPA fallback for React router (if used)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/dashboard/')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎬 Reel Summarizer Agent running at http://localhost:${PORT}\n`);
});
