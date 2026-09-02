/**
 * Alur transaksi Open Hospital ke PRECIA (lingkungan dev), dan sebaliknya.
 *
 * STATUS BERKAS INI: definisi siap-eksekusi, BELUM PERNAH DIJALANKAN.
 * Ditulis saat precia.site tidak dapat diakses (lihat komentar "PERLU
 * VERIFIKASI" di titik-titik yang bergantung pada DOM sungguhan). Enam
 * langkah pertama menggantikan tangkapan layar yang sudah lebih dulu ada di
 * public/screenshots/{en,id}/integrasi-simrs/openhospital/ (dibuat lewat
 * proses manual di luar generator ini) dengan stepSlug yang identik, supaya
 * menjalankan berkas ini tinggal menimpa berkas lama dengan hasil yang bisa
 * diulang dari generator resmi. Langkah 07 baru dan BELUM ADA di halaman
 * dokumentasi manapun.
 *
 * Sumber selector: dibaca langsung dari
 * simrs/openhospital/openhospital-ui/src (LoginActivity.tsx,
 * PatientDataForm.tsx, ExamForm.tsx, OutPatientDashboardMenu.tsx,
 * SearchPatientActivity.tsx, LaboratoryDetails.tsx, Table.tsx), bukan
 * dikarang. Titik yang tidak bisa dipastikan tanpa membuka halaman
 * sungguhan ditandai "PERLU VERIFIKASI" pada baris yang bersangkutan.
 *
 * Dua sisi didokumentasikan, sesuai pembuktian yang sudah ada di prod
 * (pendaftaran pasien dan permintaan pemeriksaan, katalog exam CD.01):
 *   1. Klien web Open Hospital (SPA React, login sendiri, terpisah dari
 *      login PRECIA). Spec ini TIDAK memakai field `role` untuk step OH,
 *      dan memakai `locales: ['id']` supaya sisi Open Hospital hanya
 *      difoto sekali (tampilannya tidak berubah karena locale PRECIA).
 *      Berkas hasilnya harus disalin manual ke folder locale satunya
 *      setelah dijalankan, supaya kedua bahasa dokumentasi menunjuk ke
 *      gambar yang sama, mengikuti pola yang sudah dipakai pada berkas
 *      integrasi-simrs__khanza-alur-kasus.config.js.
 *
 *      Kredensial login UI dibaca dari env OH_CLINICIAN_USERNAME/
 *      OH_CLINICIAN_PASSWORD, BUKAN OH_USERNAME/OH_PASSWORD. Rencana semula
 *      memakai ulang akun connector (OH_USERNAME/OH_PASSWORD, dipakai juga
 *      oleh scripts/screenshots/oh-roundtrip-api-evidence.js) untuk login UI,
 *      dengan asumsi akun itu juga bisa baca/tulis modul Patients dan
 *      Laboratory. DIVERIFIKASI SALAH lewat JWT sungguhan: akun itu
 *      (precia_cb) hanya punya laboratories.read, opds.read, dan
 *      precia_integration.callback - tidak ada patients.read sama sekali,
 *      dan /laboratory butuh permission `laboratories.access` yang berbeda
 *      dari `laboratories.read` yang dimilikinya. Akun itu murni untuk
 *      panggilan API balik connector, bukan untuk menjelajah UI sebagai
 *      manusia. OH_CLINICIAN_USERNAME/PASSWORD adalah akun docs terpisah,
 *      grup "doctor", dengan patients.access/read/create/update,
 *      laboratories.access/read/create, opds.access/read/create - baru bisa
 *      membuka langkah 03-05 dan 07 di bawah.
 *   2. Halaman worklist dan detail transaksi PRECIA (langkah 06), peran demo
 *      `OPENHOSPITAL` (akun di dalam organisasi "RS Uji Coba Open
 *      Hospital"), dibaca dari env PRECIA_DEMO_OPENHOSPITAL_EMAIL/
 *      PRECIA_DEMO_OPENHOSPITAL_PASSWORD. Baris ini sudah ada di
 *      .env.local.example (kosong, menunggu diisi), mengikuti pola akun
 *      BAHMNI/CARE yang sudah ada di berkas yang sama. .env.local.example
 *      juga masih menyebut sebuah berkas
 *      integrasi-simrs__openhospital-bukti-round-trip.config.js yang belum
 *      pernah dibuat; berkas ini (integrasi-simrs__openhospital.config.js)
 *      menggantikan rencana itu dengan satu berkas tunggal yang mencakup
 *      kedua arah, jadi baris .env.local.example itu cukup dianggap
 *      merujuk ke berkas ini.
 *
 *      Langkah 01 (pengaturan koneksi organisasi) sebaliknya memakai peran
 *      `SUP` (admin@precia.ai, akun super admin dev, sama seperti dipakai
 *      integrasi-simrs__gnu-health.config.js dan
 *      integrasi-simrs__khanza.config.js untuk step ini), BUKAN akun
 *      `OPENHOSPITAL`. Diverifikasi langsung: akun `OPENHOSPITAL` (peran
 *      NRS+CAD, dibuat untuk langkah klinis) mendapat "Unable to load
 *      settings, You do not have permission to perform this action" saat
 *      membuka /settings/simrs-integration, akun itu tidak berwenang
 *      membaca pengaturan SIMRS organisasi.
 *
 * Langkah 07 (hasil-ai-di-openhospital) MENUNGGU PEMBUKTIAN. Panel
 * "PRECIA AI Result" pada LaboratoryDetails.tsx sungguh ada di kode UI
 * (state.laboratories.getPreciaAiResult), tapi belum pernah dibuktikan
 * terisi lewat kasus yang benar-benar melewati alur validasi PRECIA sampai
 * publish, lalu callback ai-results, lalu tampil di modal ini. Dokumen
 * openhospital.mdx saat ini menyatakan sisi ini "belum ditemukan tempatnya
 * di antarmuka web", pernyataan itu perlu diperbarui setelah langkah ini
 * benar-benar dijalankan dan terbukti, bukan sebelumnya. Jangan publikasikan
 * hasil tangkapan langkah ini ke halaman dokumentasi sebelum pembuktian
 * end-to-end selesai; sampai saat itu ia hanya bukti bahwa panelnya ADA,
 * bukan bukti bahwa datanya SAMPAI.
 *
 * Data uji yang dipakai (sudah ada di openhospital-dev.precia.site menurut
 * tangkapan layar sebelumnya, MRN 1): pasien SITI RAHMAWATI, permintaan
 * laboratorium ECG 12 Lead (kode katalog CD.01), menghasilkan transaksi
 * PRECIA berkode "laboratory-1" pada unit Kardiologi. Langkah 03 dan 04
 * SENGAJA TIDAK menekan tombol SUBMIT/REQUEST, supaya menjalankan generator
 * berkali-kali tidak menumpuk pasien atau permintaan baru di data dev,
 * mengikuti pola yang sudah dipakai pada integrasi-simrs__openemr.config.js.
 * Langkah 05 dan 07 memotret data yang MEMANG SUDAH tersimpan sebelumnya,
 * bukan hasil aksi spec ini.
 */

const OPENHOSPITAL_URL =
  (process.env.OH_BASE_URL || 'https://openhospital-dev.precia.site').replace(/\/$/, '')
const OPENHOSPITAL_LOGIN = `${OPENHOSPITAL_URL}/login`

const PATIENT_FIRST_NAME = 'SITI'
const PATIENT_SECOND_NAME = 'RAHMAWATI'
const EXAM_NAME = 'ECG 12 Lead' // kode katalog CD.01

const SECTION = 'integrasi-simrs'
const PAGE = 'openhospital'

// Kasus laboratory-500001 yang sudah dijalankan sungguhan sampai AI,
// validasi, publish, dan sinkron balik ke Open Hospital (2026-08-27), dipakai
// oleh langkah 08-10 di bawah. Beda dari langkah 01-07 di atas: langkah-langkah
// itu boleh diulang dari awal setiap kali spec ini dijalankan (data tidak
// disubmit), tapi trigger AI/validasi/publish untuk kasus ini TIDAK diulang
// di sini karena sudah terjadi sungguhan dan tidak reversibel. Langkah 08-10
// murni memotret ulang hasil akhirnya yang sudah ada.
const PROVEN_TRANSACTION_ID = '31b008d0-13be-47ed-9fe2-ac40f5242818'
const PROVEN_CASE_CODE = 'laboratory-500001'

// Label PRECIA yang tampil di halaman berubah menurut locale (lib/i18n/
// translations.ts), BEDA dari langkah 01-07 yang selectornya berbasis DOM
// Open Hospital sendiri (tidak dilokalkan oleh locale PRECIA). Dibaca
// langsung dari translations.ts baris 975-983 (en) / 3300-3309 (id) untuk
// aiModule.*, dan baris 1784-1830 (en) / 4114-4161 (id) untuk validation.*.
// "Abnormal" TIDAK dilokalkan (bukan translation key, nilai mentah dari
// modul AI), jadi teksnya sama di kedua locale.
const LABELS = {
  id: {
    confidenceScore: 'Skor Keyakinan',
    classification: 'Klasifikasi',
    decision: 'Keputusan',
    decisionAccepted: 'Diterima',
    clinicalNotes: 'Catatan klinis',
    status: 'Status',
    statusPublished: 'Dipublikasikan',
    publishedAt: 'Dipublikasikan pada'
  },
  en: {
    confidenceScore: 'Confidence Score',
    classification: 'Classification',
    decision: 'Decision',
    decisionAccepted: 'Accepted',
    clinicalNotes: 'Clinical notes',
    status: 'Status',
    statusPublished: 'Published',
    publishedAt: 'Published at'
  }
}

/* ------------------------------------------------------------------ */
/* Anotasi diukur dari elemen sungguhan (bukan koordinat piksel tetap), */
/* karena tata letak tidak bisa dipastikan tanpa membuka host.          */
/* ------------------------------------------------------------------ */

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

function annotationsFor(step, locale, names, extra = []) {
  const boxes = names.map((name) => measured[keyOf(step, locale, name)]).filter(Boolean)
  if (boxes.length === 0) {
    throw new Error(`Tidak ada anotasi yang terukur untuk langkah ${step} (${locale}).`)
  }
  return [...boxes, ...extra]
}

/** Mengukur gabungan (union) beberapa locator jadi satu kotak anotasi,
 * dipakai saat beberapa elemen berdekatan harus ditandai sebagai satu blok
 * (misalnya baris Confidence Score dan baris Classification yang bersebelahan). */
async function measureUnion(page, step, locale, name, locators, padding = 8) {
  const boxes = []
  for (const locator of locators) {
    const box = await locator.first().boundingBox()
    if (!box) {
      throw new Error(`Tidak dapat mengukur elemen union "${name}" pada langkah ${step} (${locale}).`)
    }
    boxes.push(box)
  }
  const left = Math.min(...boxes.map((b) => b.x))
  const top = Math.min(...boxes.map((b) => b.y))
  const right = Math.max(...boxes.map((b) => b.x + b.width))
  const bottom = Math.max(...boxes.map((b) => b.y + b.height))
  measured[keyOf(step, locale, name)] = {
    type: 'box',
    x: Math.round(left - padding),
    y: Math.round(top - padding),
    width: Math.round(right - left + padding * 2),
    height: Math.round(bottom - top + padding * 2)
  }
}

/* ------------------------------------------------------------------ */
/* Bantuan sisi Open Hospital                                          */
/* ------------------------------------------------------------------ */

function ohCredentials() {
  // OH_USERNAME/OH_PASSWORD sengaja TIDAK dipakai di sini: itu akun connector
  // precia_cb (laboratories.read, opds.read, precia_integration.callback saja,
  // dipakai scripts/screenshots/oh-roundtrip-api-evidence.js), diverifikasi
  // lewat JWT-nya TIDAK punya patients.read/patients.create/laboratories.access
  // sama sekali, jadi tidak bisa membuka satu pun layar klinisi di bawah ini.
  // OH_CLINICIAN_USERNAME/PASSWORD adalah akun docs terpisah (grup "doctor",
  // patients.access/read/create/update + laboratories.access/read/create +
  // opds.access/read/create) yang dibuat khusus untuk langkah 03/04/05/07.
  const user = process.env.OH_CLINICIAN_USERNAME
  const password = process.env.OH_CLINICIAN_PASSWORD
  if (!user || !password) {
    throw new Error(
      'Env OH_CLINICIAN_USERNAME dan OH_CLINICIAN_PASSWORD wajib diisi saat menjalankan spec Open Hospital.'
    )
  }
  return { user, password }
}

/** Login sekali di /login. Sesi disimpan Open Hospital di sessionStorage
 * (lihat libraries/authUtils/getAuthenticationFromSession.ts), jadi
 * navigasi page.goto() berikutnya ke rute lain TIDAK memutus sesi selama
 * masih dalam context/tab yang sama. */
async function ohLogin(page) {
  const { user, password } = ohCredentials()
  await page.goto(OPENHOSPITAL_LOGIN, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#username', { timeout: 30000 })
  await page.fill('#username', user)
  await page.fill('#password', password)
  await page.click('[data-cy="login-panel"] button[type="submit"]')
  // DIVERIFIKASI: login sukses berpindah ke /patients, tapi header pasca-login
  // tidak memakai class .appHeader__nav__item di mana pun (dicek lewat
  // screenshot sungguhan) - itu tebakan lama yang salah dan membuat setiap
  // langkah yang login (03, 04, 05, 07) macet 30 detik lalu gagal. Menunggu
  // navigasi keluar dari /login, sama seperti pola scripts/screenshots/lib/auth.js
  // di sisi PRECIA, jauh lebih tahan banting daripada menebak nama class.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 })
  await page.waitForTimeout(1500)
}

/** Cari pasien SITI RAHMAWATI lewat /patients/search dan buka detailnya.
 * Dipakai untuk step 04/05/07 yang butuh pasien yang sudah punya riwayat
 * laboratorium tersimpan, bukan pasien baru. */
async function openExistingPatient(page) {
  await page.goto(`${OPENHOSPITAL_URL}/patients/search`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-cy="search-patient-panel"]', { timeout: 20000 })
  await page.fill('#firstName', PATIENT_FIRST_NAME)
  await page.click('[data-cy="search-patient-panel"] button[type="submit"]')
  await page.waitForSelector('[data-cy="patient-search-item"]', { timeout: 20000 })
  await page.waitForTimeout(500)
  await page.click('[data-cy="patient-search-item"]')
  // PERLU VERIFIKASI: selector tepat submit tombol pencarian; TextField MUI
  // di form ini tidak memakai data-cy, hanya type="submit" di dalam form
  // bertanda data-cy="search-patient-panel".
  await page.waitForSelector('[data-cy="patient-details"]', { timeout: 20000 })
  await page.waitForTimeout(1000)
}

/** Dari halaman detail pasien, buka bagian Laboratory di menu kiri.
 * DIVERIFIKASI: [data-testid="ColorizeIcon"] tidak pernah ada di build ini
 * sama sekali - dicek langsung, seluruh halaman nol elemen data-testid,
 * bukan cuma pada kasus ini. OutPatientDashboardMenu.tsx (sumber ikon ini)
 * memang memakai <Colorize> dari @mui/icons-material tanpa data-testid
 * eksplisit, dan versi MUI di build ini tidak menyuntikkan data-testid
 * otomatis. Teks menu "Laboratory" (tidak dilokalkan lewat locale PRECIA,
 * Open Hospital punya bahasa sendiri) jauh lebih tahan banting di sini. */
async function openLaboratorySection(page) {
  await page.click(
    '[data-cy="patient-details-main-menu"] .patientDetails__main_menu__item:has-text("Laboratory")'
  )
  // DIVERIFIKASI ULANG 2026-08-27: class pembungkus form permintaan exam pada
  // build yang sedang berjalan adalah .patientExamRequestForm, bukan
  // .patientExamForm seperti ditulis sebelumnya di berkas ini (dicek langsung
  // lewat HTML halaman sungguhan). .patientExamForm tidak pernah ada di DOM,
  // membuat langkah 04/05 macet 20 detik lalu gagal.
  await page.waitForSelector('.patientExamRequestForm', { timeout: 20000 })
  await page.waitForTimeout(1500)
}

module.exports = [
  /* ---------------------------------------------------------------- */
  /* Sisi PRECIA: pengaturan koneksi                                   */
  /* ---------------------------------------------------------------- */
  {
    id: 'integrasi-simrs__openhospital__01-pengaturan-koneksi',
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

  /* ---------------------------------------------------------------- */
  /* Sisi Open Hospital: klinisi membuat order                         */
  /* ---------------------------------------------------------------- */
  {
    id: 'integrasi-simrs__openhospital__02-halaman-masuk',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '02-halaman-masuk',
    route: OPENHOSPITAL_LOGIN,
    locales: ['id'],
    preActions: async (page, { locale }) => {
      await page.waitForSelector('#username', { timeout: 30000 })
      await page.waitForTimeout(1000)
      await measure(page, '02', locale, 'username', page.locator('#username'))
      await measure(page, '02', locale, 'password', page.locator('#password'))
      await measure(
        page,
        '02',
        locale,
        'login-button',
        page.locator('[data-cy="login-panel"] button[type="submit"]')
      )
    },
    annotate: ({ locale }) => annotationsFor('02', locale, ['username', 'password', 'login-button'])
  },
  {
    id: 'integrasi-simrs__openhospital__03-formulir-pasien-baru',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '03-formulir-pasien-baru',
    route: OPENHOSPITAL_LOGIN,
    locales: ['id'],
    preActions: async (page, { locale }) => {
      await ohLogin(page)
      await page.goto(`${OPENHOSPITAL_URL}/patients/new`, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('[data-cy="patient-data-form"]', { timeout: 20000 })
      await page.fill('#firstName', PATIENT_FIRST_NAME)
      await page.fill('#secondName', PATIENT_SECOND_NAME)
      // PERLU VERIFIKASI: id pasti untuk Sex/Birth Date/Address/City/
      // Telephone; field ini dilewati karena tidak wajib untuk anotasi.
      await page.fill('#note', 'Keluhan nyeri dada saat aktivitas, dirujuk untuk pemeriksaan EKG.')
      await page.waitForTimeout(800)
      // TIDAK menekan SUBMIT, lihat catatan di kepala berkas.
      await measure(page, '03', locale, 'firstName', page.locator('#firstName'))
      await measure(page, '03', locale, 'secondName', page.locator('#secondName'))
      await measure(
        page,
        '03',
        locale,
        'submit',
        page.locator('[data-cy="patient-data-submit-button"]')
      )
    },
    annotate: ({ locale }) => annotationsFor('03', locale, ['firstName', 'secondName', 'submit'])
  },
  {
    id: 'integrasi-simrs__openhospital__04-pilih-pemeriksaan',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '04-pilih-pemeriksaan',
    route: OPENHOSPITAL_LOGIN,
    locales: ['id'],
    preActions: async (page, { locale }) => {
      await ohLogin(page)
      await openExistingPatient(page)
      await openLaboratorySection(page)
      await page.fill('#exam', EXAM_NAME)
      await page.waitForTimeout(1500)
      // PERLU VERIFIKASI: kelas opsi popper MUI Autocomplete pada versi
      // paket yang ter-deploy. Default MUI: li.MuiAutocomplete-option.
      await page.click(`li.MuiAutocomplete-option:has-text("${EXAM_NAME}")`)
      await page.waitForTimeout(800)
      // TIDAK menekan REQUEST/submit, lihat catatan di kepala berkas.
      await measure(page, '04', locale, 'exam', page.locator('#exam'))
      await measure(
        page,
        '04',
        locale,
        'submit',
        page.locator('.patientExamRequestForm .submit_button button[type="submit"]')
      )
    },
    annotate: ({ locale }) => annotationsFor('04', locale, ['exam', 'submit'])
  },
  {
    id: 'integrasi-simrs__openhospital__05-permintaan-tersimpan',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '05-permintaan-tersimpan',
    route: OPENHOSPITAL_LOGIN,
    locales: ['id'],
    preActions: async (page, { locale }) => {
      await ohLogin(page)
      await openExistingPatient(page)
      await openLaboratorySection(page)
      // Memotret baris yang SUDAH tersimpan dari permintaan sebelumnya
      // (status DRAFT), bukan hasil aksi spec ini.
      await page.waitForSelector('.patientExamsTable table tbody tr', { timeout: 20000 })
      await page.waitForTimeout(1000)
      await measure(
        page,
        '05',
        locale,
        'row',
        page.locator('.patientExamsTable table tbody tr').first(),
        4
      )
    },
    annotate: ({ locale }) => annotationsFor('05', locale, ['row'])
  },

  /* ---------------------------------------------------------------- */
  /* Sisi PRECIA: kasus muncul di unit yang benar                      */
  /* ---------------------------------------------------------------- */
  {
    id: 'integrasi-simrs__openhospital__06-detail-kasus-precia',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '06-detail-kasus-precia',
    route: '/clinical',
    role: 'OPENHOSPITAL',
    preActions: async (page, { locale }) => {
      // Unit dan kode transaksi tidak di-hardcode: masuk ke worklist unit
      // Kardiologi lalu buka kasus PALING BARU, supaya spec ini tetap benar
      // walau ID transaksi berubah di antara proof run.
      await page.waitForTimeout(2500)
      // PERLU VERIFIKASI: nama unit "Kardiologi" adalah data organisasi, tidak
      // diterjemahkan oleh locale PRECIA, sama seperti dipakai pada
      // integrasi-simrs__openemr.config.js langkah 13 ("Radiologi").
      await page.getByText('Kardiologi', { exact: true }).first().click()
      await page.waitForSelector('table tbody tr', { timeout: 20000 })
      await page.waitForTimeout(1500)
      await page.locator('table tbody tr').first().click()
      await page.waitForSelector('h1', { timeout: 20000 })
      await page.waitForTimeout(2000)
      await measure(page, '06', locale, 'code', page.locator('h1').first())
      await measure(
        page,
        '06',
        locale,
        'notes',
        page.locator('pre, p', { hasText: 'openhospital' }).last()
      )
      await measure(page, '06', locale, 'unit', page.locator('text=Kardiologi').last())
    },
    annotate: ({ locale }) => annotationsFor('06', locale, ['code', 'notes', 'unit'])
  },

  /* ---------------------------------------------------------------- */
  /* Sisi Open Hospital: hasil AI kembali ke rekam medis, dilihat dari  */
  /* detail satu pemeriksaan (panel di LaboratoryDetails.tsx).          */
  /* MASIH MENUNGGU PEMBUKTIAN, bukan lagi karena belum ada kasus       */
  /* published (laboratory-500001 dan -500002 keduanya published), tapi */
  /* karena tombol "view" bergambar kaca pembesar ([data-cy=            */
  /* "table-view-action"]) yang membuka panel ini nyatanya tidak pernah */
  /* dirender sama sekali untuk permintaan CD.01 milik SITI/RUDI --     */
  /* diverifikasi langsung 2 September 2026 lewat innerHTML tabel       */
  /* (VIEW_ACTION_COUNT selalu 0). Dugaan: tombol itu hanya muncul       */
  /* untuk exam yang sudah dieksekusi dengan baris hasil sungguhan di   */
  /* Open Hospital sendiri (laboratoryRowList terisi), sedangkan kedua  */
  /* kasus uji ini murni permintaan yang diambil konektor tanpa pernah  */
  /* dieksekusi di sisi Open Hospital. Tab baru langkah 12 di bawah     */
  /* (Hasil AI PRECIA pada Patient Dashboard) tidak punya batasan ini   */
  /* karena tidak bergantung pada tombol view tersebut sama sekali.     */
  /* ---------------------------------------------------------------- */
  {
    id: 'integrasi-simrs__openhospital__07-hasil-ai-di-openhospital--PENDING-PROOF',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '07-hasil-ai-menunggu-pembuktian',
    route: OPENHOSPITAL_LOGIN,
    locales: ['id'],
    preActions: async (page, { locale }) => {
      await ohLogin(page)
      await page.goto(`${OPENHOSPITAL_URL}/laboratory`, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('.exams__table', { timeout: 20000 })
      await page.waitForTimeout(1500)
      // Baris permintaan CD.01 milik SITI RAHMAWATI. PERLU VERIFIKASI:
      // urutan/isi kolom tabel ini tidak diketahui tanpa membuka halaman;
      // kalau lebih dari satu baris cocok, ganti .first() dengan baris yang
      // memang berisi hasil AI.
      await page.locator('[data-cy="table-view-action"]').first().click()
      await page.waitForSelector('.labDetails__content__wrapper', { timeout: 20000 })
      await page.waitForTimeout(1500)

      const panel = page.locator('.labDetails__content__wrapper:has([data-testid="SmartToyIcon"])')
      const panelCount = await panel.count()
      if (panelCount === 0) {
        throw new Error(
          'Panel "PRECIA AI Result" tidak tampil pada kasus ini. Ini BUKAN kegagalan spec: ' +
            'artinya belum ada kasus di openhospital-dev yang sudah melewati validasi AI sampai ' +
            'published untuk pasien/exam ini, ATAU tombol view tidak dirender untuk exam yang belum ' +
            'dieksekusi di Open Hospital sendiri (lihat catatan 2 September 2026 di atas). Jangan ' +
            'dipaksa lulus dengan mengganti pasien/exam tanpa memverifikasi datanya nyata.'
        )
      }
      await measure(page, '07', locale, 'panel', panel)
      await measure(page, '07', locale, 'result-data', page.locator('.labDetails__content__precia_result_data'))
    },
    annotate: ({ locale }) => annotationsFor('07', locale, ['panel', 'result-data'])
  },

  /* ---------------------------------------------------------------- */
  /* Sisi Open Hospital: tab "Hasil AI PRECIA" pada Patient Dashboard.  */
  /*                                                                    */
  /* Berbeda dari langkah 07 (detail satu pemeriksaan), tab ini baru,   */
  /* berdiri sendiri di menu kiri Patient Dashboard, dan mendaftar      */
  /* SEMUA kunjungan OPD serta permintaan laboratorium pasien sekaligus */
  /* -- bukan hanya satu pemeriksaan yang sedang dibuka.                */
  /*                                                                    */
  /* DIBUKTIKAN 2 September 2026 dengan kasus BARU yang dibuat sungguhan */
  /* lewat spec ini sendiri hari itu juga: pasien RUDI HARTONO PRECIA   */
  /* PROOF (PAT_ID 2), permintaan ECG 12 Lead (LAB_ID 500002), diambil  */
  /* otomatis oleh konektor (Dibuat oleh: Open Hospital dev connector), */
  /* diproses AI, divalidasi, dan dipublikasikan sampai tersinkron balik */
  /* -- transaksi cdee8d26-ea1f-4d10-989a-0391474b248a. Data uji ini    */
  /* permanen di openhospital-dev, sama seperti laboratory-500001 di    */
  /* atas, jadi TIDAK dibuat ulang oleh spec ini.                       */
  /* ---------------------------------------------------------------- */
  {
    id: 'integrasi-simrs__openhospital__12-tab-hasil-ai-precia',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '12-tab-hasil-ai-precia',
    route: OPENHOSPITAL_LOGIN,
    locales: ['id'],
    fullPage: true,
    preActions: async (page, { locale }) => {
      await ohLogin(page)
      await page.goto(`${OPENHOSPITAL_URL}/patients/details/2/precia-ai-results`, {
        waitUntil: 'domcontentloaded'
      })
      await page.waitForSelector('[data-cy="patient-precia-ai-results"]', { timeout: 20000 })
      await page.waitForTimeout(2000)

      const publishedCard = page.locator('[data-precia-case="laboratory:500002"]')
      const cardCount = await publishedCard.count()
      if (cardCount === 0) {
        throw new Error(
          'Kartu kasus laboratory:500002 tidak ditemukan pada tab Hasil AI PRECIA. Ini BUKAN ' +
            'kegagalan spec: artinya data uji permanen yang dipakai langkah ini sudah berubah di ' +
            'openhospital-dev. Perbarui referensi PAT_ID/LAB_ID di berkas ini, jangan dipaksa lulus.'
        )
      }
      await measure(page, '12', locale, 'menu', page.locator('[data-cy="patient-menu-precia-ai-results"]'))
      await measureUnion(page, '12', locale, 'card', [publishedCard])
    },
    annotate: ({ locale }) => annotationsFor('12', locale, ['menu', 'card'])
  },

  /* ---------------------------------------------------------------- */
  /* Sisi PRECIA: hasil AI, validasi, dan publikasi untuk kasus         */
  /* laboratory-500001 (sudah dijalankan sungguhan sampai tuntas,       */
  /* lihat komentar di PROVEN_TRANSACTION_ID di atas).                  */
  /* ---------------------------------------------------------------- */
  {
    id: 'integrasi-simrs__openhospital__08-hasil-ai',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '08-hasil-ai',
    route: `/clinical/transactions/${PROVEN_TRANSACTION_ID}`,
    role: 'OPENHOSPITAL',
    fullPage: true,
    preActions: async (page, { locale }) => {
      await page.waitForSelector('h1', { timeout: 20000 })
      await page.waitForTimeout(1500)
      // Tab "ECG EF Screening" adalah <button>, bukan elemen [role="tab"];
      // badge hijau kecil dengan teks yang sama di kartu "AI Modules" kiri
      // adalah elemen text=ECG EF Screening YANG PERTAMA, jadi harus dipilih
      // lewat locator('button') supaya tidak salah klik badge itu.
      await page.locator('button', { hasText: 'ECG EF Screening' }).first().click()
      const t = LABELS[locale]
      await page.waitForSelector(`text=${t.confidenceScore}`, { timeout: 20000 })
      await page.waitForTimeout(1000)
      await measureUnion(page, '08', locale, 'result', [
        page.locator(`text=${t.confidenceScore}`).first(),
        page.locator(`text=${t.classification}`).first(),
        page.locator('text=Abnormal').first()
      ])
    },
    annotate: ({ locale }) => annotationsFor('08', locale, ['result'])
  },
  {
    id: 'integrasi-simrs__openhospital__09-validasi-dokter',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '09-validasi-dokter',
    route: '/validation',
    role: 'OPENHOSPITAL_VALIDATOR',
    preActions: async (page, { locale }) => {
      const t = LABELS[locale]
      await page.waitForTimeout(2500)
      await page.locator(`text=${PROVEN_CASE_CODE}`).first().click()
      await page.waitForSelector(`text=${t.clinicalNotes}`, { timeout: 20000 })
      await page.waitForTimeout(1000)
      // Kasus ini sudah dipublikasikan (lihat catatan di PROVEN_TRANSACTION_ID),
      // sehingga halaman ini menampilkan Decision dan Status yang sudah
      // tercatat, bukan formulir kosong menunggu diisi. Langkah 9 menyorot
      // Decision dan catatan klinis; langkah 10 menyorot Status dan waktu
      // publikasi pada halaman yang sama.
      //
      // getByText(exact:true), BUKAN locator('text=...'): worklist di kiri
      // punya header "Keputusan tercatat (3)" / "Recorded decisions (3)"
      // yang mengandung substring label yang sama, dan text= locator akan
      // menangkap elemen pertama itu (di kiri, salah), bukan label "Keputusan"
      // sungguhan pada panel Detail Validasi di kanan.
      await measureUnion(page, '09', locale, 'decision', [
        page.getByText(t.decision, { exact: true }).first(),
        page.getByText(t.decisionAccepted, { exact: true }).first(),
        page.getByText(t.clinicalNotes, { exact: true }).first()
      ])
    },
    annotate: ({ locale }) => annotationsFor('09', locale, ['decision'])
  },
  {
    id: 'integrasi-simrs__openhospital__10-validasi-dipublikasikan',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '10-validasi-dipublikasikan',
    route: '/validation',
    role: 'OPENHOSPITAL_VALIDATOR',
    preActions: async (page, { locale }) => {
      const t = LABELS[locale]
      await page.waitForTimeout(2500)
      await page.locator(`text=${PROVEN_CASE_CODE}`).first().click()
      await page.waitForSelector(`text=${t.publishedAt}`, { timeout: 20000 })
      await page.waitForTimeout(1000)
      // .last() untuk lencana status: worklist di kiri juga menampilkan
      // lencana "Dipublikasikan"/"Published" pada tiap baris (DOM-nya
      // muncul lebih dulu), panel Detail Validasi di kanan dirender
      // setelahnya, jadi elemen yang benar adalah kemunculan TERAKHIR.
      await measureUnion(page, '10', locale, 'published', [
        page.getByText(t.status, { exact: true }).first(),
        page.locator('span', { hasText: t.statusPublished }).last(),
        page.getByText(t.publishedAt, { exact: true }).first()
      ])
    },
    annotate: ({ locale }) => annotationsFor('10', locale, ['published'])
  }
]
