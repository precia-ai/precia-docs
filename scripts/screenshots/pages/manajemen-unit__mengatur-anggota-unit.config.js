/**
 * manajemen-unit / mengatur-anggota-unit
 * Tab Members di halaman detail unit: alur assign member baru + dialog edit role anggota.
 */
const UNIT_DETAIL_ROUTE = '/units/e6cd3b2a-2515-424c-b218-aebe2173d0db'

async function openAssignDialog(page) {
  await page.locator('button:has(svg.lucide-user-plus)').first().click()
  await page.waitForTimeout(400)
}

module.exports = [
  {
    id: 'manajemen-unit__mengatur-anggota-unit__01-tab-members',
    section: 'manajemen-unit',
    pageSlug: 'mengatur-anggota-unit',
    stepSlug: '01-tab-members',
    route: UNIT_DETAIL_ROUTE,
    role: 'SUP',
    annotate: [
      { type: 'box', x: 1209, y: 160, width: 182, height: 40 },
      { type: 'box', x: 1220, y: 300, width: 46, height: 34 }
    ]
  },
  {
    id: 'manajemen-unit__mengatur-anggota-unit__02-dialog-assign-kosong',
    section: 'manajemen-unit',
    pageSlug: 'mengatur-anggota-unit',
    stepSlug: '02-dialog-assign-kosong',
    route: UNIT_DETAIL_ROUTE,
    role: 'SUP',
    preActions: async (page) => {
      await openAssignDialog(page)
    },
    annotate: [
      { type: 'box', x: 481, y: 384, width: 478, height: 40 }
    ]
  },
  {
    id: 'manajemen-unit__mengatur-anggota-unit__03-dialog-assign-cari-user',
    section: 'manajemen-unit',
    pageSlug: 'mengatur-anggota-unit',
    stepSlug: '03-dialog-assign-cari-user',
    route: UNIT_DETAIL_ROUTE,
    role: 'SUP',
    preActions: async (page) => {
      await openAssignDialog(page)
      const searchInput = page.locator('input[placeholder]').first()
      await searchInput.fill('dr')
      await page.waitForTimeout(400)
    },
    annotate: [
      { type: 'box', x: 481, y: 462, width: 478, height: 55 }
    ]
  },
  {
    id: 'manajemen-unit__mengatur-anggota-unit__04-dialog-assign-terisi',
    section: 'manajemen-unit',
    pageSlug: 'mengatur-anggota-unit',
    stepSlug: '04-dialog-assign-terisi',
    route: UNIT_DETAIL_ROUTE,
    role: 'SUP',
    preActions: async (page) => {
      await openAssignDialog(page)
      const searchInput = page.locator('input[placeholder]').first()
      await searchInput.fill('dr')
      await page.waitForTimeout(400)
      const firstOption = page
        .locator('div.absolute.z-20 button[type="button"]')
        .first()
      await firstOption.click()
      const roleInput = page.locator('form input').last()
      await roleInput.fill('Dokter Spesialis Jantung')
      await page.waitForTimeout(200)
    },
    annotate: [
      { type: 'box', x: 481, y: 396, width: 478, height: 44 },
      { type: 'box', x: 481, y: 483, width: 478, height: 40 },
      { type: 'box', x: 748, y: 570, width: 210, height: 44 }
    ]
  },
  {
    id: 'manajemen-unit__mengatur-anggota-unit__05-dialog-edit-role',
    section: 'manajemen-unit',
    pageSlug: 'mengatur-anggota-unit',
    stepSlug: '05-dialog-edit-role',
    route: UNIT_DETAIL_ROUTE,
    role: 'SUP',
    preActions: async (page) => {
      await page.locator('table tbody tr button:has(svg.lucide-pencil)').first().click()
      await page.waitForTimeout(400)
    },
    annotate: [
      { type: 'box', x: 481, y: 447, width: 478, height: 40 },
      { type: 'box', x: 789, y: 503, width: 158, height: 44 }
    ]
  }
]
