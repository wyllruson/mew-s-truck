(function initMewScrollRestore() {
  const STORAGE_PREFIX = 'mew:scroll:';
  const LOGIN_RETURN_KEY = 'mew:login-return';
  const LOGIN_RESTORE_PENDING_KEY = 'mew:login-restore-pending';

  function getStorageKey() {
    return STORAGE_PREFIX + window.location.pathname + window.location.search;
  }

  function getCurrentHref() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  function getNavigationType() {
    const [entry] = performance.getEntriesByType('navigation');
    return entry?.type || 'navigate';
  }

  function shouldRestoreOnLoad() {
    const type = getNavigationType();
    return type === 'reload' || type === 'back_forward';
  }

  function clearLoginRestoreState() {
    sessionStorage.removeItem(LOGIN_RESTORE_PENDING_KEY);
    sessionStorage.removeItem(LOGIN_RETURN_KEY);
  }

  function readLoginRestoreY() {
    if (sessionStorage.getItem(LOGIN_RESTORE_PENDING_KEY) !== '1') {
      return null;
    }

    const raw = sessionStorage.getItem(LOGIN_RETURN_KEY);
    if (!raw) {
      clearLoginRestoreState();
      return null;
    }

    try {
      const { href, scrollY } = JSON.parse(raw);
      if (href !== getCurrentHref()) {
        return null;
      }

      const y = Number.parseInt(String(scrollY), 10);
      if (!Number.isFinite(y) || y < 0) {
        clearLoginRestoreState();
        return null;
      }

      return y;
    } catch {
      clearLoginRestoreState();
      return null;
    }
  }

  function readSavedY() {
    const raw = sessionStorage.getItem(getStorageKey());
    if (raw === null) {
      return null;
    }
    const y = Number.parseInt(raw, 10);
    return Number.isFinite(y) && y >= 0 ? y : null;
  }

  function isLoginRestoreDeferred() {
    return sessionStorage.getItem(LOGIN_RESTORE_PENDING_KEY) === '1';
  }

  function normalizeSitePath(pathname) {
    const base = (window.MEW_SITE?.basePath || '').replace(/\/$/, '');
    let path = pathname || '/';
    if (base && path.startsWith(base)) {
      path = path.slice(base.length) || '/';
    }
    return path.replace(/\/index\.html$/i, '/').replace(/\/$/, '') || '/';
  }

  function isHomePagePath() {
    return normalizeSitePath(window.location.pathname) === normalizeSitePath(mewPath('/'));
  }

  function isLoginReturnForCurrentPage() {
    const raw = sessionStorage.getItem(LOGIN_RETURN_KEY);
    if (!raw) {
      return false;
    }

    try {
      const { href } = JSON.parse(raw);
      return href === getCurrentHref();
    } catch {
      return false;
    }
  }

  function getInitialRestoreState() {
    if (isLoginRestoreDeferred()) {
      if (isHomePagePath()) {
        // Home restores anchors and filters once product content is ready.
        if (!isLoginReturnForCurrentPage()) {
          clearLoginRestoreState();
        }
        return { targetY: null, loginRestoreActive: false };
      }

      const y = readLoginRestoreY();
      if (y !== null) {
        return { targetY: y, loginRestoreActive: true };
      }

      clearLoginRestoreState();
      return { targetY: null, loginRestoreActive: false };
    }
    if (shouldRestoreOnLoad()) {
      return { targetY: readSavedY(), loginRestoreActive: false };
    }
    return { targetY: null, loginRestoreActive: false };
  }

  function saveScrollY() {
    sessionStorage.setItem(getStorageKey(), String(Math.round(window.scrollY)));
  }

  function scrollToY(y) {
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  }

  function clampScrollY(y) {
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(y, maxY);
  }

  let { targetY, loginRestoreActive } = getInitialRestoreState();
  let restoreActive = targetY !== null;
  let restoreGuardUntil = 0;
  let saveTimer = null;
  let resizeObserver = null;
  let pulseRaf = null;

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  function pulseRestore() {
    if (!restoreActive || targetY === null) {
      return;
    }

    restoreGuardUntil = Date.now() + 100;
    const clamped = clampScrollY(targetY);
    scrollToY(clamped);

    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (Math.abs(window.scrollY - clamped) <= 1 && maxY >= targetY - 1) {
      restoreActive = false;
      if (loginRestoreActive) {
        clearLoginRestoreState();
        loginRestoreActive = false;
      }
      resizeObserver?.disconnect();
      resizeObserver = null;
    }
  }

  function schedulePulseRestore() {
    if (pulseRaf !== null) {
      return;
    }
    pulseRaf = requestAnimationFrame(() => {
      pulseRaf = null;
      pulseRestore();
    });
  }

  function scheduleSave() {
    if (isLoginRestoreDeferred()) {
      return;
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveScrollY, 100);
  }

  function bindRestoreObservers() {
    if (targetY === null) {
      return;
    }

    document.addEventListener('DOMContentLoaded', pulseRestore, { once: true });
    window.addEventListener('load', pulseRestore, { once: true });
    window.addEventListener('site-header:layout', pulseRestore);

    resizeObserver = new ResizeObserver(() => {
      if (restoreActive) {
        schedulePulseRestore();
      }
    });
    resizeObserver.observe(document.documentElement);

    window.addEventListener(
      'load',
      () => {
        setTimeout(() => {
          if (restoreActive) {
            pulseRestore();
          }
        }, 5000);
      },
      { once: true }
    );
  }

  window.addEventListener(
    'scroll',
    () => {
      if (Date.now() < restoreGuardUntil) {
        return;
      }
      if (restoreActive) {
        restoreActive = false;
        resizeObserver?.disconnect();
        resizeObserver = null;
      }
      scheduleSave();
    },
    { passive: true }
  );

  window.addEventListener('pagehide', () => {
    if (!isLoginRestoreDeferred()) {
      saveScrollY();
    }
  });

  window.addEventListener('pageshow', (evt) => {
    if (evt.persisted) {
      return;
    }
    ({ targetY, loginRestoreActive } = getInitialRestoreState());
    restoreActive = targetY !== null;
    if (restoreActive) {
      pulseRestore();
    }
  });

  bindRestoreObservers();

  function clearLoginRestore() {
    clearLoginRestoreState();
    loginRestoreActive = false;
    restoreActive = false;
    resizeObserver?.disconnect();
    resizeObserver = null;
  }

  window.MewScrollRestore = {
    pulse: pulseRestore,
    save: saveScrollY,
    isLoginRestorePending: () => sessionStorage.getItem(LOGIN_RESTORE_PENDING_KEY) === '1',
    getLoginRestoreY: readLoginRestoreY,
    clearLoginRestore,
  };
})();
