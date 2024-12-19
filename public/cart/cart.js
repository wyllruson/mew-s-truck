document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Fetch cart items from the server
        const response = await fetch('/cart/items');
        if (!response.ok) {
            throw new Error('Failed to fetch cart items');
        }

        const cartItems = await response.json();
        displayCartItems(cartItems);
    } catch (error) {
        console.error('Error loading cart:', error);
    }
});

function displayCartItems(items) {
    const cartTable = document.querySelector('.cart-table');

    // Clear existing items (if any)
    cartTable.innerHTML = `
        <div class="cart-header">
            <span>Items</span>
            <span>Amount</span>
            <span>Price</span>
        </div>
    `;

    let subtotal = 0;

    // Loop through each cart item and create HTML elements
    items.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');

        // Calculate total price for the item
        const itemTotalPrice = item.product_price * item.quantity;
        subtotal += itemTotalPrice;

        cartItem.innerHTML = `
            <img src="${item.product_image}" alt="${item.product_name}">
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

    // Update subtotal in the summary
    const subtotalElement = document.querySelector('.cart-summary .subtotal span:last-child');
    if (subtotalElement) {
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    }
}

document.addEventListener('click', async function (event) {
    if (event.target.classList.contains('remove-item-btn')) {
        const cartItemId = event.target.dataset.cartItemId;

        try {
            const response = await fetch('/cart/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItemId })
            });

            if (response.ok) {
                // Reload the cart items after successful removal
                const cartItems = await fetch('/cart/items').then(res => res.json());
                displayCartItems(cartItems);
            } else {
                console.error('Error removing item from cart:', await response.json());
            }
        } catch (error) {
            console.error('Network error while removing item from cart:', error);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const checkoutButton = document.querySelector('.cart-summary button');

    checkoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/cart/checkout', { method: 'POST' });

            if (response.ok) {
                const result = await response.json();
                alert(`Order placed successfully! Order ID: ${result.orderId}`);
                window.location.reload(); // Reload cart page to show an empty cart
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (err) {
            console.error('Error during checkout:', err);
            alert('Failed to complete checkout. Please try again.');
        }
    });
});

