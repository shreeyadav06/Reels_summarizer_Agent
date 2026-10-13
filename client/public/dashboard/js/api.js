/**
 * API Client — fetch wrapper for ReelBrain backend
 */
const API = {
  baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3005/api/reels'
    : 'https://reel-summarizer-backend.onrender.com/api/reels',
  async getAuthHeaders() {
    const headers = {};
    if (window.firebaseUser && typeof window.firebaseUser.getIdToken === 'function') {
      try {
        const token = await window.firebaseUser.getIdToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch (_) {}
    }
    return headers;
  },

  async analyzeUpload(file) {
    const formData = new FormData();
    formData.append('video', file);
    const authHeaders = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/analyze-upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload analysis failed');
    return data;
  },

  async analyzeUrl(url) {
    const authHeaders = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/analyze-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'URL analysis failed');
    return data;
  },
  // getSummaries and deleteSummary were moved to app.js to use Firebase/Local Memory
};
