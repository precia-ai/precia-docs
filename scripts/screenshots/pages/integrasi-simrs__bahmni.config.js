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
 *
 * Steps 10 and 11 cover the return leg: a validated AI result written back
 * into the Bahmni chart. Confirmed 2026-08-23 by reading the PRECIA audit
 * trail for a real case (BAHMNI-3d2845c5-..., patient Ratna Proofdev, MRN
 * ABC200005, unit OPD): the case was CREATED by actor_type=SERVICE
 * actor_label="Bahmni connector dev" from ip_address=172.23.0.1 (the docker
 * bridge, i.e. genuine unattended connector traffic, not a hand-run script),
 * its AI slot (module AI-ECG-LVEF / "ECG EF Screening") reached status
 * completed, and once the validator published the decision,
 * SIMRS_DELIVERY_ATTEMPTED fired 29ms later under actor_type=SYSTEM
 * actor_label=simrs-delivery-worker, followed by SIMRS_DELIVERY_SUCCEEDED
 * 243ms after that. A person cannot react in 29ms, so the write-back trigger
 * itself is genuinely automatic, not rehearsed. This is a DIFFERENT case
 * than steps 01-09 (Rahmawati Nurhaliza / ABC200003, whose unit has no AI
 * slot and stays Unprocessed by design), so the mdx captions this leg as a
 * separate, already-completed case rather than implying it is the same
 * patient walked start to finish. The AI trigger itself is still a manual
 * PRECIA action in this trail (INFERENCE_DISPATCHED came from a human
 * HTTP_POST) — the same limitation already documented for every other SIMRS
 * on this site, not something specific to Bahmni.
 *
 * Ground truth this config relies on, all read from the connector repository
 * (simrs/simrs-bahmni, not vendored here) rather than invented:
 *   - The write-back path is a real service (connector/precia_connector/
 *     receiver.py), not a one-off script. It receives a validated result at
 *     POST /ai-results and turns it into a Bahmni encounter via
 *     POST /openmrs/ws/rest/v1/bahmnicore/bahmniencounter, keyed by the
 *     patientUuid resolved from the original ingest encounter.
 *   - It writes three observations: concepts "PRECIA AI Impression",
 *     "PRECIA AI Confidence" (only when a score is present) and
 *     "PRECIA AI Module" (connector/precia_connector/receiver.py,
 *     CONCEPT_IMPRESSION / CONCEPT_CONFIDENCE / CONCEPT_MODULE).
 *   - Those concepts are rendered in the chart by a dashboard section titled
 *     exactly "PRECIA AI Results", added by seed/patch_dashboard.py
 *     (SECTION.title, displayOrder 1). Without that patch the write succeeds
 *     but is invisible, which is why step 11 waits on that literal title text
 *     rather than trusting the API response alone.
 */

const BAHMNI_BASE = process.env.BAHMNI_BASE_URL || 'https://bahmni-dev.precia.site'
const BAHMNI_PATIENT_UUID = 'f5e9c399-fc75-49c4-8b5e-f38146e39bda'

const PRECIA_UNIT_ID = 'a36f9893-3934-46cc-8f32-147fea928ff6'
const PRECIA_TX_ID = 'd2429312-9dfa-4209-b207-5188d1901a1f'

// Write-back proof case (steps 10-11 only), confirmed live 2026-08-23 — see
// the header comment above for the audit trail that proves it.
const WRITEBACK_TX_CODE = 'BAHMNI-3d2845c5-0cf0-4e80-b482-77d90d010510'
const WRITEBACK_PATIENT_MRN = 'ABC200005'

/**
 * Annotation boxes measured from the real element at capture time, same
 * pattern as integrasi-simrs__gnu-health.config.js. Throws rather than
 * silently shipping an unannotated screenshot.
 */
const measuredBahmni = {}

async function measure(page, step, locale, name, locator, padding = 8) {
  const box = await locator.first().boundingBox()
  if (!box) {
    throw new Error(`Could not measure element "${name}" for step ${step} (${locale}).`)
  }
  measuredBahmni[`${step}:${locale}:${name}`] = {
    type: 'box',
    x: Math.round(box.x - padding),
    y: Math.round(box.y - padding),
    width: Math.round(box.width + padding * 2),
    height: Math.round(box.height + padding * 2)
  }
}

function annotationsForBahmni(step, locale, names) {
  const boxes = names.map((name) => measuredBahmni[`${step}:${locale}:${name}`]).filter(Boolean)
  if (boxes.length === 0) {
    throw new Error(`No measured annotation for step ${step} (${locale}).`)
  }
  return boxes
}

/**
 * Resolves a Bahmni patient uuid by MRN through the same Registration search
 * used in step 03, instead of hardcoding a uuid nobody has confirmed live.
 * Clicking a search result navigates into a hash route shaped
 * "#/patient/<uuid>/...", so the uuid is read back off the URL rather than
 * guessed from a DOM attribute.
 */
async function resolvePatientUuidByMrn(page, mrn) {
  await openBahmniApp(page, '/bahmni/registration/index.html#/search', '#registrationNumber')
  await page.fill('#registrationNumber', mrn)
  // PERLU VERIFIKASI: assumes Enter submits the search (typical Bahmni
  // ng-keyup binding on this field). Never confirmed live — if this stalls,
  // the fix is almost certainly a debounced auto-search that needs a short
  // wait instead, not a missing submit button; Bahmni's registration search
  // does not show one in the layout the earlier steps 01-03 already proved.
  await page.keyboard.press('Enter')
  await page.waitForSelector('table tbody tr', { timeout: 30000 })
  const rowCount = await page.locator('table tbody tr').count()
  if (rowCount === 0) {
    throw new Error(`Registration search for MRN ${mrn} returned no rows.`)
  }
  await page.locator('table tbody tr').first().click()
  await page.waitForURL(/#\/patient\/[0-9a-f-]{36}/, { timeout: 30000 })
  const match = page.url().match(/patient\/([0-9a-f-]{36})/)
  if (!match) {
    throw new Error(`Could not resolve a patient uuid for MRN ${mrn} from URL ${page.url()}`)
  }
  return match[1]
}

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
  },
  {
    // Steps 10-11 cover the return leg on a DIFFERENT, already-complete case
    // than steps 01-09 (Rahmawati Nurhaliza / ABC200003, whose unit has no
    // AI slot and stays Unprocessed by design, per the "Current limitations"
    // section of the mdx). The write-back leg is demonstrated on
    // BAHMNI-3d2845c5-... (patient Ratna Proofdev, MRN ABC200005), confirmed
    // 2026-08-23 by reading the PRECIA audit trail directly:
    //   - CREATED at 05:14:17, actor_type=SERVICE actor_label="Bahmni
    //     connector dev", ip_address=172.23.0.1 (the docker bridge, i.e. a
    //     genuine connector call, not a hand-run script).
    //   - CLINICAL_VALIDATION_PUBLISHED at 05:16:22.295Z.
    //   - SIMRS_DELIVERY_ATTEMPTED at 05:16:22.324Z, 29ms later, actor_type
    //     SYSTEM actor_label=simrs-delivery-worker, then
    //     SIMRS_DELIVERY_SUCCEEDED at 05:16:22.567Z.
    // A human could not react in 29ms, so the write-back trigger is real and
    // automatic. The AI trigger step itself is still a manual PRECIA action
    // (INFERENCE_DISPATCHED in the same trail is a human HTTP_POST), matching
    // the same limitation already documented for every other SIMRS on this
    // site, not something specific to Bahmni.
    id: 'integrasi-simrs__bahmni__10-validasi-dipublikasikan',
    section: 'integrasi-simrs',
    pageSlug: 'bahmni',
    stepSlug: '10-validasi-dipublikasikan',
    route: '/validation',
    role: 'BAHMNI',
    viewport: { width: 1800, height: 1004 },
    preActions: async (page, { locale }) => {
      // apps/(dashboard)/validation/page.tsx renders each worklist row as a
      // plain <button> with no data-testid, keyed on the transaction code
      // and patient name text — there is no other stable selector, and that
      // text is identical in id/en since names and codes are never
      // translated.
      await page.waitForSelector('button', { timeout: 30000 })
      const row = page.locator('button', { hasText: WRITEBACK_TX_CODE }).first()
      await row.waitFor({ timeout: 30000 })
      await measure(page, '10', locale, 'row', row)
      await row.click()
      // The detail card swaps in-place on the right column; wait for the
      // "already published" text that only renders once selected.status ===
      // 'published' (validation/page.tsx line ~536-539).
      await page.waitForSelector('text=/published|dipublikasikan|Sudah diterbitkan/i', {
        timeout: 30000
      })
      await page.waitForTimeout(1000)
      // Two separate boxes: the summary grid (app/(dashboard)/validation/
      // page.tsx, "grid grid-cols-2 gap-3 text-xs") holds patient, tx code,
      // decision and status; the AI result block ("rounded-lg border
      // border-border bg-muted/20 p-3", same file) holds the confidence
      // score the validator reviewed. Both class strings read directly from
      // that component, not guessed.
      const summary = page.locator('div.grid.grid-cols-2').first()
      await measure(page, '10', locale, 'summary', summary, 16)
      const aiResult = page.locator('div.rounded-lg.border-border.bg-muted\\/20').first()
      await measure(page, '10', locale, 'ai-result', aiResult, 12)
    },
    annotate: ({ locale }) => annotationsForBahmni('10', locale, ['row', 'summary', 'ai-result'])
  },
  {
    // Gated on step 10. patch_dashboard.py installs a "vitals" dashboard
    // section titled exactly "PRECIA AI Results" (displayOrder 1, right next
    // to Diagnoses) showing the three concepts receiver.py writes: "PRECIA
    // AI Impression", "PRECIA AI Confidence", "PRECIA AI Module". Confirmed
    // by reading simrs/simrs-bahmni seed/patch_dashboard.py and
    // connector/precia_connector/receiver.py directly, not guessed.
    //
    // The patient uuid for Ratna Proofdev/ABC200005 is not hardcoded here:
    // it is resolved live through the same Registration search used by step
    // 03, so this step also doubles as a second, independent proof that the
    // write-back landed against the right chart (matching patient identity),
    // not just that PRECIA marked the delivery as succeeded.
    id: 'integrasi-simrs__bahmni__11-hasil-ai-di-rekam-medis',
    section: 'integrasi-simrs',
    pageSlug: 'bahmni',
    stepSlug: '11-hasil-ai-di-rekam-medis',
    preActions: async (page, { locale }) => {
      const uuid = await resolvePatientUuidByMrn(page, WRITEBACK_PATIENT_MRN)
      await openBahmniApp(
        page,
        `/bahmni/clinical/index.html#/default/patient/${uuid}/dashboard`,
        'text=PRECIA AI Results'
      )
      await page.waitForTimeout(1500)
      const section = page
        .locator('text=PRECIA AI Results')
        .first()
        .locator('xpath=ancestor::*[self::div or self::section][1]')
      await measure(page, '11', locale, 'section', section, 12)
    },
    annotate: ({ locale }) => annotationsForBahmni('11', locale, ['section'])
  }
]
