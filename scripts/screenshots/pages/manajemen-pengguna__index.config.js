/**
 * Screenshot spec for content/{id,en}/manajemen-pengguna/index.mdx
 * Route: /users (organization-scoped user directory)
 */
module.exports = [
  {
    id: 'manajemen-pengguna__index__01-daftar-pengguna',
    section: 'manajemen-pengguna',
    pageSlug: 'index',
    stepSlug: '01-daftar-pengguna',
    route: '/users',
    role: 'SUP',
    annotate: [
      // "Tambah Pengguna" / "Add User" button, top right
      { type: 'box', x: 1192, y: 48, width: 205, height: 46 },
      // Stat tiles row (total / active / locked / pending)
      { type: 'box', x: 305, y: 138, width: 1086, height: 62 }
    ]
  },
  {
    id: 'manajemen-pengguna__index__02-menu-tindakan',
    section: 'manajemen-pengguna',
    pageSlug: 'index',
    stepSlug: '02-menu-tindakan',
    route: '/users',
    role: 'SUP',
    preActions: async (page) => {
      // Open the row action ("more actions") menu on the first user row.
      await page.click('table tbody tr:first-child button[aria-label]')
      await page.waitForTimeout(300)
    },
    annotate: [
      // Dropdown menu with deactivate/lock actions
      { type: 'box', x: 1224, y: 428, width: 152, height: 92 },
      // "Detail" button on the row
      { type: 'box', x: 1272, y: 397, width: 68, height: 30 }
    ]
  }
]
