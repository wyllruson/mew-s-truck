/**
 * Site-wide informational messages: popup-box modal with Silkscreen and 🔻 suffix.
 */
(function initSiteMessage() {
  const MARKER = '🔻';

  function formatMessage(message) {
    const text = String(message ?? '').trim();
    if (!text) {
      return MARKER;
    }
    if (text.endsWith(MARKER)) {
      return text;
    }
    return `${text} ${MARKER}`;
  }

  let root = null;
  let textEl = null;
  let resolveAlert = null;

  function ensureModal() {
    if (root) {
      return;
    }

    root = document.createElement('div');
    root.id = 'site-message';
    root.className = 'site-message';
    root.hidden = true;
    root.innerHTML = `
      <div class="site-message__backdrop" data-dismiss-site-message tabindex="-1" aria-hidden="true"></div>
      <div
        class="site-message__panel popup-box"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="site-message-text"
      >
        <p id="site-message-text" class="site-message__text"></p>
        <button type="button" class="site-message__ok btn-primary" data-dismiss-site-message>OK</button>
      </div>
    `;
    document.body.appendChild(root);
    textEl = root.querySelector('#site-message-text');

    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-dismiss-site-message]')) {
        closeAlert();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && root && !root.hidden) {
        closeAlert();
      }
    });
  }

  function closeAlert() {
    if (root) {
      root.hidden = true;
      window.MewModal?.unlock(root);
    }
    if (resolveAlert) {
      const done = resolveAlert;
      resolveAlert = null;
      done();
    }
  }

  function showAlert(message) {
    ensureModal();
    textEl.textContent = formatMessage(message);
    root.hidden = false;
    window.MewModal?.lock(root);
    root.querySelector('.site-message__ok')?.focus();

    return new Promise((resolve) => {
      resolveAlert = resolve;
    });
  }

  window.MewMessage = {
    format: formatMessage,
    show: showAlert,
  };
})();
