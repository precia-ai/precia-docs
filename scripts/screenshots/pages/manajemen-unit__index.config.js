/**
 * Manajemen Unit > Daftar Unit (index)
 * Route: /units
 * Grid kartu unit klinis, ada search box, pill filter status
 * (Semua/Aktif/Pilot/Nonaktif), dan tombol "Daftarkan Unit Baru".
 */
module.exports = [
  {
    id: 'manajemen-unit__index__01-daftar-unit',
    section: 'manajemen-unit',
    pageSlug: 'index',
    stepSlug: '01-daftar-unit',
    route: '/units',
    role: 'SUP',
    fullPage: true,
    annotate: [
      // Kotak: tombol Daftarkan Unit Baru
      { type: 'box', x: 1218, y: 51, width: 185, height: 46 },
      // Kotak: kotak pencarian unit
      { type: 'box', x: 282, y: 222, width: 588, height: 44 },
      // Kotak: pill filter status
      { type: 'box', x: 1061, y: 224, width: 353, height: 44 }
    ]
  },
  {
    id: 'manajemen-unit__index__02-filter-status',
    section: 'manajemen-unit',
    pageSlug: 'index',
    stepSlug: '02-filter-status',
    route: '/units',
    role: 'SUP',
    fullPage: true,
    preActions: async (page) => {
      const pills = page.locator('button.rounded-full[aria-pressed]')
      await pills.nth(2).click() // urutan tetap: Semua, Aktif, Pilot, Nonaktif
      await page.waitForTimeout(300)
    },
    annotate: [
      // Kotak: pill status Pilot yang aktif dipilih
      { type: 'box', x: 1228, y: 224, width: 86, height: 44 }
    ]
  },
  {
    id: 'manajemen-unit__index__03-pencarian',
    section: 'manajemen-unit',
    pageSlug: 'index',
    stepSlug: '03-pencarian',
    route: '/units',
    role: 'SUP',
    fullPage: true,
    preActions: async (page) => {
      await page.fill('input[type="search"]', 'cardio')
      await page.waitForTimeout(300)
    },
    annotate: [
      // Kotak: kotak pencarian berisi kata kunci
      { type: 'box', x: 282, y: 222, width: 588, height: 44 }
    ]
  }
]
