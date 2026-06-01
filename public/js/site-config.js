/**
 * Site-wide settings for static hosting (e.g. GitHub Pages).
 *
 * Project site at https://user.github.io/REPO_NAME/ — set basePath to '/REPO_NAME'
 * User/org site at https://user.github.io/ — leave basePath as ''
 */
window.MEW_SITE = window.MEW_SITE || {
  basePath: '',
};

window.mewPath = function mewPath(path) {
  const base = window.MEW_SITE.basePath || '';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!base) {
    return normalized;
  }
  const baseTrimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${baseTrimmed}${normalized}`;
};
