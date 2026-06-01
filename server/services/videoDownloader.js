const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Download a video from a URL using yt-dlp
 * @param {string} url - The reel/video URL
 * @returns {Promise<string>} Path to the downloaded video file
 */
async function downloadVideo(url) {
  const baseFilename = uuidv4();
  const outputPath = path.join(UPLOADS_DIR, `${baseFilename}.%(ext)s`);
  const instaDir = path.join(UPLOADS_DIR, baseFilename);

  try {
    let files = [];
    
    // Check if it's an Instagram URL
    const isInstagram = url.includes('instagram.com/p/') || url.includes('instagram.com/reel/');
    if (isInstagram) {
      // Extract shortcode
      const shortcodeMatch = url.match(/(?:p|reel)\/([^\/?#&]+)/);
      if (shortcodeMatch && shortcodeMatch[1]) {
        const shortcode = shortcodeMatch[1];
        try {
          const cmd = `instaloader --dirname-pattern "${instaDir}" -- -${shortcode}`;
          execSync(cmd, { timeout: 120000, stdio: 'pipe' });
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

    // Try yt-dlp if instaloader didn't get files or not instagram
    if (files.length === 0) {
      const command = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --no-playlist -o "${outputPath}" "${url}"`;
      execSync(command, {
        timeout: 120000, // 2 minute timeout
        stdio: 'pipe',
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
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    if (error.message.includes('yt-dlp')) {
      throw new Error(
        'yt-dlp is not installed. Install it with: pip install yt-dlp\n' +
        'Or upload the video file directly instead.'
      );
    }

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
      if (filePath && fs.existsSync(filePath)) {
        if (fs.statSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
          // Check if parent directory is a UUID dir and empty, delete it
          const parentDir = path.dirname(filePath);
          if (parentDir !== UPLOADS_DIR && parentDir.includes(UPLOADS_DIR)) {
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
