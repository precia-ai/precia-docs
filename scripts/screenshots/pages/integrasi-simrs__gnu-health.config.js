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
 * SELEKTOR YANG BELUM DIVERIFIKASI PADA REVISI INI, karena host precia.site
 * sedang tidak dapat diakses saat spec ini ditulis. Ditandai satu per satu
 * di preActions masing-masing langkah dengan komentar "PERLU VERIFIKASI".
 * Dugaan diturunkan dari pola yang sudah terbukti bekerja pada elemen sejenis
 * di bagian lain file ini (title attribute pada tombol toolbar, class
 * .modal-content pada dialog), bukan dikarang bebas:
 *   - Field Patient pada wizard "Medical Imaging - New order" diasumsikan
 *     bernama `patient`, sama seperti form Imaging Test Request lama. Wizard
 *     ini adalah layar berbeda dan belum pernah dibuka lewat automasi.
 *   - Baris Tests pada wizard tersebut diasumsikan dapat dicentang lewat
 *     checkbox pertama pada barisnya.
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

/** Order dan hasil pemeriksaan pencitraan pada instansi GNU Health dev. */
const ORDER_NUMBER = '010'
const RESULT_NUMBER = 'TEST008'
const PATIENT_FRAGMENT = 'Zenon Betz'
const STUDY_FRAGMENT = 'PRECIA AI ECG'

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

async function expandMenu(page, label) {
  const row = page.locator(`#menu tr:has(div.column-char[title="${label}"])`).first()
  await row.locator('span.expander img').first().click()
  await page.waitForTimeout(2000)
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

async function openImagingTestRequestList(page) {
  await expandMenu(page, 'Medical Imaging')
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

async function openImagingTestResultList(page) {
  await expandMenu(page, 'Medical Imaging')
  await menuCell(page, 'Imaging Test Result').dblclick()
  await page.waitForSelector('#tabcontent tbody tr', { timeout: 30000 })
  await page.waitForTimeout(3000)
}

/**
 * Buka wizard "Request Imaging Test" dan isi Patient serta baris Tests,
 * TANPA menekan REQUEST. Tidak pernah membuat record baru di instansi dev.
 * PERLU VERIFIKASI: field Patient pada wizard ini belum pernah dibuka oleh
 * generator, lihat catatan di kepala berkas.
 */
async function fillNewOrderWizardWithoutSubmitting(page) {
  await expandMenu(page, 'Medical Imaging')
  await menuCell(page, 'Request Imaging Test').dblclick()
  await page.waitForSelector('.modal-content', { timeout: 30000 })
  await page.waitForTimeout(2000)
  const modal = page.locator('.modal-content').first()
  const patientInput = modal.locator('input[name="patient"]').first()
  await patientInput.click()
  await patientInput.fill(PATIENT_FRAGMENT)
  await page.waitForTimeout(2500)
  await modal.locator('ul.dropdown-menu li.completion a').first().click()
  await page.waitForTimeout(1500)
  const testRow = modal.locator('table tr', { hasText: STUDY_FRAGMENT }).first()
  const testCheckbox = testRow.locator('input[type="checkbox"]').first()
  if (!(await testCheckbox.isChecked().catch(() => false))) {
    await testCheckbox.click()
    await page.waitForTimeout(800)
  }
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
      await expandMenu(page, 'Medical Imaging')
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
    route: '/clinical',
    role: 'GNUHEALTH',
    preActions: async (page, { locale }) => {
      await page.waitForSelector('table tbody tr', { timeout: 25000 })
      await page.waitForTimeout(1500)
      // PERLU VERIFIKASI: indeks select ini diwarisi dari versi sebelumnya
      // (nth(1) = penyaring Unit), belum diukur ulang pada tampilan terkini.
      const unitFilter = page.locator('select').nth(1)
      await unitFilter.selectOption({ label: PRECIA_UNIT_LABEL })
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
    id: 'integrasi-simrs__gnu-health__10-slot-ai-terisi',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '10-slot-ai-terisi',
    route: `/clinical/transactions/${PRECIA_TX_ID}`,
    role: 'GNUHEALTH',
    preActions: async (page, { locale }) => {
      await page.waitForSelector('h1', { timeout: 25000 })
      await page.getByText('ECG EF Screening', { exact: true }).first().click()
      await page.waitForTimeout(2000)
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
        'trigger',
        page.locator('button:has-text("Trigger AI")').first()
      )
    },
    annotate: ({ locale }) => annotationsFor('10', locale, ['file', 'trigger'])
  },
  {
    id: 'integrasi-simrs__gnu-health__11-hasil-ai-tampil',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '11-hasil-ai-tampil',
    route: `/clinical/transactions/${PRECIA_TX_ID}`,
    role: 'GNUHEALTH',
    preActions: async (page, { locale }) => {
      await page.waitForSelector('h1', { timeout: 25000 })
      await page.getByText('ECG EF Screening', { exact: true }).first().click()
      await page.waitForTimeout(2500)
      await measure(
        page,
        '11',
        locale,
        'confidence',
        page.locator('text=Confidence').first().locator('xpath=ancestor::div[1]')
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
      await page.waitForSelector('text=Validation Detail', { timeout: 25000 })
      await page.waitForTimeout(2000)
      await measure(page, '12', locale, 'transaction', page.locator('text=GNUHEALTH-10').first())
      await measure(page, '12', locale, 'status', page.locator('text=Published').first())
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
  }
]
