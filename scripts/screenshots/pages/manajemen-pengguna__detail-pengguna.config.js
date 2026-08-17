/**
 * Screenshot spec for content/{id,en}/manajemen-pengguna/detail-pengguna.mdx
 * Route: /users/[id] (single user profile + identity/role history)
 */
module.exports = [
  {
    id: 'manajemen-pengguna__detail-pengguna__01-profil-pengguna',
    section: 'manajemen-pengguna',
    pageSlug: 'detail-pengguna',
    stepSlug: '01-profil-pengguna',
    route: '/users',
    role: 'SUP',
    preActions: async (page) => {
      // Open the first user row's Detail link and wait for the profile page.
      await page.click('table tbody tr:first-child a[href^="/users/"]')
      await page.waitForURL(/\/users\/[^/]+$/, { timeout: 10000 })
      await page.waitForTimeout(500)
    },
    annotate: [
      // Status badge, top right of header
      { type: 'box', x: 1254, y: 37, width: 80, height: 29 },
      // User roles badge(s) under Account Information
      { type: 'box', x: 380, y: 388, width: 145, height: 28 },
      // Quick Actions block: Deactivate / Lock / Manage Roles buttons
      { type: 'box', x: 1026, y: 236, width: 290, height: 152 }
    ]
  },
  {
    id: 'manajemen-pengguna__detail-pengguna__02-riwayat-perubahan',
    section: 'manajemen-pengguna',
    pageSlug: 'detail-pengguna',
    stepSlug: '02-riwayat-perubahan',
    route: '/users',
    role: 'SUP',
    preActions: async (page) => {
      await page.click('table tbody tr:first-child a[href^="/users/"]')
      await page.waitForURL(/\/users\/[^/]+$/, { timeout: 10000 })
      await page.waitForTimeout(500)
    },
    annotate: [
      // Identity and Role History card
      { type: 'box', x: 369, y: 442, width: 627, height: 168 }
    ]
  }
]
