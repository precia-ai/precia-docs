/**
 * Manajemen Unit > Detail Unit
 * Route: /units/:unitId
 * Sidebar identitas unit + statistik, tiga tab (Members, AI Modules,
 * Governance History), dialog Edit Unit, dialog Ubah Status.
 * Menggunakan unit demo "Cardiology" (punya 1 anggota, 3 modul AI,
 * 5 riwayat) supaya tampilan representatif.
 */
const DEMO_UNIT_ID = 'e6cd3b2a-2515-424c-b218-aebe2173d0db'

module.exports = [
  {
    id: 'manajemen-unit__detail-unit__01-tab-members',
    section: 'manajemen-unit',
    pageSlug: 'detail-unit',
    stepSlug: '01-tab-members',
    route: `/units/${DEMO_UNIT_ID}`,
    role: 'SUP',
    fullPage: true,
    annotate: [
      // Kotak: tombol Tugaskan Staf (sidebar)
      { type: 'box', x: 304, y: 291, width: 288, height: 32 },
      // Kotak: tombol Ubah Status (sidebar)
      { type: 'box', x: 304, y: 339, width: 288, height: 30 },
      // Kotak: tombol Ubah Unit (sidebar)
      { type: 'box', x: 304, y: 388, width: 288, height: 30 },
      // Kotak: tab Anggota yang aktif
      { type: 'box', x: 628, y: 74, width: 140, height: 32 }
    ]
  },
  {
    id: 'manajemen-unit__detail-unit__02-tab-ai-modules',
    section: 'manajemen-unit',
    pageSlug: 'detail-unit',
    stepSlug: '02-tab-ai-modules',
    route: `/units/${DEMO_UNIT_ID}`,
    role: 'SUP',
    fullPage: true,
    preActions: async (page) => {
      const tabs = page.locator('button[role="tab"]')
      await tabs.nth(1).click() // urutan tetap: Members, AI Modules, Governance History
      await page.waitForTimeout(400)
    },
    annotate: [
      // Kotak: tab Modul AI yang aktif
      { type: 'box', x: 776, y: 74, width: 145, height: 32 },
      // Kotak: tombol Daftarkan Modul AI
      { type: 'box', x: 1202, y: 148, width: 218, height: 40 }
    ]
  },
  {
    id: 'manajemen-unit__detail-unit__03-tab-history',
    section: 'manajemen-unit',
    pageSlug: 'detail-unit',
    stepSlug: '03-tab-history',
    route: `/units/${DEMO_UNIT_ID}`,
    role: 'SUP',
    fullPage: true,
    preActions: async (page) => {
      const tabs = page.locator('button[role="tab"]')
      await tabs.nth(2).click() // urutan tetap: Members, AI Modules, Governance History
      await page.waitForTimeout(400)
    },
    annotate: [
      // Kotak: tab Riwayat Tata Kelola yang aktif
      { type: 'box', x: 927, y: 74, width: 190, height: 32 }
    ]
  },
  {
    id: 'manajemen-unit__detail-unit__04-dialog-edit-unit',
    section: 'manajemen-unit',
    pageSlug: 'detail-unit',
    stepSlug: '04-dialog-edit-unit',
    route: `/units/${DEMO_UNIT_ID}`,
    role: 'SUP',
    preActions: async (page) => {
      const buttons = page.locator('aside button')
      await buttons.nth(2).click() // urutan tetap: Tetapkan Staf, Ubah Status, Edit Unit
      await page.waitForTimeout(400)
    },
    annotate: [
      // Kotak: field Nama Unit
      { type: 'box', x: 481, y: 393, width: 480, height: 44 },
      // Kotak: tombol Simpan Perubahan
      { type: 'box', x: 783, y: 557, width: 172, height: 40 }
    ]
  },
  {
    id: 'manajemen-unit__detail-unit__05-dialog-ubah-status',
    section: 'manajemen-unit',
    pageSlug: 'detail-unit',
    stepSlug: '05-dialog-ubah-status',
    route: `/units/${DEMO_UNIT_ID}`,
    role: 'SUP',
    preActions: async (page) => {
      const buttons = page.locator('aside button')
      await buttons.nth(1).click() // urutan tetap: Tetapkan Staf, Ubah Status, Edit Unit
      await page.waitForTimeout(400)
    },
    annotate: [
      // Kotak: pilihan status Pilot
      { type: 'box', x: 481, y: 502, width: 480, height: 54 },
      // Kotak: tombol Perbarui Status
      { type: 'box', x: 803, y: 580, width: 158, height: 40 }
    ]
  }
]
