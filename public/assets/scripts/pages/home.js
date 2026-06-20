document.addEventListener('DOMContentLoaded', async () => {
  cacheLoginReturnTarget();
  if (isLoginReturnRestorePending()) {
    lockLoginReturnScroll();
  } else {
    pendingHomeNavigationState = readHomeNavigationState();
    preserveRestoredHomeCartControls = Boolean(pendingHomeNavigationState);
    restoreHomeVisualSnapshot(pendingHomeNavigationState);
  }

  initFilters();
  initHomeSearch();
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
      preserveRestoredHomeCartControls = true;
      saveHomeNavigationState();
      scheduleHomeLiveRefreshAfterRestore();
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

  const restoredHomeNavigationState = await restoreHomeNavigationStateFromCache();
  if (restoredHomeNavigationState) {
    scheduleHomeLiveRefreshAfterRestore(pendingHomeNavigationState);
  }

  try {
    if (!restoredHomeNavigationState) {
      const loadOptions = {
        loadedProductImageIds: pendingHomeNavigationState?.loadedProductImageIds,
        restoreScrollY: pendingHomeNavigationState?.scrollY,
      };
      if (pendingHomeNavigationState) {
        loadOptions.cartLinesOverride = cartLinesToMap(pendingHomeNavigationState.cartLines);
      }
      await loadProducts(loadOptions);
      finalizeHomeNavigationRestore(pendingHomeNavigationState);
    }
    if (isLoginReturnRestorePending()) {
      applyLoginReturnScroll();
    } else if (!restoredHomeNavigationState) {
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
    }
  }
});
