/**
 * Screenshots for content/{id,en}/integrasi-simrs/bahmni.mdx
 *
 * Two systems are captured in one page flow.
 *
 * Steps 01 to 07 run against the Bahmni EMR at BAHMNI_BASE_URL. Bahmni is an
 * AngularJS application that keeps long lived connections open, so the shared
 * runner option `waitUntil: 'networkidle'` never settles on it. These specs
 * therefore omit the `route` field and navigate inside `preActions` with
 * `domcontentloaded` plus an explicit wait for a selector that only exists once
 * Angular has rendered.
 *
 * Bahmni credentials are read from the environment, never hardcoded:
 *   BAHMNI_BASE_URL, BAHMNI_DEMO_USER, BAHMNI_DEMO_PASSWORD, BAHMNI_DEMO_LOCATION
 * See .env.local.example.
 *
 * Steps 08 and 09 run against PRECIA with role BAHMNI, which maps to
 * PRECIA_DEMO_BAHMNI_EMAIL / PRECIA_DEMO_BAHMNI_PASSWORD. That account belongs
 * to the organisation "RS Demo Bahmni (Dev)", the only organisation whose
 * worklist contains the transactions produced by the Bahmni feed. The demo
 * accounts used by every other page belong to a different organisation and
 * cannot see them.
 *
 * The Bahmni patient shown from step 05 onward (Rahmawati Nurhaliza,
 * ABC200003) already has a saved registration encounter, so steps 05 to 07 are
 * read only and every run lands on the exact same visual state. Step 04 fills
 * the new patient form with that same person's data but never submits it, the
 * same non mutating approach used by integrasi-simrs__index.config.js.
 */

const BAHMNI_BASE = process.env.BAHMNI_BASE_URL || 'https://bahmni-dev.precia.site'
const BAHMNI_PATIENT_UUID = 'f5e9c399-fc75-49c4-8b5e-f38146e39bda'

const PRECIA_UNIT_ID = 'a36f9893-3934-46cc-8f32-147fea928ff6'
const PRECIA_TX_ID = 'd2429312-9dfa-4209-b207-5188d1901a1f'

// Bahmni issues plain cookies, so one login is reused by every later step in
// the same runner process instead of paying the login cost nine times.
let cachedCookies = null

function bahmniCreds() {
  const user = process.env.BAHMNI_DEMO_USER
  const password = process.env.BAHMNI_DEMO_PASSWORD
  const location = process.env.BAHMNI_DEMO_LOCATION || 'Bahmni Clinic'
  if (!user || !password) {
    throw new Error(
      'Missing env vars BAHMNI_DEMO_USER / BAHMNI_DEMO_PASSWORD. ' +
        'Copy .env.local.example to .env.local and fill in the Bahmni demo account.'
    )
  }
  return { user, password, location }
}

// Bahmni renders its templates before angular-translate has resolved, so for a
// short window the page shows raw translation keys such as
// REGISTRATION_SEARCH_CONFIG_KEY instead of labels. Those keys are longer than
// the real labels and shift the layout, which moves every annotation off
// target. Wait until no such key is left in the document.
const TRANSLATED = () =>
  !/\b[A-Z0-9]+(?:_[A-Z0-9]+){2,}\b/.test(document.body.innerText)

async function waitForTranslations(page) {
  try {
    await page.waitForFunction(TRANSLATED, undefined, { timeout: 45000 })
    return
  } catch (err) {
    // Bahmni occasionally stalls on first paint. One reload is enough, and a
    // second timeout is a real failure worth surfacing.
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 })
    await page.waitForFunction(TRANSLATED, undefined, { timeout: 90000 })
  }
}

async function openLoginPage(page) {
  await page.goto(`${BAHMNI_BASE}/bahmni/home/index.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  })
  await page.waitForSelector('#username', { timeout: 90000 })
  await waitForTranslations(page)
  await page.waitForTimeout(1500)
}

async function bahmniLogin(page) {
  if (cachedCookies) {
    await page.context().addCookies(cachedCookies)
    return
  }
  const { user, password, location } = bahmniCreds()
  await openLoginPage(page)
  await page.fill('#username', user)
  await page.fill('#password', password)
  await page.selectOption('#location', { label: location })
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => url.hash.includes('dashboard'), { timeout: 90000 })
  cachedCookies = await page.context().cookies()
}

async function openBahmniApp(page, hashUrl, readySelector) {
  await bahmniLogin(page)
  await page.goto(`${BAHMNI_BASE}${hashUrl}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  })
  await page.waitForSelector(readySelector, { timeout: 90000 })
  await waitForTranslations(page)
  await page.waitForTimeout(3500)
}

module.exports = [
  {
    id: 'integrasi-simrs__bahmni__01-masuk-bahmni',
    section: 'integrasi-simrs',
    pageSlug: 'bahmni',
    stepSlug: '01-masuk-bahmni',
    preActions: async (page) => {
      await openLoginPage(page)
    },
    annotate: [
      { type: 'box', x: 651, y: 370, width: 234, height: 39 },
      { type: 'box', x: 651, y: 416, width: 234, height: 39 },
      { type: 'box', x: 651, y: 465, width: 230, height: 45 },
      { type: 'arrow', from: { x: 1030, y: 538 }, to: { x: 890, y: 538 } }
    ]
  },
  {
    id: 'integrasi-simrs__bahmni__02-menu-registration',
    section: 'integrasi-simrs',
    pageSlug: 'bahmni',
    stepSlug: '02-menu-registration',
    preActions: async (page) => {
      await openBahmniApp(page, '/bahmni/home/index.html#/dashboard', '#bahmni\\.registration')
    },
    annotate: [
      { type: 'box', x: 451, y: 136, width: 174, height: 159 },
      { type: 'arrow', from: { x: 330, y: 330 }, to: { x: 445, y: 265 } }
    ]
  },
  {
    id: 'integrasi-simrs__bahmni__03-buat-pasien-baru',
    section: 'integrasi-simrs',
    pageSlug: 'bahmni',
    stepSlug: '03-buat-pasien-baru',
    preActions: async (page) => {
      await openBahmniApp(page, '/bahmni/registration/index.html#/search', '#registrationNumber')
    },
    annotate: [
      { type: 'box', x: 212, y: 8, width: 147, height: 36 },
      { type: 'arrow', from: { x: 470, y: 110 }, to: { x: 350, y: 50 } }
    ]
  },
  {
    id: 'integrasi-simrs__bahmni__04-isi-data-pasien',
    section: 'integrasi-simrs',
    pageSlug: 'bahmni',
    stepSlug: '04-isi-data-pasien',
    preActions: async (page) => {
      await openBahmniApp(page, '/bahmni/registration/index.html#/patient/new', '#givenName')
      await page.fill('#givenName', 'Rahmawati')
      await page.fill('#familyName', 'Nurhaliza')
      await page.selectOption('#gender', { label: 'Female' })
      await page.fill('#birthdate', '1991-06-18')
      await page.fill('#cityVillage', 'Depok')
      await page.fill('#phoneNumber', '081200000003')
      await page.locator('#phoneNumber').blur()
      await page.waitForTimeout(1200)
    },
    annotate: [
      { type: 'box', x: 300, y: 118, width: 610, height: 64 },
      { type: 'box', x: 300, y: 184, width: 352, height: 94 },
      { type: 'arrow', from: { x: 1195, y: 660 }, to: { x: 1195, y: 610 } }
    ]
  },
  {
    id: 'integrasi-simrs__bahmni__05-isi-observasi',
    section: 'integrasi-simrs',
    pageSlug: 'bahmni',
    stepSlug: '05-isi-observasi',
    preActions: async (page) => {
      await openBahmniApp(
        page,
        `/bahmni/registration/index.html#/patient/${BAHMNI_PATIENT_UUID}/visit`,
        'legend.form-builder-toggle'
      )
    },
    annotate: [
      { type: 'box', x: 322, y: 318, width: 212, height: 95 },
      { type: 'box', x: 334, y: 522, width: 212, height: 95 },
      { type: 'box', x: 322, y: 761, width: 212, height: 41 }
    ]
  },
  {
    id: 'integrasi-simrs__bahmni__06-simpan-kunjungan',
    section: 'integrasi-simrs',
    pageSlug: 'bahmni',
    stepSlug: '06-simpan-kunjungan',
    fullPage: true,
    preActions: async (page) => {
      await openBahmniApp(
        page,
        `/bahmni/registration/index.html#/patient/${BAHMNI_PATIENT_UUID}/visit`,
        'legend.form-builder-toggle'
      )
    },
    annotate: [
      { type: 'box', x: 1063, y: 1159, width: 314, height: 48 },
      { type: 'arrow', from: { x: 880, y: 1214 }, to: { x: 1052, y: 1188 } }
    ]
  },
  {
    id: 'integrasi-simrs__bahmni__07-hasil-tersimpan',
    section: 'integrasi-simrs',
    pageSlug: 'bahmni',
    stepSlug: '07-hasil-tersimpan',
    preActions: async (page) => {
      await openBahmniApp(
        page,
        `/bahmni/registration/index.html#/patient/${BAHMNI_PATIENT_UUID}/visit`,
        'legend.form-builder-toggle'
      )
    },
    annotate: [
      { type: 'box', x: 952, y: 283, width: 396, height: 205 },
      { type: 'arrow', from: { x: 760, y: 560 }, to: { x: 950, y: 470 } }
    ]
  },
  {
    id: 'integrasi-simrs__bahmni__08-daftar-kasus-precia',
    section: 'integrasi-simrs',
    pageSlug: 'bahmni',
    stepSlug: '08-daftar-kasus-precia',
    route: `/clinical?unit=${PRECIA_UNIT_ID}`,
    role: 'BAHMNI',
    preActions: async (page) => {
      await page.waitForSelector('tbody tr', { timeout: 30000 })
      await page.waitForTimeout(1500)
    },
    annotate: [
      { type: 'box', x: 532, y: 318, width: 234, height: 51 },
      { type: 'box', x: 300, y: 474, width: 1096, height: 95 }
    ]
  },
  {
    id: 'integrasi-simrs__bahmni__09-detail-kasus-precia',
    section: 'integrasi-simrs',
    pageSlug: 'bahmni',
    stepSlug: '09-detail-kasus-precia',
    route: `/clinical/transactions/${PRECIA_TX_ID}`,
    role: 'BAHMNI',
    fullPage: true,
    annotate: ({ locale }) => [
      { type: 'box', x: 298, y: 110, width: 592, height: 72 },
      { type: 'box', x: 296, y: 404, width: 420, height: 132 },
      locale === 'en'
        ? { type: 'box', x: 290, y: 866, width: 430, height: 183 }
        : { type: 'box', x: 290, y: 890, width: 430, height: 183 }
    ]
  }
]
