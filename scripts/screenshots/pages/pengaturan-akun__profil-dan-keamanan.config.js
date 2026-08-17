/**
 * Screenshot spec for content/{id,en}/pengaturan-akun/profil-dan-keamanan.mdx
 * Route: /profile
 */
module.exports = [
  {
    id: 'pengaturan-akun__profil-dan-keamanan__01-informasi-akun',
    section: 'pengaturan-akun',
    pageSlug: 'profil-dan-keamanan',
    stepSlug: '01-informasi-akun',
    route: '/profile',
    role: 'SUP',
    annotate: [
      { type: 'box', x: 425, y: 251, width: 846, height: 56 },
      { type: 'box', x: 425, y: 328, width: 846, height: 56 },
      { type: 'box', x: 425, y: 405, width: 846, height: 56 }
    ]
  },
  {
    id: 'pengaturan-akun__profil-dan-keamanan__02-ubah-kata-sandi',
    section: 'pengaturan-akun',
    pageSlug: 'profil-dan-keamanan',
    stepSlug: '02-ubah-kata-sandi',
    route: '/profile',
    role: 'SUP',
    preActions: async (page) => {
      await page.locator('#password-security').scrollIntoViewIfNeeded()
    },
    annotate: [
      { type: 'box', x: 425, y: 593, width: 846, height: 56 },
      { type: 'box', x: 425, y: 670, width: 846, height: 56 },
      { type: 'box', x: 425, y: 747, width: 846, height: 56 },
      { type: 'box', x: 1060, y: 803, width: 211, height: 56 }
    ]
  }
]
