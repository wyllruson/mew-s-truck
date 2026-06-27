async function whenSupabaseReady() {
  if (window.supabase) {
    return window.supabase;
  }

  return new Promise((resolve) => {
    window.addEventListener('supabase:ready', () => resolve(window.supabase), { once: true });
  });
}

async function getSupabase() {
  const client = await whenSupabaseReady();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }
  return client;
}

async function getSession() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

const LOGIN_RETURN_KEY = 'mew:login-return';
const LOGIN_RESTORE_PENDING_KEY = 'mew:login-restore-pending';

function isSafeLoginReturnHref(href) {
  if (!href || typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) {
    return false;
  }

  const loginPath = mewPath('/account/login/').replace(/\/$/, '');
  const normalized = href.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  return normalized !== loginPath;
}

function getLoginReturnHref() {
  const raw = sessionStorage.getItem(LOGIN_RETURN_KEY);
  if (!raw) {
    return null;
  }

  try {
    const { href } = JSON.parse(raw);
    return isSafeLoginReturnHref(href) ? href : null;
  } catch {
    return null;
  }
}

function consumeLoginReturnHref() {
  const href = getLoginReturnHref();
  if (!href) {
    return null;
  }

  sessionStorage.setItem(LOGIN_RESTORE_PENDING_KEY, '1');
  return href;
}

async function requireSession(message) {
  const session = await getSession();
  if (!session) {
    const loginReturn = {
      href: window.location.pathname + window.location.search + window.location.hash,
      scrollY: Math.round(window.scrollY),
    };
    const pageCapture = window.MewHomeSession?.capture?.();
    if (pageCapture) {
      Object.assign(loginReturn, pageCapture);
    }

    if (message) {
      if (window.MewMessage) {
        await MewMessage.show(message);
      } else {
        alert(message);
      }
    }

    const refreshedCapture = window.MewHomeSession?.capture?.();
    if (refreshedCapture) {
      Object.assign(loginReturn, refreshedCapture);
    }

    loginReturn.scrollY = Math.round(window.scrollY);
    sessionStorage.setItem(LOGIN_RETURN_KEY, JSON.stringify(loginReturn));
    window.location.href = mewPath('/account/login/');
    return null;
  }
  return session;
}

async function getProfile() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', session.user.id)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

async function getLoginStatus() {
  const session = await getSession();
  if (!session) {
    return { loggedIn: false };
  }

  const metaUsername = session.user.user_metadata?.username;
  let username = metaUsername;

  try {
    const profile = await getProfile();
    if (profile?.username) {
      username = profile.username;
    }
  } catch {
    // profile row missing or unreadable — use signup metadata username
  }

  return {
    loggedIn: true,
    username: username || '',
  };
}

function normalizeImagePath(imagePath) {
  if (!imagePath) {
    return mewPath(MEW_PATHS.placeholder);
  }
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  let webPath = imagePath.replace(/^\.\.\//, '/');
  if (!webPath.startsWith('/')) {
    webPath = `/${webPath}`;
  }
  if (webPath === '/media/placeholder.jpg' || webPath === '/media/placeholder.png') {
    webPath = MEW_PATHS.placeholder;
  }
  return mewPath(webPath);
}

async function fetchCatalogByIds(productIds) {
  const ids = [...new Set((productIds || []).filter((id) => id != null))];
  if (!ids.length) {
    return new Map();
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('pokemon_cards')
    .select('id, name, image_path, price, stock')
    .in('id', ids);

  if (error) {
    throw error;
  }

  return new Map((data || []).map((row) => [row.id, row]));
}

async function fetchAllCatalog() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('pokemon_cards')
    .select('id, name, image_path, price, stock')
    .order('id', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

async function getProductStock(productId) {
  const catalog = await fetchCatalogByIds([productId]);
  return catalog.get(productId)?.stock ?? 0;
}

/** @returns {Promise<Map<number, { cartItemId: number, quantity: number }>>} */
async function getCartLinesByProductId() {
  const session = await getSession();
  if (!session) {
    return new Map();
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, product_id, quantity, is_mystery')
    .not('product_id', 'is', null);

  if (error) {
    throw error;
  }

  const lines = new Map();
  for (const row of data || []) {
    if (row.product_id == null || row.is_mystery) {
      continue;
    }
    lines.set(row.product_id, { cartItemId: row.id, quantity: row.quantity });
  }
  return lines;
}

function isDuplicateCartItemError(error) {
  const errorText = `${error?.message || ''} ${error?.details || ''}`;
  return error?.code === '23505'
    && errorText.includes('cart_items');
}

async function changeProductCartQuantity(productId, delta, activeSession) {
  const session = activeSession || await requireSession();
  if (!session) {
    return 0;
  }

  const supabase = await getSupabase();
  const [maxStock, existingResult] = await Promise.all([
    getProductStock(productId),
    supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('product_id', productId)
      .eq('is_mystery', false)
      .maybeSingle(),
  ]);

  if (existingResult.error) {
    throw existingResult.error;
  }

  const existing = existingResult.data;
  const currentQuantity = existing?.quantity ?? 0;
  let nextQuantity = currentQuantity + delta;

  if (delta > 0 && maxStock <= 0) {
    throw new Error('This item is out of stock.');
  }

  if (nextQuantity > maxStock) {
    if (delta > 0 && currentQuantity >= maxStock) {
      throw new Error(`Only ${maxStock} in stock.`);
    }
    nextQuantity = maxStock;
  }

  if (nextQuantity <= 0) {
    if (existing) {
      const { error: deleteError } = await supabase.from('cart_items').delete().eq('id', existing.id);
      if (deleteError) {
        throw deleteError;
      }
    }
    return 0;
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: nextQuantity })
      .eq('id', existing.id);
    if (updateError) {
      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase.from('cart_items').insert({
      user_id: session.user.id,
      product_id: productId,
      is_mystery: false,
      quantity: nextQuantity,
    });
    if (insertError) {
      if (isDuplicateCartItemError(insertError)) {
        const { data: latest, error: latestError } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('product_id', productId)
          .eq('is_mystery', false)
          .maybeSingle();

        if (latestError) {
          throw latestError;
        }

        if (latest) {
          const latestQuantity = latest.quantity;
          let latestNextQuantity = latestQuantity + delta;

          if (latestNextQuantity > maxStock) {
            if (delta > 0 && latestQuantity >= maxStock) {
              throw new Error(`Only ${maxStock} in stock.`);
            }
            latestNextQuantity = maxStock;
          }

          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: latestNextQuantity })
            .eq('id', latest.id);
          if (updateError) {
            throw updateError;
          }
          return latestNextQuantity;
        }
      }
      throw insertError;
    }
  }

  return nextQuantity;
}

async function changeCartItemQuantity(cartItemId, delta) {
  const supabase = await getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from('cart_items')
    .select('id, quantity, product_id, is_mystery')
    .eq('id', cartItemId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!existing) {
    return 0;
  }

  if (existing.is_mystery && delta > 0) {
    return existing.quantity;
  }

  const maxStock = existing.is_mystery ? 1 : await getProductStock(existing.product_id);
  const currentQuantity = existing.quantity;
  let nextQuantity = currentQuantity + delta;

  if (delta > 0 && maxStock <= 0) {
    throw new Error('This item is out of stock.');
  }

  if (nextQuantity > maxStock) {
    if (delta > 0 && currentQuantity >= maxStock) {
      throw new Error(`Only ${maxStock} in stock.`);
    }
    nextQuantity = maxStock;
  }

  if (nextQuantity <= 0) {
    const { error: deleteError } = await supabase.from('cart_items').delete().eq('id', cartItemId);
    if (deleteError) {
      throw deleteError;
    }
    return 0;
  }

  const { error: updateError } = await supabase
    .from('cart_items')
    .update({ quantity: nextQuantity })
    .eq('id', cartItemId);

  if (updateError) {
    throw updateError;
  }

  return nextQuantity;
}

window.MewApi = {
  getSupabase,
  requireSession,
  consumeLoginReturnHref,
  getProfile,
  getLoginStatus,
  normalizeImagePath,
  fetchCatalogByIds,
  fetchAllCatalog,
  getCartLinesByProductId,
  getProductStock,
  changeProductCartQuantity,
  changeCartItemQuantity,
};
