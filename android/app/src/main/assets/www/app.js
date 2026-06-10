(function () {
  'use strict';

  const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const USAGE_KEY = 'contentfloss_usage_count';
  const DATE_KEY = 'contentfloss_last_used_date';
  const FREE_LIMIT = 3;
  const LIMIT_MESSAGE = "You've reached your free limit. Upgrade to continue using ContentFloss.";

  const $ = (id) => document.getElementById(id);

  const els = {
    inputText: $('input-text'),
    inputLink: $('input-link'),
    platformSelect: $('platform-select'),
    btnGenerate: $('btn-generate'),
    status: $('status'),
    statusText: $('status-text'),
    error: $('error'),
    usageInfo: $('usage-info'),
    outputSection: $('output-section'),
    cardInstagram: $('card-instagram'),
    cardLinkedin: $('card-linkedin'),
    cardTwitter: $('card-twitter'),
    cardYoutube: $('card-youtube'),
    cardTiktok: $('card-tiktok'),
    cardFacebook: $('card-facebook'),
    cardHooks: $('card-hooks'),
    outInstagram: $('out-instagram'),
    outLinkedin: $('out-linkedin'),
    outTwitter: $('out-twitter'),
    outYoutube: $('out-youtube'),
    outTiktok: $('out-tiktok'),
    outFacebook: $('out-facebook'),
    outHooks: $('out-hooks')
  };

  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  function checkAndResetDaily() {
    const today = getToday();
    const lastDate = localStorage.getItem(DATE_KEY);

    if (lastDate !== today) {
      localStorage.setItem(USAGE_KEY, '0');
      localStorage.setItem(DATE_KEY, today);
    }
  }

  function getUsageCount() {
    checkAndResetDaily();
    return parseInt(localStorage.getItem(USAGE_KEY) || '0', 10);
  }

  function incrementUsage() {
    const count = getUsageCount() + 1;
    localStorage.setItem(USAGE_KEY, String(count));
    localStorage.setItem(DATE_KEY, getToday());
    updateUsageDisplay();
    return count;
  }

  function isLimitReached() {
    return getUsageCount() >= FREE_LIMIT;
  }

  function updateUsageDisplay() {
    if (!els.usageInfo) return;
    const remaining = Math.max(0, FREE_LIMIT - getUsageCount());
    els.usageInfo.textContent = remaining > 0
      ? `${remaining} free generation${remaining === 1 ? '' : 's'} remaining today`
      : 'No free generations remaining today';
  }

  function getApiBase() {
    if (window.CONTENTFLOSS_API_BASE) return window.CONTENTFLOSS_API_BASE;
    return 'https://contentfloss.vercel.app';
  }

  function isYouTubeUrl(str) {
    return YOUTUBE_REGEX.test(str.trim());
  }

  function showError(msg) {
    els.error.textContent = msg;
    els.error.hidden = false;
  }

  function clearError() {
    els.error.hidden = true;
    els.error.textContent = '';
  }

  function setLoading(active, text) {
    els.status.hidden = !active;
    els.statusText.textContent = text || 'Generating…';
    els.btnGenerate.disabled = active || isLimitReached();
  }

  function hideAllOutputs() {
    els.outputSection.hidden = true;
    [
      els.cardInstagram,
      els.cardLinkedin,
      els.cardTwitter,
      els.cardYoutube,
      els.cardTiktok,
      els.cardFacebook,
      els.cardHooks
    ].forEach((c) => {
      if (c) c.hidden = true;
    });
  }

  function showOutput(data, platform) {
    els.outputSection.hidden = false;
    const showAll = platform === 'all';

    if ((showAll || platform === 'instagram') && data.instagram) {
      els.outInstagram.textContent = data.instagram;
      els.cardInstagram.hidden = false;
    }

    if ((showAll || platform === 'linkedin') && data.linkedin) {
      els.outLinkedin.textContent = data.linkedin;
      els.cardLinkedin.hidden = false;
    }

    if ((showAll || platform === 'twitter') && data.twitter) {
      els.outTwitter.textContent = data.twitter;
      els.cardTwitter.hidden = false;
    }

    if ((showAll || platform === 'youtube') && data.youtube) {
      els.outYoutube.textContent = data.youtube;
      els.cardYoutube.hidden = false;
    }

    if ((showAll || platform === 'tiktok') && data.tiktok) {
      els.outTiktok.textContent = data.tiktok;
      els.cardTiktok.hidden = false;
    }

    if ((showAll || platform === 'facebook') && data.facebook) {
      els.outFacebook.textContent = data.facebook;
      els.cardFacebook.hidden = false;
    }

    if (data.hooks && data.hooks.length > 0) {
      els.outHooks.innerHTML = '';
      data.hooks.forEach((hook) => {
        const li = document.createElement('li');
        li.textContent = hook;
        els.outHooks.appendChild(li);
      });
      els.cardHooks.hidden = false;
    }
  }

  async function apiPost(endpoint, body) {
    const base = getApiBase();
    const res = await fetch(`${base}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function resolveContent() {
    const text = els.inputText.value.trim();
    const link = els.inputLink.value.trim();

    if (!text && !link) {
      throw new Error('Please paste some text or enter a YouTube link.');
    }

    if (link || isYouTubeUrl(text)) {
      const url = link || text;
      setLoading(true, 'Fetching transcript…');
      const result = await apiPost('/api/transcript', { url });
      return result.text;
    }

    return text;
  }

  async function handleGenerate() {
    clearError();
    hideAllOutputs();
    checkAndResetDaily();
    updateUsageDisplay();

    if (isLimitReached()) {
      showError(LIMIT_MESSAGE);
      els.btnGenerate.disabled = true;
      return;
    }

    incrementUsage();

    try {
      const content = await resolveContent();
      const platform = els.platformSelect.value;

      setLoading(true, 'Generating posts…');
      const result = await apiPost('/api/generate', { text: content, platform });

      setLoading(false);
      updateUsageDisplay();
      showOutput(result, platform);
    } catch (err) {
      setLoading(false);
      updateUsageDisplay();
      showError(err.message || 'Something went wrong. Please try again.');
    }
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  function handleCopy(e) {
    const targetId = e.target.dataset.target;
    const el = $(targetId);
    if (!el) return;

    navigator.clipboard.writeText(el.textContent).then(() => {
      showToast('Copied!');
    }).catch(() => {
      showToast('Copy failed');
    });
  }

  els.btnGenerate.addEventListener('click', handleGenerate);

  document.querySelectorAll('.btn-copy').forEach((btn) => {
    btn.addEventListener('click', handleCopy);
  });

  checkAndResetDaily();
  updateUsageDisplay();
  if (isLimitReached()) {
    els.btnGenerate.disabled = true;
  }
})();
