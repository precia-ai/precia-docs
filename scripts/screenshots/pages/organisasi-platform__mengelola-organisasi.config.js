/**
 * Shots for content/{id,en}/organisasi-platform/mengelola-organisasi.mdx
 *
 * Route: /platform/organizations (SUP-only platform area).
 * A demo organization "DOC-DEMO" was created beforehand through the app UI
 * (Create Organization modal) so the edit / deactivate / activate steps have
 * a safe row to act on without touching real orgs (DEMO, RSUI, RS-UAT,
 * SYSTEM, PROBE-SYNTHETIC). Coordinates below were measured directly from
 * the live page at viewport 1440x900.
 *
 * Specs run sequentially and mutate shared backend state (this is by
 * design): step 05 deactivates DOC-DEMO, which is what step 05's screenshot
 * documents. DOC-DEMO is left "Inactive" after a full run, which is fine
 * since it is a docs-only demo org.
 */
const NEW_ORG_BUTTON = 'div.flex.flex-col.gap-3.sm\\:flex-row button'
const DIALOG = 'div[role="dialog"]'

async function openEditForDocDemo(page) {
  const row = page.locator('table tbody tr', { hasText: 'DOC-DEMO' })
  await row.locator('td:last-child button').nth(0).click()
  await page.waitForSelector(DIALOG)
  await page.waitForTimeout(300)
}

const MODAL_FIELD_ANNOTATIONS = [
  { type: 'box', x: 476, y: 361, width: 488, height: 50 }, // Kode
  { type: 'box', x: 476, y: 441, width: 488, height: 50 }, // Nama
  { type: 'box', x: 476, y: 521, width: 488, height: 47 } // Tipe
]

module.exports = [
  {
    id: 'organisasi-platform__mengelola-organisasi__01-daftar-organisasi',
    section: 'organisasi-platform',
    pageSlug: 'mengelola-organisasi',
    stepSlug: '01-daftar-organisasi',
    route: '/platform/organizations',
    role: 'SUP',
    annotate: [{ type: 'box', x: 1241, y: 31, width: 172, height: 50 }]
  },
  {
    id: 'organisasi-platform__mengelola-organisasi__02-modal-tambah-organisasi',
    section: 'organisasi-platform',
    pageSlug: 'mengelola-organisasi',
    stepSlug: '02-modal-tambah-organisasi',
    route: '/platform/organizations',
    role: 'SUP',
    preActions: async (page) => {
      await page.click(NEW_ORG_BUTTON)
      await page.waitForSelector(DIALOG)
      await page.waitForTimeout(300)
    },
    annotate: [
      ...MODAL_FIELD_ANNOTATIONS,
      { type: 'box', x: 883, y: 591, width: 81, height: 50 } // submit button
    ]
  },
  {
    id: 'organisasi-platform__mengelola-organisasi__03-modal-edit-organisasi',
    section: 'organisasi-platform',
    pageSlug: 'mengelola-organisasi',
    stepSlug: '03-modal-edit-organisasi',
    route: '/platform/organizations',
    role: 'SUP',
    preActions: async (page) => {
      await openEditForDocDemo(page)
    },
    annotate: MODAL_FIELD_ANNOTATIONS
  },
  {
    id: 'organisasi-platform__mengelola-organisasi__04-tombol-nonaktifkan',
    section: 'organisasi-platform',
    pageSlug: 'mengelola-organisasi',
    stepSlug: '04-tombol-nonaktifkan',
    route: '/platform/organizations',
    role: 'SUP',
    annotate: [{ type: 'box', x: 1256, y: 349, width: 123, height: 42 }]
  },
  {
    id: 'organisasi-platform__mengelola-organisasi__05-organisasi-nonaktif',
    section: 'organisasi-platform',
    pageSlug: 'mengelola-organisasi',
    stepSlug: '05-organisasi-nonaktif',
    route: '/platform/organizations',
    role: 'SUP',
    preActions: async (page) => {
      // Toggle button variant reflects state: "destructive" = currently
      // active (button deactivates it), "primary" = currently inactive
      // (button activates it). Only click when the org is still active, so
      // this step is idempotent regardless of which locale ran first.
      const row = page.locator('table tbody tr', { hasText: 'DOC-DEMO' })
      const toggleBtn = row.locator('td:last-child button').nth(1)
      const cls = (await toggleBtn.getAttribute('class')) || ''
      if (cls.includes('destructive')) {
        await toggleBtn.click()
        await page.waitForTimeout(1200)
      }
    },
    annotate: [
      { type: 'box', x: 987, y: 336, width: 151, height: 67 }, // status badge
      { type: 'box', x: 1285, y: 349, width: 94, height: 42 } // activate button
    ]
  }
]
