#!/usr/bin/env node
/**
 * Writes public/assets/scripts/config/supabase-config.js from .env (same shape as GitHub Pages deploy).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const OUT_PATH = path.join(ROOT, 'public/assets/scripts/config/supabase-config.js');

function loadEnv(filePath) {
  const env = {};
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function isPlaceholder(value) {
  if (!value) return true;
  return value.includes('YOUR_') || value.includes('YOUR_PROJECT');
}

function main() {
  if (!fs.existsSync(ENV_PATH)) {
    return false;
  }

  const env = loadEnv(ENV_PATH);
  const url = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY;

  if (isPlaceholder(url) || isPlaceholder(anonKey)) {
    console.error('Edit .env with your Supabase URL and anon key (Dashboard → API).');
    process.exit(1);
  }

  const body = `window.MEW_SUPABASE = {
  url: ${JSON.stringify(url)},
  anonKey: ${JSON.stringify(anonKey)},
};
`;

  fs.writeFileSync(OUT_PATH, body, 'utf8');
  return true;
}

if (require.main === module) {
  const ok = main();
  if (!ok) {
    process.exit(0);
  }
}

module.exports = { main };
