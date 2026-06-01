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
| Frontend | Vanilla HTML/CSS/JS |
| Backend | Node.js + Express |
| AI | Google Gemini 2.0 Flash |
| Storage | JSON file |
