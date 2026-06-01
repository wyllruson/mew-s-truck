document.addEventListener('DOMContentLoaded', async () => {
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

  const checkoutButton = document.querySelector('.cart-summary button');
  if (checkoutButton) {
    checkoutButton.addEventListener('click', async () => {
      try {
        const supabase = await MewApi.getSupabase();
        const { data, error } = await supabase.rpc('checkout');

        if (error) {
          alert(`Error: ${error.message}`);
          return;
        }

        alert(`Order placed successfully! Order ID: ${data.orderId}`);
        window.location.reload();
      } catch (err) {
        console.error('Error during checkout:', err);
        alert('Failed to complete checkout. Please try again.');
      }
    });
  }
});

async function fetchCartItems() {
  const supabase = await MewApi.getSupabase();
  const { data, error } = await supabase
    .from('cart_items')
    .select(
      `
      id,
      quantity,
      boundaries_crossed (
        name,
        image_path,
        price
      )
    `
    )
    .order('id');

  if (error) {
    throw error;
  }

  return (data || []).map((row) => ({
    cart_item_id: row.id,
    product_name: row.boundaries_crossed?.name,
    product_image: row.boundaries_crossed?.image_path,
    product_price: Number(row.boundaries_crossed?.price),
    quantity: row.quantity,
  }));
}

function displayCartItems(items) {
  const cartTable = document.querySelector('.cart-table');

  cartTable.innerHTML = `
        <div class="cart-header">
            <span>Items</span>
            <span>Amount</span>
            <span>Price</span>
        </div>
    `;

  let subtotal = 0;

  items.forEach((item) => {
    const cartItem = document.createElement('div');
    cartItem.classList.add('cart-item');

    const itemTotalPrice = item.product_price * item.quantity;
    subtotal += itemTotalPrice;

    const imageSrc = MewApi.normalizeImagePath(item.product_image);

    cartItem.innerHTML = `
            <img src="${imageSrc}" alt="${item.product_name}">
            <div class="item-details">
                <span class="item-name">${item.product_name}</span>
                <span class="item-amount">
                    ${item.quantity}
                    <button class="remove-item-btn" data-cart-item-id="${item.cart_item_id}">Delete</button>
                </span>
                <span class="item-price">$${itemTotalPrice.toFixed(2)}</span>
            </div>
        `;

    cartTable.appendChild(cartItem);
  });

  const subtotalElement = document.querySelector('.cart-summary .subtotal span:last-child');
  if (subtotalElement) {
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  }
}

document.addEventListener('click', async (event) => {
  if (!event.target.classList.contains('remove-item-btn')) {
    return;
  }

  const cartItemId = event.target.dataset.cartItemId;

  try {
    const supabase = await MewApi.getSupabase();
    const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);

    if (error) {
      console.error('Error removing item from cart:', error);
      return;
    }

    const cartItems = await fetchCartItems();
    displayCartItems(cartItems);
  } catch (error) {
    console.error('Network error while removing item from cart:', error);
  }
});
