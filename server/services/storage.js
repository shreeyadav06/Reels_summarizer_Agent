const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, '..', 'data', 'summaries.json');

// Ensure data directory and file exist
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

/**
 * Read all summaries from storage
 * @returns {Array} Array of summary objects
 */
function getAllSummaries() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save a new summary to storage
 * @param {object} analysisResult - The Gemini analysis result
 * @param {string} sourceUrl - Original URL (if provided)
 * @param {string} sourceFilename - Original filename (if uploaded)
 * @returns {object} The saved summary with ID and timestamp
 */
function saveSummary(analysisResult, sourceUrl = null, sourceFilename = null) {
  const summaries = getAllSummaries();

  const summary = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    sourceUrl,
    sourceFilename,
    ...analysisResult,
  };

  summaries.unshift(summary); // Add to beginning (newest first)
  fs.writeFileSync(DATA_FILE, JSON.stringify(summaries, null, 2), 'utf-8');

  return summary;
}

/**
 * Delete a summary by ID
 * @param {string} id - Summary ID to delete
 * @returns {boolean} Whether the summary was found and deleted
 */
function deleteSummary(id) {
  const summaries = getAllSummaries();
  const filtered = summaries.filter((s) => s.id !== id);

  if (filtered.length === summaries.length) {
    return false; // Not found
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}

/**
 * Get a summary by ID
 * @param {string} id - Summary ID
 * @returns {object|null} The summary or null
 */
function getSummaryById(id) {
  const summaries = getAllSummaries();
  return summaries.find((s) => s.id === id) || null;
}

module.exports = { getAllSummaries, saveSummary, deleteSummary, getSummaryById };
