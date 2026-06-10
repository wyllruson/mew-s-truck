let allProducts = [];
let appliedFilterValues = new Set();
let appliedSearchQuery = '';
let productPreviewReturnFocus = null;
let cachedLoginReturnScrollY = null;
let cachedLoginReturnAnchor = null;
let pendingLoginReturnProductId = null;
let loginReturnScrollLockHandler = null;
let loginReturnScrollRestoreObserver = null;
let loginReturnScrollRestoreTimeout = null;
const LOGIN_RETURN_STABLE_FRAMES_REQUIRED = 5;

const FILTER_CHECKBOX_SELECTOR = '#filters-options input[type="checkbox"]';
const TOTAL_FILTERS = 6;

function getFilterCheckboxes() {
  return document.querySelectorAll(FILTER_CHECKBOX_SELECTOR);
}

function getSelectedValues() {
  return [...getFilterCheckboxes()]
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
}

function setCheckboxesFromValues(values) {
  const activeValues = new Set(values);
  getFilterCheckboxes().forEach((checkbox) => {
    checkbox.checked = activeValues.has(checkbox.value);
  });
}

function scrollToInstant(y) {
  const top = Math.max(0, Math.round(y));
  window.scrollTo({ top, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = top;
  document.body.scrollTop = top;
}

function scheduleHomeScrollRestore(scrollY) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollToInstant(scrollY);
    });
  });
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

function scheduleScrollToFilterBar() {
  const scroll = () => scrollToFilterBar({ behavior: 'instant' });
  requestAnimationFrame(() => {
    requestAnimationFrame(scroll);
  });
  window.addEventListener('site-header:layout', scroll, { once: true });
  window.addEventListener('load', scroll, { once: true });
}

async function maybeScrollToFilterBarForLoggedInUser() {
  if (
    isLoginReturnRestorePending() ||
    !isFreshNavigationToHome() ||
    !(await isUserLoggedIn())
  ) {
    return;
  }
  scheduleScrollToFilterBar();
}

function openFiltersModal() {
  const modal = document.getElementById('filters-modal');
  const trigger = document.getElementById('filters-open-btn');

  setCheckboxesFromValues([...appliedFilterValues]);
  updateFilterUI();

  modal.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  window.MewModal?.lock(modal, { scrollContainer: '.filters-modal-body' });

  const showResultsBtn = document.getElementById('filters-show-results');
  showResultsBtn.focus();
}

function closeFiltersModal({ revert = true, restoreFocus = true } = {}) {
  const modal = document.getElementById('filters-modal');
  const trigger = document.getElementById('filters-open-btn');

  if (revert) {
    setCheckboxesFromValues([...appliedFilterValues]);
    updateFilterUI();
  }

  modal.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
  window.MewModal?.unlock(modal);

  if (restoreFocus) {
    trigger.focus({ preventScroll: true });
  }
}

function clearAllFilters() {
  getFilterCheckboxes().forEach((checkbox) => {
    checkbox.checked = false;
  });
  updateFilterUI();
}

function removeFilter(value) {
  const checkbox = document.querySelector(`${FILTER_CHECKBOX_SELECTOR}[value="${value}"]`);
  if (checkbox) {
    checkbox.checked = false;
    updateFilterUI();
  }
}

function renderUsedTags(selected) {
  const container = document.getElementById('filters-used-tags');
  container.innerHTML = '';

  selected.forEach((checkbox) => {
    const label = checkbox.dataset.label || checkbox.parentElement.textContent.trim();
    const tag = document.createElement('button');
    tag.type = 'button';
    tag.className = 'filter-tag filter-tag--removable';
    tag.setAttribute('aria-label', `Remove ${label}`);
    tag.addEventListener('click', () => {
      removeFilter(checkbox.value);
    });

    const text = document.createElement('span');
    text.className = 'filter-tag-label';
    text.textContent = label;

    const removeIcon = document.createElement('span');
    removeIcon.className = 'filter-tag-remove';
    removeIcon.textContent = '×';
    removeIcon.setAttribute('aria-hidden', 'true');

    tag.appendChild(text);
    tag.appendChild(removeIcon);
    container.appendChild(tag);
  });

  if (selected.length > 0) {
    const clearAll = document.createElement('button');
    clearAll.type = 'button';
    clearAll.className = 'filter-tag filter-tag--clear';
    clearAll.textContent = 'Clear all';
    clearAll.addEventListener('click', clearAllFilters);
    container.appendChild(clearAll);
  }
}

function updateHpBar(selectedCount) {
  const fill = document.getElementById('filters-hp-fill');
  const countEl = document.getElementById('filters-hp-count');
  const ratio = selectedCount / TOTAL_FILTERS;
  fill.style.width = `${ratio * 100}%`;
  countEl.textContent = `${selectedCount} / ${TOTAL_FILTERS}`;
}

function syncFilterOptionStyles() {
  getFilterCheckboxes().forEach((checkbox) => {
    checkbox.closest('.filter-option')?.classList.toggle('is-selected', checkbox.checked);
  });
}

function getActiveSortFilter(selectedCheckboxes) {
  const sortCheckbox = selectedCheckboxes.find(
    (checkbox) => checkbox.getAttribute('data-group') === 'sort'
  );
  return sortCheckbox ? sortCheckbox.value : null;
}

function getActiveAvailabilityFilters(selectedCheckboxes) {
  return selectedCheckboxes
    .filter((checkbox) => checkbox.getAttribute('data-group') === 'availability')
    .map((checkbox) => checkbox.value);
}

function filterProductsByAvailability(products, availabilityFilters) {
  if (availabilityFilters.length !== 1) {
    return products;
  }

  if (availabilityFilters[0] === 'in-stock') {
    return products.filter((product) => (product.stock ?? 0) > 0);
  }

  if (availabilityFilters[0] === 'out-of-stock') {
    return products.filter((product) => (product.stock ?? 0) <= 0);
  }

  return products;
}

function updateFilterUI() {
  const checkboxes = getFilterCheckboxes();
  const selected = [...checkboxes].filter((checkbox) => checkbox.checked);

  renderUsedTags(selected);
  syncFilterOptionStyles();
}

function applyProductFilters() {
  const checkboxes = getFilterCheckboxes();
  const selected = [...checkboxes].filter((checkbox) => checkbox.checked);
  const activeSortFilter = getActiveSortFilter(selected);
  const availabilityFilters = getActiveAvailabilityFilters(selected);

  let filteredProducts = [...allProducts];

  if (appliedSearchQuery) {
    filteredProducts = filteredProducts.filter((product) => {
      const name = product?.name || '';
      return name.toLowerCase().includes(appliedSearchQuery);
    });
  }

  filteredProducts = filterProductsByAvailability(filteredProducts, availabilityFilters);

  let sortedProducts = filteredProducts;

  if (activeSortFilter === 'name-asc') {
    sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
  } else if (activeSortFilter === 'name-desc') {
    sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
  } else if (activeSortFilter === 'price-asc') {
    sortedProducts.sort((a, b) => a.price - b.price);
  } else if (activeSortFilter === 'price-desc') {
    sortedProducts.sort((a, b) => b.price - a.price);
  } else {
    sortedProducts.sort((a, b) => b.id - a.id);
  }

  void displayProducts(sortedProducts);
}

function showResults() {
  appliedFilterValues = new Set(getSelectedValues());
  updateHpBar(appliedFilterValues.size);
  applyProductFilters();
  closeFiltersModal({ revert: false, restoreFocus: true });
  requestAnimationFrame(restoreScrollPosition);
}

function normalizeSearchQuery(query) {
  return (query || '').trim().toLowerCase();
}

function updateHomeSearchClearVisibility(input, clearBtn) {
  const hasQuery = Boolean(normalizeSearchQuery(input.value) || appliedSearchQuery);
  clearBtn.hidden = !hasQuery;
}

function clearHomeSearch(input, clearBtn) {
  input.value = '';
  appliedSearchQuery = '';
  applyProductFilters();
  updateHomeSearchClearVisibility(input, clearBtn);
}

function initHomeSearch() {
  const form = document.getElementById('home-search-form');
  const input = document.getElementById('home-search-input');
  const clearBtn = document.getElementById('home-search-clear-btn');

  if (!form || !input || !clearBtn) {
    return;
  }

  const syncClearBtn = () => updateHomeSearchClearVisibility(input, clearBtn);

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    appliedSearchQuery = normalizeSearchQuery(input.value);
    applyProductFilters();
    syncClearBtn();
  });

  input.addEventListener('input', syncClearBtn);

  clearBtn.addEventListener('click', () => {
    clearHomeSearch(input, clearBtn);
    input.focus();
  });

  // Clear quickly without needing to click: `Esc` while focused.
  input.addEventListener('keydown', (evt) => {
    if (evt.key !== 'Escape') {
      return;
    }
    evt.preventDefault();
    clearHomeSearch(input, clearBtn);
    input.blur();
  });
}

function openProductPreview(product, triggerEl) {
  const modal = document.getElementById('product-preview-modal');
  const img = document.getElementById('product-preview-img');

  img.src = MewApi.normalizeImagePath(product.image_path);
  img.alt = product.name;

  productPreviewReturnFocus = triggerEl;
  modal.hidden = false;
  window.MewModal?.lock(modal);
  document.getElementById('product-preview-close').focus();
}

function closeProductPreview() {
  const modal = document.getElementById('product-preview-modal');
  if (modal.hidden) {
    return;
  }

  modal.hidden = true;
  window.MewModal?.unlock(modal);

  if (productPreviewReturnFocus) {
    productPreviewReturnFocus.focus({ preventScroll: true });
    productPreviewReturnFocus = null;
  }
}

let productImageObserver;

function getProductImageObserver() {
  if (productImageObserver) {
    return productImageObserver;
  }

  productImageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        const img = entry.target;
        const src = img.dataset.src;
        if (!src) {
          return;
        }
        img.src = src;
        img.removeAttribute('data-src');
        productImageObserver.unobserve(img);
      });
    },
    { rootMargin: '400px 0px', threshold: 0.01 }
  );

  return productImageObserver;
}

function deferProductImageLoad(img, imageUrl) {
  const placeholder = mewPath(MEW_PATHS.placeholder);
  img.dataset.src = imageUrl;
  img.src = placeholder;

  if ('IntersectionObserver' in window) {
    getProductImageObserver().observe(img);
    return;
  }

  img.src = imageUrl;
  img.removeAttribute('data-src');
}

function initProductPreview() {
  const modal = document.getElementById('product-preview-modal');
  const closeBtn = document.getElementById('product-preview-close');
  const backdrop = modal.querySelector('[data-dismiss]');
  const img = document.getElementById('product-preview-img');

  closeBtn.addEventListener('click', closeProductPreview);
  backdrop.addEventListener('click', closeProductPreview);

  modal.addEventListener('click', (evt) => {
    evt.stopPropagation();
  });

  img.addEventListener('error', function onPreviewImageError() {
    this.src = mewPath(MEW_PATHS.placeholder);
  });
}

async function isUserLoggedIn() {
  try {
    const status = await MewApi.getLoginStatus();
    return status.loggedIn;
  } catch {
    return false;
  }
}

let cartAuthListenerBound = false;

function bindCartControlRefresh() {
  const bindAuth = async () => {
    if (!cartAuthListenerBound) {
      cartAuthListenerBound = true;
      try {
        const supabase = await MewApi.getSupabase();
        supabase.auth.onAuthStateChange(() => {
          void syncProductCartControls();
        });
      } catch {
        // Supabase unavailable — static product cards still work
      }
    }
    void syncProductCartControls();
  };

  if (window.supabase) {
    void bindAuth();
  } else {
    window.addEventListener('supabase:ready', () => {
      void bindAuth();
    }, { once: true });
  }
}

function fillProductCartControl(container, product, cartLine) {
  container.dataset.productId = String(product.id);
  container.dataset.productName = product.name;
  container.dataset.productStock = String(product.stock ?? 0);
  container.innerHTML = '';
  const stock = product.stock ?? 0;
  const quantity = cartLine?.quantity ?? 0;

  if (stock <= 0) {
    const soldOut = document.createElement('p');
    soldOut.className = 'product-card__sold-out';
    container.appendChild(soldOut);
    return;
  }

  if (quantity === 0) {
    const addToCartBtn = document.createElement('button');
    addToCartBtn.type = 'button';
    addToCartBtn.textContent = 'Add to Cart';
    addToCartBtn.classList.add('btn-primary', 'product-card__cta');
    addToCartBtn.addEventListener('click', async () => {
      window.MewHomeSession?.setLoginReturnProductId?.(product.id);
      const session = await MewApi.requireSession('Please log in to add items to your cart.');
      if (!session) {
        return;
      }

      try {
        const newQuantity = await MewApi.changeProductCartQuantity(product.id, 1);
        window.dispatchEvent(new CustomEvent('mew:cart-updated'));
        fillProductCartControl(container, product, { quantity: newQuantity });
      } catch (error) {
        console.error('Error adding to cart:', error);
        const message = error?.message || 'Failed to add item to cart.';
        await MewMessage.show(message);
      }
    });
    container.appendChild(addToCartBtn);
    return;
  }

  const stepper = MewQtyStepper.create({
    quantity,
    maxQuantity: stock,
    ariaLabel: product.name,
    onChange: async (delta) => {
      window.MewHomeSession?.setLoginReturnProductId?.(product.id);
      const session = await MewApi.requireSession('Please log in to change your cart.');
      if (!session) {
        return quantity;
      }

      try {
        const newQuantity = await MewApi.changeProductCartQuantity(product.id, delta);
        window.dispatchEvent(new CustomEvent('mew:cart-updated'));
        if (newQuantity === 0) {
          fillProductCartControl(container, product, null);
        }
        return newQuantity;
      } catch (error) {
        const message = error?.message || 'Failed to update cart.';
        await MewMessage.show(message);
        return quantity;
      }
    },
  });
  container.appendChild(stepper);
}

async function refreshProductStock() {
  if (!allProducts.length) {
    return;
  }

  try {
    const catalog = await MewApi.fetchAllCatalog();
    const stockById = new Map(catalog.map((row) => [row.id, row.stock ?? 0]));
    allProducts = allProducts.map((product) => ({
      ...product,
      stock: stockById.get(product.id) ?? product.stock ?? 0,
    }));

    applyProductFilters();
  } catch (error) {
    console.error('Error refreshing stock:', error);
  }
}

async function syncProductCartControls() {
  if (!(await isUserLoggedIn())) {
    return;
  }

  try {
    const cartLines = await MewApi.getCartLinesByProductId();
    document.querySelectorAll('.product-card__cart[data-product-id]').forEach((container) => {
      const productId = Number(container.dataset.productId);
      const line = cartLines.get(productId);
      const quantity = line?.quantity ?? 0;
      const stepper = container.querySelector('.qty-stepper');
      const addBtn = container.querySelector('.product-card__cta');

      if (quantity > 0 && stepper?.setQuantity) {
        stepper.setQuantity(quantity);
        return;
      }

      if (quantity === 0 && addBtn && !stepper) {
        return;
      }

      const product = {
        id: productId,
        name: container.dataset.productName || 'item',
        stock: Number(container.dataset.productStock) || 0,
      };
      fillProductCartControl(container, product, line);
    });
  } catch (error) {
    console.error('Error syncing cart quantities:', error);
  }
}

async function displayProducts(products) {
  const preserveLoginReturn = isLoginReturnRestorePending();
  const galleryScrollY = preserveLoginReturn ? null : getGalleryPreserveScrollY();
  const gallery = document.getElementById('product-gallery');

  if (preserveLoginReturn && gallery.offsetHeight > 0) {
    gallery.style.minHeight = `${gallery.offsetHeight}px`;
  }

  gallery.innerHTML = '';

  if (preserveLoginReturn) {
    applyLoginReturnScroll();
  } else {
    scheduleHomeScrollRestore(galleryScrollY);
  }
  gallery.setAttribute('aria-busy', 'false');
  gallery.classList.remove('product-gallery--empty-state');

  if (products.length === 0) {
    gallery.classList.add('product-gallery--empty-state');
    const empty = document.createElement('p');
    empty.className = 'product-gallery-empty site-notice popup-box';
    empty.textContent = appliedSearchQuery
      ? 'No cards match your search. Try adjusting or clearing your search. 🔻'
      : 'No cards match your filters. Try adjusting or clearing filters. 🔻';
    gallery.appendChild(empty);
    document.getElementById('item-count').textContent = '0 items';
    if (!preserveLoginReturn) {
      scheduleHomeScrollRestore(galleryScrollY);
    }
    return;
  }

  const fragment = document.createDocumentFragment();

  products.forEach((product) => {
    const card = document.createElement('article');
    card.classList.add('product-card');
    card.setAttribute('role', 'listitem');

    const mediaBtn = document.createElement('button');
    mediaBtn.type = 'button';
    mediaBtn.className = 'product-card__media-btn';
    mediaBtn.setAttribute('aria-label', `View larger image of ${product.name}`);

    const media = document.createElement('figure');
    media.className = 'product-card__media';

    const img = document.createElement('img');
    deferProductImageLoad(img, MewApi.normalizeImagePath(product.image_path));
    img.alt = '';
    img.decoding = 'async';
    img.fetchPriority = 'low';
    img.width = 736;
    img.height = 1024;
    img.onerror = function onImageError() {
      this.src = mewPath(MEW_PATHS.placeholder);
    };

    mediaBtn.addEventListener('click', () => {
      openProductPreview(product, mediaBtn);
    });

    const body = document.createElement('div');
    body.className = 'product-card__body';

    const name = document.createElement('h3');
    name.className = 'product-card__name';
    name.textContent = product.name;

    const price = document.createElement('p');
    price.className = 'product-card__price';
    price.innerHTML = `<span class="product-card__price-label">Price</span> $${Number(product.price).toFixed(2)}`;

    const stock = document.createElement('p');
    stock.className = 'product-card__stock';
    if ((product.stock ?? 0) <= 0) {
      stock.classList.add('product-card__stock--empty');
      stock.textContent = 'Out of stock';
    } else {
      stock.textContent = `${product.stock} in stock`;
    }

    const cartControl = document.createElement('div');
    cartControl.className = 'product-card__cart';
    fillProductCartControl(cartControl, product, null);

    media.appendChild(img);
    mediaBtn.appendChild(media);
    body.appendChild(name);
    body.appendChild(price);
    body.appendChild(stock);
    body.appendChild(cartControl);
    card.appendChild(mediaBtn);
    card.appendChild(body);
    fragment.appendChild(card);
  });

  gallery.appendChild(fragment);
  if (preserveLoginReturn) {
    gallery.style.minHeight = '';
  }
  document.getElementById('item-count').textContent =
    products.length === 1 ? '1 item' : `${products.length} items`;

  if (preserveLoginReturn) {
    applyLoginReturnScroll();
  } else {
    scheduleHomeScrollRestore(galleryScrollY);
    window.MewScrollRestore?.pulse();
  }

  try {
    if (await isUserLoggedIn()) {
      const cartLines = await MewApi.getCartLinesByProductId();
      gallery.querySelectorAll('.product-card__cart[data-product-id]').forEach((container) => {
        const productId = Number(container.dataset.productId);
        const product = {
          id: productId,
          name: container.dataset.productName || 'item',
          stock: Number(container.dataset.productStock) || 0,
        };
        fillProductCartControl(container, product, cartLines.get(productId));
      });
      if (preserveLoginReturn) {
        applyLoginReturnScroll();
      }
    }
  } catch (error) {
    console.error('Error loading cart quantities:', error);
  }
}

function dismissFiltersModal() {
  closeFiltersModal({ revert: true, restoreFocus: true });
}

function initFilters() {
  const openBtn = document.getElementById('filters-open-btn');
  const modal = document.getElementById('filters-modal');
  const showResultsBtn = document.getElementById('filters-show-results');
  const closeBtn = document.getElementById('filters-modal-close');
  const backdrop = modal.querySelector('[data-dismiss-filters]');
  const checkboxes = getFilterCheckboxes();

  openBtn.addEventListener('click', () => {
    if (modal.hidden) {
      openFiltersModal();
    }
  });

  showResultsBtn.addEventListener('click', showResults);
  closeBtn.addEventListener('click', dismissFiltersModal);
  backdrop.addEventListener('click', dismissFiltersModal);

  modal.addEventListener('click', (evt) => {
    evt.stopPropagation();
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.key !== 'Escape') {
      return;
    }
    const previewModal = document.getElementById('product-preview-modal');
    if (!previewModal.hidden) {
      closeProductPreview();
      return;
    }
    if (!modal.hidden) {
      dismissFiltersModal();
    }
  });

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      if (checkbox.checked && checkbox.getAttribute('data-group') === 'sort') {
        checkboxes.forEach((other) => {
          if (other !== checkbox && other.getAttribute('data-group') === 'sort') {
            other.checked = false;
          }
        });
      }
      updateFilterUI();
    });
  });

  updateHpBar(appliedFilterValues.size);
  updateFilterUI();
}

function setGalleryLoading(isLoading) {
  const gallery = document.getElementById('product-gallery');
  gallery.classList.toggle('product-gallery--loading', isLoading);
  gallery.setAttribute('aria-busy', String(isLoading));
}

async function loadProducts() {
  setGalleryLoading(true);
  try {
    allProducts = await MewApi.fetchAllCatalog();
    applyProductFilters();
  } finally {
    setGalleryLoading(false);
  }
}

function initScrollToCatalog() {
  const btn = document.getElementById('scroll-to-catalog-btn');
  const filterBar = getFilterBar();
  if (!btn || !filterBar) {
    return;
  }

  let visibilityTicking = false;

  function getFilterBarThreshold() {
    const rect = filterBar.getBoundingClientRect();
    return rect.top + window.scrollY + filterBar.offsetHeight + 16;
  }

  function updateScrollToCatalogVisibility() {
    btn.hidden = window.scrollY <= getFilterBarThreshold();
    visibilityTicking = false;
  }

  function scheduleVisibilityUpdate() {
    if (!visibilityTicking) {
      visibilityTicking = true;
      requestAnimationFrame(updateScrollToCatalogVisibility);
    }
  }

  btn.addEventListener('click', () => {
    scrollToFilterBar();
  });

  window.addEventListener('scroll', scheduleVisibilityUpdate, { passive: true });
  window.addEventListener('resize', scheduleVisibilityUpdate);
  window.addEventListener('site-header:layout', scheduleVisibilityUpdate);
  updateScrollToCatalogVisibility();
}

function initGrassParallax() {
  const grassDiv = document.querySelector('.grass-div');
  const smallScreenQuery = window.matchMedia('(max-width: 48rem)');
  if (
    !grassDiv ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    smallScreenQuery.matches
  ) {
    if (grassDiv) {
      grassDiv.style.transform = '';
    }
    return;
  }

  const parallaxFactor = 0.45;
  let ticking = false;

  function update() {
    grassDiv.style.transform = `translateY(${-window.scrollY * parallaxFactor}px)`;
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  update();
}

document.addEventListener('DOMContentLoaded', async () => {
  cacheLoginReturnTarget();
  if (isLoginReturnRestorePending()) {
    lockLoginReturnScroll();
  }

  initFilters();
  initHomeSearch();
  restoreHomeSessionFromLoginReturn();
  initProductPreview();
  initGrassParallax();
  initScrollToCatalog();
  bindCartControlRefresh();
  window.addEventListener('mew:cart-updated', () => {
    void syncProductCartControls();
    void refreshProductStock();
  });
  window.addEventListener('pageshow', (evt) => {
    if (evt.persisted) {
      void syncProductCartControls();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void syncProductCartControls();
    }
  });

  try {
    await loadProducts();
    if (!isLoginReturnRestorePending()) {
      await syncProductCartControls();
    } else {
      applyLoginReturnScroll();
    }
  } catch (error) {
    console.error('Error loading products:', error);
    const gallery = document.getElementById('product-gallery');
    gallery.classList.add('product-gallery--empty-state');
    const loadError = window.MewMessage
      ? MewMessage.format('Unable to load products. Check Supabase configuration.')
      : 'Unable to load products. Check Supabase configuration. 🔻';
    gallery.innerHTML = `<p class="product-gallery-empty site-notice site-notice--error popup-box">${loadError}</p>`;
  } finally {
    if (isLoginReturnRestorePending()) {
      await finalizeHomeLoginReturnScroll();
    } else {
      await maybeScrollToFilterBarForLoggedInUser();
    }
  }
});
