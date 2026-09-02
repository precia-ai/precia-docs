/**
 * Alur transaksi GNU Health ke PRECIA, dan hasil AI kembali ke GNU Health,
 * pada lingkungan dev.
 *
 * PERBAIKAN DARI VERSI SEBELUMNYA: revisi ini mengganti spec lama yang
 * mendokumentasikan alur Draft-and-Note yang tidak pernah menjadi jalur
 * pembuktian sesungguhnya. Ingest dan write-back kini terbukti berjalan di
 * dev DAN prod lewat wizard "Request Imaging Test" dan aksi "Generate
 * Results" pada Imaging Test Request, bukan lewat form New/Save yang
 * dibiarkan Draft. Kasus pembuktian dev: order GNU Health 010, transaksi
 * PRECIA GNUHEALTH-10 (id 223cb1c1-0aa4-41bc-8f2c-37599464cceb), organisasi
 * "RS Uji Coba GNU Health", unit "Poliklinik Kardiologi", pasien seed Zenon
 * Betz, Matt (MRN 97234436). Kasus ini sudah selesai lengkap: hasil AI
 * dipublikasikan dan catatan write-back sudah ada di GNU Health, sehingga
 * spec ini TIDAK membuat data baru untuk langkah 05 ke atas, hanya membuka
 * ulang record yang sudah ada. Detail pembuktian: lihat memory
 * project_gnuhealth_connector_status di agent-memory simrs-connector.
 *
 * Dua sumber tangkapan layar:
 *   1. Halaman pengaturan Integrasi SIMRS di PRECIA (peran SUP), untuk
 *      menunjukkan tempat adapter dan URL endpoint organisasi diatur.
 *      Pendaftaran konektor GNU Health masih dikerjakan tim implementasi
 *      lewat onboarding platform, bukan lewat kolom Adapter di halaman ini,
 *      jadi langkah ini masih berlaku apa adanya dari versi sebelumnya.
 *   2. Klien web GNU Health (Tryton sao) pada instansi dev, dan halaman
 *      klinis PRECIA pada organisasi "RS Uji Coba GNU Health". Spec sisi
 *      GNU Health memakai URL penuh pada `route` dan TIDAK memakai `role`,
 *      karena login GNU Health berbeda dari login PRECIA. Spec sisi PRECIA
 *      memakai role GNUHEALTH (env PRECIA_DEMO_GNUHEALTH_EMAIL/PASSWORD),
 *      bukan SUP, karena organisasi platform default tidak dapat membaca
 *      daftar kerja maupun transaksi milik organisasi GNU Health.
 *
 * Kredensial GNU Health dibaca dari env GNUHEALTH_UI_USER dan
 * GNUHEALTH_UI_PASSWORD, tidak pernah ditulis di file ini. Jalankan dengan:
 *   npm run shots -- --only=integrasi-simrs__gnu-health__
 * setelah mengisi .env.local (lihat .env.local.example untuk daftar
 * variabel yang diperlukan bagian ini).
 *
 * Catatan perilaku sao yang sudah diverifikasi pada versi sebelumnya dan
 * masih berlaku:
 *   - Kotak Login hanya meminta nama pengguna. Kata sandi diminta pada kotak
 *     kedua dengan id #ask-dialog-entry setelah tombol LOGIN ditekan.
 *   - Kolom Database sudah terisi dan tidak perlu disentuh.
 *   - Menu kiri adalah tabel pohon. Baris dibuka dengan klik ganda pada sel
 *     teksnya, bukan pada barisnya.
 *   - Kolom many2one (Patient, Study, Health prof) memakai pelengkapan
 *     otomatis. Nilai harus dipilih dari daftar saran, bukan sekadar
 *     diketik.
 *
 * Langkah 4-7 dan 13-14 (wizard Request Imaging Test dan record order yang
 * sudah selesai) sudah diverifikasi hidup 2026-08-27, setelah izin modul
 * Medical Imaging dan tautan tenaga kesehatan akun docs dibereskan:
 *   - Field Patient pada wizard "Medical Imaging - New order" memang
 *     bernama `patient`, sama seperti form Imaging Test Request lama.
 *   - Baris Tests pada wizard tersebut BUKAN daftar centang statis seperti
 *     dugaan sebelumnya, melainkan widget many2many: field bernama `tests`
 *     berupa kolom pelengkapan otomatis, baris baru ditambahkan dengan
 *     mengetik lalu memilih saran, dan baris yang ditambahkan otomatis
 *     tercentang.
 *   - Membuka wizard ini dengan `.dblclick()` pada baris menunya membuka 3
 *     dialog modal bertumpuk, bukan 1. Dialog yang benar-benar interaktif
 *     selalu yang PALING BARU di DOM (`.last()`), bukan `.first()`.
 *   - Akun login harus tertaut ke rekaman tenaga kesehatan (field
 *     `internal_user` pada `party.party`) atau wizard menolak dibuka
 *     dengan galat SM-CORE-0007. Akun docs ditautkan ke party "Wilson"
 *     yang sebelumnya belum dipakai siapa pun (`internal_user` masih
 *     kosong), bukan membuat party baru maupun menimpa tautan pihak lain.
 *   - Tombol aksi "Generate Results" pada toolbar Imaging Test Request
 *     diasumsikan punya `title="Generate Results"`, mengikuti pola tombol
 *     New dan Save yang sudah terbukti. Ini BELUM pernah diklik oleh
 *     generator ini; pada bukti round trip yang sudah ada, aksi ini
 *     dijalankan oleh agen lain secara manual.
 */

const GNUHEALTH_URL = process.env.GNUHEALTH_UI_URL || 'https://gnuhealth-dev.precia.site/'

/** Kasus pembuktian pada organisasi demo "RS Uji Coba GNU Health". */
const PRECIA_TX_ID = '223cb1c1-0aa4-41bc-8f2c-37599464cceb'
const PRECIA_UNIT_LABEL = 'Poliklinik Kardiologi'
const PRECIA_UNIT_ID = 'a876b556-f672-475b-9e4a-44837f06af28'

/** Order dan hasil pemeriksaan pencitraan pada instansi GNU Health dev. */
const ORDER_NUMBER = '010'
const RESULT_NUMBER = 'TEST008'
const PATIENT_FRAGMENT = 'Zenon Betz'
const STUDY_FRAGMENT = 'PRECIA AI ECG'

/**
 * Kasus kedua, terpisah dari 010, dibuat 2026-09-02 khusus untuk membuktikan
 * body ir.note berformat JSON terstruktur (lihat langkah 15). Order 010
 * ditulis SEBELUM perbaikan itu ada, jadi catatannya masih memuat teks bebas
 * lama dan tidak bisa dipakai untuk membuktikan format baru tanpa menjalankan
 * ulang siklus penuh. Order ini dibuat lewat wizard "Request Imaging Test"
 * yang sama, direquest, digenerate hasilnya, dipicu AI-nya, lalu divalidasi,
 * seluruhnya melalui langkah yang identik dengan yang dipakai order 010,
 * hanya kali ini menghasilkan catatan JSON karena adapter sudah diperbaiki.
 * Transaksi PRECIA: GNUHEALTH-0-11 (id 59aa7535-9ddd-45f8-b58f-cf0f110de2b5),
 * pasien seed Ana Isabel Betz, modul AI-ECG-LVEF, classification "Normal"
 * diambil dari result_data.class_label lewat fallback kunci klasifikasi yang
 * baru ditambahkan pada sesi yang sama.
 */
const JSON_DEMO_ORDER_NUMBER = '011'

/**
 * Kotak anotasi yang diukur dari elemen sungguhan saat preActions berjalan.
 * Kunci: "<stepSlug>:<locale>:<nama>". annotationsFor() melempar galat kalau
 * kosong, supaya tangkapan layar tanpa anotasi tidak mungkin diterbitkan.
 */
const measured = {}

function keyOf(step, locale, name) {
  return `${step}:${locale}:${name}`
}

async function measure(page, step, locale, name, locator, padding = 8) {
  const box = await locator.first().boundingBox()
  if (!box) {
    throw new Error(`Tidak dapat mengukur elemen "${name}" pada langkah ${step} (${locale}).`)
  }
  measured[keyOf(step, locale, name)] = {
    type: 'box',
    x: Math.round(box.x - padding),
    y: Math.round(box.y - padding),
    width: Math.round(box.width + padding * 2),
    height: Math.round(box.height + padding * 2)
  }
}

function annotationsFor(step, locale, names) {
  const boxes = names.map((name) => measured[keyOf(step, locale, name)]).filter(Boolean)
  if (boxes.length === 0) {
    throw new Error(`Tidak ada anotasi yang terukur untuk langkah ${step} (${locale}).`)
  }
  return boxes
}

/* ------------------------------------------------------------------ */
/* Bantuan sisi GNU Health                                             */
/* ------------------------------------------------------------------ */

function credentials() {
  const user = process.env.GNUHEALTH_UI_USER
  const password = process.env.GNUHEALTH_UI_PASSWORD
  if (!user || !password) {
    throw new Error(
      'Env GNUHEALTH_UI_USER dan GNUHEALTH_UI_PASSWORD wajib diisi saat menjalankan spec GNU Health.'
    )
  }
  return { user, password }
}

async function waitLoginDialog(page) {
  await page.waitForSelector('#login', { timeout: 45000 })
  await page.waitForTimeout(1500)
}

async function fillUserName(page) {
  await page.fill('#login', credentials().user)
}

async function submitUserName(page) {
  await page.click('.btn:has-text("LOGIN")')
  await page.waitForSelector('#ask-dialog-entry', { timeout: 30000 })
  await page.waitForTimeout(1200)
}

async function submitPassword(page) {
  await page.fill('#ask-dialog-entry', credentials().password)
  await page.keyboard.press('Enter')
  await page.waitForSelector('#menu div.column-char[title="Health"]', { timeout: 45000 })
  await page.waitForTimeout(3000)
}

async function loginGnuhealth(page) {
  await waitLoginDialog(page)
  await fillUserName(page)
  await submitUserName(page)
  await submitPassword(page)
}

function menuCell(page, label) {
  return page.locator(`#menu div.column-char[title="${label}"]`).first()
}

/**
 * A plain Playwright .click() on the expander icon is unreliable here: it
 * intermittently resolves but never actually toggles the branch, and
 * sometimes the locator itself never settles before the 30s default
 * timeout (confirmed live 2026-09-02 on both a fresh script and this file's
 * own steps 13/14, unrelated to any spec-specific change). A raw DOM
 * dispatchEvent('click') on the <img> reliably toggles it where the
 * synthetic pointer click does not.
 */
async function expandMenu(page, label) {
  const row = page.locator(`#menu tr:has(div.column-char[title="${label}"])`).first()
  await row.waitFor({ state: 'visible', timeout: 30000 })
  await row.locator('span.expander img').first().dispatchEvent('click')
  await page.waitForTimeout(2500)
}

/** Baris "010" pada tab yang sedang aktif di daftar Imaging Test Request. */
function requestRow(page) {
  return page
    .locator('#tabcontent tbody tr td[data-title="Order: "] div.column-char', {
      hasText: ORDER_NUMBER
    })
    .first()
    .locator('xpath=ancestor::tr')
}

/**
 * "Medical Imaging" is nested under "Health" in the tree menu, and Tryton's
 * sao client only renders a branch's children after that branch has been
 * expanded at least once. A fresh login always starts with every branch
 * collapsed, so "Medical Imaging" does not exist in the DOM yet until
 * "Health" itself is expanded first. Confirmed live 2026-08-27: expanding
 * "Medical Imaging" directly after login times out with no such row found.
 */
async function openMedicalImagingBranch(page) {
  // Whether "Health" starts expanded or collapsed after login turned out to
  // depend on which account logs in (confirmed live 2026-09-02: already
  // expanded for GNUHEALTH_UI_USER=admin, matching this file's older
  // comment about a fresh login starting fully collapsed only for the
  // docs-viewer account it originally assumed). Toggling unconditionally
  // therefore risks CLOSING an already-open branch instead of opening it.
  // Check first, expand only if the child is not already visible.
  if (!(await menuCell(page, 'Medical Imaging').isVisible().catch(() => false))) {
    await expandMenu(page, 'Health')
  }
  if (!(await menuCell(page, 'Request Imaging Test').isVisible().catch(() => false))) {
    await expandMenu(page, 'Medical Imaging')
  }
}

async function openImagingTestRequestList(page) {
  await openMedicalImagingBranch(page)
  await menuCell(page, 'Imaging Test Request').dblclick()
  await page.waitForSelector('#tabcontent button[title="New"]', { timeout: 30000 })
  await page.waitForTimeout(3000)
}

/**
 * Pindah ke tab "All" pada daftar Imaging Test Request. PERLU VERIFIKASI:
 * order 010 sudah berstatus Done (bukan Draft lagi setelah Generate Results
 * dijalankan), sehingga tab default "Draft" tidak lagi menampilkannya. Tag
 * elemen tab (li vs a) belum dipastikan langsung dari DOM, hanya dari
 * kemiripan visual dengan tab Draft/Requested/Done/All pada bukti raw.
 */
async function switchToAllTab(page) {
  await page.click('#tabcontent li:has-text("All"), #tabcontent a:has-text("All")')
  await page.waitForTimeout(1500)
}

/** Buka kembali record order 010 yang sudah lengkap (state Done). */
async function openExistingOrder(page) {
  await openImagingTestRequestList(page)
  await switchToAllTab(page)
  await requestRow(page).locator('td[data-title="Order: "] div.column-char').dblclick()
  await page.waitForSelector('input[name="patient"]', { timeout: 30000 })
  await page.waitForTimeout(3000)
}

/** Sama seperti openExistingOrder, untuk order arbitrer (dipakai langkah 15). */
async function openOrderByNumber(page, orderNumber) {
  await openImagingTestRequestList(page)
  await switchToAllTab(page)
  await page
    .locator('#tabcontent tbody tr td[data-title="Order: "] div.column-char', {
      hasText: orderNumber
    })
    .first()
    .dblclick()
  await page.waitForSelector('input[name="patient"]', { timeout: 30000 })
  await page.waitForTimeout(3000)
}

async function openImagingTestResultList(page) {
  await openMedicalImagingBranch(page)
  await menuCell(page, 'Imaging Test Result').dblclick()
  await page.waitForSelector('#tabcontent tbody tr', { timeout: 30000 })
  await page.waitForTimeout(3000)
}

/**
 * Buka wizard "Request Imaging Test" dan isi Patient serta baris Tests,
 * TANPA menekan REQUEST. Tidak pernah membuat record baru di instansi dev.
 *
 * dblclick() pada baris menu ini membuka wizard LEBIH dari sekali (3 dialog
 * bertumpuk terkonfirmasi langsung 2026-08-27), berbeda dari baris menu
 * daftar (Imaging Test Request/Result) yang aman menerima dblclick berulang.
 * .modal-content terlama (.first()) berada di belakang backdrop dialog yang
 * lebih baru, sehingga elemen di dalamnya tidak menerima klik ("subtree
 * intercepts pointer events"). Dialog yang benar-benar interaktif selalu
 * yang PALING BARU (.last()).
 */
async function fillNewOrderWizardWithoutSubmitting(page) {
  await openMedicalImagingBranch(page)
  await menuCell(page, 'Request Imaging Test').dblclick()
  await page.waitForSelector('.modal-content', { timeout: 30000 })
  await page.waitForTimeout(2000)
  const modal = page.locator('.modal-content').last()
  const patientInput = modal.locator('input[name="patient"]').first()
  await patientInput.click()
  await patientInput.fill(PATIENT_FRAGMENT)
  await page.waitForTimeout(2500)
  await modal.locator('ul.dropdown-menu li.completion a').first().click()
  await page.waitForTimeout(1500)
  // "Tests" is a many2many widget (add/remove buttons plus one autocomplete
  // input, name="tests"), not a pre-populated table with checkboxes to tick
  // as the old comment assumed. Confirmed live 2026-08-27: the grid starts
  // empty; typing into the autocomplete and picking the matching suggestion
  // is what adds (and auto-checks) the row.
  const testsInput = modal.locator('input[name="tests"]').first()
  await testsInput.click()
  await testsInput.fill(STUDY_FRAGMENT)
  await page.waitForTimeout(2500)
  await modal.locator('.form-many2many-toolbar ul.dropdown-menu li.completion a').first().click()
  await page.waitForTimeout(1500)
  return modal
}

/* ------------------------------------------------------------------ */
/* Spec                                                                */
/* ------------------------------------------------------------------ */

const SECTION = 'integrasi-simrs'
const PAGE = 'gnu-health'

module.exports = [
  {
    id: 'integrasi-simrs__gnu-health__01-pengaturan-koneksi',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '01-pengaturan-koneksi',
    route: '/settings/simrs-integration',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await page.waitForSelector('#simrs-adapter', { timeout: 20000 })
      await page.waitForTimeout(1500)
      // The shared platform SUP account's own organization ("System Health
      // Organization") has a single mutable simrs.adapter record that every
      // SIMRS needing this settings screen was racing to overwrite via
      // "Save connection settings" — confirmed live 2026-08-27 by diffing
      // this page's earlier saved screenshot against Open Hospital's:
      // byte-identical, same admin@precia.ai identity, same org, whichever
      // SIMRS saved last silently won. Fixed the same way
      // integrasi-simrs__khanza.config.js already does: overwrite the form
      // to GNU Health's own values WITHOUT clicking Save, so the screenshot
      // is correct regardless of whatever another SIMRS last persisted.
      await page.selectOption('#simrs-adapter', 'gnuhealth')
      await page.fill('#simrs-endpoint-url', 'https://simrs.contoh-rs.example/gnuhealth')
      await page.waitForTimeout(800)
      await measure(page, '01', locale, 'adapter', page.locator('#simrs-adapter'))
      await measure(page, '01', locale, 'endpoint', page.locator('#simrs-endpoint-url'))
    },
    annotate: ({ locale }) => annotationsFor('01', locale, ['adapter', 'endpoint'])
  },
  {
    id: 'integrasi-simrs__gnu-health__02-halaman-masuk',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '02-halaman-masuk',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await waitLoginDialog(page)
      await fillUserName(page)
      await page.waitForTimeout(800)
      await measure(page, '02', locale, 'user', page.locator('#login'))
      await measure(page, '02', locale, 'button', page.locator('.btn:has-text("LOGIN")'))
    },
    annotate: ({ locale }) => annotationsFor('02', locale, ['user', 'button'])
  },
  {
    id: 'integrasi-simrs__gnu-health__03-kata-sandi',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '03-kata-sandi',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await waitLoginDialog(page)
      await fillUserName(page)
      await submitUserName(page)
      await page.fill('#ask-dialog-entry', credentials().password)
      await page.waitForTimeout(800)
      await measure(page, '03', locale, 'entry', page.locator('#ask-dialog-entry'))
    },
    annotate: ({ locale }) => annotationsFor('03', locale, ['entry'])
  },
  {
    id: 'integrasi-simrs__gnu-health__04-menu-pencitraan',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '04-menu-pencitraan',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await loginGnuhealth(page)
      await openMedicalImagingBranch(page)
      await measure(page, '04', locale, 'medical-imaging', menuCell(page, 'Medical Imaging'))
      await measure(page, '04', locale, 'request-wizard', menuCell(page, 'Request Imaging Test'))
      await measure(page, '04', locale, 'request-list', menuCell(page, 'Imaging Test Request'))
    },
    annotate: ({ locale }) =>
      annotationsFor('04', locale, ['medical-imaging', 'request-wizard', 'request-list'])
  },
  {
    id: 'integrasi-simrs__gnu-health__05-formulir-permintaan-baru',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '05-formulir-permintaan-baru',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await loginGnuhealth(page)
      const modal = await fillNewOrderWizardWithoutSubmitting(page)
      await measure(page, '05', locale, 'patient', modal.locator('input[name="patient"]').first())
      await measure(
        page,
        '05',
        locale,
        'test-row',
        modal.locator('table tr', { hasText: STUDY_FRAGMENT }).first()
      )
      await measure(page, '05', locale, 'request', modal.locator('button:has-text("REQUEST")'))
    },
    annotate: ({ locale }) => annotationsFor('05', locale, ['patient', 'test-row', 'request'])
  },
  {
    id: 'integrasi-simrs__gnu-health__06-permintaan-tersimpan',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '06-permintaan-tersimpan',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await loginGnuhealth(page)
      await openImagingTestRequestList(page)
      await switchToAllTab(page)
      await measure(page, '06', locale, 'row', requestRow(page), 4)
    },
    annotate: ({ locale }) => annotationsFor('06', locale, ['row'])
  },
  {
    id: 'integrasi-simrs__gnu-health__07-hasil-pemeriksaan',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '07-hasil-pemeriksaan',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await loginGnuhealth(page)
      await openImagingTestResultList(page)
      const row = page.locator('#tabcontent tbody tr', { hasText: RESULT_NUMBER }).first()
      await measure(page, '07', locale, 'row', row, 4)
    },
    annotate: ({ locale }) => annotationsFor('07', locale, ['row'])
  },
  {
    id: 'integrasi-simrs__gnu-health__08-daftar-kerja-precia',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '08-daftar-kerja-precia',
    // Verified live 2026-08-27: plain /clinical now shows a "Choose a Unit"
    // card picker with no table at all, not a worklist with a select
    // filter. Passing ?unit=<id> lands directly on that unit's worklist,
    // same convention as Bahmni's own step 08.
    route: `/clinical?unit=${PRECIA_UNIT_ID}`,
    role: 'GNUHEALTH',
    preActions: async (page, { locale }) => {
      await page.waitForSelector('table tbody tr', { timeout: 25000 })
      await page.waitForTimeout(1500)
      // With ?unit= already in the route, select index 1 (0 is Status) is
      // the Unit filter and is already set to Poliklinik Kardiologi.
      // selectOption({label: PRECIA_UNIT_LABEL}) failed here: the actual
      // option label is "KARDIO - Poliklinik Kardiologi" (code prefix
      // included), not the bare unit name, and reselecting is redundant
      // anyway since the URL already picked it. Just measure it as-is.
      const unitFilter = page.locator('select').nth(1)
      await page.waitForTimeout(2000)
      await measure(page, '08', locale, 'unit-filter', unitFilter)
      await measure(
        page,
        '08',
        locale,
        'row',
        page.locator('table tbody tr', { hasText: 'GNUHEALTH-10' }).first(),
        4
      )
    },
    annotate: ({ locale }) => annotationsFor('08', locale, ['unit-filter', 'row'])
  },
  {
    id: 'integrasi-simrs__gnu-health__09-detail-transaksi-precia',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '09-detail-transaksi-precia',
    route: `/clinical/transactions/${PRECIA_TX_ID}`,
    role: 'GNUHEALTH',
    preActions: async (page, { locale }) => {
      await page.waitForSelector('h1', { timeout: 25000 })
      await page.waitForTimeout(2500)
      await measure(page, '09', locale, 'code', page.locator('h1').first())
      await measure(
        page,
        '09',
        locale,
        'unit',
        page.locator('text=Poliklinik Kardiologi').first()
      )
    },
    annotate: ({ locale }) => annotationsFor('09', locale, ['code', 'unit'])
  },
  {
    // Two elements both render the text "ECG EF Screening": the AI Modules
    // chip under Transaction Details (index 0) and the actual tab button
    // (index 1). .first() was clicking the chip, which does nothing, so the
    // page stayed on the Patient Info tab and neither locator below was
    // ever found. Confirmed live 2026-08-27.
    //
    // Also: GNUHEALTH-10's AI module already reached status "Completed" by
    // the time this generator runs (same permanence problem already noted
    // on step 12's own comment below) — there is no "Trigger AI" button to
    // capture anymore, and reproducing the pre-trigger moment would mean
    // reverting a real completed result. This step therefore shows the
    // uploaded source file together with the module's current status.
    //
    // That status text is itself translated (precia-fe lib/i18n/
    // translations.ts, key "status.completed": "Completed" in English,
    // "Selesai" in Indonesian) — a literal 'text=Completed' locator only
    // ever matches the English pass. Confirmed live: on the 'id' pass the
    // tab click was working correctly the whole time, the page really did
    // show "Selesai", not "Completed"; hours were lost to this looking
    // like a click/network bug when it was a hardcoded-English-string bug.
    id: 'integrasi-simrs__gnu-health__10-slot-ai-terisi',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '10-slot-ai-terisi',
    route: `/clinical/transactions/${PRECIA_TX_ID}`,
    role: 'GNUHEALTH',
    fullPage: true,
    preActions: async (page, { locale }) => {
      const statusText = locale === 'id' ? 'Selesai' : 'Completed'
      await page.waitForSelector('h1', { timeout: 25000 })
      await page.getByText('ECG EF Screening', { exact: true }).nth(1).click()
      await page.waitForSelector(`text=${statusText}`, { timeout: 20000 })
      await measure(
        page,
        '10',
        locale,
        'file',
        page.locator('text=A012599').first()
      )
      await measure(
        page,
        '10',
        locale,
        'status',
        page.locator(`text=${statusText}`).first()
      )
    },
    annotate: ({ locale }) => annotationsFor('10', locale, ['file', 'status'])
  },
  {
    // Confidence/classification render below the fold at the default
    // viewport height; a non-fullPage screenshot cropped them out entirely
    // while the step still reported success (boundingBox() doesn't require
    // the element to be within the visible viewport). Confirmed live
    // 2026-08-27: the saved PNG was exactly 1440x900 with no annotated
    // content visible anywhere in it.
    id: 'integrasi-simrs__gnu-health__11-hasil-ai-tampil',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '11-hasil-ai-tampil',
    route: `/clinical/transactions/${PRECIA_TX_ID}`,
    role: 'GNUHEALTH',
    fullPage: true,
    preActions: async (page, { locale }) => {
      // "Confidence" is a translated label (precia-fe lib/i18n/
      // translations.ts, "clinical.colConfidence": "Confidence" / EN,
      // "Keyakinan" / ID) — a literal 'text=Confidence' locator only
      // matches the English pass. "Abnormal" is a raw AI classification
      // value, not translated, confirmed absent from the translations file
      // as its own key, so it is safe as a literal in both locales.
      const confidenceLabel = locale === 'id' ? 'Keyakinan' : 'Confidence'
      await page.waitForSelector('h1', { timeout: 25000 })
      // Same click-index fix as step 10: index 1 is the actual tab.
      await page.getByText('ECG EF Screening', { exact: true }).nth(1).click()
      await page.waitForTimeout(2500)
      await measure(
        page,
        '11',
        locale,
        'confidence',
        page.locator(`text=${confidenceLabel}`).first().locator('xpath=ancestor::div[1]')
      )
      await measure(page, '11', locale, 'classification', page.locator('text=Abnormal').first())
    },
    annotate: ({ locale }) => annotationsFor('11', locale, ['confidence', 'classification'])
  },
  {
    // Kasus pembuktian GNUHEALTH-10 sudah dipublikasikan secara permanen di
    // data dev, jadi status "menunggu keputusan" yang tampak pada bukti raw
    // (_evidence/dev/gnuhealth-10-*.png) tidak dapat direproduksi lagi oleh
    // generator ini tanpa membatalkan validasi yang sudah tercatat. Langkah
    // ini karena itu memotret Validation Detail pada keadaannya yang
    // sekarang, yaitu sudah diterbitkan, bukan keadaan sebelum diputuskan.
    id: 'integrasi-simrs__gnu-health__12-validasi-diterbitkan',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '12-validasi-diterbitkan',
    route: '/validation',
    role: 'GNUHEALTH',
    preActions: async (page, { locale }) => {
      // Both "Validation Detail" and "Published" are translated labels
      // (precia-fe lib/i18n/translations.ts: "validation.detailTitle" ->
      // "Detail Validasi" in Indonesian, "validation.statusPublished" ->
      // "Dipublikasikan"). Literal English locators only ever matched the
      // English pass; this is the actual reason this step kept timing out
      // on the 'id' pass, not the network flakiness it looked like.
      const detailTitle = locale === 'id' ? 'Detail Validasi' : 'Validation Detail'
      const publishedLabel = locale === 'id' ? 'Dipublikasikan' : 'Published'
      await page.waitForSelector(`text=${detailTitle}`, { timeout: 25000 })
      await page.waitForTimeout(2000)
      await measure(page, '12', locale, 'transaction', page.locator('text=GNUHEALTH-10').first())
      await measure(page, '12', locale, 'status', page.locator(`text=${publishedLabel}`).first())
    },
    annotate: ({ locale }) => annotationsFor('12', locale, ['transaction', 'status'])
  },
  {
    id: 'integrasi-simrs__gnu-health__13-order-selesai-di-gnu-health',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '13-order-selesai-di-gnu-health',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await loginGnuhealth(page)
      await openExistingOrder(page)
      await measure(page, '13', locale, 'state', page.locator('select[name="state"]'))
      await measure(
        page,
        '13',
        locale,
        'notes-button',
        page.locator('button[title^="Note"], [title="Notes"]').first()
      )
    },
    annotate: ({ locale }) => annotationsFor('13', locale, ['state', 'notes-button'])
  },
  {
    id: 'integrasi-simrs__gnu-health__14-catatan-hasil-ai',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '14-catatan-hasil-ai',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await loginGnuhealth(page)
      await openExistingOrder(page)
      await page.click('#tabcontent button[title^="Note"]')
      await page.waitForSelector('.modal-content', { timeout: 30000 })
      await page.waitForTimeout(3000)
      const modal = page.locator('.modal-content').first()
      await modal.locator('td[data-title="Message: "]').first().dblclick()
      await page.waitForSelector('.modal-content input[name="unread"]', { timeout: 30000 })
      await page.waitForTimeout(2500)
      await measure(page, '14', locale, 'author', modal.locator('input[name="last_user"]'))
      await measure(page, '14', locale, 'message', modal.locator('textarea[name="message"]'), 6)
    },
    annotate: ({ locale }) => annotationsFor('14', locale, ['author', 'message'])
  },
  {
    // Order 011, separate from the permanent 010 case above: proves the
    // structured JSON note body added 2026-09-02. 010 predates that fix, so
    // its note still holds the old free-text format and cannot show this.
    id: 'integrasi-simrs__gnu-health__15-catatan-json-terstruktur',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '15-catatan-json-terstruktur',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await loginGnuhealth(page)
      await openOrderByNumber(page, JSON_DEMO_ORDER_NUMBER)
      await page.click('#tabcontent button[title^="Note"]')
      await page.waitForSelector('.modal-content', { timeout: 30000 })
      await page.waitForTimeout(3000)
      const modal = page.locator('.modal-content').first()
      await modal.locator('td[data-title="Message: "]').first().dblclick()
      await page.waitForSelector('.modal-content input[name="unread"]', { timeout: 30000 })
      await page.waitForTimeout(2500)
      await measure(page, '15', locale, 'author', modal.locator('input[name="last_user"]'))
      await measure(page, '15', locale, 'message', modal.locator('textarea[name="message"]'), 6)
    },
    annotate: ({ locale }) => annotationsFor('15', locale, ['author', 'message'])
  }
]
