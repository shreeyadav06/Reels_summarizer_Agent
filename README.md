# 🎬 ReelBrain — AI Reel Summarizer Agent

An AI-powered agent that watches your saved reels, extracts ALL important information, and organizes it into structured, searchable categories.

## Features

- **Upload** video files or **paste URLs** of Instagram Reels, Image Carousels, and YouTube Shorts
- **Gemini 3.1 Flash lite** multimodal AI analyzes video, audio, and image arrays in one pass
- **Auto-categorization** into 9 categories: Internships, Skills, Recipes, Coupons, Places, News, Finance, Tools, General
- **Structured extraction** of category-specific fields (ingredients, coupon codes, deadlines, etc.)
- **Clickable Source Links** mapped directly onto your summary cards and details modal for easy access
- **Instagram Carousel Support** automatically detects slideshows and downloads all images for multi-image analysis
- **Beautiful dashboard** with glassmorphism cards and category filtering

## Quick Start

1. **Get API Keys**:
   - **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/) (free)
   - **Apify API Token** from [Apify](https://apify.com/) (free tier, required for Instagram scraping)
   - **RapidAPI Key** from [RapidAPI YouTube Media Downloader](https://rapidapi.com/) (free tier, required to bypass YouTube datacenter blocks)

2. **Add your keys** to `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_key_here
   APIFY_API_TOKEN=your_apify_token_here
   RAPIDAPI_KEY=your_rapidapi_key_here
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Run the app:**
   ```bash
   npm run dev
   ```

5. Open `http://localhost:3005` in your browser

## URL Download Support

To analyze reels from URLs, the backend uses a resilient, multi-pronged downloading strategy to bypass datacenter blocking (like 403 / Bot Challenges):

- **Instagram URLs:** Uses the `apify-client` to trigger cloud scrapers that automatically detect whether the post is a Reel (downloads `.mp4`) or a Carousel (downloads an array of `.jpg`s).
- **YouTube URLs:** Uses a dedicated `RapidAPI` endpoint to fetch the `.mp3` audio track directly from YouTube's CDN, completely avoiding strict video bot-blocks while still allowing Gemini to generate a full transcript and summary.
- **Fallback:** Bundles `youtube-dl-exec` (yt-dlp) as a final fallback layer.

Without any downloader configured, you can still upload video files directly from the dashboard.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vanilla JS, HTML, Custom CSS (Glassmorphism), Firebase Firestore |
| Backend | Node.js + Express |
| AI | Google Gemini 3.1 Flash lite |
| Infrastructure| Apify Client, RapidAPI, Node-Fetch |

## Deployment

Deploying the application requires hosting the frontend and backend separately.

### Frontend (Vercel)

Vercel is the recommended option for deploying the static HTML/JS frontend.

1. Push your code to GitHub.
2. Go to Vercel and import your repository.
3. Set the Root Directory to `client/`.
4. Deploy. (Firebase handles the client-side database).

### Backend (Render)

We recommend deploying the backend using a Docker container on platforms like Render:

1. Connect your repository to Render as a "Web Service".
2. Set the root directory to `server/`.
3. Add your `GEMINI_API_KEY`, `APIFY_API_TOKEN`, and `RAPIDAPI_KEY` to the environment variables on the Render dashboard.
4. Render will automatically build the environment and launch your Express server.
