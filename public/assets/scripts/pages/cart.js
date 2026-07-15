let cartPreview = null;
let orderSuccessReturnFocus = null;

function getCartPreview() {
  if (!cartPreview) {
    cartPreview = MewMediaPreview.create({
      modalId: 'cart-preview-modal',
      imageId: 'cart-preview-img',
      mysteryId: 'cart-preview-mystery',
      closeId: 'cart-preview-close',
      dismissSelector: '[data-dismiss-cart-preview]',
    });
  }
  return cartPreview;
}

function openCartPreview(imageSrc, productName, triggerEl, isMystery = false) {
  getCartPreview().open({
    imageSrc,
    label: productName,
    triggerEl,
    isMystery,
  });
}

function initCartPreview() {
  getCartPreview().bind();
}

document.addEventListener('DOMContentLoaded', async () => {
  initCartPreview();
  initOrderSuccess();

  const session = await MewApi.requireSession();
  if (!session) {
    return;
  }

  try {
    const cartItems = await fetchCartItems();
    displayCartItems(cartItems);
  } catch (error) {
    console.error('Error loading cart:', error);
  }

  const checkoutButton = document.getElementById('cart-checkout-btn');
  if (checkoutButton) {
    checkoutButton.addEventListener('click', async () => {
      if (checkoutButton.disabled) {
        return;
      }

      const previousLabel = checkoutButton.textContent;
      checkoutButton.disabled = true;
      checkoutButton.textContent = 'Processing…';

      try {
        const supabase = await MewApi.getSupabase();
        const { data, error } = await supabase.rpc('checkout');

        if (error) {
          await MewMessage.show(`Error: ${error.message}`);
          return;
        }

        displayCartItems([]);
        window.dispatchEvent(new CustomEvent('mew:cart-updated'));
        showOrderSuccess(data?.orderId);
      } catch (err) {
        console.error('Error during checkout:', err);
        await MewMessage.show('Failed to complete checkout. Please try again.');
      } finally {
        checkoutButton.textContent = previousLabel;
        const successModal = document.getElementById('cart-order-success');
        if (successModal?.hidden !== false) {
          const cartEmpty = document.getElementById('cart-empty');
          checkoutButton.disabled = Boolean(cartEmpty && !cartEmpty.hidden);
        }
      }
    });
  }
});

const MYSTERY_CARD_NAME = 'Mystery Card';

const MYSTERY_CARD_PRICE = 5;

async function fetchCartItems() {
  const supabase = await MewApi.getSupabase();
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, product_id, is_mystery, quantity')
    .order('id');

  if (error) {
    throw error;
  }

  const catalog = await MewApi.fetchCatalogByIds((data || []).map((row) => row.product_id));

  return (data || []).map((row) => {
    const isMysteryItem = Boolean(row.is_mystery);
    const product = catalog.get(row.product_id);

    return {
      cart_item_id: row.id,
      is_mystery: isMysteryItem,
      product_name: isMysteryItem ? MYSTERY_CARD_NAME : (product?.name || 'Unknown item'),
      product_image: product?.image_path,
      product_price: isMysteryItem ? MYSTERY_CARD_PRICE : Number(product?.price ?? 0),
      product_stock: isMysteryItem ? 1 : Number(product?.stock ?? 0),
      quantity: isMysteryItem ? 1 : row.quantity,
    };
  });
}

function syncCartSummaryFromRows() {
  const itemCountEl = document.getElementById('cart-item-count');
  const checkoutButton = document.getElementById('cart-checkout-btn');
  const subtotalValue = document.querySelector('.cart-summary__row.subtotal dd');
  const cartEmpty = document.getElementById('cart-empty');
  const rows = [...document.querySelectorAll('.cart-item[data-unit-price][data-quantity]')];
  const totalQuantity = rows.reduce(
    (sum, row) => sum + (Number(row.dataset.quantity) || 0),
    0
  );
  const subtotal = rows.reduce((sum, row) => {
    const quantity = Number(row.dataset.quantity) || 0;
    const unitPrice = Number(row.dataset.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);

  if (itemCountEl) {
    itemCountEl.textContent = MewUtils.itemCountLabel(totalQuantity);
  }
  if (subtotalValue) {
    subtotalValue.textContent = MewUtils.formatMoney(subtotal);
  }
  if (checkoutButton) {
    checkoutButton.disabled = Boolean(cartEmpty && !cartEmpty.hidden) || totalQuantity <= 0;
  }
}

function updateCartItemQuantityView(cartItem, nextQuantity) {
  const unitPrice = Number(cartItem.dataset.unitPrice) || 0;
  const lineTotalEl = cartItem.querySelector('.cart-item__line-total');
  const unitPriceEl = cartItem.querySelector('.cart-item__unit-price');

  cartItem.dataset.quantity = String(nextQuantity);

  if (lineTotalEl) {
    lineTotalEl.textContent = MewUtils.formatMoney(unitPrice * nextQuantity);
  }

  if (unitPriceEl) {
    unitPriceEl.textContent =
      nextQuantity > 1
        ? `· ${MewUtils.formatMoney(unitPrice)} each`
        : `· ${MewUtils.formatMoney(unitPrice)}`;
  }

  syncCartSummaryFromRows();
}

function displayCartItems(items) {
  const cartTable = document.querySelector('.cart-table');
  const cartEmpty = document.getElementById('cart-empty');
  const itemCountEl = document.getElementById('cart-item-count');
  const checkoutButton = document.getElementById('cart-checkout-btn');
  const subtotalValue = document.querySelector('.cart-summary__row.subtotal dd');

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  if (itemCountEl) {
    itemCountEl.textContent = MewUtils.itemCountLabel(totalQuantity);
  }

  if (!items.length) {
    cartTable.innerHTML = '';
    cartTable.hidden = true;
    cartEmpty.hidden = false;
    if (subtotalValue) {
      subtotalValue.textContent = MewUtils.formatMoney(0);
    }
    if (checkoutButton) {
      checkoutButton.disabled = true;
    }
    window.MewScrollRestore?.pulse();
    return;
  }

  cartTable.hidden = false;
  cartEmpty.hidden = true;
  if (checkoutButton) {
    checkoutButton.disabled = false;
  }

  let subtotal = 0;
  cartTable.innerHTML = '';

  items.forEach((item) => {
    const lineTotal = item.product_price * item.quantity;
    subtotal += lineTotal;

    const imageSrc = item.product_image ? MewApi.normalizeImagePath(item.product_image) : '';
    const unitLabel =
      item.quantity > 1
        ? `${MewUtils.formatMoney(item.product_price)} each`
        : MewUtils.formatMoney(item.product_price);
    const mediaMarkup = item.is_mystery
      ? '<div class="cart-item__media mystery-card-face" role="img" aria-label="Mystery Card"></div>'
      : `<img class="cart-item__media" src="${imageSrc}" alt="" width="736" height="1024" decoding="async">`;

    const cartItem = document.createElement('article');
    cartItem.classList.add('cart-item');
    cartItem.setAttribute('role', 'listitem');
    cartItem.dataset.cartItemId = String(item.cart_item_id);
    cartItem.dataset.unitPrice = String(item.product_price);
    cartItem.dataset.quantity = String(item.quantity);

    cartItem.innerHTML = `
      <button type="button" class="cart-item__media-btn" aria-label="View larger image of ${MewUtils.escapeHtml(item.product_name)}">
        ${mediaMarkup}
      </button>
      <div class="cart-item__body">
        <div class="cart-item__top">
          <h3 class="cart-item__name">${MewUtils.escapeHtml(item.product_name)}</h3>
          <span class="cart-item__line-total">${MewUtils.formatMoney(lineTotal)}</span>
        </div>
        <div class="cart-item__meta">
          <div class="cart-item__qty">
            <span class="cart-item__qty-label">Qty</span>
            <div class="cart-item__qty-stepper" data-cart-item-id="${item.cart_item_id}"></div>
            <span class="cart-item__unit-price">· ${unitLabel}</span>
          </div>
        </div>
        <div class="cart-item__actions">
          <button
            type="button"
            class="remove-item-btn"
            data-cart-item-id="${item.cart_item_id}"
            aria-label="Remove ${MewUtils.escapeHtml(item.product_name)} from cart"
          >
            <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
            Remove
          </button>
        </div>
      </div>
    `;

    const media = cartItem.querySelector('.cart-item__media');
    const mediaBtn = cartItem.querySelector('.cart-item__media-btn');
    if (media?.tagName === 'IMG') {
      media.alt = '';
      media.onerror = function onCartImageError() {
        this.src = mewPath(MEW_PATHS.placeholder);
      };
    }
    if (mediaBtn) {
      mediaBtn.addEventListener('click', () => {
        openCartPreview(imageSrc, item.product_name, mediaBtn, item.is_mystery);
      });
    }

    const stepperHost = cartItem.querySelector('.cart-item__qty-stepper');
    if (stepperHost) {
      if (item.is_mystery) {
        const stepper = MewQtyStepper.create({
          quantity: item.quantity,
          maxQuantity: 1,
          ariaLabel: item.product_name,
          onChange: async (delta) => {
            try {
              const newQuantity = await MewApi.changeCartItemQuantity(item.cart_item_id, delta);
              window.dispatchEvent(new CustomEvent('mew:cart-updated'));
              return newQuantity;
            } catch (error) {
              console.error('Error updating mystery card quantity:', error);
              const message = error?.message || 'Failed to update quantity. Please try again.';
              await MewMessage.show(message);
              return item.quantity;
            }
          },
          onSettled: async (finalQuantity) => {
            if (finalQuantity <= 0) {
              try {
                const cartItems = await fetchCartItems();
                displayCartItems(cartItems);
              } catch (error) {
                console.error('Error refreshing cart after mystery quantity update:', error);
              }
            }
          },
        });
        stepperHost.appendChild(stepper);
      } else {
        const stepper = MewQtyStepper.create({
          quantity: item.quantity,
          maxQuantity: item.product_stock,
          ariaLabel: item.product_name,
          onChange: async (delta) => {
            try {
              const newQuantity = await MewApi.changeCartItemQuantity(item.cart_item_id, delta);
              window.dispatchEvent(new CustomEvent('mew:cart-updated'));
              if (newQuantity > 0) {
                item.quantity = newQuantity;
                updateCartItemQuantityView(cartItem, newQuantity);
              }
              return newQuantity;
            } catch (error) {
              console.error('Error updating cart quantity:', error);
              const message = error?.message || 'Failed to update quantity. Please try again.';
              await MewMessage.show(message);
              return item.quantity;
            }
          },
          onSettled: async (finalQuantity) => {
            if (finalQuantity <= 0) {
              try {
                const cartItems = await fetchCartItems();
                displayCartItems(cartItems);
              } catch (error) {
                console.error('Error refreshing cart after quantity update:', error);
              }
            }
          },
        });
        stepperHost.appendChild(stepper);
      }
    }

    cartTable.appendChild(cartItem);
  });

  if (subtotalValue) {
    subtotalValue.textContent = MewUtils.formatMoney(subtotal);
  }
  window.MewScrollRestore?.pulse();
}

function showOrderSuccess(orderId) {
  const modal = document.getElementById('cart-order-success');
  const orderIdEl = document.getElementById('cart-order-success-id');
  if (!modal) {
    return;
  }

  if (orderIdEl) {
    orderIdEl.textContent = orderId != null ? `#${orderId}` : '—';
  }

  orderSuccessReturnFocus = document.getElementById('cart-checkout-btn');
  modal.hidden = false;
  window.MewModal?.lock(modal);
  modal.querySelector('.cart-order-success__close')?.focus();
}

function closeOrderSuccess() {
  const modal = document.getElementById('cart-order-success');
  if (!modal || modal.hidden) {
    return;
  }

  modal.hidden = true;
  window.MewModal?.unlock(modal);

  if (orderSuccessReturnFocus) {
    orderSuccessReturnFocus.focus({ preventScroll: true });
    orderSuccessReturnFocus = null;
  }
}

function initOrderSuccess() {
  const modal = document.getElementById('cart-order-success');
  if (!modal) {
    return;
  }

  modal.querySelectorAll('[data-dismiss-order-success]').forEach((el) => {
    el.addEventListener('click', closeOrderSuccess);
  });

  modal.addEventListener('click', (evt) => {
    evt.stopPropagation();
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.key !== 'Escape' || modal.hidden) {
      return;
    }
    closeOrderSuccess();
  });
}

document.addEventListener('click', async (event) => {
  const removeBtn = event.target.closest('.remove-item-btn');
  if (!removeBtn) {
    return;
  }

  const cartItemId = removeBtn.dataset.cartItemId;

  try {
    const supabase = await MewApi.getSupabase();
    const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);

    if (error) {
      console.error('Error removing item from cart:', error);
      return;
    }

    const cartItems = await fetchCartItems();
    displayCartItems(cartItems);
    window.dispatchEvent(new CustomEvent('mew:cart-updated'));
  } catch (error) {
    console.error('Network error while removing item from cart:', error);
  }
});
