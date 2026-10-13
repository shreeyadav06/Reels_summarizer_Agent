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

   # Security & Authentication (Recommended for Production)
   FIREBASE_PROJECT_ID=your_firebase_project_id_here
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
   ```

3. **Install dependencies:**
   ```bash
   # Install backend dependencies
   npm install

   # Install client frontend dependencies
   npm install --prefix client
   ```

4. **Run the app:**
   ```bash
   # Run backend API server (:3005)
   npm run dev

   # Run modern React + Vite frontend (:5173) in a separate terminal
   npm run dev --prefix client
   ```

5. Open `http://localhost:5173` (React landing) or `http://localhost:3005/dashboard` (Vanilla JS dashboard).

## Security & Protection

ReelBrain includes multi-layer defensive security controls:
- **SSRF & Command Injection Protection**: Strict URL normalization and domain allowlisting (Instagram and YouTube only) before triggering downloaders.
- **Backend Authentication Gate**: Firebase Admin ID token verification (`authMiddleware`) on analysis endpoints.
- **Rate Limiting & DoS Mitigation**: Built-in sliding-window IP rate limiter (20 requests / 15 minutes) and 1MB JSON payload limit.
- **XSS Sanitization**: Escaped DOM attribute bindings and strictly protocol-checked (`http`/`https`) link rendering.
- **Container Hardening**: Dockerfile runs under unprivileged `node` user on Node 22 LTS.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 8, Tailwind CSS v4, Lucide Icons, Vanilla JS Dashboard |
| Backend | Node.js + Express, Firebase Admin SDK, In-Memory Rate Limiter |
| AI | Google Gemini 3.1 Flash lite |
| Infrastructure | Apify Client, RapidAPI, bundled yt-dlp, Docker |

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
