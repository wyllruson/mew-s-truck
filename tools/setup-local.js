#!/usr/bin/env node
/**
 * One-time / repeat local bootstrap: ensure .env exists, then write supabase-config.js.
 */
const fs = require('fs');
const path = require('path');
const { main: writeConfig } = require('./write-supabase-config.js');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const EXAMPLE_PATH = path.join(ROOT, '.env.example');

if (!fs.existsSync(ENV_PATH)) {
  if (!fs.existsSync(EXAMPLE_PATH)) {
    console.error('Missing .env.example — cannot bootstrap local config.');
    process.exit(1);
  }
  fs.copyFileSync(EXAMPLE_PATH, ENV_PATH);
  console.log('Created .env from .env.example.');
  console.log('Add your Supabase URL and anon key, then run: npm run dev');
  process.exit(1);
}

const wrote = writeConfig();
if (!wrote) {
  console.error('.env exists but could not write supabase-config.js.');
  process.exit(1);
}
