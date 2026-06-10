import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.MEW_SUPABASE;

if (cfg?.url && cfg?.anonKey) {
  window.supabase = createClient(cfg.url, cfg.anonKey);
} else {
  console.warn(
    'Supabase is not configured. Run npm run setup after filling in .env'
  );
  window.supabase = null;
}

window.dispatchEvent(new Event('supabase:ready'));
