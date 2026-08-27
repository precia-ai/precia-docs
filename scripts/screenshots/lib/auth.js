const BASE_URL = process.env.PRECIA_BASE_URL || 'https://app-dev.precia.site'

/**
 * Credentials are read from env vars per role, never hardcoded here.
 * Expected env vars (see .env.local.example):
 *   PRECIA_DEMO_<ROLE>_EMAIL / PRECIA_DEMO_<ROLE>_PASSWORD
 * e.g. PRECIA_DEMO_CLN_EMAIL, PRECIA_DEMO_CLN_PASSWORD
 */
function credsForRole(role) {
  const upper = role.toUpperCase()
  const email = process.env[`PRECIA_DEMO_${upper}_EMAIL`]
  const password = process.env[`PRECIA_DEMO_${upper}_PASSWORD`]
  if (!email || !password) {
    throw new Error(
      `Missing env vars PRECIA_DEMO_${upper}_EMAIL / PRECIA_DEMO_${upper}_PASSWORD. ` +
        'Copy .env.local.example to .env.local and fill in demo account credentials.'
    )
  }
  return { email, password }
}

async function login(page, role) {
  const { email, password } = credsForRole(role)
  // This is a Next.js dev server: HMR keeps a connection open, so
  // 'networkidle' never resolves and every login intermittently times out
  // navigating to /login. Wait for the DOM instead, then let page.fill's
  // own actionability wait handle hydration.
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#email', { timeout: 30000 })
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15000
  })
}

module.exports = { login, BASE_URL, credsForRole }
