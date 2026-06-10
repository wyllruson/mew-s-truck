document.addEventListener('DOMContentLoaded', () => {
  const footer = document.getElementById('site-footer');
  if (!footer) {
    return;
  }

  const year = new Date().getFullYear();

  footer.innerHTML = `
    <div class="footer-grass" aria-hidden="true"></div>
    <div class="footer-inner">
      <div class="footer-grid">
        <div class="footer-brand-block">
          <a class="footer-logo" href="${mewPath('/')}">
            <img src="${mewPath('/assets/images/ui/logo.png')}" alt="Mew's Truck home">
          </a>
          <p class="footer-tagline">Pokémon cards, mystery packs, and good vibes.</p>
        </div>
        <div class="footer-col">
          <h2 class="footer-heading">Shop</h2>
          <nav class="footer-links" aria-label="Shop">
            <a href="${mewPath('/')}">Products</a>
            <a href="${mewPath('/mystery/')}">Mystery Shop</a>
            <a href="${mewPath('/cart/')}">Cart</a>
          </nav>
        </div>
        <div class="footer-col">
          <h2 class="footer-heading">Info</h2>
          <nav class="footer-links" aria-label="Information">
            <a href="${mewPath('/about/')}">About</a>
            <a href="${mewPath('/service/')}">Service</a>
            <a href="${mewPath('/credits/')}">Credits</a>
          </nav>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">&copy; ${year} Mew's Truck. For demonstration purposes only.</p>
      </div>
    </div>
  `;
});
