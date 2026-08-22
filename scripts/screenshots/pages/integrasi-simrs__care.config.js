/**
 * Screenshots for content/{id,en}/integrasi-simrs/care.mdx
 *
 * Two systems are captured in one spec file.
 *
 * Steps 01 to 07 run against the CARE web interface at
 * https://care-dev.precia.site. CARE is not a PRECIA page, so `role` is
 * deliberately omitted and the framework login helper is never used. The
 * CARE session is obtained once per process through the CARE JSON API and
 * injected into localStorage, because CARE rate limits login attempts to
 * five per ten minutes per username at the serializer level. Logging in
 * once per spec per locale would exceed that limit halfway through a run.
 *
 * Steps 08 and 09 run against PRECIA with `role: 'CARE'`, resolved from
 * PRECIA_DEMO_CARE_EMAIL and PRECIA_DEMO_CARE_PASSWORD. That account lives
 * in the organisation "RS Uji Coba CARE" and is the only demo account that
 * can read the Radiologi worklist; the other demo roles resolve to the
 * platform super administrator, whose clinical queries are scoped to a
 * different organisation and return 404 for this transaction.
 *
 * Fixed demo objects, so every locale run lands on the same visual state:
 *   CARE facility   d971dfc0-aad5-4eeb-8297-7106fd9e77eb  FACILITY WITH PATIENTS
 *   CARE patient    2d051484-dde4-4836-98f8-138bd9a89ece  Gayathri Sabharwal
 *   CARE encounter  fe6ad2c7-7f19-4bb0-9220-6197d329b0ad  Home Health, In Progress
 *   PRECIA unit     80e9ac80-5774-42d2-9a23-6c71f78b4cb6  RAD - Radiologi
 *   PRECIA case     12334b18-1f5a-46fc-94d5-7107a27ae16b  CARE-7907b219-...
 *
 * The worklist in the RAD - Radiologi unit currently holds four cases, all
 * raised on the same demo encounter. Step 08 frames the whole table body
 * rather than one row, because row order follows creation time and a later
 * import would push any single highlighted row out of place. The prose tells
 * the reader to match on the case code instead of on row position.
 *
 * Step 09 opens the case whose PRECIA priority is Normal, which agrees with
 * the Routine priority every request shows in step 07. One of the four cases
 * carries Urgent in PRECIA while its CARE source record is Routine; anchoring
 * on that one would make the walkthrough contradict its own screenshots. The
 * mismatch itself is documented as a limitation on the page.
 *
 * The order form is filled but never submitted. Submitting would create a
 * new CARE ServiceRequest on every locale of every run, which would both
 * pollute the demo facility and change the row count in step 07.
 *
 * CARE renders in English regardless of the PRECIA documentation locale, so
 * steps 01 to 07 produce the same layout for id and en and one shared
 * annotation array is correct. Steps 08 and 09 were measured in both
 * locales and the annotated regions sit at identical coordinates.
 */

const CARE_ORIGIN = 'https://care-dev.precia.site'
const FACILITY_ID = 'd971dfc0-aad5-4eeb-8297-7106fd9e77eb'
const PATIENT_ID = '2d051484-dde4-4836-98f8-138bd9a89ece'
const ENCOUNTER_ID = 'fe6ad2c7-7f19-4bb0-9220-6197d329b0ad'

const PRECIA_UNIT_ID = '80e9ac80-5774-42d2-9a23-6c71f78b4cb6'
const PRECIA_TRANSACTION_ID = '12334b18-1f5a-46fc-94d5-7107a27ae16b'

const ENCOUNTER_BASE = `${CARE_ORIGIN}/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${ENCOUNTER_ID}`

// CARE stores its JWT under this key, see src/common/constants.tsx in care_fe.
const CARE_TOKEN_KEY = 'care_access_token'

let careSessionPromise = null

/**
 * One CARE login per node process, shared by every spec and every locale.
 * Credentials come from .env.local, never from this file.
 */
function careAccessToken() {
  if (careSessionPromise) return careSessionPromise
  const username = process.env.CARE_DEMO_USERNAME
  const password = process.env.CARE_DEMO_PASSWORD
  if (!username || !password) {
    throw new Error(
      'Missing env vars CARE_DEMO_USERNAME / CARE_DEMO_PASSWORD. ' +
        'Copy .env.local.example to .env.local and fill in the CARE demo account.'
    )
  }
  careSessionPromise = (async () => {
    const res = await fetch(`${CARE_ORIGIN}/api/v1/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (!res.ok) {
      throw new Error(`CARE login failed with HTTP ${res.status}`)
    }
    const body = await res.json()
    return body.access
  })()
  return careSessionPromise
}

/**
 * Put the shared CARE session into the browser context, then land on the
 * requested CARE page as an authenticated user.
 */
async function openCare(page, url) {
  const token = await careAccessToken()
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value)
    },
    [CARE_TOKEN_KEY, token]
  )
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
}

/** Open the activity definition picker on the service request form. */
async function openActivityPicker(page) {
  await openCare(page, `${ENCOUNTER_BASE}/questionnaire/service_request`)
  await page.locator('button[role="combobox"]').first().click()
  await page.waitForTimeout(1500)
}

/** Drill into the Imaging category inside the open picker. */
async function openImagingCategory(page) {
  await openActivityPicker(page)
  await page.getByText('Imaging', { exact: true }).click()
  await page.waitForTimeout(1500)
}

module.exports = [
  {
    id: 'integrasi-simrs__care__01-masuk-care',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '01-masuk-care',
    route: `${CARE_ORIGIN}/login`,
    preActions: async (page) => {
      await page.waitForSelector('input[name="username"], #username', { timeout: 15000 })
      await page.waitForTimeout(800)
    },
    annotate: [
      // "Log in as Staff" tab
      { type: 'box', x: 982, y: 312, width: 170, height: 36 },
      // Username and password fields
      { type: 'box', x: 976, y: 352, width: 338, height: 142 },
      // Login button
      { type: 'box', x: 980, y: 558, width: 330, height: 40 }
    ]
  },
  {
    id: 'integrasi-simrs__care__02-encounter-pasien',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '02-encounter-pasien',
    route: `${ENCOUNTER_BASE}/updates`,
    preActions: async (page) => {
      await openCare(page, `${ENCOUNTER_BASE}/updates`)
    },
    annotate: [
      // Patient identity header
      { type: 'box', x: 76, y: 36, width: 360, height: 60 },
      // "Service Request" quick action card
      { type: 'box', x: 597, y: 205, width: 160, height: 109 }
    ]
  },
  {
    id: 'integrasi-simrs__care__03-formulir-permintaan',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '03-formulir-permintaan',
    route: `${ENCOUNTER_BASE}/questionnaire/service_request`,
    preActions: async (page) => {
      await openCare(page, `${ENCOUNTER_BASE}/questionnaire/service_request`)
    },
    annotate: [
      // "Select Activity Definition" combobox
      { type: 'box', x: 326, y: 287, width: 756, height: 40 },
      {
        type: 'arrow',
        from: { x: 700, y: 228 },
        to: { x: 700, y: 280 }
      }
    ]
  },
  {
    id: 'integrasi-simrs__care__04-kategori-imaging',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '04-kategori-imaging',
    route: `${ENCOUNTER_BASE}/questionnaire/service_request`,
    preActions: async (page) => {
      await openActivityPicker(page)
    },
    annotate: [
      // "Imaging" category row
      { type: 'box', x: 331, y: 418, width: 418, height: 40 }
    ]
  },
  {
    id: 'integrasi-simrs__care__05-memilih-pemeriksaan',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '05-memilih-pemeriksaan',
    route: `${ENCOUNTER_BASE}/questionnaire/service_request`,
    preActions: async (page) => {
      await openImagingCategory(page)
    },
    annotate: [
      // Breadcrumb Root > Imaging
      { type: 'box', x: 337, y: 417, width: 180, height: 32 },
      // "Chest X-ray (PRECIA AI)" orderable
      { type: 'box', x: 331, y: 458, width: 418, height: 42 }
    ]
  },
  {
    id: 'integrasi-simrs__care__06-mengirim-permintaan',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '06-mengirim-permintaan',
    route: `${ENCOUNTER_BASE}/questionnaire/service_request`,
    preActions: async (page) => {
      await openImagingCategory(page)
      await page.getByText('Chest X-ray (PRECIA AI)', { exact: false }).first().click()
      await page.waitForTimeout(2500)
    },
    annotate: [
      // The chosen orderable, now a row on the form
      { type: 'box', x: 326, y: 288, width: 872, height: 50 },
      // Submit button
      { type: 'box', x: 1143, y: 490, width: 87, height: 38 }
    ]
  },
  {
    id: 'integrasi-simrs__care__07-daftar-permintaan',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '07-daftar-permintaan',
    route: `${ENCOUNTER_BASE}/service_requests`,
    preActions: async (page) => {
      await openCare(page, `${ENCOUNTER_BASE}/service_requests`)
    },
    annotate: [
      // "Service Requests" tab
      { type: 'box', x: 849, y: 158, width: 144, height: 32 },
      // Newest request row, Active and Routine
      { type: 'box', x: 425, y: 366, width: 988, height: 64 }
    ]
  },
  {
    id: 'integrasi-simrs__care__08-worklist-precia',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '08-worklist-precia',
    route: `/clinical?unit=${PRECIA_UNIT_ID}`,
    role: 'CARE',
    preActions: async (page) => {
      await page.waitForSelector('table tbody tr', { timeout: 20000 })
      await page.waitForTimeout(900)
    },
    annotate: [
      // Unit filter, set to RAD - Radiologi
      { type: 'box', x: 538, y: 324, width: 220, height: 40 },
      // Every case in the table, each code carrying the CARE- prefix
      { type: 'box', x: 306, y: 480, width: 1086, height: 314 }
    ]
  },
  {
    id: 'integrasi-simrs__care__09-detail-kasus',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '09-detail-kasus',
    route: `/clinical/transactions/${PRECIA_TRANSACTION_ID}`,
    role: 'CARE',
    preActions: async (page) => {
      await page.waitForSelector('h1, h2', { timeout: 20000 })
      await page.waitForTimeout(1200)
    },
    annotate: [
      // Case code, patient name and MRN
      { type: 'box', x: 298, y: 116, width: 684, height: 68 },
      // Notes, carrying the CARE ServiceRequest reference
      { type: 'box', x: 296, y: 420, width: 424, height: 72 }
    ]
  }
]
