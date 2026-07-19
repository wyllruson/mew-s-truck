(function initMewNavigationState() {
  const ENTRY_ID_KEY = 'mewNavigationEntryId';
  const STORAGE_PREFIX = 'mew:navigation-entry:';
  const LOGIN_RETURN_KEY = 'mew:login-return';
  const LOGIN_RESTORE_PENDING_KEY = 'mew:login-restore-pending';
  const MAX_SNAPSHOT_LENGTH = 2_000_000;

  let adapter = null;
  let saveTimer = null;
  let resizeObserver = null;
  let pulseRaf = null;
  let restoreGuardUntil = 0;
  let sharedRestored = false;

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

  function createEntryId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function ensureEntryId() {
    const state = history.state && typeof history.state === 'object' ? history.state : {};
    const existing = state[ENTRY_ID_KEY];
    if (typeof existing === 'string' && existing) {
      return existing;
    }

    const entryId = createEntryId();
    try {
      history.replaceState({ ...state, [ENTRY_ID_KEY]: entryId }, '', window.location.href);
    } catch {
      // History state is best effort; the in-memory ID still isolates this page load.
    }
    return entryId;
  }

  const entryId = ensureEntryId();

  function getStorageKey() {
    return STORAGE_PREFIX + entryId;
  }

  function readSnapshot() {
    if (!shouldRestoreOnLoad()) {
      return null;
    }
    try {
      const raw = sessionStorage.getItem(getStorageKey());
      if (!raw || raw.length > MAX_SNAPSHOT_LENGTH) {
        return null;
      }
      const snapshot = JSON.parse(raw);
      if (
        !snapshot ||
        typeof snapshot !== 'object' ||
        snapshot.href !== getCurrentHref()
      ) {
        return null;
      }
      return snapshot;
    } catch {
      try {
        sessionStorage.removeItem(getStorageKey());
      } catch {
        // Storage can be disabled or full.
      }
      return null;
    }
  }

  let pendingSnapshot = readSnapshot();

  function clearLoginRestoreState() {
    try {
      sessionStorage.removeItem(LOGIN_RESTORE_PENDING_KEY);
      sessionStorage.removeItem(LOGIN_RETURN_KEY);
    } catch {
      // Storage can be disabled.
    }
  }

  function readLoginRestoreY() {
    try {
      if (sessionStorage.getItem(LOGIN_RESTORE_PENDING_KEY) !== '1') {
        return null;
      }
      const raw = sessionStorage.getItem(LOGIN_RETURN_KEY);
      if (!raw) {
        clearLoginRestoreState();
        return null;
      }
      const { href, scrollY } = JSON.parse(raw);
      const y = Number.parseInt(String(scrollY), 10);
      if (href !== getCurrentHref() || !Number.isFinite(y) || y < 0) {
        return null;
      }
      return y;
    } catch {
      clearLoginRestoreState();
      return null;
    }
  }

  function isLoginRestoreDeferred() {
    try {
      return sessionStorage.getItem(LOGIN_RESTORE_PENDING_KEY) === '1';
    } catch {
      return false;
    }
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
    try {
      const raw = sessionStorage.getItem(LOGIN_RETURN_KEY);
      return raw ? JSON.parse(raw).href === getCurrentHref() : false;
    } catch {
      return false;
    }
  }

  function getInitialTargetY() {
    if (isLoginRestoreDeferred()) {
      if (isHomePagePath()) {
        if (!isLoginReturnForCurrentPage()) {
          clearLoginRestoreState();
        }
        return { y: null, login: false };
      }
      const loginY = readLoginRestoreY();
      if (loginY !== null) {
        return { y: loginY, login: true };
      }
      clearLoginRestoreState();
    }

    const y = Number.parseInt(String(pendingSnapshot?.shared?.scrollY), 10);
    return {
      y: Number.isFinite(y) && y >= 0 ? y : null,
      login: false,
    };
  }

  let initialTarget = getInitialTargetY();
  let targetY = initialTarget.y;
  let loginRestoreActive = initialTarget.login;
  let restoreActive = targetY !== null;

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  function getActiveElementState() {
    const active = document.activeElement;
    if (
      !(active instanceof HTMLElement) ||
      active === document.body ||
      active === document.documentElement ||
      !active.id ||
      (active instanceof HTMLInputElement && active.type === 'password')
    ) {
      return null;
    }

    const state = { id: active.id };
    if (typeof active.selectionStart === 'number' && typeof active.selectionEnd === 'number') {
      state.selectionStart = active.selectionStart;
      state.selectionEnd = active.selectionEnd;
    }
    return state;
  }

  function captureSharedState() {
    const header = document.getElementById('site-header');
    const nestedScroll = {};
    document.querySelectorAll('[data-navigation-scroll][id]').forEach((element) => {
      if (element.scrollTop || element.scrollLeft) {
        nestedScroll[element.id] = {
          top: Math.round(element.scrollTop),
          left: Math.round(element.scrollLeft),
        };
      }
    });

    return {
      scrollY: Math.round(window.scrollY),
      mobileNavOpen: Boolean(header?.classList.contains('nav-open')),
      activeElement: getActiveElementState(),
      nestedScroll,
    };
  }

  function getPageState() {
    if (!adapter?.key || typeof adapter.capture !== 'function') {
      return null;
    }
    try {
      return adapter.capture();
    } catch (error) {
      console.error(`Error capturing navigation state for ${adapter.key}:`, error);
      return null;
    }
  }

  function saveNow() {
    if (isLoginRestoreDeferred()) {
      return;
    }

    const pages = {};
    if (adapter?.key) {
      pages[adapter.key] = getPageState();
    }
    const snapshot = {
      version: 1,
      href: getCurrentHref(),
      shared: captureSharedState(),
      pages,
    };

    try {
      const raw = JSON.stringify(snapshot);
      if (raw.length <= MAX_SNAPSHOT_LENGTH) {
        sessionStorage.setItem(getStorageKey(), raw);
      }
    } catch {
      // Navigation must still work when storage is unavailable or full.
    }
  }

  function scheduleSave() {
    if (isLoginRestoreDeferred()) {
      return;
    }
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveNow, 100);
  }

  function scrollToY(y) {
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  }

  function clampScrollY(y) {
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(y, maxY);
  }

  function stopRestoreObserver() {
    resizeObserver?.disconnect();
    resizeObserver = null;
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
      stopRestoreObserver();
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

  function bindRestoreObserver() {
    if (targetY === null || resizeObserver) {
      return;
    }
    resizeObserver = new ResizeObserver(schedulePulseRestore);
    resizeObserver.observe(document.documentElement);
    window.addEventListener('load', pulseRestore, { once: true });
    window.addEventListener('site-header:layout', pulseRestore);
  }

  function restoreFocus(state) {
    const active = state?.activeElement;
    if (!active?.id) {
      return;
    }
    const element = document.getElementById(active.id);
    if (
      !(element instanceof HTMLElement) ||
      element.hidden ||
      element.closest('[hidden]') ||
      element.hasAttribute('disabled') ||
      (element instanceof HTMLInputElement && element.type === 'password')
    ) {
      return;
    }
    element.focus({ preventScroll: true });
    if (
      typeof element.setSelectionRange === 'function' &&
      Number.isInteger(active.selectionStart) &&
      Number.isInteger(active.selectionEnd)
    ) {
      try {
        element.setSelectionRange(active.selectionStart, active.selectionEnd);
      } catch {
        // Only text-like controls support selection restoration.
      }
    }
  }

  function restoreSharedState() {
    if (sharedRestored || !pendingSnapshot?.shared) {
      return;
    }
    sharedRestored = true;
    const state = pendingSnapshot.shared;

    const restoreHeader = () => {
      const header = document.getElementById('site-header');
      if (!header || typeof header.mewSetMobileNavOpen !== 'function') {
        return false;
      }
      header.mewSetMobileNavOpen(Boolean(state.mobileNavOpen));
      return true;
    };
    if (!restoreHeader()) {
      window.addEventListener('mew:site-header-ready', restoreHeader, { once: true });
    }

    Object.entries(state.nestedScroll || {}).forEach(([id, position]) => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollTop = Number(position?.top) || 0;
        element.scrollLeft = Number(position?.left) || 0;
      }
    });

    const savedY = Number.parseInt(String(state.scrollY), 10);
    if (!isLoginRestoreDeferred() && Number.isFinite(savedY) && savedY >= 0) {
      targetY = savedY;
      restoreActive = true;
      bindRestoreObserver();
      pulseRestore();
    }
    requestAnimationFrame(() => restoreFocus(state));
  }

  function registerPage(nextAdapter) {
    if (!nextAdapter?.key || typeof nextAdapter.capture !== 'function') {
      throw new TypeError('MewNavigationState.registerPage requires a key and capture function.');
    }
    adapter = nextAdapter;
  }

  async function restorePage(context) {
    const state = adapter?.key ? pendingSnapshot?.pages?.[adapter.key] : null;
    if (state && typeof adapter.restore === 'function') {
      try {
        await adapter.restore(state, context);
      } catch (error) {
        console.error(`Error restoring navigation state for ${adapter.key}:`, error);
      }
    }
    restoreSharedState();
    return Boolean(state);
  }

  async function refreshPage(context) {
    if (typeof adapter?.refresh !== 'function') {
      return false;
    }
    const state = getPageState();
    try {
      await adapter.refresh(state, context);
      restoreSharedState();
      return true;
    } catch (error) {
      console.error(`Error refreshing navigation state for ${adapter.key}:`, error);
      return false;
    }
  }

  window.MewNavigationState = {
    registerPage,
    restorePage,
    refreshPage,
    save: saveNow,
    scheduleSave,
    hasPendingRestore: () => Boolean(pendingSnapshot),
    getPendingPageState: (key) => pendingSnapshot?.pages?.[key] ?? null,
    restoreShared: restoreSharedState,
  };

  window.MewScrollRestore = {
    pulse: pulseRestore,
    save: saveNow,
    isLoginRestorePending: isLoginRestoreDeferred,
    getLoginRestoreY: readLoginRestoreY,
    clearLoginRestore() {
      clearLoginRestoreState();
      loginRestoreActive = false;
      restoreActive = false;
      stopRestoreObserver();
    },
  };

  window.addEventListener('scroll', () => {
    if (Date.now() < restoreGuardUntil) {
      return;
    }
    if (restoreActive) {
      restoreActive = false;
      stopRestoreObserver();
    }
    scheduleSave();
  }, { passive: true });

  document.addEventListener('input', scheduleSave, true);
  document.addEventListener('change', scheduleSave, true);
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href]');
    if (link && !link.target && !link.hasAttribute('download')) {
      saveNow();
      return;
    }
    scheduleSave();
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    window.setTimeout(() => {
      if (!adapter) {
        restoreSharedState();
      }
    }, 0);
  }, { once: true });

  window.addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveNow();
    }
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      void refreshPage();
    }
  });

  bindRestoreObserver();
})();
