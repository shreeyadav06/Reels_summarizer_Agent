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
 * Download a video from a URL using Apify, RapidAPI, falling back to bundled yt-dlp
 * @param {string} url - The reel/video URL
 * @returns {Promise<string[]>} Paths to the downloaded video file(s)
 */
async function downloadVideo(url) {
  const baseFilename = uuidv4();
  const outputTemplate = path.join(UPLOADS_DIR, `${baseFilename}.%(ext)s`);
  const mp4Output = path.join(UPLOADS_DIR, `${baseFilename}.mp4`);

  try {
    let files = [];
    const https = require('https');
    
    // Helper to download files
    const downloadFile = (fileUrl, outputPath) => {
      return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        https.get(fileUrl, response => {
          if (response.statusCode !== 200) {
            return reject(new Error(`Failed to download from CDN: ${response.statusCode}`));
          }
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(outputPath);
          });
        }).on('error', err => {
          fs.unlink(outputPath, () => {});
          reject(err);
        });
      });
    };
    
    // Check URL type
    const isInstagram = url.includes('instagram.com/p/') || url.includes('instagram.com/reel/');
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');

    // 1. Try RapidAPI for YouTube
    if (isYoutube && process.env.RAPIDAPI_KEY) {
      try {
        console.log("Using RapidAPI to bypass YouTube blocking...");
        const encodedUrl = encodeURIComponent(url);
        const rapidUrl = `https://youtube-info-download-api.p.rapidapi.com/ajax/download.php?format=mp3&add_info=0&url=${encodedUrl}`;
        const fetchObj = global.fetch ? global.fetch : require('node-fetch');
        
        const res = await fetchObj(rapidUrl, {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'youtube-info-download-api.p.rapidapi.com',
            'x-rapidapi-key': process.env.RAPIDAPI_KEY
          }
        });
        const data = await res.json();
        
        if (data && data.success) {
           const progressUrl = data.progress_url;
           if (progressUrl) {
             console.log("Polling RapidAPI progress...");
             let downloadUrl = null;
             // Poll for up to 30 seconds
             for (let i = 0; i < 30; i++) {
               const pRes = await fetchObj(progressUrl);
               const pData = await pRes.json();
               if (pData && pData.success === 1 && pData.download_url) {
                 downloadUrl = pData.download_url;
                 break;
               }
               await new Promise(r => setTimeout(r, 1000));
             }
             if (downloadUrl) {
                console.log("RapidAPI extracted URL. Downloading mp3 audio...");
                const mp3Output = path.join(UPLOADS_DIR, `${baseFilename}.mp3`);
                await downloadFile(downloadUrl, mp3Output);
                if (fs.existsSync(mp3Output)) files.push(mp3Output);
             } else {
                throw new Error("RapidAPI polling timed out.");
             }
           } else if (data.url) {
              console.log("RapidAPI extracted URL immediately. Downloading mp3...");
              const mp3Output = path.join(UPLOADS_DIR, `${baseFilename}.mp3`);
              await downloadFile(data.url, mp3Output);
              if (fs.existsSync(mp3Output)) files.push(mp3Output);
           }
        } else {
          console.warn("RapidAPI response unsuccessful:", data);
        }
      } catch (e) {
        console.warn("RapidAPI YouTube download failed:", e.message);
      }
    }

    // 2. Try Apify Scraper for Instagram
    if (files.length === 0 && isInstagram && process.env.APIFY_API_TOKEN) {
      try {
        console.log("Using Apify to bypass Instagram blocking...");
        const { ApifyClient } = require('apify-client');
        const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
        
        const input = {
          directUrls: [url],
          resultsType: "details",
          resultsLimit: 1,
          addParentData: false,
        };
        
        const run = await client.actor("apify/instagram-scraper").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        if (items.length > 0) {
          const item = items[0];
          
          if (item.images && item.images.length > 0) {
            console.log(`Apify extracted ${item.images.length} images for carousel. Downloading...`);
            for (let i = 0; i < item.images.length; i++) {
              const imgOutput = path.join(UPLOADS_DIR, `${baseFilename}-${i}.jpg`);
              try {
                await downloadFile(item.images[i], imgOutput);
                if (fs.existsSync(imgOutput)) files.push(imgOutput);
              } catch (err) {
                console.warn(`Failed to download carousel image ${i}:`, err.message);
              }
            }
          } else if (item.videoUrl) {
            console.log("Apify extracted video URL. Downloading...");
            await downloadFile(item.videoUrl, mp4Output);
            if (fs.existsSync(mp4Output)) files.push(mp4Output);
          } else {
             console.warn("Apify finished but did not find video or images. Falling back to yt-dlp.");
          }
        }
      } catch (e) {
        console.warn("Apify failed, falling back to yt-dlp", e.message);
      }
    }

    // 3. Try youtube-dl-exec (bundled yt-dlp) if APIs didn't get files
    if (files.length === 0) {
      console.log("Falling back to yt-dlp...");
      await youtubedl(url, {
        format: 'best[ext=mp4]/best',
        noPlaylist: true,
        jsRuntimes: 'node',
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
