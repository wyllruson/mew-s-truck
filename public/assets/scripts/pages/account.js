document.addEventListener('DOMContentLoaded', async () => {
  let accountPreviewTarget = null;
  const accountPreview = MewMediaPreview.create({
    modalId: 'account-preview-modal',
    imageId: 'account-preview-img',
    mysteryId: 'account-preview-mystery',
    closeId: 'account-preview-close',
    dismissSelector: '[data-dismiss-account-preview]',
    onClose: () => {
      accountPreviewTarget = null;
    },
  });
  accountPreview.bind();

  const session = await MewApi.requireSession();
  if (!session) {
    return;
  }

  const limit = 5;
  let offset = 0;

  const ordersList = document.getElementById('orders-list');
  const ordersEmpty = document.getElementById('orders-empty');
  const ordersError = document.getElementById('orders-error');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const greetingEl = document.getElementById('account-greeting');

  function setGreeting(username) {
    if (!greetingEl) {
      return;
    }
    const name = username?.trim();
    greetingEl.textContent = name ? `Welcome back, ${name}!` : 'Welcome back!';
  }

  function showOrdersEmpty(show) {
    if (ordersEmpty) {
      ordersEmpty.hidden = !show;
    }
    if (ordersList) {
      ordersList.hidden = show;
    }
  }

  function showOrdersError(show, message) {
    if (!ordersError) {
      return;
    }
    if (show) {
      ordersError.textContent = message;
      ordersError.hidden = false;
      showOrdersEmpty(false);
      if (ordersList) {
        ordersList.hidden = true;
      }
      if (loadMoreBtn) {
        loadMoreBtn.hidden = true;
      }
      return;
    }
    ordersError.hidden = true;
    ordersError.textContent = '';
  }

  function createOrderItemElement(item, orderId) {
    const fullImagePath = MewApi.normalizeImagePath(item.pokemon_cards?.image_path);
    const name = item.pokemon_cards?.name || 'Unknown item';
    const mediaMarkup = `<img
          class="account-order__thumb"
          src="${fullImagePath}"
          alt=""
          width="736"
          height="1024"
          loading="lazy"
        />`;
    const li = document.createElement('li');
    li.className = 'account-order__item';
    li.innerHTML = `
      <button type="button" class="account-order__media-btn" aria-label="View larger image of ${MewUtils.escapeHtml(name)}">
        ${mediaMarkup}
      </button>
      <div class="account-order__item-body">
        <span class="account-order__item-name">${MewUtils.escapeHtml(name)}</span>
        <span class="account-order__item-meta">Qty ${item.quantity}</span>
        <span class="account-order__item-price">${MewUtils.formatMoney(item.price)}</span>
      </div>
    `;

    const media = li.querySelector('.account-order__thumb');
    const mediaBtn = li.querySelector('.account-order__media-btn');
    if (mediaBtn) {
      mediaBtn.dataset.orderId = String(orderId);
      mediaBtn.dataset.productId = String(item.product_id);
    }
    if (media?.tagName === 'IMG') {
      media.onerror = function onOrderImageError() {
        this.src = mewPath(MEW_PATHS.placeholder);
      };
    }
    if (mediaBtn) {
      mediaBtn.addEventListener('click', () => {
        accountPreviewTarget = {
          orderId: String(orderId),
          productId: String(item.product_id),
        };
        accountPreview.open({
          imageSrc: fullImagePath,
          label: name,
          triggerEl: mediaBtn,
        });
      });
    }

    return li;
  }

  function createOrderElement(order, items) {
    const orderArticle = document.createElement('article');
    orderArticle.className = 'account-order';
    orderArticle.setAttribute('role', 'listitem');

    const formattedDate = new Date(order.order_date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const header = document.createElement('div');
    header.className = 'account-order__header';
    header.innerHTML = `
      <span class="account-order__id">Order #${order.id}</span>
      <time class="account-order__date" datetime="${order.order_date}">${formattedDate}</time>
      <span class="account-order__total">${MewUtils.formatMoney(order.total_price)}</span>
    `;

    const itemList = document.createElement('ul');
    itemList.className = 'account-order__items';
    (items || []).forEach((item) => {
      itemList.appendChild(createOrderItemElement(item, order.id));
    });

    orderArticle.appendChild(header);
    orderArticle.appendChild(itemList);
    return orderArticle;
  }

  async function fetchAndRenderOrders() {
    try {
      if (offset === 0) {
        showOrdersError(false);
      }

      const supabase = await MewApi.getSupabase();
      const profile = await MewApi.getProfile();
      const username = profile?.username || '';
      const email = profile?.email || session.user.email || '';

      document.getElementById('username').textContent = username || '—';
      document.getElementById('email').textContent = email || '—';
      setGreeting(username);

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
          showOrdersEmpty(true);
        }
        if (loadMoreBtn) {
          loadMoreBtn.hidden = true;
        }
        return;
      }

      showOrdersEmpty(false);

      for (const order of orderRows) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, is_mystery, quantity, price')
          .eq('order_id', order.id);

        if (itemsError) {
          throw itemsError;
        }

        const catalog = await MewApi.fetchCatalogByIds((items || []).map((item) => item.product_id));
        const enrichedItems = (items || []).map((item) => ({
          ...item,
          pokemon_cards: catalog.get(item.product_id) || null,
        }));

        ordersList.appendChild(createOrderElement(order, enrichedItems));
      }

      offset += limit;

      if (loadMoreBtn) {
        loadMoreBtn.hidden = orderRows.length < limit;
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      const loadError = window.MewMessage
        ? MewMessage.format('We had trouble loading your orders. Try refreshing.')
        : 'We had trouble loading your orders. Try refreshing. 🔻';
      showOrdersError(true, loadError);
    }
  }

  async function restoreAccountState(state) {
    if (!state) {
      return;
    }
    const targetCount = Number.parseInt(String(state.loadedOrderCount), 10);
    while (Number.isFinite(targetCount) && offset < targetCount && !loadMoreBtn?.hidden) {
      const previousOffset = offset;
      await fetchAndRenderOrders();
      if (offset <= previousOffset) {
        break;
      }
    }

    if (state.previewOpen && state.previewTarget) {
      const button = [...document.querySelectorAll('.account-order__media-btn')]
        .find((candidate) => (
          candidate.dataset.orderId === String(state.previewTarget.orderId) &&
          candidate.dataset.productId === String(state.previewTarget.productId)
        ));
      button?.click();
    }
  }

  window.MewNavigationState?.registerPage({
    key: 'account',
    capture: () => ({
      loadedOrderCount: offset,
      previewOpen: document.getElementById('account-preview-modal')?.hidden === false,
      previewTarget: accountPreviewTarget,
    }),
    restore: restoreAccountState,
    refresh: async (state) => {
      const currentSession = await MewApi.requireSession();
      if (!currentSession) {
        return;
      }
      offset = 0;
      await fetchAndRenderOrders();
      await restoreAccountState(state);
    },
  });

  await fetchAndRenderOrders();
  await window.MewNavigationState?.restorePage?.();
  window.MewScrollRestore?.pulse();

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
      window.location.href = mewPath('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  });
});
