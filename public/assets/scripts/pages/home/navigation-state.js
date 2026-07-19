let allProducts = [];
let appliedFilterValues = new Set();
let appliedSearchQuery = '';
let cachedLoginReturnScrollY = null;
let cachedLoginReturnAnchor = null;
let pendingLoginReturnProductId = null;
let loginReturnScrollLockHandler = null;
let loginReturnScrollRestoreObserver = null;
let loginReturnScrollRestoreTimeout = null;
let pendingHomeNavigationState = null;
let restoringHomeNavigationState = false;
let homeNavigationSaveTimer = null;
let lastKnownHomeScrollY = Math.round(window.scrollY);
let suppressNextVisibleCartSync = false;
let preserveRestoredHomeCartControls = false;
let homeNavigationLiveRefreshTimer = null;
let homeScrollToCatalogVisibilityUpdate = null;
let homeGrassParallaxUpdate = null;
let homeStorefrontFitUpdate = null;
let restoredHomeVisualSnapshot = false;
const productPreviewButtonsBound = new WeakSet();
const LOGIN_RETURN_STABLE_FRAMES_REQUIRED = 5;

const FILTER_CHECKBOX_SELECTOR = '#filters-options input[type="checkbox"]';
const TOTAL_FILTERS = 6;
const HOME_NAV_STATE_PREFIX = 'mew:home:navigation-state:';
const HOME_NAV_ENTRY_STATE_PREFIX = 'mew:home:navigation-entry-state:';
const HOME_NAV_HISTORY_STATE_KEY = 'mewHomeNavigationState';
const HOME_NAV_HISTORY_ENTRY_ID_KEY = 'mewHomeNavigationEntryId';
const HOME_VISUAL_SNAPSHOT_SELECTORS = [
  '#storefront',
  '#grass-transition',
  '.products-section',
  '#filters-modal',
  '#product-preview-modal',
  '#scroll-to-catalog-btn',
];

function getFilterCheckboxes() {
  return document.querySelectorAll(FILTER_CHECKBOX_SELECTOR);
}

function getSelectedValues() {
  return [...getFilterCheckboxes()]
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
}

function getAppliedFilterCheckboxes() {
  return [...getFilterCheckboxes()].filter((checkbox) => appliedFilterValues.has(checkbox.value));
}

function setCheckboxesFromValues(values) {
  const activeValues = new Set(values);
  getFilterCheckboxes().forEach((checkbox) => {
    checkbox.checked = activeValues.has(checkbox.value);
  });
}

function scrollToInstant(y) {
  const top = Math.max(0, Math.round(Number(y) || 0));
  window.scrollTo({ top, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = top;
  document.body.scrollTop = top;
}

function scheduleHomeScrollRestore(scrollY) {
  const targetY = getValidScrollY(scrollY);
  if (targetY === null) {
    return;
  }

  const restore = () => {
    scrollToInstant(targetY);
    refreshHomeDerivedVisualState();
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      restore();
    });
  });
  window.addEventListener('site-header:layout', restore, { once: true });
  window.addEventListener('load', restore, { once: true });
}

function restoreScrollPosition() {
  window.MewScrollRestore?.pulse?.();
}

function getHomeNavigationStateKey() {
  return HOME_NAV_STATE_PREFIX + window.location.pathname + window.location.search;
}

function createHomeNavigationEntryId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getHomeNavigationEntryStateKey(entryId) {
  return entryId ? HOME_NAV_ENTRY_STATE_PREFIX + entryId : null;
}

function parseHomeNavigationState(raw, storageKey = null) {
  if (!raw) {
    return null;
  }

  try {
    const state = JSON.parse(raw);
    return state && typeof state === 'object' ? state : null;
  } catch {
    if (storageKey) {
      sessionStorage.removeItem(storageKey);
    }
    return null;
  }
}

function getValidScrollY(value) {
  const y = Number.parseInt(String(value), 10);
  return Number.isFinite(y) && y >= 0 ? y : null;
}

function getNavigationType() {
  const [entry] = performance.getEntriesByType('navigation');
  return entry?.type || 'navigate';
}

function isBackForwardNavigation() {
  return getNavigationType() === 'back_forward';
}

function readHomeNavigationState({ requireBackForward = true } = {}) {
  const sharedState = window.MewNavigationState?.getPendingPageState?.('home');
  if (sharedState) {
    return sharedState;
  }

  if (requireBackForward && !isBackForwardNavigation()) {
    return null;
  }

  const historyState = history.state && typeof history.state === 'object' ? history.state : {};
  const entryState = historyState[HOME_NAV_HISTORY_STATE_KEY];
  const entryId = historyState[HOME_NAV_HISTORY_ENTRY_ID_KEY];
  const entryStorageKey = getHomeNavigationEntryStateKey(entryId);
  const entryCacheState = parseHomeNavigationState(
    entryStorageKey ? sessionStorage.getItem(entryStorageKey) : null,
    entryStorageKey
  );
  const urlStorageKey = getHomeNavigationStateKey();
  const urlCacheState = entryId
    ? null
    : parseHomeNavigationState(sessionStorage.getItem(urlStorageKey), urlStorageKey);
  const cachedState = entryCacheState || urlCacheState;

  if (entryState && typeof entryState === 'object') {
    if (!cachedState) {
      return entryState;
    }

    return {
      ...cachedState,
      ...entryState,
      products: Array.isArray(cachedState?.products) ? cachedState.products : [],
      visualSnapshot: Array.isArray(cachedState?.visualSnapshot)
        ? cachedState.visualSnapshot
        : [],
      cartLines: Array.isArray(entryState.cartLines)
        ? entryState.cartLines
        : Array.isArray(cachedState?.cartLines)
          ? cachedState.cartLines
          : [],
      loadedProductImageIds: Array.isArray(entryState.loadedProductImageIds)
        ? entryState.loadedProductImageIds
        : Array.isArray(cachedState?.loadedProductImageIds)
          ? cachedState.loadedProductImageIds
          : [],
    };
  }

  return cachedState;
}

function getProductIdFromPreview() {
  const modal = document.getElementById('product-preview-modal');
  if (!modal || modal.hidden) {
    return null;
  }

  const src = document.getElementById('product-preview-img')?.src;
  const product = allProducts.find((item) => {
    const imageUrl = MewApi.normalizeImagePath(item.image_path);
    return src === imageUrl || src?.endsWith(imageUrl);
  });
  return product?.id ?? null;
}

function getCartLinesFromDom() {
  return [...document.querySelectorAll('.product-card__cart[data-product-id]')]
    .map((container) => {
      const productId = Number.parseInt(container.dataset.productId, 10);
      const quantity = Number.parseInt(
        container.querySelector('.qty-stepper__value')?.value || '0',
        10
      );

      if (!Number.isFinite(productId) || !Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      return { productId, quantity };
    })
    .filter(Boolean);
}

function getLoadedProductImageIdsFromDom() {
  return [...document.querySelectorAll('.product-card[data-product-id] .product-card__media img')]
    .map((img) => {
      if (img.dataset.src) {
        return null;
      }

      const productId = Number.parseInt(
        img.closest('.product-card')?.dataset.productId || '',
        10
      );
      return Number.isFinite(productId) ? productId : null;
    })
    .filter((productId) => productId !== null);
}

function getGalleryStatus(gallery) {
  if (!gallery) {
    return 'missing';
  }
  if (
    gallery.getAttribute('aria-busy') === 'true' ||
    gallery.classList.contains('product-gallery--loading')
  ) {
    return 'loading';
  }
  if (gallery.querySelector('.site-notice--error')) {
    return 'error';
  }
  if (gallery.classList.contains('product-gallery--empty-state')) {
    return 'empty';
  }
  return 'products';
}

function getHomeGalleryState() {
  const gallery = document.getElementById('product-gallery');
  const status = getGalleryStatus(gallery);

  return {
    status,
    className: gallery?.className || '',
    ariaBusy: gallery?.getAttribute('aria-busy') || 'false',
    html: status === 'empty' || status === 'error' ? gallery?.innerHTML || '' : '',
    itemCountText: document.getElementById('item-count')?.textContent || '',
  };
}

function restoreHomeGalleryState(state) {
  const galleryState = state?.galleryState;
  if (
    !galleryState ||
    (galleryState.status !== 'empty' && galleryState.status !== 'error')
  ) {
    return false;
  }

  const gallery = document.getElementById('product-gallery');
  if (!gallery) {
    return false;
  }

  gallery.className = galleryState.className || 'product-gallery';
  gallery.setAttribute('aria-busy', galleryState.ariaBusy || 'false');
  gallery.innerHTML = galleryState.html || '';

  const itemCount = document.getElementById('item-count');
  if (itemCount && typeof galleryState.itemCountText === 'string') {
    itemCount.textContent = galleryState.itemCountText;
  }

  return true;
}

function getHomeActiveElementState() {
  const active = document.activeElement;
  if (
    !(active instanceof HTMLElement) ||
    active === document.body ||
    active === document.documentElement ||
    !active.id
  ) {
    return null;
  }

  const activeState = { id: active.id };
  activeState.focusVisible = active.matches(':focus-visible');
  if (
    typeof active.selectionStart === 'number' &&
    typeof active.selectionEnd === 'number'
  ) {
    activeState.selectionStart = active.selectionStart;
    activeState.selectionEnd = active.selectionEnd;
  }

  return activeState;
}

function restoreHomeActiveElement(state) {
  const activeState = state?.activeElement;
  if (!activeState?.id) {
    return;
  }

  const element = document.getElementById(activeState.id);
  if (
    !(element instanceof HTMLElement) ||
    element.hidden ||
    element.closest('[hidden]') ||
    element.hasAttribute('disabled')
  ) {
    return;
  }

  const textFocusTypes = new Set([
    'email',
    'number',
    'password',
    'search',
    'tel',
    'text',
    'url',
  ]);
  const shouldRestoreFocus = Boolean(activeState.focusVisible) ||
    element.tagName === 'TEXTAREA' ||
    (element.tagName === 'INPUT' && textFocusTypes.has(element.type));
  if (!shouldRestoreFocus) {
    return;
  }

  element.focus({
    preventScroll: true,
    focusVisible: Boolean(activeState.focusVisible),
  });
  if (
    typeof element.setSelectionRange === 'function' &&
    Number.isInteger(activeState.selectionStart) &&
    Number.isInteger(activeState.selectionEnd)
  ) {
    try {
      element.setSelectionRange(activeState.selectionStart, activeState.selectionEnd);
    } catch {
      // Some focused controls expose selection APIs only for specific input types.
    }
  }
}

function refreshHomeDerivedVisualState() {
  homeStorefrontFitUpdate?.();
  homeScrollToCatalogVisibilityUpdate?.();
  homeGrassParallaxUpdate?.();
}

function restoreHomeHeaderVisualState() {
  window.MewSiteHeader?.clearVisualStateOverride?.();
}

function getHomeVisualSnapshot() {
  return HOME_VISUAL_SNAPSHOT_SELECTORS
    .map((selector) => {
      const element = document.querySelector(selector);
      return element
        ? {
            selector,
            outerHTML: element.outerHTML,
          }
        : null;
    })
    .filter(Boolean);
}

function restoreHomeVisualSnapshot(state) {
  const snapshot = Array.isArray(state?.visualSnapshot) ? state.visualSnapshot : [];
  if (!snapshot.length) {
    return false;
  }

  let restoredAny = false;
  snapshot.forEach(({ selector, outerHTML }) => {
    if (!selector || typeof outerHTML !== 'string') {
      return;
    }

    const current = document.querySelector(selector);
    if (!current) {
      return;
    }

    current.outerHTML = outerHTML;
    restoredAny = true;
  });

  restoredHomeVisualSnapshot = restoredAny;
  return restoredAny;
}

function getSnapshotScrollY() {
  lastKnownHomeScrollY = Math.round(window.scrollY);
  return lastKnownHomeScrollY;
}

function getProductSnapshot() {
  return allProducts.map((product) => ({
    id: product.id,
    name: product.name,
    image_path: product.image_path,
    price: product.price,
    stock: product.stock,
  }));
}

function cartLinesToMap(lines) {
  return new Map(
    (Array.isArray(lines) ? lines : [])
      .map((line) => {
        const productId = Number.parseInt(String(line.productId), 10);
        const quantity = Number.parseInt(String(line.quantity), 10);
        if (!Number.isFinite(productId) || !Number.isFinite(quantity) || quantity <= 0) {
          return null;
        }
        return [productId, { quantity }];
      })
      .filter(Boolean)
  );
}

function getHomeNavigationState({
  includeProducts = true,
  includeCartLines = true,
  includeVisualSnapshot = true,
} = {}) {
  const searchInput = document.getElementById('home-search-input');
  const filtersModal = document.getElementById('filters-modal');
  const filtersModalBody = document.querySelector('.filters-modal-body');

  return {
    scrollY: getSnapshotScrollY(),
    filters: [...appliedFilterValues],
    filterDraftValues: getSelectedValues(),
    search: appliedSearchQuery,
    searchInputValue: searchInput?.value || '',
    filtersModalOpen: Boolean(filtersModal && !filtersModal.hidden),
    filtersModalScrollTop: filtersModalBody?.scrollTop || 0,
    previewProductId: getProductIdFromPreview(),
    mobileNavOpen: false,
    headerState: null,
    loadedProductImageIds: getLoadedProductImageIdsFromDom(),
    galleryState: getHomeGalleryState(),
    activeElement: getHomeActiveElementState(),
    visualSnapshot: includeVisualSnapshot ? getHomeVisualSnapshot() : [],
    products: includeProducts ? getProductSnapshot() : [],
    cartLines: includeCartLines ? getCartLinesFromDom() : [],
  };
}

function saveHomeNavigationState({ full = true } = {}) {
  if (!isHomePage() || restoringHomeNavigationState) {
    return;
  }
  if (window.MewNavigationState) {
    window.MewNavigationState.save();
    return;
  }
  clearTimeout(homeNavigationSaveTimer);
  homeNavigationSaveTimer = null;
  window.MewScrollRestore?.save?.();
  const fullState = getHomeNavigationState({
    includeProducts: full,
    includeCartLines: true,
    includeVisualSnapshot: full,
  });
  const compactState = {
    ...fullState,
    products: [],
    visualSnapshot: [],
  };

  try {
    const currentState = history.state && typeof history.state === 'object' ? history.state : {};
    const entryId = currentState[HOME_NAV_HISTORY_ENTRY_ID_KEY] || createHomeNavigationEntryId();
    history.replaceState(
      {
        ...currentState,
        [HOME_NAV_HISTORY_ENTRY_ID_KEY]: entryId,
        [HOME_NAV_HISTORY_STATE_KEY]: compactState,
      },
      '',
      window.location.href
    );
    const entryStorageKey = getHomeNavigationEntryStateKey(entryId);
    if (entryStorageKey && full) {
      sessionStorage.setItem(entryStorageKey, JSON.stringify(fullState));
    }
  } catch {
    // Per-entry history state is best effort; session storage remains as a fallback.
  }

  try {
    sessionStorage.setItem(
      getHomeNavigationStateKey(),
      JSON.stringify(full ? fullState : compactState)
    );
  } catch {
    try {
      sessionStorage.setItem(
        getHomeNavigationStateKey(),
        JSON.stringify(compactState)
      );
    } catch {
      // Ignore storage failures; the browser may still restore from bfcache.
    }
  }
}

function scheduleHomeNavigationStateSave({ full = true } = {}) {
  if (restoringHomeNavigationState) {
    return;
  }
  clearTimeout(homeNavigationSaveTimer);
  homeNavigationSaveTimer = setTimeout(() => {
    saveHomeNavigationState({ full });
  }, 75);
}

function bindHomeNavigationStateCapture() {
  let scrollTicking = false;

  window.addEventListener(
    'scroll',
    () => {
      lastKnownHomeScrollY = Math.round(window.scrollY);
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(() => {
          scrollTicking = false;
          scheduleHomeNavigationStateSave({ full: false });
        });
      }
    },
    { passive: true }
  );

  document.addEventListener(
    'click',
    (evt) => {
      const link = evt.target.closest?.('a[href]');
      if (!link || link.target || link.hasAttribute('download')) {
        return;
      }

      const url = new URL(link.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        (url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash)
      ) {
        return;
      }

      saveHomeNavigationState();
    },
    true
  );

  window.addEventListener('pagehide', saveHomeNavigationState);
}

function shouldPreserveRestoredHomeCartControls() {
  return preserveRestoredHomeCartControls && !isLoginReturnRestorePending();
}

function getFilterBar() {
  return document.querySelector('.products-section .filter-bar');
}

function scrollToFilterBar({ behavior } = {}) {
  const filterBar = getFilterBar();
  if (!filterBar) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  filterBar.scrollIntoView({
    block: 'start',
    behavior: behavior ?? (prefersReducedMotion ? 'instant' : 'smooth'),
  });
}

function isFreshNavigationToHome() {
  const [entry] = performance.getEntriesByType('navigation');
  return (entry?.type || 'navigate') === 'navigate';
}

function isHomePage() {
  const path = window.location.pathname.replace(/\/index\.html$/i, '/').replace(/\/$/, '') || '/';
  const home = mewPath('/').replace(/\/index\.html$/i, '/').replace(/\/$/, '') || '/';
  return path === home;
}

function getLoginReturnHref() {
  const raw = sessionStorage.getItem('mew:login-return');
  if (!raw) {
    return null;
  }

  try {
    const { href } = JSON.parse(raw);
    return typeof href === 'string' ? href : null;
  } catch {
    return null;
  }
}

function getCurrentPageHref() {
  return window.location.pathname + window.location.search + window.location.hash;
}

function isLoginReturnForHomePage() {
  const returnHref = getLoginReturnHref();
  if (!returnHref) {
    return false;
  }

  return returnHref === getCurrentPageHref() && isHomePage();
}

function clearStaleLoginReturnState() {
  unlockLoginReturnScroll();
  stopLoginReturnScrollObservers();
  cachedLoginReturnScrollY = null;
  cachedLoginReturnAnchor = null;
  pendingLoginReturnProductId = null;
  window.MewScrollRestore?.clearLoginRestore?.();
}

function isLoginReturnRestorePending() {
  if (
    window.MewScrollRestore?.isLoginRestorePending?.() ||
    cachedLoginReturnScrollY !== null ||
    cachedLoginReturnAnchor !== null
  ) {
    if (!isLoginReturnForHomePage()) {
      clearStaleLoginReturnState();
      return false;
    }
    return true;
  }

  return false;
}

function getProductCardById(productId) {
  return document
    .querySelector(`.product-card__cart[data-product-id="${productId}"]`)
    ?.closest('.product-card') ?? null;
}

function buildLoginReturnAnchor(productId) {
  const card = getProductCardById(productId);
  const gallery = document.getElementById('product-gallery');
  if (!card || !gallery) {
    return null;
  }

  const galleryTop = gallery.getBoundingClientRect().top + window.scrollY;
  return {
    productId,
    cardViewportTop: card.getBoundingClientRect().top,
    galleryScrollOffset: window.scrollY - galleryTop,
  };
}

function parseLoginReturnAnchor(rawAnchor) {
  if (!rawAnchor || rawAnchor.productId == null) {
    return null;
  }

  const cardViewportTop = Number.parseFloat(String(rawAnchor.cardViewportTop));
  const galleryScrollOffset = Number.parseFloat(String(rawAnchor.galleryScrollOffset));
  if (!Number.isFinite(cardViewportTop)) {
    return null;
  }

  return {
    productId: rawAnchor.productId,
    cardViewportTop,
    galleryScrollOffset: Number.isFinite(galleryScrollOffset) ? galleryScrollOffset : null,
  };
}

function getGalleryPreserveScrollY() {
  if (cachedLoginReturnScrollY !== null) {
    return cachedLoginReturnScrollY;
  }

  const loginRestoreY = window.MewScrollRestore?.getLoginRestoreY?.();
  if (loginRestoreY !== null && loginRestoreY !== undefined) {
    return loginRestoreY;
  }
  return window.scrollY;
}

function cacheLoginReturnTarget() {
  if (!isLoginReturnForHomePage()) {
    return null;
  }

  const raw = sessionStorage.getItem('mew:login-return');
  if (!raw) {
    return null;
  }

  try {
    const data = JSON.parse(raw);

    if (cachedLoginReturnScrollY === null) {
      const scrollY = Number.parseInt(String(data.scrollY), 10);
      if (Number.isFinite(scrollY) && scrollY >= 0) {
        cachedLoginReturnScrollY = scrollY;
      }
    }

    if (cachedLoginReturnAnchor === null) {
      cachedLoginReturnAnchor = parseLoginReturnAnchor(data.homeState?.anchor);
    }
  } catch {
    // Ignore malformed saved session state.
  }

  return resolveLoginReturnScrollY();
}

function resolveLoginReturnScrollY() {
  if (cachedLoginReturnAnchor?.productId != null) {
    const card = getProductCardById(cachedLoginReturnAnchor.productId);
    if (card) {
      const rect = card.getBoundingClientRect();
      const target = window.scrollY + rect.top - cachedLoginReturnAnchor.cardViewportTop;
      return Math.max(0, Math.round(target));
    }
  }

  if (
    cachedLoginReturnAnchor?.galleryScrollOffset != null &&
    hasLoginReturnGalleryContent()
  ) {
    const gallery = document.getElementById('product-gallery');
    if (gallery) {
      const galleryTop = gallery.getBoundingClientRect().top + window.scrollY;
      return Math.max(0, Math.round(galleryTop + cachedLoginReturnAnchor.galleryScrollOffset));
    }
  }

  return cachedLoginReturnScrollY;
}

function applyLoginReturnScroll() {
  const targetY = resolveLoginReturnScrollY();
  if (targetY === null) {
    return;
  }
  scrollToInstant(targetY);
}

function lockLoginReturnScroll() {
  applyLoginReturnScroll();

  if (loginReturnScrollLockHandler) {
    return;
  }

  loginReturnScrollLockHandler = () => {
    if (!isLoginReturnRestorePending()) {
      return;
    }
    const targetY = resolveLoginReturnScrollY();
    if (targetY !== null && Math.abs(window.scrollY - targetY) > 1) {
      scrollToInstant(targetY);
    }
  };
  window.addEventListener('scroll', loginReturnScrollLockHandler, { passive: true });
}

function unlockLoginReturnScroll() {
  if (!loginReturnScrollLockHandler) {
    return;
  }
  window.removeEventListener('scroll', loginReturnScrollLockHandler);
  loginReturnScrollLockHandler = null;
}

function stopLoginReturnScrollObservers() {
  loginReturnScrollRestoreObserver?.disconnect();
  loginReturnScrollRestoreObserver = null;
  if (loginReturnScrollRestoreTimeout !== null) {
    clearTimeout(loginReturnScrollRestoreTimeout);
    loginReturnScrollRestoreTimeout = null;
  }
}

(function bootstrapLoginReturnScrollCache() {
  if (!window.MewScrollRestore?.isLoginRestorePending?.()) {
    return;
  }
  if (!isLoginReturnForHomePage()) {
    window.MewScrollRestore?.clearLoginRestore?.();
    return;
  }
  cacheLoginReturnTarget();
  if (isLoginReturnRestorePending()) {
    lockLoginReturnScroll();
  }
})();

function restoreHomeSessionFromLoginReturn() {
  cacheLoginReturnTarget();

  if (!window.MewScrollRestore?.isLoginRestorePending?.()) {
    return;
  }

  const raw = sessionStorage.getItem('mew:login-return');
  if (!raw) {
    return;
  }

  try {
    const { homeState } = JSON.parse(raw);
    if (!homeState) {
      return;
    }

    appliedFilterValues = new Set(homeState.filters || []);
    appliedSearchQuery = homeState.search || '';

    setCheckboxesFromValues([...appliedFilterValues]);
    updateHpBar(appliedFilterValues.size);
    updateFilterUI();

    const input = document.getElementById('home-search-input');
    const clearBtn = document.getElementById('home-search-clear-btn');
    if (input) {
      input.value = appliedSearchQuery;
      if (clearBtn) {
        updateHomeSearchClearVisibility(input, clearBtn);
      }
    }
  } catch {
    // Ignore malformed saved session state.
  }
}

function applyHomeNavigationControls(state, { useDraftFilters = false } = {}) {
  if (!state) {
    return;
  }

  appliedFilterValues = new Set(Array.isArray(state.filters) ? state.filters : []);
  appliedSearchQuery = typeof state.search === 'string' ? state.search : '';

  const checkedValues = useDraftFilters && Array.isArray(state.filterDraftValues)
    ? state.filterDraftValues
    : [...appliedFilterValues];
  setCheckboxesFromValues(checkedValues);
  updateHpBar(appliedFilterValues.size);
  updateFilterUI();

  const input = document.getElementById('home-search-input');
  const clearBtn = document.getElementById('home-search-clear-btn');
  if (input) {
    input.value = typeof state.searchInputValue === 'string'
      ? state.searchInputValue
      : appliedSearchQuery;
    if (clearBtn) {
      updateHomeSearchClearVisibility(input, clearBtn);
    }
  }
}

function hydrateHomeNavigationData(state) {
  if (!state) {
    return;
  }

  appliedFilterValues = new Set(Array.isArray(state.filters) ? state.filters : []);
  appliedSearchQuery = typeof state.search === 'string' ? state.search : '';
}

function restoreHomeFiltersModalScroll(state) {
  const scrollTop = Number.parseInt(String(state?.filtersModalScrollTop), 10);
  if (!Number.isFinite(scrollTop) || scrollTop <= 0) {
    return;
  }

  const body = document.querySelector('.filters-modal-body');
  if (body) {
    body.scrollTop = scrollTop;
  }
}

function restoreHomeNavigationTransientUi(state) {
  if (!state) {
    return;
  }

  const restoreMobileNav = () => {
    const header = document.getElementById('site-header');
    if (!header || typeof header.mewSetMobileNavOpen !== 'function') {
      return false;
    }

    header.mewSetMobileNavOpen(Boolean(state.mobileNavOpen));
    return true;
  };

  if (!restoreMobileNav()) {
    window.addEventListener('mew:site-header-ready', restoreMobileNav, { once: true });
  }

  if (state.previewProductId != null) {
    const product = allProducts.find((item) => String(item.id) === String(state.previewProductId));
    if (product) {
      openProductPreview(product, null);
      return;
    }
  }

  if (state.filtersModalOpen) {
    openFiltersModal();
    setCheckboxesFromValues(
      Array.isArray(state.filterDraftValues) ? state.filterDraftValues : [...appliedFilterValues]
    );
    updateFilterUI();
    restoreHomeFiltersModalScroll(state);
    requestAnimationFrame(() => restoreHomeFiltersModalScroll(state));
  }
}

function restoreHomeModalLocksFromDom() {
  const filtersModal = document.getElementById('filters-modal');
  const filtersTrigger = document.getElementById('filters-open-btn');
  const previewModal = document.getElementById('product-preview-modal');

  if (filtersModal && !filtersModal.hidden) {
    filtersTrigger?.setAttribute('aria-expanded', 'true');
    window.MewModal?.lock(filtersModal, { scrollContainer: '.filters-modal-body' });
  }

  if (previewModal && !previewModal.hidden) {
    window.MewModal?.lock(previewModal);
  }
}

function rebindRestoredProductGallery() {
  if (!allProducts.length) {
    return;
  }

  const productsById = new Map(allProducts.map((product) => [Number(product.id), product]));
  document.querySelectorAll('.product-card[data-product-id]').forEach((card) => {
    const productId = Number(card.dataset.productId);
    const product = productsById.get(productId);
    if (!product) {
      return;
    }

    const mediaBtn = card.querySelector('.product-card__media-btn');
    if (mediaBtn && !productPreviewButtonsBound.has(mediaBtn)) {
      productPreviewButtonsBound.add(mediaBtn);
      mediaBtn.addEventListener('click', () => {
        openProductPreview(product, mediaBtn);
      });
    }

    const cartControl = card.querySelector('.product-card__cart');
    if (!cartControl) {
      return;
    }

    const quantity = Number.parseInt(
      cartControl.querySelector('.qty-stepper__value')?.value || '0',
      10
    );
    fillProductCartControl(
      cartControl,
      product,
      Number.isFinite(quantity) && quantity > 0 ? { quantity } : null
    );
  });
}

async function restoreHomeNavigationStateFromCache() {
  const state = pendingHomeNavigationState;
  if (!state) {
    return false;
  }

  if (restoredHomeVisualSnapshot) {
    hydrateHomeNavigationData(state);
    applyHomeNavigationControls(state, { useDraftFilters: Boolean(state.filtersModalOpen) });
    allProducts = Array.isArray(state.products) ? state.products : [];
    rebindRestoredProductGallery();
    finalizeHomeNavigationRestore(state, { preserveRestoredDom: true });
    return true;
  }

  applyHomeNavigationControls(state);

  if (!Array.isArray(state.products) || state.products.length === 0) {
    restoringHomeNavigationState = true;
    allProducts = [];
    try {
      if (restoreHomeGalleryState(state)) {
        finalizeHomeNavigationRestore(state);
        return true;
      }
    } finally {
      restoringHomeNavigationState = false;
    }
    return false;
  }

  restoringHomeNavigationState = true;
  allProducts = state.products;

  try {
    await applyProductFilters({
      cartLinesOverride: cartLinesToMap(state.cartLines),
      loadedProductImageIds: state.loadedProductImageIds,
      restoreScrollY: state.scrollY,
    });
    finalizeHomeNavigationRestore(state);
    return true;
  } finally {
    restoringHomeNavigationState = false;
  }
}

function finalizeHomeNavigationRestore(state, { preserveRestoredDom = false } = {}) {
  if (!state) {
    return;
  }

  const scrollY = getValidScrollY(state.scrollY);
  if (scrollY !== null) {
    lastKnownHomeScrollY = scrollY;
    scrollToInstant(scrollY);
    scheduleHomeScrollRestore(scrollY);
  }
  if (preserveRestoredDom) {
    restoreHomeModalLocksFromDom();
    restoreHomeFiltersModalScroll(state);
    requestAnimationFrame(() => restoreHomeFiltersModalScroll(state));
  } else {
    restoreHomeNavigationTransientUi(state);
  }
  restoreHomeHeaderVisualState(state);
  restoreHomeActiveElement(state);
  refreshHomeDerivedVisualState();
  requestAnimationFrame(() => {
    restoreHomeHeaderVisualState(state);
    restoreHomeActiveElement(state);
    refreshHomeDerivedVisualState();
  });
}

function scheduleHomeLiveRefreshAfterRestore(state = null) {
  if (homeNavigationLiveRefreshTimer !== null) {
    return;
  }

  const restoredScrollY = getValidScrollY(state?.scrollY) ?? Math.round(window.scrollY);

  homeNavigationLiveRefreshTimer = window.setTimeout(async () => {
    homeNavigationLiveRefreshTimer = null;
    if (!isHomePage() || isLoginReturnRestorePending()) {
      return;
    }

    preserveRestoredHomeCartControls = false;
    window.MewSiteHeader?.clearVisualStateOverride?.();

    try {
      const targetScrollY = Math.abs(window.scrollY - restoredScrollY) <= 2
        ? restoredScrollY
        : Math.round(window.scrollY);
      await loadProducts({
        loadedProductImageIds: getLoadedProductImageIdsFromDom(),
        restoreScrollY: targetScrollY,
      });
      scheduleHomeScrollRestore(targetScrollY);
      scheduleHomeNavigationStateSave();
    } catch (error) {
      console.error('Error refreshing restored home state:', error);
      try {
        await syncProductCartControls();
      } catch {
        // The live product refresh already reported the actionable failure.
      }
    }
  }, 500);
}

window.MewNavigationState?.registerPage({
  key: 'home',
  capture: () => getHomeNavigationState({
    includeProducts: false,
    includeCartLines: false,
    includeVisualSnapshot: false,
  }),
  restore: (state) => {
    finalizeHomeNavigationRestore(state);
  },
  refresh: async (state) => {
    if (!state || isLoginReturnRestorePending()) {
      return;
    }
    applyHomeNavigationControls(state, { useDraftFilters: Boolean(state.filtersModalOpen) });
    await loadProducts({
      loadedProductImageIds: state.loadedProductImageIds,
      restoreScrollY: state.scrollY,
    });
    finalizeHomeNavigationRestore(state);
  },
});

function finishLoginReturnRestore() {
  unlockLoginReturnScroll();
  stopLoginReturnScrollObservers();
  cachedLoginReturnScrollY = null;
  cachedLoginReturnAnchor = null;
  pendingLoginReturnProductId = null;
  window.MewScrollRestore?.clearLoginRestore?.();
}

function isLoginReturnScrollAtTarget() {
  const targetY = resolveLoginReturnScrollY();
  if (targetY === null) {
    return false;
  }

  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const clamped = Math.min(targetY, maxY);
  return Math.abs(window.scrollY - clamped) <= 2 && maxY >= targetY - 1;
}

function hasLoginReturnGalleryContent() {
  return Boolean(document.getElementById('product-gallery')?.querySelector('.product-card'));
}

async function waitForLoginReturnScrollStable() {
  await new Promise((resolve) => {
    let stableFrames = 0;
    let settled = false;

    const done = () => {
      if (settled) {
        return;
      }
      settled = true;
      window.removeEventListener('site-header:layout', onLayout);
      resolve();
    };

    const tryStable = () => {
      applyLoginReturnScroll();
      if (!hasLoginReturnGalleryContent()) {
        stableFrames = 0;
        return;
      }
      if (isLoginReturnScrollAtTarget()) {
        stableFrames += 1;
        if (stableFrames >= LOGIN_RETURN_STABLE_FRAMES_REQUIRED) {
          done();
        }
      } else {
        stableFrames = 0;
      }
    };

    const onLayout = () => tryStable();
    window.addEventListener('site-header:layout', onLayout);
    window.addEventListener('load', onLayout, { once: true });

    loginReturnScrollRestoreObserver = new ResizeObserver(tryStable);
    loginReturnScrollRestoreObserver.observe(document.documentElement);
    const gallery = document.getElementById('product-gallery');
    if (gallery) {
      loginReturnScrollRestoreObserver.observe(gallery);
    }

    loginReturnScrollRestoreTimeout = window.setTimeout(done, 10000);

    (function rafLoop() {
      if (settled) {
        return;
      }
      tryStable();
      requestAnimationFrame(rafLoop);
    })();
  });
}

async function waitForLoginReturnGallery() {
  if (hasLoginReturnGalleryContent()) {
    return;
  }

  const gallery = document.getElementById('product-gallery');
  if (!gallery) {
    return;
  }

  await new Promise((resolve) => {
    const timeoutId = window.setTimeout(resolve, 8000);
    const observer = new MutationObserver(() => {
      if (hasLoginReturnGalleryContent()) {
        clearTimeout(timeoutId);
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(gallery, { childList: true, subtree: true });
  });
}

async function finalizeHomeLoginReturnScroll() {
  if (!isLoginReturnRestorePending()) {
    return;
  }

  cacheLoginReturnTarget();
  if (resolveLoginReturnScrollY() === null) {
    return;
  }

  lockLoginReturnScroll();
  await waitForLoginReturnGallery();
  await waitForLoginReturnScrollStable();
  applyLoginReturnScroll();
  finishLoginReturnRestore();
}

window.MewHomeSession = {
  setLoginReturnProductId(productId) {
    pendingLoginReturnProductId = productId;
  },
  capture() {
    if (!isHomePage()) {
      return null;
    }

    const anchorProductId = pendingLoginReturnProductId;
    const anchor = anchorProductId != null ? buildLoginReturnAnchor(anchorProductId) : null;

    return {
      homeState: {
        filters: [...appliedFilterValues],
        search: appliedSearchQuery,
        anchor,
      },
    };
  },
};
