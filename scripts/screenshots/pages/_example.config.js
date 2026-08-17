/**
 * Template for a page's screenshot spec file. Copy this pattern into a new
 * file named "<section>__<page>.config.js" inside scripts/screenshots/pages/.
 * Each file exports an ARRAY of shot specs (one entry per distinct UI step).
 *
 * IMPORTANT: preActions must use STABLE selectors (data-testid, aria-label,
 * href, css class, input id/name) — never visible text — because the same
 * spec runs once per locale (id/en) and button/label text differs between
 * them. Read the actual component file in precia-fe before writing selectors.
 *
 * id            unique across the whole project: "<section>__<page>__<step>"
 * section       matches content/<locale>/<section>/ folder name
 * pageSlug      matches the .mdx filename (without extension)
 * stepSlug      short kebab-case step name, becomes the image filename
 * route         path on https://app-dev.precia.site (or full URL)
 * role          demo account role code to log in as (CLN, SAD, PAD, ...) or
 *               omit for the public login page itself
 * viewport      optional, defaults to 1440x900
 * preActions    optional async (page, {locale}) => {} run after navigation,
 *               before the screenshot (click/fill to reach this exact step)
 * annotate      optional array of {type:'box'|'arrow', ...} OR a function
 *               (({locale}) => array) if coordinates differ per locale
 */
module.exports = [
  {
    id: 'contoh__contoh-halaman__01-tampilan-awal',
    section: 'contoh',
    pageSlug: 'contoh-halaman',
    stepSlug: '01-tampilan-awal',
    route: '/dashboard',
    role: 'CLN',
    annotate: [
      { type: 'box', x: 40, y: 120, width: 220, height: 48 },
      { type: 'arrow', from: { x: 500, y: 300 }, to: { x: 280, y: 145 } }
    ]
  }
]
