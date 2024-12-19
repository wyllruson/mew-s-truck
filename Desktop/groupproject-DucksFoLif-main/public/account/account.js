document.addEventListener('DOMContentLoaded', async () => {
    let limit = 5; // Number of orders to fetch per request
    let offset = 0; // Starting point
    let allOrdersLoaded = false;

    const ordersList = document.getElementById('orders-list');
    const loadMoreBtn = document.getElementById('load-more-btn');

    // Function to fetch and render orders
    async function fetchAndRenderOrders() {
        try {
            // Fetch user account info with pagination parameters
            const response = await fetch(`/account-info?limit=${limit}&offset=${offset}`);
            const data = await response.json();

            if (data.loggedIn) {
                document.getElementById('username').textContent = data.username;
                document.getElementById('email').textContent = data.email;

                // Remove the placeholder "Loading..." on the first load
                if (offset === 0) {
                    ordersList.innerHTML = ''; // Clear placeholder message
                }

                // If no more orders, disable "Load More" button
                if (!data.recentOrders || data.recentOrders.length === 0) {
                    allOrdersLoaded = true;
                    loadMoreBtn.style.display = 'none';
                    return;
                }

                // Append fetched orders to the list
                data.recentOrders.forEach(order => {
                    const orderDiv = document.createElement('div');
                    orderDiv.classList.add('order-item');

                    // Format the date
                    const formattedDate = new Date(order.date).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });

                    // Order summary
                    const orderHeader = document.createElement('h3');
                    orderHeader.textContent = `Order #${order.id} - ${formattedDate} - $${parseFloat(order.total).toFixed(2)}`;

                    const itemList = document.createElement('ul');

                    order.items.forEach(item => {
                        const fullImagePath = `../Boundaries_Crossed/${item.image_path}`;
                        const itemLi = document.createElement('li');
                        itemLi.innerHTML = `
                            <img src="${fullImagePath}" alt="${item.product_name}" width="50" onerror="this.src='../media/placeholder.jpg';" />
                            <span>${item.product_name} - Qty: ${item.quantity} - $${parseFloat(item.price).toFixed(2)}</span>
                        `;
                        itemList.appendChild(itemLi);
                    });

                    orderDiv.appendChild(orderHeader);
                    orderDiv.appendChild(itemList);
                    ordersList.appendChild(orderDiv);
                });

                // Increment offset for the next batch
                offset += limit;
            } else {
                window.location.href = '../account/login.html'; // Redirect if not logged in
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    // Initial fetch of orders
    await fetchAndRenderOrders();

    // Logout handler
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            const response = await fetch('/logout', { method: 'POST' });
            if (response.ok) {
                window.location.href = '../index.html';
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    });
});
