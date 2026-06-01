# Mew's Truck

A demo e-commerce site for Pokémon Boundaries Crossed trading cards. The frontend is static HTML/CSS/JavaScript, hosted on **GitHub Pages**, with **Supabase** (free tier) for auth, database, and server-side logic via Postgres RPCs.

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
2. In **SQL Editor**, run (in order):
   - `database/supabase_schema.sql`
   - `database/supabase_seed.sql`
3. **Authentication → Providers → Email**: turn off **Confirm email** for the simplest demo flow.
4. **Authentication → URL configuration**: add your site URL(s), e.g.
   - `http://localhost:3000`
   - `https://YOUR_USER.github.io/YOUR_REPO/`

### 2. Local config

```bash
cp public/js/supabase-config.example.js public/js/supabase-config.js
```

Edit `public/js/supabase-config.js` with your project **URL** and **anon public** key (Dashboard → Project Settings → API).

For GitHub **project** sites (`username.github.io/repo-name/`), set `basePath` in `public/js/site-config.js`:

```js
window.MEW_SITE = {
  basePath: '/YOUR_REPO_NAME',
};
```

Leave `basePath` as `''` for local `npm run serve` or a custom domain at the site root.

### 3. Run locally

```bash
npm run serve
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to GitHub Pages

1. In the repo: **Settings → Pages → Build and deployment → GitHub Actions**.
2. Add repository **secrets**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Push to `main` (or `master`). The workflow `.github/workflows/deploy-pages.yml` deploys the `public/` folder and sets `basePath` to `/REPO_NAME` automatically.

## Project structure

```
mew-s-truck/
├── .github/workflows/           # GitHub Pages deploy (Supabase config injection)
├── public/                      # Static site (GitHub Pages root)
│   ├── css/                     # layout, components, forms, home
│   ├── js/                      # Supabase client, site config, shared helpers
│   ├── account/                 # Login, signup, dashboard
│   ├── cart/
│   ├── mystery/
│   ├── about/
│   ├── service/
│   ├── credits/
│   └── media/
└── database/
    ├── supabase_schema.sql      # Tables, RLS, RPCs (run in Supabase)
    └── supabase_seed.sql        # Card catalog data
```

## Scripts

| Command           | Description                                      |
|-------------------|--------------------------------------------------|
| `npm run serve`   | Preview static site on port 3000                 |
| `npm run lint`    | ESLint on `public/**/*.js`                       |

## License

ISC
