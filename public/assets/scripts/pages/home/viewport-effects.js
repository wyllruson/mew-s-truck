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
    homeGrassParallaxUpdate?.();
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
  const designWidth = 1512;
  const designHeight = 982;
  return Math.min((window.innerWidth * designHeight) / designWidth, designHeight);
}

const GRASS_PARALLAX_DESIGN_WIDTH = 2560;
const GRASS_PARALLAX_DESIGN_HEIGHT = 982;
const GRASS_PARALLAX_MIN_WIDTH = 1024;
const GRASS_PARALLAX_MAX_FACTOR = 0.76;
const GRASS_PARALLAX_MIN_FACTOR = 0.12;
const GRASS_PARALLAX_MIN_HEIGHT_MULTIPLIER = 0.65;
const GRASS_PARALLAX_MAX_HEIGHT_MULTIPLIER = 1.35;
const GRASS_PARALLAX_PORTRAIT_MIN_MULTIPLIER = 0.45;
const GRASS_PARALLAX_LANDSCAPE_MAX_MULTIPLIER = 2.55;
const GRASS_PARALLAX_SQUARE_MAX_MULTIPLIER = 1.65;
const GRASS_PARALLAX_MOBILE_MAX_WIDTH = 1440;

function clampGrassParallax(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothGrassParallaxStep(t) {
  const x = clampGrassParallax(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function usesMobileGrassParallax() {
  return window.innerWidth <= GRASS_PARALLAX_MOBILE_MAX_WIDTH;
}

function isViewportLargerThanDesignBasis(viewportWidth, viewportHeight) {
  return viewportWidth >= GRASS_PARALLAX_DESIGN_WIDTH
    || viewportHeight >= GRASS_PARALLAX_DESIGN_HEIGHT;
}

function getLargeViewportAspectMultiplier(viewportWidth, viewportHeight) {
  if (!isViewportLargerThanDesignBasis(viewportWidth, viewportHeight)) {
    return 1;
  }

  if (viewportWidth < viewportHeight) {
    const portraitIntensity = smoothGrassParallaxStep(1 - (viewportWidth / viewportHeight));
    return 1 - (1 - GRASS_PARALLAX_PORTRAIT_MIN_MULTIPLIER) * portraitIntensity;
  }

  if (viewportWidth > viewportHeight) {
    const landscapeIntensity = smoothGrassParallaxStep(1 - (viewportHeight / viewportWidth));
    return 1 + (GRASS_PARALLAX_LANDSCAPE_MAX_MULTIPLIER - 1) * landscapeIntensity;
  }

  return 1;
}

function getSquareAspectMultiplier(viewportWidth, viewportHeight) {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return 1;
  }

  const aspect = viewportWidth / viewportHeight;
  const squareness = Math.min(aspect, 1 / aspect);
  const squareIntensity = smoothGrassParallaxStep(squareness);

  return 1 + (GRASS_PARALLAX_SQUARE_MAX_MULTIPLIER - 1) * squareIntensity;
}

function getGrassParallaxFactor() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight || GRASS_PARALLAX_DESIGN_HEIGHT;

  const widthProgress = clampGrassParallax(
    (viewportWidth - GRASS_PARALLAX_MIN_WIDTH)
      / (GRASS_PARALLAX_DESIGN_WIDTH - GRASS_PARALLAX_MIN_WIDTH),
    0,
    1,
  );
  const widthFactor = GRASS_PARALLAX_MIN_FACTOR
    + (GRASS_PARALLAX_MAX_FACTOR - GRASS_PARALLAX_MIN_FACTOR) * smoothGrassParallaxStep(widthProgress);

  const heightSpeedup = clampGrassParallax(
    viewportHeight / GRASS_PARALLAX_DESIGN_HEIGHT,
    GRASS_PARALLAX_MIN_HEIGHT_MULTIPLIER,
    GRASS_PARALLAX_MAX_HEIGHT_MULTIPLIER,
  );

  const aspectMultiplier = getLargeViewportAspectMultiplier(viewportWidth, viewportHeight);
  const squareMultiplier = getSquareAspectMultiplier(viewportWidth, viewportHeight);

  return widthFactor * heightSpeedup * aspectMultiplier * squareMultiplier;
}

function getGrassParallaxContentBottom(grassDiv) {
  const img = grassDiv.querySelector('img');
  if (img && window.getComputedStyle(img).display !== 'none') {
    return grassDiv.offsetTop + img.offsetTop + img.offsetHeight;
  }

  return grassDiv.offsetTop + grassDiv.offsetHeight;
}

function getGrassParallaxMaxOffset(grassDiv, grassStrip2) {
  if (!grassDiv || !grassStrip2 || grassDiv.parentElement !== grassStrip2.parentElement) {
    return Number.POSITIVE_INFINITY;
  }

  const grassBottom = getGrassParallaxContentBottom(grassDiv);
  const strip2Bottom = grassStrip2.offsetTop + grassStrip2.offsetHeight;

  return Math.max(0, grassBottom - strip2Bottom);
}

function initGrassParallax() {
  const grassDiv = document.querySelector('.grass-div');
  const grassStrip2 = document.querySelector('#grass-transition .truck-grass-strip-2');
  if (!grassDiv) {
    return;
  }

  let scrollHandler = null;
  let lastParallaxLayoutWidth = window.innerWidth;
  let lastParallaxUsesMobileMode = usesMobileGrassParallax();

  const applyParallaxState = () => {
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
      scrollHandler = null;
    }

    if (shouldDisableGrassParallax()) {
      grassDiv.style.transform = '';
      homeGrassParallaxUpdate = null;
      return;
    }

    let ticking = false;

    const update = () => {
      const parallaxFactor = getGrassParallaxFactor();
      const maxOffset = getGrassParallaxMaxOffset(grassDiv, grassStrip2);

      if (usesMobileGrassParallax()) {
        const parentRect = grassDiv.parentElement?.getBoundingClientRect();
        const rect = parentRect || grassDiv.getBoundingClientRect();
        const travel = Math.min(grassDiv.offsetHeight * parallaxFactor, maxOffset);
        const designViewportHeight = getDesignViewportHeight();
        const range = designViewportHeight + rect.height;
        const progress = range > 0
          ? Math.min(1, Math.max(0, (designViewportHeight - rect.top) / range))
          : 0;
        const offset = Math.min(progress * travel, maxOffset);

        grassDiv.style.transform = `translateY(${-offset}px)`;
      } else {
        const offset = Math.min(window.scrollY * parallaxFactor, maxOffset);
        grassDiv.style.transform = `translateY(${-offset}px)`;
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
  const grassImg = grassDiv.querySelector('img');
  if (grassImg && !grassImg.complete) {
    grassImg.addEventListener('load', () => homeGrassParallaxUpdate?.(), { once: true });
    grassImg.addEventListener('error', () => homeGrassParallaxUpdate?.(), { once: true });
  }
  window.addEventListener('resize', () => {
    const viewportWidth = window.innerWidth;
    const usesMobileMode = usesMobileGrassParallax();

    if (usesMobileMode !== lastParallaxUsesMobileMode) {
      lastParallaxLayoutWidth = viewportWidth;
      lastParallaxUsesMobileMode = usesMobileMode;
      applyParallaxState();
      return;
    }

    if (viewportWidth !== lastParallaxLayoutWidth) {
      lastParallaxLayoutWidth = viewportWidth;
    }

    homeGrassParallaxUpdate?.();
  });
}
