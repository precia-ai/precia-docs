/**
 * modul-ai / izin-modul-lintas-organisasi
 * Dialog "Kelola Izin" (Tenant Permission) di halaman detail modul AI.
 * Module dipakai untuk screenshot: Detrusor Underactivity Screening, sudah
 * punya 5 tenant aktif di data demo (org SUP sendiri + 4 org lain) sehingga
 * kartu "Izin Tenant" merepresentasikan izin lintas organisasi dengan baik.
 */
const MODULE_ID = '7bb6e5b9-27e8-4b56-ba9f-3460e530eab4'
const MODULE_ROUTE = `/ai-registry/${MODULE_ID}`

module.exports = [
  {
    id: 'modul-ai__izin-modul-lintas-organisasi__01-kartu-izin-tenant',
    section: 'modul-ai',
    pageSlug: 'izin-modul-lintas-organisasi',
    stepSlug: '01-kartu-izin-tenant',
    route: MODULE_ROUTE,
    role: 'SUP',
    annotate: [
      { type: 'box', x: 972, y: 296, width: 436, height: 196 },
      { type: 'box', x: 1266, y: 501, width: 108, height: 36 }
    ]
  },
  {
    id: 'modul-ai__izin-modul-lintas-organisasi__02-dialog-kelola-izin',
    section: 'modul-ai',
    pageSlug: 'izin-modul-lintas-organisasi',
    stepSlug: '02-dialog-kelola-izin',
    route: MODULE_ROUTE,
    role: 'SUP',
    preActions: async (page) => {
      await page.click('button:has-text("Kelola Izin"), button:has-text("Manage Permissions")')
      await page.waitForTimeout(500)
    },
    annotate: [
      { type: 'box', x: 424, y: 462, width: 592, height: 54 },
      { type: 'box', x: 852, y: 560, width: 190, height: 40 }
    ]
  }
]
