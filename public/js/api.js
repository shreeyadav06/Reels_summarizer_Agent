/**
 * API Client — fetch wrapper for ReelBrain backend
 */
const API = {
  baseUrl: '/api/reels',

  async analyzeUpload(file) {
    const formData = new FormData();
    formData.append('video', file);
    const res = await fetch(`${this.baseUrl}/analyze-upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload analysis failed');
    return data;
  },

  async analyzeUrl(url) {
    const res = await fetch(`${this.baseUrl}/analyze-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'URL analysis failed');
    return data;
  },
  // getSummaries and deleteSummary were moved to app.js to use Firebase/Local Memory
};
