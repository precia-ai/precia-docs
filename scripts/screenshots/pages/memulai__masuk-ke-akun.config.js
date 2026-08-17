/**
 * "Masuk ke Akun" (memulai section) — public login page at /login.
 * No role/login needed since this page IS the login flow itself.
 */
const { credsForRole } = require('../lib/auth')

module.exports = [
  {
    id: 'memulai__masuk-ke-akun__01-halaman-login',
    section: 'memulai',
    pageSlug: 'masuk-ke-akun',
    stepSlug: '01-halaman-login',
    route: '/login',
    annotate: [
      { type: 'box', x: 977, y: 393, width: 349, height: 39 },
      { type: 'box', x: 977, y: 474, width: 349, height: 39 },
      { type: 'box', x: 977, y: 538, width: 349, height: 39 }
    ]
  },
  {
    id: 'memulai__masuk-ke-akun__02-form-terisi',
    section: 'memulai',
    pageSlug: 'masuk-ke-akun',
    stepSlug: '02-form-terisi',
    route: '/login',
    preActions: async (page) => {
      const { email, password } = credsForRole('SUP')
      await page.fill('#email', email)
      await page.fill('#password', password)
    },
    annotate: [{ type: 'box', x: 977, y: 538, width: 349, height: 39 }]
  },
  {
    id: 'memulai__masuk-ke-akun__03-login-gagal',
    section: 'memulai',
    pageSlug: 'masuk-ke-akun',
    stepSlug: '03-login-gagal',
    route: '/login',
    preActions: async (page) => {
      const { email } = credsForRole('SUP')
      await page.fill('#email', email)
      await page.fill('#password', 'kata-sandi-salah-123')
      await page.click('button[type="submit"]')
      await page.waitForSelector('form p', { timeout: 10000 })
    },
    annotate: [{ type: 'box', x: 977, y: 505, width: 349, height: 40 }]
  }
]
