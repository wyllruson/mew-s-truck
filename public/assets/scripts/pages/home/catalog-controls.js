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
  scheduleHomeNavigationStateSave();

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
  scheduleHomeNavigationStateSave();

  if (restoreFocus) {
    trigger.focus({ preventScroll: true });
  }
}

function clearAllFilters() {
  getFilterCheckboxes().forEach((checkbox) => {
    checkbox.checked = false;
  });
  updateFilterUI();
  scheduleHomeNavigationStateSave();
}

function removeFilter(value) {
  const checkbox = document.querySelector(`${FILTER_CHECKBOX_SELECTOR}[value="${value}"]`);
  if (checkbox) {
    checkbox.checked = false;
    updateFilterUI();
    scheduleHomeNavigationStateSave();
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

function applyProductFilters(options = {}) {
  const selected = getAppliedFilterCheckboxes();
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

  updateHpBar(appliedFilterValues.size);
  return displayProducts(sortedProducts, options);
}

async function showResults() {
  appliedFilterValues = new Set(getSelectedValues());
  await applyProductFilters();
  closeFiltersModal({ revert: false, restoreFocus: true });
  saveHomeNavigationState();
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
  void applyProductFilters();
  updateHomeSearchClearVisibility(input, clearBtn);
  saveHomeNavigationState();
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
    void applyProductFilters();
    syncClearBtn();
    saveHomeNavigationState();
  });

  input.addEventListener('input', () => {
    syncClearBtn();
    scheduleHomeNavigationStateSave({ full: false });
  });

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

let productPreview = null;

function getProductPreview() {
  if (!productPreview) {
    productPreview = MewMediaPreview.create({
      modalId: 'product-preview-modal',
      imageId: 'product-preview-img',
      closeId: 'product-preview-close',
      dismissSelector: '[data-dismiss]',
      onOpen: scheduleHomeNavigationStateSave,
      onClose: scheduleHomeNavigationStateSave,
    });
  }
  return productPreview;
}

function openProductPreview(product, triggerEl) {
  getProductPreview().open({
    imageSrc: MewApi.normalizeImagePath(product.image_path),
    label: product.name,
    triggerEl,
  });
}

function closeProductPreview() {
  getProductPreview().close();
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
  getProductPreview().bind();
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
          if (!shouldPreserveRestoredHomeCartControls()) {
            void syncProductCartControls();
          }
        });
      } catch {
        // Supabase unavailable — static product cards still work
      }
    }
    if (!shouldPreserveRestoredHomeCartControls()) {
      void syncProductCartControls();
    }
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
      if (addToCartBtn.disabled) {
        return;
      }

      window.MewHomeSession?.setLoginReturnProductId?.(product.id);
      addToCartBtn.disabled = true;
      addToCartBtn.setAttribute('aria-busy', 'true');

      const session = await MewApi.requireSession('Please log in to add items to your cart.');
      if (!session) {
        addToCartBtn.disabled = false;
        addToCartBtn.removeAttribute('aria-busy');
        return;
      }

      try {
        const newQuantity = await MewApi.changeProductCartQuantity(product.id, 1, session);
        window.dispatchEvent(new CustomEvent('mew:cart-updated'));
        fillProductCartControl(container, product, { quantity: newQuantity });
      } catch (error) {
        console.error('Error adding to cart:', error);
        const message = error?.message || 'Failed to add item to cart.';
        await MewMessage.show(message);
        addToCartBtn.disabled = false;
        addToCartBtn.removeAttribute('aria-busy');
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
        const newQuantity = await MewApi.changeProductCartQuantity(product.id, delta, session);
        window.dispatchEvent(new CustomEvent('mew:cart-updated'));
        return newQuantity;
      } catch (error) {
        const message = error?.message || 'Failed to update cart.';
        await MewMessage.show(message);
        return quantity;
      }
    },
    onSettled: (finalQuantity) => {
      if (finalQuantity === 0) {
        fillProductCartControl(container, product, null);
      }
    },
  });
  container.appendChild(stepper);
}

async function syncProductCartControls() {
  if (shouldPreserveRestoredHomeCartControls()) {
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

      if (stepper?.isBusy?.()) {
        return;
      }

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

async function displayProducts(products, options = {}) {
  const preserveLoginReturn = isLoginReturnRestorePending();
  const galleryScrollY = preserveLoginReturn
    ? null
    : options.restoreScrollY ?? getGalleryPreserveScrollY();
  const gallery = document.getElementById('product-gallery');
  const loadedProductImageIds = new Set(
    (Array.isArray(options.loadedProductImageIds) ? options.loadedProductImageIds : [])
      .map((productId) => String(productId))
  );
  let cartLines = options.cartLinesOverride instanceof Map
    ? options.cartLinesOverride
    : new Map();

  if (!(options.cartLinesOverride instanceof Map)) {
    try {
      cartLines = await MewApi.getCartLinesByProductId();
    } catch (error) {
      console.error('Error loading cart quantities:', error);
    }
  }

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
    card.dataset.productId = String(product.id);
    card.setAttribute('role', 'listitem');

    const mediaBtn = document.createElement('button');
    mediaBtn.type = 'button';
    mediaBtn.className = 'product-card__media-btn';
    mediaBtn.setAttribute('aria-label', `View larger image of ${product.name}`);

    const media = document.createElement('figure');
    media.className = 'product-card__media';

    const img = document.createElement('img');
    const imageUrl = MewApi.normalizeImagePath(product.image_path);
    if (loadedProductImageIds.has(String(product.id))) {
      img.src = imageUrl;
    } else {
      deferProductImageLoad(img, imageUrl);
    }
    img.alt = '';
    img.decoding = 'async';
    img.fetchPriority = 'low';
    img.width = 736;
    img.height = 1024;
    img.onerror = function onImageError() {
      this.src = mewPath(MEW_PATHS.placeholder);
    };

    productPreviewButtonsBound.add(mediaBtn);
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
    price.innerHTML = `<span class="product-card__price-label">Price</span> ${MewUtils.formatMoney(product.price)}`;

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
    fillProductCartControl(cartControl, product, cartLines.get(product.id));

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

  if (preserveLoginReturn) {
    applyLoginReturnScroll();
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

  showResultsBtn.addEventListener('click', () => {
    void showResults();
  });
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
      scheduleHomeNavigationStateSave();
    });
  });

  if (!restoredHomeVisualSnapshot) {
    updateHpBar(appliedFilterValues.size);
    updateFilterUI();
  }
}

function setGalleryLoading(isLoading) {
  const gallery = document.getElementById('product-gallery');
  gallery.classList.toggle('product-gallery--loading', isLoading);
  gallery.setAttribute('aria-busy', String(isLoading));
}

async function loadProducts(options = {}) {
  setGalleryLoading(true);
  try {
    allProducts = await MewApi.fetchAllCatalog();
    await applyProductFilters(options);
  } finally {
    setGalleryLoading(false);
  }
}
