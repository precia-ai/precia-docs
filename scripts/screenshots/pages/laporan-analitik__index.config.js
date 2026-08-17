/**
 * Laporan & Analitik > Ringkasan (index)
 * Route: /analytics
 * Dua tab: Operasional (volume, keberhasilan, waktu penyelesaian, per unit,
 * per modul, keyakinan, kegagalan, hasil validasi, ringkasan per unit) dan
 * Adopsi (adopsi unit, adopsi validator, utilisasi modul).
 * Akun SUP dipakai; tab aktif di-klik eksplisit lewat preActions karena
 * status default tab tidak bisa diasumsikan sama di semua sesi.
 */
const TABS_SELECTOR = 'div.flex.gap-1.border-b.border-border button'

async function clickTab(page, index) {
  await page.locator(TABS_SELECTOR).nth(index).click()
  await page.waitForTimeout(1200)
}

module.exports = [
  {
    id: 'laporan-analitik__index__01-tab-operasional',
    section: 'laporan-analitik',
    pageSlug: 'index',
    stepSlug: '01-tab-operasional',
    route: '/analytics',
    role: 'SUP',
    fullPage: true,
    preActions: async (page) => {
      await clickTab(page, 0)
    },
    annotate: [
      // Kotak: filter rentang tanggal, unit, modul AI, dan tombol muat ulang
      { type: 'box', x: 623, y: 47, width: 782, height: 213 },
      // Kotak: saklar tab Operasional / Adopsi
      { type: 'box', x: 286, y: 228, width: 204, height: 30 }
    ]
  },
  {
    id: 'laporan-analitik__index__02-tabel-ringkasan-unit',
    section: 'laporan-analitik',
    pageSlug: 'index',
    stepSlug: '02-tabel-ringkasan-unit',
    route: '/analytics',
    role: 'SUP',
    preActions: async (page) => {
      await clickTab(page, 0)
      await page.locator('table').scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
    },
    annotate: [
      // Kotak: baris header kolom tabel
      { type: 'box', x: 309, y: 193, width: 1078, height: 40 },
      // Kotak: baris unit dengan data nyata (Cardiology)
      { type: 'box', x: 309, y: 234, width: 1078, height: 42 },
      // Panah: menunjuk kolom Tingkat keberhasilan pada baris tersebut
      { type: 'arrow', from: { x: 1040, y: 760 }, to: { x: 1140, y: 262 } }
    ]
  },
  {
    id: 'laporan-analitik__index__03-tab-adopsi',
    section: 'laporan-analitik',
    pageSlug: 'index',
    stepSlug: '03-tab-adopsi',
    route: '/analytics',
    role: 'SUP',
    preActions: async (page) => {
      await clickTab(page, 1)
    },
    annotate: [
      // Kotak: kartu Adopsi Unit
      { type: 'box', x: 288, y: 287, width: 552, height: 142 },
      // Kotak: kartu Adopsi Validator
      { type: 'box', x: 856, y: 287, width: 552, height: 142 }
    ]
  },
  {
    id: 'laporan-analitik__index__04-drilldown-kegagalan',
    section: 'laporan-analitik',
    pageSlug: 'index',
    stepSlug: '04-drilldown-kegagalan',
    route: '/analytics/failures',
    role: 'SUP',
    annotate: [
      // Kotak: filter (tanggal, alasan, unit, modul AI) di halaman detail kegagalan
      { type: 'box', x: 305, y: 105, width: 1015, height: 130 },
      // Panah: kolom Kasus, tautan ke detail transaksi asal kegagalan
      { type: 'arrow', from: { x: 1150, y: 500 }, to: { x: 1354, y: 419 } }
    ]
  }
]
