const youtubedl = require('youtube-dl-exec');
const path = require('path');
const url = 'https://youtube.com/shorts/ONaSgDK-VzA?si=vihh-2LRwdKrR8E5';
const out = path.join(__dirname, 'test_output_%(ext)s');

youtubedl(url, {
  format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
  noPlaylist: true,
  output: `"${out}"`
}).then(res => console.log('Success')).catch(err => console.error('Error:', err.message));
