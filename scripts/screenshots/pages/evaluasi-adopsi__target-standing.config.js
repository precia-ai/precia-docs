/**
 * Evaluasi & Adopsi > Target Standing (Standing KPI Targets)
 * Route: /evaluation/targets
 *
 * Daftar target KPI yang berlaku (standing target) + form buat/gantikan
 * target. indicator_key adalah daftar tetap dari backend (bukan teks bebas),
 * dan nilainya (mis. "success_rate", "turnaround_p90_ms") sama persis di
 * kedua locale karena itu kode data, bukan string UI yang diterjemahkan --
 * aman dipakai sebagai selector teks lintas locale.
 *
 * Urutan field pada form (dipakai lewat locator input/select generik karena
 * komponen Input tidak punya id/name/data-testid stabil, dan label-nya
 * diterjemahkan beda per locale). "form input" dan "form select" dihitung
 * TERPISAH (select bukan tag input), jadi dua daftar index berbeda:
 *   inputs:                         selects:
 *   0 indicator key (text)          0 scope unit
 *   1 target value (number)         1 scope AI module
 *   2 direction >= (radio)
 *   3 direction <= (radio)
 *   4 baseline value (number)
 *   5 baseline from (date)
 *   6 baseline to (date)
 *   7 effective from (date)
 *   8 note (text)
 */

const INDICATOR_KEY = 'turnaround_p90_ms'

async function openCreateForm(page) {
  await page.locator('main button:has(svg.lucide-plus)').click()
  await page.waitForTimeout(400)
}

async function fillCreateForm(page) {
  const inputs = page.locator('form input')
  const selects = page.locator('form select')
  await inputs.nth(0).fill(INDICATOR_KEY)
  await inputs.nth(1).fill('950')
  await inputs.nth(3).check() // "at most" direction
  await inputs.nth(4).fill('1400')
  await inputs.nth(5).fill('2026-05-01')
  await inputs.nth(6).fill('2026-07-31')
  await selects.nth(0).selectOption({ label: 'Cardiology' })
  await selects.nth(1).selectOption({ index: 1 })
  await inputs.nth(8).fill('Contoh target turnaround demo dokumentasi')
  await page.waitForTimeout(200)
}

/**
 * Submits the create form. The indicator+scope combination can already be
 * active from a previous run of this same spec (targets are never deleted
 * from the demo org), so a second submit is expected to fail with "already
 * active" -- that failure means the row we want to show already exists, so
 * we just close the form and move on rather than treating it as an error.
 */
async function submitCreateForm(page) {
  await page.locator('main button[type="submit"]').click()
  await page.waitForTimeout(1200)
  const stillOpen = await page.locator('main button[type="submit"]').count()
  if (stillOpen > 0) {
    // Form is still open -> either a real validation error or the
    // already-active conflict. Either way, cancel to fall back to the list,
    // which already carries the row from an earlier run.
    await page.locator('main button:has-text("Cancel"), main button:has-text("Batal")').click()
    await page.waitForTimeout(400)
  }
}

module.exports = [
  {
    id: 'evaluasi-adopsi__target-standing__01-daftar-target',
    section: 'evaluasi-adopsi',
    pageSlug: 'target-standing',
    stepSlug: '01-daftar-target',
    route: '/evaluation/targets',
    role: 'SUP',
    annotate: [
      // Kotak: filter Indicator key
      { type: 'box', x: 298, y: 158, width: 232, height: 40 },
      // Panah: tombol New target
      { type: 'arrow', from: { x: 760, y: 230 }, to: { x: 628, y: 197 } },
      // Kotak: aksi Supersede/Retire pada baris target aktif pertama
      { type: 'box', x: 1200, y: 326, width: 196, height: 34 }
    ]
  },
  {
    id: 'evaluasi-adopsi__target-standing__02-formulir-kosong',
    section: 'evaluasi-adopsi',
    pageSlug: 'target-standing',
    stepSlug: '02-formulir-kosong',
    route: '/evaluation/targets',
    role: 'SUP',
    preActions: async (page) => {
      await openCreateForm(page)
    },
    annotate: [
      // Kotak: field Indicator key
      { type: 'box', x: 298, y: 320, width: 542, height: 42 },
      // Kotak: field Target value
      { type: 'box', x: 850, y: 320, width: 542, height: 42 },
      // Kotak: pilihan Direction (arah target)
      { type: 'box', x: 298, y: 422, width: 1092, height: 92 },
      // Panah: tombol Create target
      { type: 'arrow', from: { x: 1050, y: 830 }, to: { x: 1300, y: 800 } }
    ]
  },
  {
    id: 'evaluasi-adopsi__target-standing__03-formulir-terisi',
    section: 'evaluasi-adopsi',
    pageSlug: 'target-standing',
    stepSlug: '03-formulir-terisi',
    route: '/evaluation/targets',
    role: 'SUP',
    preActions: async (page) => {
      await openCreateForm(page)
      await fillCreateForm(page)
    },
    annotate: [
      // Kotak: Indicator key + Target value terisi
      { type: 'box', x: 298, y: 320, width: 1092, height: 42 },
      // Kotak: Baseline value, Baseline from, Baseline to
      { type: 'box', x: 298, y: 533, width: 1092, height: 44 },
      // Kotak: Scope unit dan Scope AI module terisi
      { type: 'box', x: 298, y: 638, width: 722, height: 44 },
      // Panah: tombol Create target
      { type: 'arrow', from: { x: 1050, y: 830 }, to: { x: 1300, y: 800 } }
    ]
  },
  {
    id: 'evaluasi-adopsi__target-standing__04-target-dibuat',
    section: 'evaluasi-adopsi',
    pageSlug: 'target-standing',
    stepSlug: '04-target-dibuat',
    route: '/evaluation/targets',
    role: 'SUP',
    fullPage: true,
    preActions: async (page) => {
      await openCreateForm(page)
      await fillCreateForm(page)
      await submitCreateForm(page)
      // Scroll the newly created / already-existing row into view.
      const row = page.locator('main table tr', { hasText: INDICATOR_KEY }).first()
      await row.scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
    },
    // No annotate box: the new row's position depends on how many active
    // targets already exist in the demo org by the time this shot runs
    // (varies per run/locale), so a fixed pixel box would drift. The doc
    // prose points the reader to the row by its indicator key text instead.
    annotate: []
  }
]
