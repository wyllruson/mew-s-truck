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

async function requireSession(message) {
  const session = await getSession();
  if (!session) {
    if (message) {
      alert(message);
    }
    window.location.href = mewPath('/account/login.html');
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

  const profile = await getProfile();
  return {
    loggedIn: true,
    username: profile?.username || session.user.email,
  };
}

function normalizeImagePath(imagePath) {
  if (!imagePath) {
    return mewPath('/media/placeholder.jpg');
  }
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  const webPath = imagePath.replace(/^\.\.\//, '/');
  return mewPath(webPath.startsWith('/') ? webPath : `/${webPath}`);
}

window.MewApi = {
  getSupabase,
  getSession,
  requireSession,
  getProfile,
  getLoginStatus,
  normalizeImagePath,
};
