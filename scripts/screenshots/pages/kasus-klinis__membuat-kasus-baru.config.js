/**
 * Screenshot spec: Kasus Klinis > Membuat Kasus Baru
 * Route: /clinical (drawer "Buat Transaksi Klinis")
 * Selectors verified against precia-fe/app/(dashboard)/clinical/page.tsx.
 * Locale-agnostic selectors only (no visible-text selectors):
 *   - New case button: only <button> inside the gradient header Card (.border-primary/15)
 *   - Drawer root: [role="dialog"]
 *   - Unit select: #unit-select (id is hardcoded, not derived from a translated label)
 *   - MRN / Name inputs: shared Input component, both render class "Input-module__..."
 *     (CSS module hash, stable across locale) — nth(0)=MRN, nth(1)=Name
 *   - DOB: #dob-input, Notes: #notes-textarea (hardcoded ids)
 *   - Gender pills: .grid.grid-cols-2.gap-1\.5 button (order: male, female, other, unknown)
 *   - Priority pills: .grid.grid-cols-4.gap-1\.5 button (order: low, normal, high, urgent)
 *   - Submit: [role="dialog"] button[type="submit"]
 */

const NEW_CASE_BUTTON = '.border-primary\\/15 button'
const DIALOG = '[role="dialog"]'
const INPUT_TEXT = 'input[class*="Input-module"]'
const GENDER_BUTTONS = '.grid.grid-cols-2.gap-1\\.5 button'
const PRIORITY_BUTTONS = '.grid.grid-cols-4.gap-1\\.5 button'

async function openDrawer(page) {
  await page.click(NEW_CASE_BUTTON)
  await page.waitForSelector(DIALOG)
  await page.waitForTimeout(400)
}

async function fillForm(page, locale) {
  await page.selectOption('#unit-select', { index: 1 })
  await page.locator(INPUT_TEXT).nth(0).fill('MRN-DOC-0001')
  await page
    .locator(INPUT_TEXT)
    .nth(1)
    .fill(locale === 'en' ? 'Sample Patient' : 'Pasien Contoh Dokumentasi')
  await page.fill('#dob-input', '1985-06-15')
  await page.locator(GENDER_BUTTONS).nth(0).click() // male
  await page.locator(PRIORITY_BUTTONS).nth(2).click() // high / tinggi
  await page.fill(
    '#notes-textarea',
    locale === 'en'
      ? 'Sample case for the user guide.'
      : 'Kasus contoh untuk dokumentasi panduan pengguna.'
  )
  await page.waitForTimeout(200)
}

module.exports = [
  {
    id: 'kasus-klinis__membuat-kasus-baru__01-worklist',
    section: 'kasus-klinis',
    pageSlug: 'membuat-kasus-baru',
    stepSlug: '01-worklist',
    route: '/clinical?unit=general',
    role: 'SUP',
    preActions: async (page) => {
      await page.waitForTimeout(400)
    },
    annotate: [{ type: 'box', x: 1218, y: 54, width: 176, height: 44 }]
  },
  {
    id: 'kasus-klinis__membuat-kasus-baru__02-drawer-kosong',
    section: 'kasus-klinis',
    pageSlug: 'membuat-kasus-baru',
    stepSlug: '02-drawer-kosong',
    route: '/clinical?unit=general',
    role: 'SUP',
    preActions: async (page) => {
      await openDrawer(page)
    },
    annotate: [{ type: 'box', x: 980, y: 158, width: 440, height: 38 }]
  },
  {
    id: 'kasus-klinis__membuat-kasus-baru__03-drawer-terisi',
    section: 'kasus-klinis',
    pageSlug: 'membuat-kasus-baru',
    stepSlug: '03-drawer-terisi',
    route: '/clinical?unit=general',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await openDrawer(page)
      await fillForm(page, locale)
    },
    annotate: [{ type: 'box', x: 1268, y: 844, width: 138, height: 46 }]
  },
  {
    id: 'kasus-klinis__membuat-kasus-baru__04-hasil-sukses',
    section: 'kasus-klinis',
    pageSlug: 'membuat-kasus-baru',
    stepSlug: '04-hasil-sukses',
    route: '/clinical?unit=general',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await openDrawer(page)
      await fillForm(page, locale)
      await page.click(`${DIALOG} button[type="submit"]`)
      await page.waitForURL(/\/clinical\/transactions\//, { timeout: 15000 })
      await page.waitForTimeout(800)
    },
    annotate: [
      { type: 'box', x: 296, y: 78, width: 430, height: 100 },
      { type: 'box', x: 300, y: 610, width: 210, height: 150 }
    ]
  }
]
