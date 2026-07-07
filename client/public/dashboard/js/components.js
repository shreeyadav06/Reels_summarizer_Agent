/**
 * UI Components — renders cards, modals, and states for ReelBrain
 */
const Components = {
  categoryMeta: {
    internship: { icon: '🎓', label: 'Internship', class: 'cat-internship' },
    skill:      { icon: '💡', label: 'Skill',      class: 'cat-skill' },
    recipe:     { icon: '🍳', label: 'Recipe',     class: 'cat-recipe' },
    coupon:     { icon: '🎟️', label: 'Coupon',     class: 'cat-coupon' },
    location:   { icon: '📍', label: 'Location',   class: 'cat-location' },
    news:       { icon: '📰', label: 'News',       class: 'cat-news' },
    finance:    { icon: '💰', label: 'Finance',    class: 'cat-finance' },
    tool:       { icon: '🛠️', label: 'Tool',       class: 'cat-tool' },
    general:    { icon: '📋', label: 'General',    class: 'cat-general' },
  },

  getCatMeta(category) {
    return this.categoryMeta[category] || this.categoryMeta.general;
  },

  formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  },

  renderCard(summary) {
    const cat = this.getCatMeta(summary.category);
    const tags = (summary.tags || []).slice(0, 4);
    
    // Create clickable link if URL exists
    const sourceHtml = summary.sourceUrl
      ? `<a href="${this.escapeHtml(summary.sourceUrl)}" target="_blank" onclick="event.stopPropagation()" class="summary-card__source summary-card__source--link" title="Open original link">🔗 ${this.escapeHtml(new URL(summary.sourceUrl).hostname)}</a>`
      : `<span class="summary-card__source">${this.escapeHtml(summary.sourceFilename || 'Uploaded')}</span>`;

    return `
      <article class="summary-card" data-category="${summary.category}" data-id="${summary.id}" onclick="App.openModal('${summary.id}')">
        <div class="summary-card__header">
          <span class="summary-card__category ${cat.class}">${cat.icon} ${cat.label}</span>
          <div style="display:flex; gap:6px;">
            <button class="summary-card__copy" onclick="event.stopPropagation(); App.copyToClipboard('${summary.id}')" title="Copy Text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            <button class="summary-card__delete" onclick="event.stopPropagation(); App.deleteSummary('${summary.id}')" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <h3 class="summary-card__title">${this.escapeHtml(summary.title || 'Untitled')}</h3>
        <p class="summary-card__summary">${this.escapeHtml(summary.summary || '')}</p>
        ${tags.length ? `<div class="summary-card__tags">${tags.map(t => `<span class="summary-card__tag">#${this.escapeHtml(t)}</span>`).join('')}</div>` : ''}
        <div class="summary-card__meta">
          ${sourceHtml}
          <span>${this.formatDate(summary.createdAt)}</span>
        </div>
      </article>
    `;
  },

  renderModalContent(summary) {
    const cat = this.getCatMeta(summary.category);
    let detailsHtml = '';
    const details = summary.details || {};

    // Build detail grid
    const entries = Object.entries(details).filter(([, v]) => v != null && v !== '');
    if (entries.length > 0) {
      const items = entries.map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        const isLong = Array.isArray(value) || (typeof value === 'string' && value.length > 60);
        const displayVal = Array.isArray(value)
          ? `<ul style="margin:0;padding-left:16px;">${value.map(v => `<li class="modal__list-item">${this.escapeHtml(String(v))}</li>`).join('')}</ul>`
          : this.escapeHtml(String(value));
        return `<div class="modal__detail-item${isLong ? ' modal__detail-item--full' : ''}"><div class="modal__detail-label">${this.escapeHtml(label)}</div><div class="modal__detail-value">${displayVal}</div></div>`;
      }).join('');
      detailsHtml = `<div class="modal__section"><div class="modal__section-title">📄 Details</div><div class="modal__detail-grid">${items}</div></div>`;
    }

    // Action items
    let actionsHtml = '';
    if (summary.actionItems && summary.actionItems.length > 0) {
      actionsHtml = `<div class="modal__section"><div class="modal__section-title">⚡ Action Items</div><ul class="modal__action-list">${summary.actionItems.map(a => `<li class="modal__action-item"><span class="modal__action-bullet">→</span>${this.escapeHtml(a)}</li>`).join('')}</ul></div>`;
    }

    // Tags
    let tagsHtml = '';
    if (summary.tags && summary.tags.length > 0) {
      tagsHtml = `<div class="modal__section"><div class="modal__section-title">🏷️ Tags</div><div class="modal__tags">${summary.tags.map(t => `<span class="modal__tag">#${this.escapeHtml(t)}</span>`).join('')}</div></div>`;
    }

    // Transcript
    let transcriptHtml = '';
    if (summary.rawTranscript) {
      transcriptHtml = `<div class="modal__section"><div class="modal__section-title">📝 Transcript</div><p style="font-size:0.82rem;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap;">${this.escapeHtml(summary.rawTranscript)}</p></div>`;
    }

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span class="modal__category-badge ${cat.class}" style="margin-bottom:0;">${cat.icon} ${cat.label}</span>
        <button class="modal__copy-btn" onclick="App.copyToClipboard('${summary.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Info
        </button>
      </div>
      <h2 class="modal__title">${this.escapeHtml(summary.title || 'Untitled')}</h2>
      <p class="modal__summary">${this.escapeHtml(summary.summary || '')}</p>
      ${detailsHtml}
      ${actionsHtml}
      ${tagsHtml}
      ${transcriptHtml}
    `;
  },

  escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },
};
