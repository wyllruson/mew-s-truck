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

  homeScrollToCatalogVisibilityUpdate = updateScrollToCatalogVisibility;

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

function getStorefrontViewportHeight() {
  return Math.round(window.visualViewport?.height || window.innerHeight || 0);
}

function isStorefrontFitAllowed() {
  const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  return scrollY <= 1;
}

function getStorefrontMinGap(storefront) {
  const styles = window.getComputedStyle(storefront);
  const value = styles.getPropertyValue('--home-storefront-min-gap').trim();
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return 32;
  }
  if (value.endsWith('rem')) {
    const rootFontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize);
    return parsed * (Number.isFinite(rootFontSize) ? rootFontSize : 16);
  }
  if (value.endsWith('em')) {
    const fontSize = Number.parseFloat(styles.fontSize);
    return parsed * (Number.isFinite(fontSize) ? fontSize : 16);
  }
  return parsed;
}

function initStorefrontViewportFit() {
  const storefront = document.getElementById('storefront');
  const popupBox = storefront?.querySelector('.popup-box--hero');
  const truck = storefront?.querySelector('.truck-container');
  if (!storefront || !popupBox || !truck) {
    return;
  }

  let ticking = false;

  const fitStorefront = () => {
    if (!isStorefrontFitAllowed()) {
      ticking = false;
      return;
    }

    const viewportHeight = getStorefrontViewportHeight();
    if (viewportHeight <= 0) {
      ticking = false;
      return;
    }

    storefront.style.setProperty('--home-storefront-min-height', `${viewportHeight}px`);

    const minGap = getStorefrontMinGap(storefront);
    const popupRect = popupBox.getBoundingClientRect();
    const truckRect = truck.getBoundingClientRect();
    const currentGap = truckRect.top - popupRect.bottom;
    const adjustedHeight = viewportHeight + Math.max(0, minGap - currentGap);

    storefront.style.setProperty('--home-storefront-min-height', `${Math.ceil(adjustedHeight)}px`);
    ticking = false;
  };

  const scheduleStorefrontFit = () => {
    if (!isStorefrontFitAllowed()) {
      return;
    }

    if (!ticking) {
      ticking = true;
      requestAnimationFrame(fitStorefront);
    }
  };

  homeStorefrontFitUpdate = fitStorefront;

  window.addEventListener('scroll', scheduleStorefrontFit, { passive: true });
  window.addEventListener('resize', scheduleStorefrontFit);
  window.visualViewport?.addEventListener('resize', scheduleStorefrontFit);
  window.addEventListener('site-header:layout', scheduleStorefrontFit);
  truck.querySelectorAll('img').forEach((img) => {
    if (!img.complete) {
      img.addEventListener('load', scheduleStorefrontFit, { once: true });
      img.addEventListener('error', scheduleStorefrontFit, { once: true });
    }
  });
  document.fonts?.ready?.then(scheduleStorefrontFit).catch(() => {});
  scheduleStorefrontFit();
}

function shouldDisableGrassParallax() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getDesignViewportHeight() {
  const designWidth = 3024;
  const designHeight = 1964;
  return Math.min((window.innerWidth * designHeight) / designWidth, designHeight);
}

function getGrassParallaxFactor() {
  if (window.matchMedia('(max-width: 48rem)').matches) {
    return 0.12;
  }

  if (window.matchMedia('(max-width: 64rem)').matches) {
    return 0.18;
  }

  return 0.45;
}

function initGrassParallax() {
  const grassDiv = document.querySelector('.grass-div');
  if (!grassDiv) {
    return;
  }

  let scrollHandler = null;

  const applyParallaxState = () => {
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
      scrollHandler = null;
    }

    grassDiv.style.transform = '';

    if (shouldDisableGrassParallax()) {
      homeGrassParallaxUpdate = null;
      return;
    }

    const parallaxFactor = getGrassParallaxFactor();
    let ticking = false;

    const update = () => {
      if (window.matchMedia('(max-width: 64rem)').matches) {
        const parentRect = grassDiv.parentElement?.getBoundingClientRect();
        const rect = parentRect || grassDiv.getBoundingClientRect();
        const travel = Math.min(grassDiv.offsetHeight * parallaxFactor, 80);
        const designViewportHeight = getDesignViewportHeight();
        const range = designViewportHeight + rect.height;
        const progress = range > 0
          ? Math.min(1, Math.max(0, (designViewportHeight - rect.top) / range))
          : 0;

        grassDiv.style.transform = `translateY(${-progress * travel}px)`;
      } else {
        grassDiv.style.transform = `translateY(${-window.scrollY * parallaxFactor}px)`;
      }
      ticking = false;
    };

    homeGrassParallaxUpdate = update;

    scrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
    update();
  };

  applyParallaxState();
  window.addEventListener('resize', applyParallaxState);
}

