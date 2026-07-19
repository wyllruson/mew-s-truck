document.addEventListener('DOMContentLoaded', async () => {
  cacheLoginReturnTarget();
  if (isLoginReturnRestorePending()) {
    lockLoginReturnScroll();
  } else {
    pendingHomeNavigationState = readHomeNavigationState();
  }

  initFilters();
  initHomeSearch();
  if (pendingHomeNavigationState) {
    applyHomeNavigationControls(pendingHomeNavigationState, {
      useDraftFilters: Boolean(pendingHomeNavigationState.filtersModalOpen),
    });
  }
  restoreHomeSessionFromLoginReturn();
  initProductPreview();
  initStorefrontViewportFit();
  initGrassParallax();
  initScrollToCatalog();
  bindCartControlRefresh();
  window.addEventListener('mew:cart-updated', () => {
    preserveRestoredHomeCartControls = false;
    window.MewSiteHeader?.clearVisualStateOverride?.();
    void syncProductCartControls();
    scheduleHomeNavigationStateSave();
  });
  bindHomeNavigationStateCapture();
  window.addEventListener('pagehide', (evt) => {
    if (evt.persisted) {
      suppressNextVisibleCartSync = true;
      preserveRestoredHomeCartControls = true;
    }
  });
  window.addEventListener('pageshow', (evt) => {
    if (evt.persisted) {
      suppressNextVisibleCartSync = true;
      saveHomeNavigationState();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveHomeNavigationState();
      return;
    }
    if (document.visibilityState === 'visible') {
      if (suppressNextVisibleCartSync) {
        suppressNextVisibleCartSync = false;
        return;
      }
      if (shouldPreserveRestoredHomeCartControls()) {
        return;
      }
      void syncProductCartControls();
    }
  });

  try {
    const loadOptions = {
      loadedProductImageIds: pendingHomeNavigationState?.loadedProductImageIds,
      restoreScrollY: pendingHomeNavigationState?.scrollY,
    };
    await loadProducts(loadOptions);
    if (pendingHomeNavigationState) {
      await window.MewNavigationState?.restorePage?.();
    }
    if (isLoginReturnRestorePending()) {
      applyLoginReturnScroll();
    } else {
      await syncProductCartControls();
      scheduleHomeNavigationStateSave();
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
    } else if (!pendingHomeNavigationState) {
      await maybeScrollToFilterBarForLoggedInUser();
    } else {
      window.MewNavigationState?.restoreShared?.();
    }
  }
});
