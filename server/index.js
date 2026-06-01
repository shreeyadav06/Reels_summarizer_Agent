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

// Simple health check for the root URL
app.get('/', (req, res) => {
  res.send('ReelBrain API is running!');
});

// 404 handler for any other unrecognized routes
app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`\n🎬 Reel Summarizer Agent running at http://localhost:${PORT}\n`);
});
