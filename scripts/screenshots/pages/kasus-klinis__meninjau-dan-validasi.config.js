/**
 * "Meninjau dan Validasi" (kasus-klinis section) — the /validation worklist
 * page (list of cases handed to a clinical validator + decision detail
 * panel), plus the "Clinical Review" block on the transaction detail page
 * (Send to Validator / Request Retake).
 *
 * Demo data used (System Health Organization, SUP account):
 *  - Published case: transaction code TRX-20260810-3568B8 ("Urology Three
 *    Module Test") — validation already recorded and published.
 *  - Unpublished case: patient code MEDICCA-TEST-DAFTAR-001, the row whose
 *    status badge reads "Pending"/"Menunggu" — decision recorded but not
 *    yet published, so Publish/Retake actions are still visible.
 *  - Clinical Review block: a real transaction created through the UI
 *    (Cardiology unit, MRN MRN-DOCS-VAL-01) left in "Unprocessed" status,
 *    so "Send to Validator" and "Request Retake" are both visible in their
 *    natural (pre-submit) state.
 */

const PENDING_LABEL = { id: 'Menunggu', en: 'Pending' }

module.exports = [
  {
    id: 'kasus-klinis__meninjau-dan-validasi__01-worklist',
    section: 'kasus-klinis',
    pageSlug: 'meninjau-dan-validasi',
    stepSlug: '01-worklist',
    route: '/validation',
    role: 'SUP',
    annotate: [
      { type: 'box', x: 300, y: 214, width: 522, height: 44 }
    ]
  },
  {
    id: 'kasus-klinis__meninjau-dan-validasi__02-detail-terpublikasi',
    section: 'kasus-klinis',
    pageSlug: 'meninjau-dan-validasi',
    stepSlug: '02-detail-terpublikasi',
    route: '/validation',
    role: 'SUP',
    preActions: async (page) => {
      await page.locator('button', { hasText: 'TRX-20260810-3568B8' }).click()
      await page.waitForTimeout(800)
    },
    annotate: [
      { type: 'box', x: 1143, y: 245, width: 90, height: 26 }
    ]
  },
  {
    id: 'kasus-klinis__meninjau-dan-validasi__03-detail-belum-publikasi',
    section: 'kasus-klinis',
    pageSlug: 'meninjau-dan-validasi',
    stepSlug: '03-detail-belum-publikasi',
    route: '/validation',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      const label = PENDING_LABEL[locale] || PENDING_LABEL.en
      const row = page
        .locator('button', { hasText: 'MEDICCA-TEST-DAFTAR-001' })
        .filter({ hasText: label })
      await row.first().click()
      await page.waitForTimeout(800)
    },
    annotate: ({ locale }) => {
      const publishWidth = locale === 'id' ? 205 : 175
      const retakeBtnWidth = locale === 'id' ? 215 : 145
      return [
        { type: 'box', x: 875, y: 549, width: publishWidth, height: 43 },
        { type: 'box', x: 875, y: 627, width: 515, height: 57 },
        { type: 'box', x: 875, y: 704, width: retakeBtnWidth, height: 37 }
      ]
    }
  },
  {
    id: 'kasus-klinis__meninjau-dan-validasi__04-tinjauan-klinis-detail-transaksi',
    section: 'kasus-klinis',
    pageSlug: 'meninjau-dan-validasi',
    stepSlug: '04-tinjauan-klinis-detail-transaksi',
    route: '/clinical/transactions/201d6ebd-110e-4b9a-955d-d812f09751ad',
    role: 'SUP',
    preActions: async (page) => {
      await page.mouse.wheel(0, 500)
      await page.waitForTimeout(300)
    },
    annotate: ({ locale }) => {
      const sendWidth = locale === 'id' ? 178 : 175
      const retakeBtnWidth = locale === 'id' ? 202 : 163
      return [
        { type: 'box', x: 778, y: 331, width: sendWidth, height: 42 },
        { type: 'box', x: 778, y: 407, width: 596, height: 58 },
        { type: 'box', x: 778, y: 478, width: retakeBtnWidth, height: 40 }
      ]
    }
  }
]
