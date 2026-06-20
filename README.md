# Mew's Truck

A demo e-commerce site for Pokémon trading cards. The frontend is static HTML/CSS/JavaScript, hosted on **GitHub Pages**, with **Supabase** (free tier) for auth, database, and server-side logic via Postgres RPCs.

## Features

- Product catalog with sorting filters (loaded from Supabase)
- User authentication (signup, login, logout)
- Shopping cart and checkout
- Order history with pagination
- Mystery card purchase ($5 random card)
- FAQ and contact form

## Architecture

```
Browser (public/)  →  Supabase Auth + Postgres (RLS + RPCs)
GitHub Pages       →  serves static files only
```

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run (in order — both scripts are safe to re-run):
   - `database/schema.sql` — structure, legacy table/column migrations, RPCs, RLS
   - `database/seed.sql` — catalog data (upserts; preserves carts and orders)
3. **Authentication → Providers → Email**: turn off **Confirm email** for the simplest demo flow.
4. **Authentication → URL configuration**: add your site URL(s), e.g.
   - `http://localhost:3000`
   - `https://YOUR_USER.github.io/YOUR_REPO/`

### 2. Local environment

```bash
npm install
npm run setup
```

On first run, `setup` creates `.env` from `.env.example`. Edit `.env` with your project **URL** and **anon public** key (Dashboard → Project Settings → API), then run `npm run setup` again (or start dev — setup runs automatically).

For GitHub **project** sites (`username.github.io/repo-name/`), set `basePath` in `public/assets/scripts/config/site-config.js`:

```js
window.MEW_SITE = {
  basePath: '/YOUR_REPO_NAME',
};
```

Leave `basePath` as `''` for local dev or a custom domain at the site root.

### 3. Run locally

```bash
npm run dev
```

Opens [http://localhost:3000](http://localhost:3000) with live reload while you edit CSS/JS/HTML.

Production-like preview (no auto-reload):

```bash
npm run serve
```

## Deploy to GitHub Pages

1. In the repo: **Settings → Pages → Build and deployment → GitHub Actions**.
2. Add repository **secrets**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Push to `main` (or `master`). The workflow `.github/workflows/deploy-pages.yml` deploys the `public/` folder and sets `basePath` to `/REPO_NAME` automatically.

## Project structure

```
mew-s-truck/
├── .env.example                 # Copy → .env for local Supabase keys
├── .github/workflows/           # GitHub Pages deploy
├── database/
│   ├── schema.sql               # Tables, RLS, RPCs (run in Supabase)
│   └── seed.sql                 # Card catalog data
├── public/                      # Static site (GitHub Pages root)
│   ├── index.html               # Home / catalog
│   ├── assets/
│   │   ├── styles/
│   │   │   ├── layout.css       # Global layout
│   │   │   ├── components.css   # Shared UI components
│   │   │   ├── forms.css        # Form styles
│   │   │   └── pages/           # Page-specific CSS
│   │   ├── scripts/
│   │   │   ├── config/          # site-config, supabase client
│   │   │   ├── core/            # header, footer, API/shared UI helpers
│   │   │   ├── auth/            # shared auth UI feedback
│   │   │   └── pages/           # Page-specific JavaScript and home modules
│   │   └── images/              # catalog sets, UI art, placeholder
│   ├── about/                   # index.html only
│   ├── account/                 # dashboard, login/, signup/
│   ├── cart/
│   ├── credits/
│   ├── mystery/
│   └── service/
└── tools/                       # Local setup
    ├── setup-local.js
    ├── write-supabase-config.js
```

## Scripts

| Command           | Description                                      |
|-------------------|--------------------------------------------------|
| `npm run setup`   | Create `.env` (first time) and generate Supabase config |
| `npm run dev`     | Local dev server with live reload (port 3000)    |
| `npm run serve`   | Static preview without live reload (port 3000)   |
| `npm start`       | Alias for `npm run serve`                        |
| `npm run lint`    | ESLint on shared and page JavaScript             |

## License

ISC
