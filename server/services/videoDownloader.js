const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// youtube-dl-exec ships its own yt-dlp binary — no system Python needed
const youtubedl = require('youtube-dl-exec');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}



/**
 * Download a video from a URL using RapidAPI, falling back to bundled yt-dlp
 * @param {string} url - The reel/video URL
 * @returns {Promise<string[]>} Paths to the downloaded video file(s)
 */
async function downloadVideo(url) {
  const baseFilename = uuidv4();
  const outputTemplate = path.join(UPLOADS_DIR, `${baseFilename}.%(ext)s`);
  const instaDir = path.join(UPLOADS_DIR, baseFilename);
  const mp4Output = path.join(UPLOADS_DIR, `${baseFilename}.mp4`);

  try {
    let files = [];
    
    // Check if it's an Instagram URL
    const isInstagram = url.includes('instagram.com/p/') || url.includes('instagram.com/reel/');
    
    // 1. Try local Instaloader (likely blocked in CI/CD without cookies)
    if (isInstagram && files.length === 0) {
      // Extract shortcode
      const shortcodeMatch = url.match(/(?:p|reel)\/([^\/?#&]+)/);
      if (shortcodeMatch && shortcodeMatch[1]) {
        const shortcode = shortcodeMatch[1];
        try {
          execFileSync('instaloader', ['--dirname-pattern', instaDir, '--', `-${shortcode}`], { timeout: 120000, stdio: 'pipe' });
          if (fs.existsSync(instaDir)) {
             files = fs.readdirSync(instaDir)
               .filter(f => !f.endsWith('.txt') && !f.endsWith('.json.xz'))
               .map(f => path.join(instaDir, f));
          }
        } catch(e) {
          console.warn("Instaloader failed, falling back to yt-dlp", e.message);
        }
      }
    }

    // 2. Try youtube-dl-exec (bundled yt-dlp) if instaloader didn't get files or not instagram
    if (files.length === 0) {
      await youtubedl(url, {
        format: 'best[ext=mp4]/best',
        noPlaylist: true,
        output: `"${outputTemplate}"`,
      });

      files = fs.readdirSync(UPLOADS_DIR)
        .filter((f) => f.startsWith(baseFilename) && !fs.statSync(path.join(UPLOADS_DIR, f)).isDirectory())
        .map(f => path.join(UPLOADS_DIR, f));
    }

    if (files.length > 0) {
      return files;
    }

    throw new Error('Download completed but no media files were found.');
  } catch (error) {
    // Clean up on failure
    const possibleOutput = path.join(UPLOADS_DIR, `${baseFilename}.*`);
    try {
      fs.readdirSync(UPLOADS_DIR)
        .filter(f => f.startsWith(baseFilename))
        .forEach(f => {
          const fullPath = path.join(UPLOADS_DIR, f);
          if (fs.statSync(fullPath).isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(fullPath);
          }
        });
    } catch (_) { /* ignore cleanup errors */ }

    throw new Error(`Failed to download video: ${error.message}`);
  }
}

/**
 * Clean up a downloaded video file
 * @param {string} filePath - Path to the file to delete
 */
function cleanupFile(filePaths) {
  try {
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    paths.forEach(filePath => {
      if (!filePath) return;
      
      // Prevent path traversal by strictly verifying the path falls within UPLOADS_DIR
      // We must use path.resolve BEFORE any fs calls to prevent existsSync from traversing
      const safeRoot = path.resolve(UPLOADS_DIR);
      const resolvedPath = path.resolve(safeRoot, filePath);
      
      if (!resolvedPath.startsWith(safeRoot)) {
        console.warn("Security warning: Attempted to clean up file outside of uploads directory:", filePath);
        return;
      }

      if (fs.existsSync(resolvedPath)) {
        const realPath = fs.realpathSync(resolvedPath);
        // Double check after following symlinks
        if (!realPath.startsWith(fs.realpathSync(safeRoot))) {
           console.warn("Security warning: Symlink escape attempt:", filePath);
           return;
        }

        if (fs.statSync(realPath).isDirectory()) {
          fs.rmSync(realPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(realPath);
          // Check if parent directory is a UUID dir and empty, delete it
          const parentDir = path.dirname(realPath);
          if (parentDir !== safeRoot && parentDir.startsWith(safeRoot)) {
             const remaining = fs.readdirSync(parentDir);
             if (remaining.length === 0 || remaining.every(f => f.endsWith('.txt') || f.endsWith('.json.xz'))) {
                fs.rmSync(parentDir, { recursive: true, force: true });
             }
          }
        }
      }
    });
  } catch (err) {
    console.warn(`Warning: Could not clean up files:`, err.message);
  }
}

module.exports = { downloadVideo, cleanupFile };
