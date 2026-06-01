const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { analyzeVideo } = require('../services/gemini');
const { downloadVideo, cleanupFile } = require('../services/videoDownloader');
const { getAllSummaries, saveSummary, deleteSummary } = require('../services/storage');

const router = express.Router();

// Configure multer for video uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'video/mp4', 'video/quicktime', 'video/x-msvideo',
      'video/webm', 'video/x-matroska', 'video/3gpp',
      'image/jpeg', 'image/png', 'image/webp',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported video/image format: ${file.mimetype}. Use MP4, MOV, WebM, JPEG, PNG, or WebP.`));
    }
  },
});

/**
 * POST /api/reels/analyze-upload
 * Analyze an uploaded video file
 */
router.post('/analyze-upload', upload.single('video'), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded.' });
    }

    filePath = req.file.path;
    console.log(`📹 Analyzing uploaded video: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(1)}MB)`);

    // Analyze with Gemini
    const analysis = await analyzeVideo(filePath);
    analysis.id = require('uuid').v4(); // Generate a temporary ID
    analysis.createdAt = new Date().toISOString();

    console.log(`✅ Analysis complete: "${analysis.title}" [${analysis.category}]`);
    res.json({ success: true, summary: analysis });

  } catch (error) {
    console.error('❌ Upload analysis failed:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    // Clean up uploaded file
    cleanupFile(filePath);
  }
});

/**
 * POST /api/reels/analyze-url
 * Analyze a video from URL (Instagram Reel, etc.)
 */
router.post('/analyze-url', async (req, res) => {
  let filePath = null;

  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid URL.' });
    }

    console.log(`🔗 Downloading video from: ${url}`);

    // Download the video
    filePath = await downloadVideo(url);
    console.log(`📹 Downloaded, analyzing...`);

    // Analyze with Gemini
    const analysis = await analyzeVideo(filePath);
    analysis.id = require('uuid').v4(); // Generate a temporary ID
    analysis.createdAt = new Date().toISOString();

    console.log(`✅ Analysis complete: "${analysis.title}" [${analysis.category}]`);
    res.json({ success: true, summary: analysis });

  } catch (error) {
    console.error('❌ URL analysis failed:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    cleanupFile(filePath);
  }
});

// GET and DELETE /summaries removed because Firestore is now used on the frontend directly.

module.exports = router;
