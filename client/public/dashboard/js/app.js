/**
 * App — Main application controller for ReelBrain
 */
const App = {
  summaries: [],
  selectedFile: null,
  activeFilter: 'all',

  init() {
    this.bindEvents();
    // Expose loadSummaries to window for Firebase auth listener to trigger
    window.loadSummaries = () => this.loadSummaries();
    this.loadSummaries(); // Try loading initially (may just be empty if guest)
  },

  // ─── Event Binding ───
  bindEvents() {
    // Tab switching
    document.querySelectorAll('.input-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // File upload
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drop-zone--active'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drop-zone--active'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('drop-zone--active');
      if (e.dataTransfer.files.length) this.selectFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', e => { if (e.target.files.length) this.selectFile(e.target.files[0]); });

    document.getElementById('file-remove').addEventListener('click', () => this.clearFile());
    document.getElementById('btn-analyze-upload').addEventListener('click', () => this.analyzeUpload());

    // URL input
    const urlInput = document.getElementById('url-input');
    urlInput.addEventListener('input', () => {
      document.getElementById('btn-analyze-url').disabled = !urlInput.value.trim();
    });
    urlInput.addEventListener('keydown', e => { if (e.key === 'Enter' && urlInput.value.trim()) this.analyzeUrl(); });
    document.getElementById('btn-paste').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        urlInput.value = text;
        urlInput.dispatchEvent(new Event('input'));
      } catch { /* clipboard access denied */ }
    });
    document.getElementById('btn-analyze-url').addEventListener('click', () => this.analyzeUrl());

    // Filters
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => this.setFilter(pill.dataset.category));
    });

    // Modal
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) this.closeModal();
    });
    document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.closeModal(); });

    // Error toast
    document.getElementById('error-close').addEventListener('click', () => this.hideError());
  },

  // ─── Tabs ───
  switchTab(tab) {
    document.querySelectorAll('.input-tab').forEach(t => t.classList.remove('input-tab--active'));
    document.querySelectorAll('.input-panel').forEach(p => p.classList.remove('input-panel--active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('input-tab--active');
    document.getElementById(`panel-${tab}`).classList.add('input-panel--active');
  },

  // ─── File Handling ───
  selectFile(file) {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|webm|avi|mkv|jpg|jpeg|png|webp)$/i)) {
      return this.showError('Please upload a valid video or image file (MP4, MOV, WebM, AVI, JPG, PNG, WebP)');
    }
    if (file.size > 100 * 1024 * 1024) {
      return this.showError('File too large. Maximum size is 100MB.');
    }
    this.selectedFile = file;
    document.getElementById('drop-zone').style.display = 'none';
    document.getElementById('file-preview').style.display = 'flex';
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    document.getElementById('btn-analyze-upload').disabled = false;
  },

  clearFile() {
    this.selectedFile = null;
    document.getElementById('drop-zone').style.display = 'block';
    document.getElementById('file-preview').style.display = 'none';
    document.getElementById('file-input').value = '';
    document.getElementById('btn-analyze-upload').disabled = true;
  },

  // ─── Analysis ───
  async analyzeUpload() {
    if (!this.selectedFile) return;
    this.showLoading();
    try {
      const data = await API.analyzeUpload(this.selectedFile);
      await this.saveSummary(data.summary);
      this.clearFile();
      this.hideLoading();
      this.renderSummaries();
      this.showSuccess(`Extracted: "${data.summary.title}"`);
    } catch (err) {
      this.hideLoading();
      this.showError(err.message);
    }
  },

  async analyzeUrl() {
    const urlInput = document.getElementById('url-input');
    const url = urlInput.value.trim();
    if (!url) return;
    this.showLoading();
    try {
      const data = await API.analyzeUrl(url);
      await this.saveSummary(data.summary);
      urlInput.value = '';
      document.getElementById('btn-analyze-url').disabled = true;
      this.hideLoading();
      this.renderSummaries();
      this.showSuccess(`Extracted: "${data.summary.title}"`);
    } catch (err) {
      this.hideLoading();
      this.showError(err.message);
    }
  },

  // ─── Loading State ───
  showLoading() {
    document.getElementById('input-section').style.display = 'none';
    document.getElementById('loading-section').style.display = 'block';
    this.animateSteps();
  },

  hideLoading() {
    document.getElementById('input-section').style.display = 'block';
    document.getElementById('loading-section').style.display = 'none';
    if (this._stepTimer) clearInterval(this._stepTimer);
  },

  animateSteps() {
    let step = 1;
    const steps = [document.getElementById('step-1'), document.getElementById('step-2'), document.getElementById('step-3')];
    steps.forEach(s => { s.className = 'loading-step'; });
    steps[0].classList.add('loading-step--active');

    this._stepTimer = setInterval(() => {
      if (step < 3) {
        steps[step - 1].classList.remove('loading-step--active');
        steps[step - 1].classList.add('loading-step--done');
        steps[step].classList.add('loading-step--active');
        step++;
      }
    }, 3000);
  },

  // ─── Summaries (Firebase / Local) ───
  async loadSummaries() {
    try {
      if (window.firebaseUser && window.firebaseDb) {
        // Authenticated user: load from Firestore
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        const querySnapshot = await getDocs(collection(window.firebaseDb, `users/${window.firebaseUser.uid}/summaries`));
        
        const loaded = [];
        querySnapshot.forEach((doc) => {
          loaded.push(doc.data());
        });
        // Sort by createdAt descending
        loaded.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        this.summaries = loaded;
      } else {
        // Guest mode: load from memory (which is just what we have so far)
        // If we want to persist across soft-reloads, we could use localStorage, but user requested erased on refresh
        // So we do nothing, keep existing this.summaries
      }
      this.renderSummaries();
    } catch (err) {
      console.error("Failed to load summaries", err);
      this.renderSummaries();
    }
  },

  async saveSummary(summary) {
    this.summaries.unshift(summary);
    if (window.firebaseUser && window.firebaseDb) {
      try {
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        await setDoc(doc(window.firebaseDb, `users/${window.firebaseUser.uid}/summaries`, summary.id), summary);
      } catch (err) {
        console.error("Failed to save to Firestore", err);
      }
    }
  },

  renderSummaries() {
    const grid = document.getElementById('summaries-grid');
    const filterSection = document.getElementById('filter-section');
    const emptyState = document.getElementById('empty-state');

    if (this.summaries.length === 0) {
      filterSection.style.display = 'none';
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    filterSection.style.display = 'block';
    document.getElementById('summary-count').textContent = `${this.summaries.length} reel${this.summaries.length !== 1 ? 's' : ''}`;

    const filtered = this.activeFilter === 'all'
      ? this.summaries
      : this.summaries.filter(s => s.category === this.activeFilter);

    grid.innerHTML = filtered.length
      ? filtered.map(s => Components.renderCard(s)).join('')
      : `<div class="empty-state" style="grid-column:1/-1;padding:40px"><h3 class="empty-state__title">No ${this.activeFilter} reels yet</h3><p class="empty-state__text">Analyze a reel with ${this.activeFilter} content to see it here.</p></div>`;
  },

  setFilter(category) {
    this.activeFilter = category;
    document.querySelectorAll('.filter-pill').forEach(p => {
      p.classList.toggle('filter-pill--active', p.dataset.category === category);
    });
    this.renderSummaries();
  },

  async deleteSummary(id) {
    try {
      if (window.firebaseUser && window.firebaseDb) {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        await deleteDoc(doc(window.firebaseDb, `users/${window.firebaseUser.uid}/summaries`, id));
      }
      this.summaries = this.summaries.filter(s => s.id !== id);
      this.renderSummaries();
      this.closeModal();
      this.showSuccess('Reel deleted');
    } catch (err) {
      this.showError(err.message);
    }
  },

  // ─── Modal ───
  openModal(id) {
    const summary = this.summaries.find(s => s.id === id);
    if (!summary) return;
    document.getElementById('modal-content').innerHTML = Components.renderModalContent(summary);
    document.getElementById('modal-overlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.body.style.overflow = '';
  },

  // ─── Clipboard ───
  async copyToClipboard(id) {
    const summary = this.summaries.find(s => s.id === id);
    if (!summary) return;
    
    let textToCopy = `[${summary.category.toUpperCase()}] ${summary.title}\n\n`;
    textToCopy += `${summary.summary}\n\n`;
    
    if (summary.details) {
      Object.entries(summary.details).forEach(([k, v]) => {
        if (v) {
          const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const val = Array.isArray(v) ? v.join(', ') : v;
          textToCopy += `${label}: ${val}\n`;
        }
      });
      textToCopy += '\n';
    }
    
    if (summary.actionItems && summary.actionItems.length > 0) {
      textToCopy += `Action Items:\n${summary.actionItems.map(a => '- ' + a).join('\n')}\n\n`;
    }
    
    if (summary.tags && summary.tags.length > 0) {
      textToCopy += `Tags: ${summary.tags.map(t => '#' + t).join(' ')}`;
    }
    
    try {
      await navigator.clipboard.writeText(textToCopy.trim());
      this.showSuccess('Copied to clipboard!');
    } catch (err) {
      this.showError('Failed to copy to clipboard');
    }
  },

  // ─── Toasts ───
  showError(msg) {
    const toast = document.getElementById('error-toast');
    document.getElementById('error-message').textContent = msg;
    toast.style.display = 'flex';
    clearTimeout(this._errorTimer);
    this._errorTimer = setTimeout(() => this.hideError(), 8000);
  },

  hideError() {
    document.getElementById('error-toast').style.display = 'none';
  },

  showSuccess(msg) {
    const toast = document.getElementById('success-toast');
    document.getElementById('success-message').textContent = msg;
    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 4000);
  },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
