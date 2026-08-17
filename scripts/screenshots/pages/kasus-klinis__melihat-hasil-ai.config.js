/**
 * Screenshots for content/{id,en}/kasus-klinis/melihat-hasil-ai.mdx
 *
 * Fixed demo transaction (org DEMO, unit Urology, 3 AI module slots — one
 * pending, two completed with different classifications) so every locale
 * run lands on the exact same visual state:
 *   https://app-dev.precia.site/clinical/transactions/1050572b-b82d-4f98-8598-88326594791d
 *
 * Tab bar selector: div.flex.border-b.border-border.px-1 button
 *   0 = Info Pasien / Patient Info
 *   1 = BOO Multimodal (Version A)  -> status "Pending" (structured fields, no AI result yet)
 *   2 = BOO Clinical Screening      -> status "Completed", classification "BOO"
 *   3 = Detrusor Underactivity Screening -> status "Completed", classification "Non-DU"
 */

const TX_ROUTE =
  '/clinical/transactions/1050572b-b82d-4f98-8598-88326594791d'

const TAB_SELECTOR = 'div.flex.border-b.border-border.px-1 button'

async function clickTab(page, index) {
  await page.locator(TAB_SELECTOR).nth(index).click()
  await page.waitForTimeout(600)
}

module.exports = [
  {
    id: 'kasus-klinis__melihat-hasil-ai__01-tab-info-pasien',
    section: 'kasus-klinis',
    pageSlug: 'melihat-hasil-ai',
    stepSlug: '01-tab-info-pasien',
    route: TX_ROUTE,
    role: 'SUP',
    fullPage: true,
    annotate: [
      // Tab bar: one tab per AI module slot, plus Patient Info
      { type: 'box', x: 748, y: 271, width: 692, height: 35 },
      // "AI Modules 3 slot" stat tile -> tab bar
      {
        type: 'arrow',
        from: { x: 1290, y: 392 },
        to: { x: 1200, y: 308 }
      }
    ]
  },
  {
    id: 'kasus-klinis__melihat-hasil-ai__02-tab-modul-menunggu',
    section: 'kasus-klinis',
    pageSlug: 'melihat-hasil-ai',
    stepSlug: '02-tab-modul-menunggu',
    route: TX_ROUTE,
    role: 'SUP',
    fullPage: true,
    preActions: async (page) => {
      await clickTab(page, 1)
    },
    annotate: [
      // Slot status badge ("Pending" / "Menunggu") — AI has not run yet
      { type: 'box', x: 1288, y: 344, width: 92, height: 28 },
      // Structured clinical data fields for this module
      { type: 'box', x: 771, y: 452, width: 610, height: 675 }
    ]
  },
  {
    id: 'kasus-klinis__melihat-hasil-ai__03-hasil-boo-screening',
    section: 'kasus-klinis',
    pageSlug: 'melihat-hasil-ai',
    stepSlug: '03-hasil-boo-screening',
    route: TX_ROUTE,
    role: 'SUP',
    fullPage: true,
    preActions: async (page) => {
      await clickTab(page, 2)
    },
    annotate: [
      // Confidence badge in the module header (top-right)
      { type: 'box', x: 1298, y: 1290, width: 84, height: 28 },
      // Probability bar row
      { type: 'box', x: 771, y: 1415, width: 610, height: 42 },
      // Classification chip
      { type: 'box', x: 1310, y: 1477, width: 72, height: 26 }
    ]
  },
  {
    id: 'kasus-klinis__melihat-hasil-ai__04-hasil-detrusor',
    section: 'kasus-klinis',
    pageSlug: 'melihat-hasil-ai',
    stepSlug: '04-hasil-detrusor',
    route: TX_ROUTE,
    role: 'SUP',
    fullPage: true,
    preActions: async (page) => {
      await clickTab(page, 3)
    },
    annotate: [
      // Confidence badge in the module header (top-right)
      { type: 'box', x: 1298, y: 1290, width: 84, height: 28 },
      // Probability bar row
      { type: 'box', x: 771, y: 1415, width: 610, height: 42 },
      // Classification chip ("Non-DU" is wider than "BOO", box sized to fit both locales)
      { type: 'box', x: 1272, y: 1477, width: 110, height: 26 }
    ]
  }
]
