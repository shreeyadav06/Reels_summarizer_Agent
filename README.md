# 🎬 ReelBrain — AI Reel Summarizer Agent

An AI-powered agent that watches your saved reels, extracts ALL important information, and organizes it into structured, searchable categories.

## Features

- **Upload** video files or **paste URLs** of Instagram Reels
- **Gemini 2.0 Flash** multimodal AI analyzes video + audio in one pass
- **Auto-categorization** into 9 categories: Internships, Skills, Recipes, Coupons, Places, News, Finance, Tools, General
- **Structured extraction** of category-specific fields (ingredients, coupon codes, deadlines, etc.)
- **Beautiful dashboard** with glassmorphism cards and category filtering
- **Detail modal** with full extracted info, action items, and tags

## Quick Start

1. **Get a Gemini API Key** from [Google AI Studio](https://aistudio.google.com/) (free)

2. **Add your key** to `.env`:
   ```
   GEMINI_API_KEY=your_key_here
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run the app:**
   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000` in your browser

## Optional: URL Download Support

To analyze reels from URLs, install [yt-dlp](https://github.com/yt-dlp/yt-dlp):
```bash
pip install yt-dlp
```

Without yt-dlp, you can still upload video files directly.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js + Express |
| AI | Google Gemini 2.0 Flash |
| Storage | JSON file |

## Deployment

Deploying the application requires hosting the frontend and backend separately due to the backend's dependency on Python packages (`yt-dlp`, `instaloader`) for downloading videos.

### Frontend (Vercel)

Vercel is the recommended option for deploying the Vite React frontend.

1. Push your code to GitHub.
2. Go to Vercel and import your repository.
3. Vercel will automatically detect **Vite**.
4. Set the Root Directory to `client/`.
5. Add your `VITE_API_BASE_URL` environment variable pointing to your deployed backend URL.
6. Click Deploy.

### Backend (Render)

Vercel's free tier serverless functions are not suitable for the backend because they have a 10-second timeout and do not support global system dependencies like `yt-dlp`. 

We recommend deploying the backend using a Docker container on platforms like Render:

1. Use the provided Docker configuration to build the environment with Node.js, Python, `yt-dlp`, and `instaloader`.
2. Connect your repository to Render as a "Web Service".
3. Set the root directory to `server/`.
4. Render will automatically build the environment using the Dockerfile.
5. Add your `GEMINI_API_KEY` to the environment variables on Render.
