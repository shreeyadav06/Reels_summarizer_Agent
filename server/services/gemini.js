const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');

function validatePath(filePath) {
  if (!filePath) throw new Error("Invalid file path");
  const safeRoot = path.resolve(UPLOADS_DIR);
  const resolvedPath = path.resolve(safeRoot, filePath);
  if (!resolvedPath.startsWith(safeRoot)) {
    throw new Error("Security Error: Path traversal attempt");
  }
  return fs.realpathSync(resolvedPath);
}

const EXTRACTION_PROMPT = `You are an expert content analyst AI agent. Analyze this media (an Instagram Reel, Post, or short video) and extract ALL important, actionable information from it.

You MUST return a valid JSON object (no markdown, no code fences, just raw JSON) with this exact structure:

{
  "title": "A short, catchy title summarizing the reel (max 10 words)",
  "category": "ONE of: internship, recipe, coupon, location, skill, news, finance, tool, general",
  "confidence": 0.0 to 1.0 (how confident you are about the category),
  "summary": "A 2-3 sentence summary of the key information in the reel",
  "details": {
    // Category-specific fields (see below)
  },
  "tags": ["relevant", "tags", "for", "searching"],
  "actionItems": ["Concrete action steps the viewer should take"],
  "rawTranscript": "Brief transcript or description of what was said/shown"
}

CATEGORY-SPECIFIC DETAILS FIELDS:

For "internship":
{
  "company": "Company name",
  "role": "Job/internship title",
  "stipend": "Stipend/salary if mentioned",
  "deadline": "Application deadline if mentioned",
  "applyLink": "URL or instructions to apply",
  "eligibility": "Who can apply",
  "duration": "Internship duration"
}

For "recipe":
{
  "dishName": "Name of the dish",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": ["step 1", "step 2"],
  "cookTime": "Total cooking time",
  "servings": "Number of servings",
  "cuisineType": "Type of cuisine"
}

For "coupon":
{
  "code": "The coupon/promo code",
  "platform": "Where to use it (Amazon, Swiggy, etc.)",
  "discount": "Discount amount or percentage",
  "expiry": "Expiration date if mentioned",
  "conditions": "Any terms or conditions",
  "productCategory": "What products it applies to"
}

For "location":
{
  "placeName": "Name of the place",
  "city": "City/region",
  "country": "Country",
  "highlights": ["What makes it special"],
  "bestTimeToVisit": "Best season/time",
  "estimatedCost": "Approximate cost",
  "tips": ["Travel tips"]
}

For "skill":
{
  "skillName": "Name of the skill",
  "resources": ["Recommended resources/courses"],
  "difficulty": "Beginner/Intermediate/Advanced",
  "timeToLearn": "Estimated learning time",
  "prerequisites": ["Required prerequisites"],
  "careerRelevance": "How it helps in career"
}

For "news":
{
  "topic": "News topic",
  "keyPoints": ["Key point 1", "Key point 2"],
  "source": "Original source if mentioned",
  "date": "Date of the news",
  "impact": "Why it matters"
}

For "finance":
{
  "tipType": "Investment/Saving/Tax/Budgeting",
  "advice": "The core financial advice",
  "steps": ["Actionable steps"],
  "tools": ["Recommended tools/apps"],
  "riskLevel": "Low/Medium/High",
  "applicability": "Who this applies to"
}

For "tool":
{
  "productName": "Name of the tool/product",
  "useCase": "What it's used for",
  "pricing": "Free/Paid/Freemium + price",
  "link": "URL if mentioned",
  "alternatives": ["Alternative tools"],
  "rating": "Rating or review summary"
}

For "general":
{
  "topic": "Main topic",
  "keyPoints": ["Key point 1", "Key point 2"],
  "references": ["Any links or references mentioned"]
}

RULES:
- Extract EVERY piece of useful information. Don't skip anything.
- If a field is not mentioned in the video, use null instead of making things up.
- Choose the BEST matching category. If multiple apply, pick the primary one.
- Include text shown on screen, spoken words, and any visual information.
- Be specific with coupon codes, links, dates, and numbers — exact values matter.
- The tags should be useful for searching later.
- Action items should be concrete next steps the viewer can take.

Analyze the video now and return ONLY the JSON object:`;

/**
 * Analyze a video file using Gemini's multimodal capabilities
 * @param {string|string[]} videoPaths - Absolute path(s) to the video/image file(s)
 * @returns {Promise<object>} Structured extraction result
 */
async function analyzeVideo(videoPaths) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  const paths = Array.isArray(videoPaths) ? videoPaths : [videoPaths];
  const parts = [EXTRACTION_PROMPT];

  for (const vPath of paths) {
    const safePath = validatePath(vPath);
    const videoData = fs.readFileSync(safePath);
    const base64Video = videoData.toString('base64');
    const ext = path.extname(safePath).toLowerCase();
    
    const mimeMap = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.3gp': 'video/3gpp',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const mimeType = mimeMap[ext] || 'video/mp4';

    parts.push({
      inlineData: {
        data: base64Video,
        mimeType: mimeType,
      },
    });
  }

  const result = await model.generateContent(parts);
  const responseText = result.response.text();

  // Parse the JSON response (handle potential markdown code fences)
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', responseText);
    throw new Error('AI returned invalid JSON. Please try again.');
  }
}

/**
 * Analyze a video using Gemini File API (for larger files > 20MB)
 * @param {string} videoPath - Absolute path to the video file
 * @returns {Promise<object>} Structured extraction result
 */
async function analyzeVideoLarge(videoPath) {
  const fileManager = genAI.getFileManager
    ? genAI.getFileManager()
    : null;

  // Fallback to inline method if file manager not available
  if (!fileManager) {
    return analyzeVideo(videoPath);
  }

  const safePath = validatePath(videoPath);
  const ext = path.extname(safePath).toLowerCase();
  const mimeMap = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  const mimeType = mimeMap[ext] || 'video/mp4';

  const uploadResult = await fileManager.uploadFile(safePath, {
    mimeType,
    displayName: path.basename(safePath),
  });

  // Wait for processing
  let file = uploadResult.file;
  while (file.state === 'PROCESSING') {
    await new Promise((r) => setTimeout(r, 2000));
    file = await fileManager.getFile(file.name);
  }

  if (file.state === 'FAILED') {
    throw new Error('Video processing failed on server.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
  const result = await model.generateContent([
    EXTRACTION_PROMPT,
    {
      fileData: {
        fileUri: file.uri,
        mimeType: file.mimeType,
      },
    },
  ]);

  const responseText = result.response.text();
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned invalid JSON. Please try again.');
  }
}

module.exports = { analyzeVideo, analyzeVideoLarge };
