async function updateLoginLink() {
  try {
    const data = await MewApi.getLoginStatus();
    const accountLink = document.getElementById('login-link');
    if (!accountLink) {
      return;
    }

    const icon = accountLink.querySelector('i');
    const span = accountLink.querySelector('span') || document.createElement('span');

    if (data.loggedIn) {
      accountLink.href = mewPath('/account/account.html');
      span.textContent = data.username;
    } else {
      accountLink.href = mewPath('/account/login.html');
      span.textContent = 'Login';
    }

    if (!accountLink.contains(span)) {
      accountLink.appendChild(span);
    }

    if (icon && !accountLink.contains(icon)) {
      accountLink.insertBefore(icon, span);
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('site-header');
  if (!header) {
    return;
  }

  header.innerHTML = `
    <div class="top-row">
      <div class="logo">
        <a href="${mewPath('/index.html')}">
          <img src="${mewPath('/media/site_design_imgs/logo.png')}" alt="Logo">
        </a>
      </div>
      <nav class="nav-links" aria-label="Main">
        <a href="${mewPath('/index.html#products')}">Products</a>
        <a href="${mewPath('/mystery/mystery.html')}">Mystery Shop</a>
        <a href="${mewPath('/about/about.html')}">About</a>
        <a href="${mewPath('/service/service.html')}">Service</a>
      </nav>
      <div class="right-links">
        <a href="${mewPath('/cart/cart.html')}" class="cart-link" aria-label="Cart">
          <i class="fa-solid fa-cart-shopping fa-xl"></i>
        </a>
        <a href="${mewPath('/account/login.html')}" id="login-link">
          <i class="fa-solid fa-user fa-xl"></i>
          <span>Login</span>
        </a>
      </div>
    </div>
  `;

  const cartLink = header.querySelector('.cart-link');
  const cartIcon = cartLink?.querySelector('i');
  if (cartLink && cartIcon) {
    cartLink.addEventListener('mouseenter', () => cartIcon.classList.add('fa-bounce'));
    cartLink.addEventListener('mouseleave', () => cartIcon.classList.remove('fa-bounce'));
  }

  updateLoginLink();
});
