import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.MEW_SUPABASE;

if (cfg?.url && cfg?.anonKey) {
  window.supabase = createClient(cfg.url, cfg.anonKey);
} else {
  console.warn(
    'Supabase is not configured. Copy public/js/supabase-config.example.js to supabase-config.js'
  );
  window.supabase = null;
}

window.dispatchEvent(new Event('supabase:ready'));
