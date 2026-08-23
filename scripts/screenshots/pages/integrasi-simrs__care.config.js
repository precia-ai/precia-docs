/**
 * Screenshots for content/{id,en}/integrasi-simrs/care.mdx
 *
 * Two systems are captured in one spec file.
 *
 * ---------------------------------------------------------------------
 * STEPS 10-15 ADDED 2026-08-23, NOT YET CAPTURED, READ THIS FIRST
 * ---------------------------------------------------------------------
 * precia.site was unreachable when steps 10-15 were written (host down
 * since 11:45, blinking on and off since). Every selector below was read
 * from source, not from a live page, and every `annotate` box is an
 * estimate sized to what the component is expected to render, not a
 * measurement. Before trusting a capture from these steps:
 *
 *   1. Run each step once, inspect the raw (pre-annotation) PNG, and
 *      correct the annotate coordinates the same way probe.js is used
 *      elsewhere in this directory to measure real element positions.
 *   2. UPDATE 2026-08-23 (later the same day): steps 10-11 originally
 *      searched for the ECG orderable by title through the picker's
 *      CommandInput tab, because its category was unverified. That is now
 *      CONFIRMED WRONG/UNNECESSARY: prod evidence
 *      public/screenshots/_evidence/prod/prod-care-21-clinician-picks-ecg-12-lead-precia-ai.png
 *      shows the orderable is titled exactly "ECG 12 lead (PRECIA AI)"
 *      (no hyphen, lowercase "lead") and sits in the SAME "Imaging"
 *      category as "Chest X-ray (PRECIA AI)", both listed together under
 *      the same Root > Imaging breadcrumb. Steps 10-11 now reuse
 *      openImagingCategory exactly like steps 04-06 do, instead of the
 *      untested search-tab approach. This is prod evidence, not dev - the
 *      UI structure should be identical (same CARE build), the demo
 *      patient/facility is not (prod evidence shows "Ayushman Chander",
 *      unrelated to the dev fixtures below). searchOrderable() is kept
 *      in this file as a documented fallback only, unused by the current
 *      steps.
 *   3. STEPS 13-15 ARE CONFIRMED BLOCKED AT THE DATA LEVEL, NOT JUST AN
 *      OPEN QUESTION. Read via direct DB query on app-dev by precia-tracker
 *      on 2026-08-23 (~12:40 local): CARE-dev has 8 transactions with
 *      source=simrs, ALL still status=unprocessed. Zero have reached
 *      ai_completed. Zero have any SimrsDelivery row at all, so CARE has
 *      never received a write-back on this environment. Running
 *      `node run.js --only=integrasi-simrs__care` right now will not fail
 *      loudly on steps 13-15; it will "succeed" against an empty result
 *      (careOriginRow / the report list) and produce a misleading blank or
 *      placeholder screenshot. DO NOT run 13-15 until one of the 8 pending
 *      transactions has actually been pushed through AI processing and
 *      doctor validation, and the write-back dispatcher has run for it.
 *      That is a pipeline action outside the scope of this docs capture
 *      (needs someone with trigger access, not a docs agent) - confirm
 *      with team lead before assuming it has happened. Once it has, it is
 *      probably worth pinning fixed ids the way steps 02-09 do, rather
 *      than keeping the dynamic search, so repeat runs stay stable.
 *   4. Whether the `role: 'CARE'` demo account (scoped to worklist reads
 *      in "RAD - Radiologi", per the existing steps 08-09 note) can also
 *      see AI module slots routed to a different unit (an ECG module is
 *      unlikely to be enabled on a radiology unit) was not verified. If
 *      step 13 comes back empty for an ECG-derived case, either the ECG
 *      AI module's target unit needs to be added to this account's
 *      access, or a second role needs resolving for that unit.
 *
 * Everything above step 10 (steps 01-09) was already captured and is
 * unaffected by this addition.
 * ---------------------------------------------------------------------
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

/**
 * Open the activity picker and search it by title instead of browsing
 * categories. UNUSED by the current steps as of 2026-08-23 - confirmed via
 * prod evidence that the ECG orderable lives in the same "Imaging" category
 * as Chest X-ray, so steps 10-11 use openImagingCategory instead. Kept only
 * as a documented fallback in case the category changes on a given CARE
 * install. See the file-header note dated 2026-08-23 for details.
 */
async function searchOrderable(page, term) {
  await openActivityPicker(page)
  const searchInput = page.locator('input[cmdk-input]')
  await searchInput.fill(term)
  await page.waitForTimeout(1200)
}

/**
 * PRECIA "By AI Module" worklist tab, filtered to completed slots, scoped
 * to whatever unit(s) the logged-in role can see. Mirrors the helper in
 * kasus-klinis__worklist-per-modul.config.js (same class-based selectors,
 * confirmed stable there against a live page).
 */
const AI_MODULE_TAB_GROUP_SELECTOR =
  'div.inline-flex.rounded-lg.border.border-border.bg-muted\\/30.p-1'
const AI_MODULE_FILTER_SELECTOR =
  'div.rounded-xl.border.border-border\\/70.bg-muted\\/20.p-4.mb-4 select'

async function openCompletedAiModuleSlots(page) {
  await page.waitForSelector(AI_MODULE_TAB_GROUP_SELECTOR, { timeout: 20000 })
  await page.locator(`${AI_MODULE_TAB_GROUP_SELECTOR} button`).nth(1).click()
  await page.waitForSelector(AI_MODULE_FILTER_SELECTOR)
  const selects = page.locator(AI_MODULE_FILTER_SELECTOR)
  // Index 1 is "Status Slot" in kasus-klinis__worklist-per-modul.config.js;
  // not reverified here for the CARE-scoped page, see header note point 4.
  const slotsResponse = page.waitForResponse(
    (res) => res.url().includes('/slots/') && res.url().includes('status=completed')
  )
  await selects.nth(1).selectOption('completed')
  await slotsResponse.catch(() => {})
  await page.waitForTimeout(800)
}

/** First worklist row whose visible text carries the CARE- transaction prefix. */
function careOriginRow(page) {
  return page.locator('table tbody tr').filter({ hasText: 'CARE-' }).first()
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
  },
  // -----------------------------------------------------------------
  // Steps 10-12: ordering ECG 12 lead in CARE, mirroring steps 04-07 for
  // Chest X-ray - same category picker, same openImagingCategory helper,
  // confirmed by prod evidence (see file-header note dated 2026-08-23).
  // Coordinates are estimates sized off that evidence's 1560x1000/1172
  // screenshots, not a clean ratio to this file's 1440x900 viewport - more
  // grounded than a blind guess, still needs re-measuring on first run.
  // -----------------------------------------------------------------
  {
    id: 'integrasi-simrs__care__10-memilih-pemeriksaan-ecg',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '10-memilih-pemeriksaan-ecg',
    route: `${ENCOUNTER_BASE}/questionnaire/service_request`,
    preActions: async (page) => {
      await openImagingCategory(page)
    },
    annotate: [
      // Breadcrumb Root > Imaging, same box as step 05
      { type: 'box', x: 337, y: 417, width: 180, height: 32 },
      // "ECG 12 lead (PRECIA AI)" row, listed above Chest X-ray per
      // prod-care-21 evidence
      { type: 'box', x: 331, y: 458, width: 418, height: 42 }
    ]
  },
  {
    id: 'integrasi-simrs__care__11-mengirim-permintaan-ecg',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '11-mengirim-permintaan-ecg',
    route: `${ENCOUNTER_BASE}/questionnaire/service_request`,
    preActions: async (page) => {
      await openImagingCategory(page)
      // Exact title confirmed via prod-care-21 evidence: "ECG 12 lead
      // (PRECIA AI)", no hyphen, lowercase "lead". Loose match is still
      // used here so a minor label change does not break the run.
      await page.getByText('ECG', { exact: false }).first().click()
      await page.waitForTimeout(2500)
    },
    annotate: [
      // The chosen orderable, now a row on the form
      { type: 'box', x: 326, y: 288, width: 872, height: 50 },
      // Submit button (never clicked, same as step 06)
      { type: 'box', x: 1143, y: 490, width: 87, height: 38 }
    ]
  },
  {
    id: 'integrasi-simrs__care__12-daftar-permintaan-ecg',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '12-daftar-permintaan-ecg',
    route: `${ENCOUNTER_BASE}/service_requests`,
    preActions: async (page) => {
      await openCare(page, `${ENCOUNTER_BASE}/service_requests`)
    },
    annotate: [
      // Row for the ECG request, expected Active/Routine like step 07.
      // This box assumes the ECG row lands directly under the Chest
      // X-ray row from step 07; re-measure once both requests exist.
      { type: 'box', x: 425, y: 300, width: 988, height: 64 }
    ]
  },
  // -----------------------------------------------------------------
  // Step 13: AI result visible in PRECIA, on the "By AI Module" tab
  // rather than the plain worklist, because that tab is what actually
  // exposes per-slot AI status/confidence (see kasus-klinis
  // __worklist-per-modul.config.js). No fixed transaction id: this
  // depends on at least one CARE-origin transaction already being
  // ai_completed on dev when the capture runs (see header note point 3).
  // -----------------------------------------------------------------
  {
    id: 'integrasi-simrs__care__13-hasil-ai-modul-precia',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '13-hasil-ai-modul-precia',
    route: '/clinical',
    role: 'CARE',
    fullPage: true,
    preActions: async (page) => {
      await openCompletedAiModuleSlots(page)
      const row = careOriginRow(page)
      await row.waitFor({ state: 'visible', timeout: 20000 })
      await row.locator('button').first().click()
      await page.waitForTimeout(900)
    },
    annotate: [
      // The CARE-origin row, its transaction code carrying the CARE- prefix
      { type: 'box', x: 300, y: 460, width: 1100, height: 60 },
      // Expanded AI result panel below the row (classification, confidence)
      { type: 'box', x: 316, y: 520, width: 1080, height: 220 }
    ]
  },
  // -----------------------------------------------------------------
  // Steps 14-15: the write-back, on CARE's own Diagnostic Reports tab
  // for the same encounter used throughout this file. No fixed report
  // id, see header note point 3: the dispatcher must have already
  // pushed the report before this can find anything.
  // -----------------------------------------------------------------
  {
    id: 'integrasi-simrs__care__14-laporan-diagnostik-care',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '14-laporan-diagnostik-care',
    route: `${ENCOUNTER_BASE}/diagnostic_reports`,
    preActions: async (page) => {
      await openCare(page, `${ENCOUNTER_BASE}/diagnostic_reports`)
      await page.waitForSelector('ul.grid.gap-2 li', { timeout: 20000 })
      await page.waitForTimeout(700)
    },
    annotate: [
      // "Diagnostic Reports" tab in the encounter tab bar
      { type: 'box', x: 780, y: 158, width: 190, height: 32 },
      // First report card in the left panel list
      { type: 'box', x: 20, y: 96, width: 340, height: 96 }
    ]
  },
  {
    id: 'integrasi-simrs__care__15-detail-laporan-diagnostik-care',
    section: 'integrasi-simrs',
    pageSlug: 'care',
    stepSlug: '15-detail-laporan-diagnostik-care',
    route: `${ENCOUNTER_BASE}/diagnostic_reports`,
    preActions: async (page) => {
      await openCare(page, `${ENCOUNTER_BASE}/diagnostic_reports`)
      await page.waitForSelector('ul.grid.gap-2 li', { timeout: 20000 })
      await page.locator('ul.grid.gap-2 li').first().click()
      await page.waitForTimeout(1200)
    },
    annotate: [
      // Status badge on the detail card (Preliminary/Final)
      { type: 'box', x: 1180, y: 96, width: 140, height: 30 },
      // Notes field: PRECIA writes "PRECIA <module code>" as its first
      // line, followed by confidence, model version, validation status,
      // the PRECIA transaction id and job id (see care.py _note()).
      { type: 'box', x: 380, y: 420, width: 700, height: 160 }
    ]
  }
]
