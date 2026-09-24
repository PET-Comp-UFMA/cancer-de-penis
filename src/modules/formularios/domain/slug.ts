// Public address of a form: /tela-avaliacao/<slug>. Slugs replace the
// auto-generated FORM-<uuid> key on a form's first publication.

// Static pages under /tela-avaliacao that a slug must not shadow.
const RESERVED_SLUGS = new Set(['tela-avaliacao']);

export const AUTO_CATALOG_KEY = /^FORM-[0-9A-F]{32}$/i;

export function slugify(title: string): string {
  const slug = title
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return slug || 'formulario';
}

// First candidate is the plain slug, then slug-2, slug-3, ...
export function slugCandidates(title: string): (attempt: number) => string {
  const base = slugify(title);
  const offset = RESERVED_SLUGS.has(base) ? 1 : 0;
  return (attempt) => (attempt + offset === 1 ? base : `${base}-${attempt + offset}`);
}
