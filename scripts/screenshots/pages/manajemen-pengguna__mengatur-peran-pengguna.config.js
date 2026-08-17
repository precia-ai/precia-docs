/**
 * Halaman /users/[id]/roles: kelola peran pengguna (assign/remove massal
 * lewat checkbox multi-select + widget tukar peran).
 *
 * User demo yang dipakai: "Pengguna Contoh Dokumentasi" (dibuat khusus
 * untuk kebutuhan screenshot dokumentasi, org DEMO / System Health
 * Organization), id 5083e1be-8893-4a81-9c33-218c216b30c9, peran awal
 * "Nurse / Technician".
 */
const USER_ID = '5083e1be-8893-4a81-9c33-218c216b30c9'
const ROUTE = `/users/${USER_ID}/roles`

module.exports = [
  {
    id: 'manajemen-pengguna__mengatur-peran-pengguna__01-tampilan-awal',
    section: 'manajemen-pengguna',
    pageSlug: 'mengatur-peran-pengguna',
    stepSlug: '01-tampilan-awal',
    route: ROUTE,
    role: 'SUP',
    annotate: [
      { type: 'box', x: 512, y: 112, width: 672, height: 98 }
    ]
  },
  {
    id: 'manajemen-pengguna__mengatur-peran-pengguna__02-pilih-peran-diberikan',
    section: 'manajemen-pengguna',
    pageSlug: 'mengatur-peran-pengguna',
    stepSlug: '02-pilih-peran-diberikan',
    route: ROUTE,
    role: 'SUP',
    preActions: async (page) => {
      const checkboxes = page.locator('input[type=checkbox]')
      await checkboxes.nth(0).check() // Admin
      await checkboxes.nth(2).check() // Klinisi / Clinician
    },
    annotate: [
      { type: 'box', x: 523, y: 289, width: 650, height: 174 },
      { type: 'arrow', from: { x: 700, y: 540 }, to: { x: 687, y: 497 } }
    ]
  },
  {
    id: 'manajemen-pengguna__mengatur-peran-pengguna__03-pilih-peran-dicabut',
    section: 'manajemen-pengguna',
    pageSlug: 'mengatur-peran-pengguna',
    stepSlug: '03-pilih-peran-dicabut',
    route: ROUTE,
    role: 'SUP',
    preActions: async (page) => {
      const checkboxes = page.locator('input[type=checkbox]')
      await checkboxes.nth(1).check() // Perawat / Nurse (peran yang sedang dimiliki user)
    },
    annotate: [
      { type: 'box', x: 523, y: 343, width: 650, height: 66 },
      { type: 'arrow', from: { x: 1000, y: 540 }, to: { x: 1008, y: 497 } }
    ]
  },
  {
    id: 'manajemen-pengguna__mengatur-peran-pengguna__04-tukar-peran-lama',
    section: 'manajemen-pengguna',
    pageSlug: 'mengatur-peran-pengguna',
    stepSlug: '04-tukar-peran-lama',
    route: ROUTE,
    role: 'SUP',
    preActions: async (page) => {
      await page.locator('select').nth(0).selectOption({ index: 1 })
    },
    annotate: [
      { type: 'box', x: 523, y: 615, width: 327, height: 83 }
    ]
  },
  {
    id: 'manajemen-pengguna__mengatur-peran-pengguna__05-tukar-peran-baru',
    section: 'manajemen-pengguna',
    pageSlug: 'mengatur-peran-pengguna',
    stepSlug: '05-tukar-peran-baru',
    route: ROUTE,
    role: 'SUP',
    preActions: async (page) => {
      await page.locator('select').nth(0).selectOption({ index: 1 })
      await page.locator('select').nth(1).selectOption('nurse')
    },
    annotate: [
      { type: 'box', x: 523, y: 615, width: 327, height: 83 },
      { type: 'box', x: 846, y: 615, width: 327, height: 83 },
      { type: 'arrow', from: { x: 848, y: 760 }, to: { x: 848, y: 724 } }
    ]
  }
]
