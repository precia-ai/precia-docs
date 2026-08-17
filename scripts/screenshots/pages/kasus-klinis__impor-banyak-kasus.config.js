/**
 * Kasus Klinis > Mengimpor Banyak Kasus Sekaligus
 * Route: /clinical/bulk-import/[unitId]/[moduleId]
 * app/(dashboard)/clinical/bulk-import/[unitId]/[moduleId]/page.tsx
 *
 * Entry point in the app: /clinical -> pick a unit -> "By AI Module" tab ->
 * pick a module -> "Bulk Import" button. We navigate straight to the final
 * URL (same one that button pushes to) since unitId/moduleId are stable
 * UUIDs in the DEMO-adjacent "System Health Organization" org used by the
 * SUP demo account (org CARD - Cardiology unit, "ECG EF Screening" module).
 *
 * The 3-step wizard tracker only has "Upload / Processing / Result", but the
 * upload step itself has 2 visually distinct sub-states worth separate
 * shots: file selected (ready to start) and preview (server validated the
 * ZIP, ready to confirm). Both stay under stepIndex 0 in the tracker.
 *
 * Fixture ZIP (fixtures/bulk-import-example.zip) is a copy of the app's own
 * generated "ZIP example" for this module (manifest.xlsx + 2 sample case
 * files), downloaded once via the app itself, not hand-crafted.
 */
const path = require('node:path')

const UNIT_ID = 'e6cd3b2a-2515-424c-b218-aebe2173d0db' // CARD - Cardiology
const MODULE_ID = '6e8751cc-cd68-485f-bb8a-4b8179094fe2' // ECG EF Screening
const ROUTE = `/clinical/bulk-import/${UNIT_ID}/${MODULE_ID}?unit=${encodeURIComponent('CARD - Cardiology')}`
const FIXTURE_ZIP = path.join(__dirname, '..', 'fixtures', 'bulk-import-example.zip')

// Bottom action row is always `.flex.justify-end.gap-2` with the primary
// action as the LAST button (Cancel/Back come first). Stable across locales
// because it's a structural selector, not text.
const PRIMARY_ACTION = '.flex.justify-end.gap-2 button:last-child'

async function selectFile(page) {
  await page.locator('input[type="file"]').setInputFiles(FIXTURE_ZIP)
}

async function reachPreview(page) {
  await selectFile(page)
  await page.waitForTimeout(300)
  await page.locator(PRIMARY_ACTION).click() // Start Import / Mulai Impor
  await page.waitForResponse((r) => r.url().includes('/bulk-import/') && r.url().includes('/preview/'), {
    timeout: 20000
  })
  await page.waitForTimeout(300)
}

async function reachProcessing(page) {
  await reachPreview(page)
  await page.locator(PRIMARY_ACTION).click() // Confirm Import / Konfirmasi Impor
  // Phase flips to "processing" synchronously on click; poll interval is
  // 3s, so this state stays on screen for several seconds regardless of
  // how fast the job actually finishes server-side.
  await page.waitForTimeout(900)
}

async function reachDone(page) {
  await reachPreview(page)
  await page.locator(PRIMARY_ACTION).click()
  // job.status text ("completed" / "failed" / ...) is rendered raw, not
  // translated, so this selector works in both locales.
  await page.waitForSelector('text=completed', { timeout: 30000 })
  await page.waitForTimeout(300)
}

module.exports = [
  {
    id: 'kasus-klinis__impor-banyak-kasus__01-unggah-zip',
    section: 'kasus-klinis',
    pageSlug: 'impor-banyak-kasus',
    stepSlug: '01-unggah-zip',
    route: ROUTE,
    role: 'SUP',
    fullPage: true,
    preActions: selectFile,
    annotate: [
      { type: 'box', x: 967, y: 383, width: 424, height: 53 },
      { type: 'box', x: 1260, y: 462, width: 134, height: 46 }
    ]
  },
  {
    id: 'kasus-klinis__impor-banyak-kasus__02-pratinjau',
    section: 'kasus-klinis',
    pageSlug: 'impor-banyak-kasus',
    stepSlug: '02-pratinjau',
    route: ROUTE,
    role: 'SUP',
    fullPage: true,
    preActions: reachPreview,
    annotate: [
      { type: 'box', x: 967, y: 347, width: 424, height: 65 },
      { type: 'box', x: 1210, y: 553, width: 184, height: 47 }
    ]
  },
  {
    id: 'kasus-klinis__impor-banyak-kasus__03-memproses',
    section: 'kasus-klinis',
    pageSlug: 'impor-banyak-kasus',
    stepSlug: '03-memproses',
    route: ROUTE,
    role: 'SUP',
    fullPage: true,
    preActions: reachProcessing,
    annotate: [{ type: 'box', x: 967, y: 328, width: 424, height: 90 }]
  },
  {
    id: 'kasus-klinis__impor-banyak-kasus__04-hasil',
    section: 'kasus-klinis',
    pageSlug: 'impor-banyak-kasus',
    stepSlug: '04-hasil',
    route: ROUTE,
    role: 'SUP',
    fullPage: true,
    preActions: reachDone,
    annotate: [
      { type: 'box', x: 967, y: 352, width: 424, height: 100 },
      { type: 'box', x: 1186, y: 467, width: 206, height: 46 }
    ]
  }
]
