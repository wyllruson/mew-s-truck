const NAV_LINKS = [
  { href: '/', label: 'Products', key: 'products' },
  { href: '/mystery/', label: 'Mystery Shop', key: 'mystery' },
  { href: '/about/', label: 'About', key: 'about' },
];

let siteHeaderVisualStateOverride = null;

function normalizeSitePath(pathname) {
  const base = (window.MEW_SITE?.basePath || '').replace(/\/$/, '');
  let path = pathname || '/';
  if (base && path.startsWith(base)) {
    path = path.slice(base.length) || '/';
  }
  return path.replace(/\/index\.html$/i, '/').replace(/\/$/, '') || '/';
}

function getActiveNavKey() {
  const path = normalizeSitePath(window.location.pathname);

  if (path === '/' || path.endsWith('/index')) {
    return 'products';
  }
  if (path.includes('/mystery')) {
    return 'mystery';
  }
  if (path.includes('/about')) {
    return 'about';
  }
  return null;
}

function renderNavLinks() {
  const activeKey = getActiveNavKey();
  return NAV_LINKS.map(({ href, label, key }) => {
    const isActive = activeKey === key;
    return `<a href="${mewPath(href)}"${isActive ? ' class="is-active" aria-current="page"' : ''}>${label}</a>`;
  }).join('');
}

function captureSiteHeaderVisualState() {
  const header = document.getElementById('site-header');
  if (!header) {
    return null;
  }

  const accountLink = document.getElementById('login-link');
  const cartLink = header.querySelector('.cart-link');
  const cartBadge = document.getElementById('cart-badge');
  const demoBannerTrack = header.querySelector('.demo-banner__track');

  return {
    mobileNavOpen: header.classList.contains('nav-open'),
    demoBannerTrack: demoBannerTrack
      ? {
          transform: window.getComputedStyle(demoBannerTrack).transform,
        }
      : null,
    accountLink: accountLink
      ? {
          href: accountLink.getAttribute('href') || '',
          className: accountLink.className,
          ariaLabel: accountLink.getAttribute('aria-label') || '',
          html: accountLink.innerHTML,
        }
      : null,
    cartLink: cartLink
      ? {
          ariaLabel: cartLink.getAttribute('aria-label') || '',
        }
      : null,
    cartBadge: cartBadge
      ? {
          className: cartBadge.className,
          hidden: cartBadge.hidden,
          text: cartBadge.textContent || '',
        }
      : null,
  };
}

function applyDemoBannerTrackVisualState(state) {
  const header = document.getElementById('site-header');
  const demoBannerTrack = header?.querySelector('.demo-banner__track');
  if (!demoBannerTrack) {
    return;
  }

  if (!state?.demoBannerTrack) {
    demoBannerTrack.style.removeProperty('animation');
    demoBannerTrack.style.removeProperty('transform');
    return;
  }

  demoBannerTrack.style.animation = 'none';
  if (state.demoBannerTrack.transform && state.demoBannerTrack.transform !== 'none') {
    demoBannerTrack.style.transform = state.demoBannerTrack.transform;
  } else {
    demoBannerTrack.style.removeProperty('transform');
  }
}

function applySiteHeaderVisualState(state) {
  if (!state || typeof state !== 'object') {
    return false;
  }

  const header = document.getElementById('site-header');
  if (!header) {
    return false;
  }

  if (typeof header.mewSetMobileNavOpen === 'function') {
    header.mewSetMobileNavOpen(Boolean(state.mobileNavOpen));
  }

  applyDemoBannerTrackVisualState(state);

  const accountLink = document.getElementById('login-link');
  if (accountLink && state.accountLink) {
    accountLink.setAttribute('href', state.accountLink.href || mewPath('/account/login/'));
    accountLink.className = state.accountLink.className || '';
    accountLink.setAttribute('aria-label', state.accountLink.ariaLabel || 'Login');
    accountLink.innerHTML = state.accountLink.html || '';
  }

  const cartLink = header.querySelector('.cart-link');
  if (cartLink && state.cartLink) {
    cartLink.setAttribute('aria-label', state.cartLink.ariaLabel || 'Cart');
  }

  const cartBadge = document.getElementById('cart-badge');
  if (cartBadge && state.cartBadge) {
    cartBadge.className = state.cartBadge.className || 'cart-badge';
    cartBadge.textContent = state.cartBadge.text || '';
    cartBadge.hidden = Boolean(state.cartBadge.hidden);
  }

  updateSiteHeaderOffset();
  return true;
}

function setSiteHeaderVisualStateOverride(state) {
  siteHeaderVisualStateOverride = state || null;
  if (!siteHeaderVisualStateOverride) {
    return false;
  }
  return applySiteHeaderVisualState(siteHeaderVisualStateOverride);
}

function clearSiteHeaderVisualStateOverride() {
  siteHeaderVisualStateOverride = null;
  applyDemoBannerTrackVisualState(null);
}

function applySiteHeaderVisualStateOverride() {
  return Boolean(
    siteHeaderVisualStateOverride &&
    applySiteHeaderVisualState(siteHeaderVisualStateOverride)
  );
}

async function updateLoginLink() {
  if (!window.MewApi) {
    return;
  }

  if (applySiteHeaderVisualStateOverride()) {
    return;
  }

  const accountLink = document.getElementById('login-link');
  if (!accountLink) {
    return;
  }

  try {
    const data = await MewApi.getLoginStatus();
    if (applySiteHeaderVisualStateOverride()) {
      return;
    }

    if (data.loggedIn) {
      accountLink.href = mewPath('/account/');
      accountLink.querySelector('span')?.remove();

      if (!accountLink.querySelector('i')) {
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-user fa-lg';
        icon.setAttribute('aria-hidden', 'true');
        accountLink.prepend(icon);
      }

      const span = document.createElement('span');
      span.className = 'account-name';
      span.textContent = data.username;
      accountLink.appendChild(span);
      accountLink.classList.add('is-logged-in');
      accountLink.setAttribute('aria-label', data.username);
      updateSiteHeaderOffset();
    } else {
      accountLink.href = mewPath('/account/login/');
      accountLink.querySelector('span')?.remove();
      accountLink.classList.remove('is-logged-in');

      if (!accountLink.querySelector('i')) {
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-user fa-lg';
        icon.setAttribute('aria-hidden', 'true');
        accountLink.appendChild(icon);
      }
      accountLink.setAttribute('aria-label', 'Login');
      updateSiteHeaderOffset();
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }
}

async function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const cartLink = document.querySelector('.cart-link');
  if (!badge || !cartLink || !window.MewApi) {
    return;
  }

  if (applySiteHeaderVisualStateOverride()) {
    return;
  }

  try {
    const status = await MewApi.getLoginStatus();
    if (applySiteHeaderVisualStateOverride()) {
      return;
    }

    if (!status.loggedIn) {
      badge.hidden = true;
      cartLink.setAttribute('aria-label', 'Cart');
      return;
    }

    const supabase = await MewApi.getSupabase();
    const { data, error } = await supabase.from('cart_items').select('quantity');

    if (error) {
      throw error;
    }

    if (applySiteHeaderVisualStateOverride()) {
      return;
    }

    const itemCount = (data || []).reduce((sum, row) => sum + row.quantity, 0);
    if (itemCount > 0) {
      badge.textContent = itemCount > 99 ? '99+' : String(itemCount);
      badge.hidden = false;
      cartLink.setAttribute('aria-label', `Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`);
    } else {
      badge.hidden = true;
      cartLink.setAttribute('aria-label', 'Cart');
    }
  } catch (error) {
    console.error('Error loading cart count:', error);
    badge.hidden = true;
  }
}

function bindMobileNav(header) {
  const toggle = header.querySelector('.nav-toggle');
  const nav = header.querySelector('.nav-links');
  if (!toggle || !nav) {
    return;
  }

  const toggleIcon = toggle.querySelector('i');

  const closeNav = () => {
    header.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    toggleIcon?.classList.replace('fa-xmark', 'fa-bars');
  };

  const openNav = () => {
    header.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    toggleIcon?.classList.replace('fa-bars', 'fa-xmark');
  };

  header.mewSetMobileNavOpen = (isOpen) => {
    if (isOpen) {
      openNav();
    } else {
      closeNav();
    }
  };

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (header.classList.contains('nav-open')) {
      closeNav();
    } else {
      openNav();
    }
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeNav();
    }
  });

  document.addEventListener('click', (event) => {
    if (!header.classList.contains('nav-open')) {
      return;
    }
    if (header.contains(event.target)) {
      return;
    }
    closeNav();
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      closeNav();
    }
  });
}

function bindCartHover(cartLink) {
  const cartIcon = cartLink?.querySelector('i');
  if (!cartLink || !cartIcon) {
    return;
  }

  cartLink.addEventListener('mouseenter', () => cartIcon.classList.add('fa-bounce'));
  cartLink.addEventListener('mouseleave', () => cartIcon.classList.remove('fa-bounce'));
}

function updateSiteHeaderOffset() {
  const header = document.getElementById('site-header');
  if (!header) {
    return;
  }

  document.documentElement.style.setProperty(
    '--site-header-offset',
    `${header.getBoundingClientRect().height}px`
  );
  window.dispatchEvent(new CustomEvent('site-header:layout'));
}

function bindAuthRefresh() {
  window.addEventListener('supabase:ready', async () => {
    try {
      const supabase = await MewApi.getSupabase();
      supabase.auth.onAuthStateChange(() => {
        updateLoginLink();
        updateCartBadge();
      });
    } catch {
      // Supabase unavailable — static header still works
    }
  }, { once: true });
}

function bindCartBadgeRefresh() {
  window.addEventListener('mew:cart-updated', () => {
    clearSiteHeaderVisualStateOverride();
    updateCartBadge();
  });
}

window.MewSiteHeader = {
  captureVisualState: captureSiteHeaderVisualState,
  setVisualStateOverride: setSiteHeaderVisualStateOverride,
  clearVisualStateOverride: clearSiteHeaderVisualStateOverride,
  restoreVisualState: applySiteHeaderVisualState,
};

document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('site-header');
  if (!header) {
    return;
  }

  header.className = 'site-header';

  header.innerHTML = `
    <div class="demo-banner" role="note" aria-label="For demonstration purposes only.">
      <div class="demo-banner__track" aria-hidden="true">
        <div class="demo-banner__group">
          <span>For demonstration purposes only.</span>
          <span>For demonstration purposes only.</span>
          <span>For demonstration purposes only.</span>
          <span>For demonstration purposes only.</span>
          <span>For demonstration purposes only.</span>
          <span>For demonstration purposes only.</span>
        </div>
        <div class="demo-banner__group">
          <span>For demonstration purposes only.</span>
          <span>For demonstration purposes only.</span>
          <span>For demonstration purposes only.</span>
          <span>For demonstration purposes only.</span>
          <span>For demonstration purposes only.</span>
          <span>For demonstration purposes only.</span>
        </div>
      </div>
    </div>
    <div class="top-row">
      <div class="top-row-inner">
        <div class="logo">
          <a href="${mewPath('/')}">
            <img src="${mewPath('/assets/images/ui/logo.png')}" alt="Mew's Truck home">
          </a>
        </div>
        <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Open menu">
          <i class="fa-solid fa-bars" aria-hidden="true"></i>
        </button>
        <nav id="main-nav" class="nav-links" aria-label="Main">
          <div class="nav-links__primary">
            ${renderNavLinks()}
          </div>
          <div class="nav-links__utils">
            <a href="${mewPath('/cart/')}" class="cart-link" aria-label="Cart">
              <i class="fa-solid fa-cart-shopping fa-lg" aria-hidden="true"></i>
              <span class="cart-badge" id="cart-badge" hidden>0</span>
            </a>
            <a href="${mewPath('/account/login/')}" id="login-link" aria-label="Login">
              <i class="fa-solid fa-user fa-lg" aria-hidden="true"></i>
            </a>
          </div>
        </nav>
      </div>
    </div>
  `;

  bindMobileNav(header);
  bindCartHover(header.querySelector('.cart-link'));
  bindAuthRefresh();
  bindCartBadgeRefresh();
  updateSiteHeaderOffset();
  window.addEventListener('resize', updateSiteHeaderOffset);
  updateLoginLink();
  updateCartBadge();
  window.dispatchEvent(new CustomEvent('mew:site-header-ready'));
});
