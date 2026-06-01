document.addEventListener('DOMContentLoaded', async () => {
  const session = await MewApi.requireSession();
  if (!session) {
    return;
  }

  const limit = 5;
  let offset = 0;

  const ordersList = document.getElementById('orders-list');
  const loadMoreBtn = document.getElementById('load-more-btn');

  async function fetchAndRenderOrders() {
    try {
      const supabase = await MewApi.getSupabase();
      const profile = await MewApi.getProfile();

      document.getElementById('username').textContent = profile?.username || '';
      document.getElementById('email').textContent = profile?.email || session.user.email || '';

      const { data: orderRows, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_price, order_date')
        .order('order_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (ordersError) {
        throw ordersError;
      }

      if (offset === 0) {
        ordersList.innerHTML = '';
      }

      if (!orderRows || orderRows.length === 0) {
        if (offset === 0) {
          ordersList.innerHTML = '<p>No orders yet.</p>';
        }
        if (loadMoreBtn) {
          loadMoreBtn.style.display = 'none';
        }
        return;
      }

      for (const order of orderRows) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select(
            `
            product_id,
            quantity,
            price,
            boundaries_crossed (
              name,
              image_path
            )
          `
          )
          .eq('order_id', order.id);

        if (itemsError) {
          throw itemsError;
        }

        const orderDiv = document.createElement('div');
        orderDiv.classList.add('order-item');

        const formattedDate = new Date(order.order_date).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        const orderHeader = document.createElement('h3');
        orderHeader.textContent = `Order #${order.id} - ${formattedDate} - $${Number(order.total_price).toFixed(2)}`;

        const itemList = document.createElement('ul');

        (items || []).forEach((item) => {
          const fullImagePath = MewApi.normalizeImagePath(item.boundaries_crossed?.image_path);
          const itemLi = document.createElement('li');
          itemLi.innerHTML = `
                        <img src="${fullImagePath}" alt="${item.boundaries_crossed?.name}" width="50" onerror="this.src='${mewPath('/media/placeholder.jpg')}';" />
                        <span>${item.boundaries_crossed?.name} - Qty: ${item.quantity} - $${Number(item.price).toFixed(2)}</span>
                    `;
          itemList.appendChild(itemLi);
        });

        orderDiv.appendChild(orderHeader);
        orderDiv.appendChild(itemList);
        ordersList.appendChild(orderDiv);
      }

      offset += limit;

      if (orderRows.length < limit && loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }

  await fetchAndRenderOrders();

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', fetchAndRenderOrders);
  }

  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      const supabase = await MewApi.getSupabase();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout failed', error);
        return;
      }
      window.location.href = mewPath('/index.html');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  });
});
