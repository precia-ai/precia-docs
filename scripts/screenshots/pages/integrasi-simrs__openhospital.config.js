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
 *      integrasi-simrs__khanza-alur-kasus.config.js. Kredensial dibaca dari
 *      env OH_USERNAME/OH_PASSWORD, sama dengan akun yang sudah disediakan
 *      di .env.local.example untuk scripts/screenshots/oh-roundtrip-api-evidence.js;
 *      dipakai ulang di sini untuk login UI karena akun itu sudah punya izin
 *      precia_integration.callback dan sudah terverifikasi ada. PERLU
 *      VERIFIKASI: akun itu juga punya izin membaca/menulis modul Patients
 *      dan Laboratory yang dipakai langkah 02-05 dan 07 di bawah.
 *   2. Halaman worklist dan detail transaksi PRECIA, peran demo
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

/* ------------------------------------------------------------------ */
/* Bantuan sisi Open Hospital                                          */
/* ------------------------------------------------------------------ */

function ohCredentials() {
  const user = process.env.OH_USERNAME
  const password = process.env.OH_PASSWORD
  if (!user || !password) {
    throw new Error(
      'Env OH_USERNAME dan OH_PASSWORD wajib diisi saat menjalankan spec Open Hospital.'
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
  // PERLU VERIFIKASI: seberapa lama transisi ke /patients setelah login.
  await page.waitForSelector('.appHeader__nav__item', { timeout: 30000 })
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
 * Ikon Colorize dipakai sebagai penanda karena teks menu tidak dilokalkan
 * lewat locale PRECIA (Open Hospital punya bahasa sendiri), tapi tetap
 * lebih aman dipakai lewat data-testid ikon MUI daripada teks. */
async function openLaboratorySection(page) {
  await page.click(
    '[data-cy="patient-details-main-menu"] .patientDetails__main_menu__item:has([data-testid="ColorizeIcon"])'
  )
  await page.waitForSelector('.patientExamForm', { timeout: 20000 })
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
    role: 'OPENHOSPITAL',
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
        page.locator('.patientExamForm .submit_button button[type="submit"]')
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
  /* Sisi Open Hospital: hasil AI kembali ke rekam medis.               */
  /* MENUNGGU PEMBUKTIAN — lihat catatan di kepala berkas. Selector di  */
  /* bawah berasal dari kode UI sungguhan (LaboratoryDetails.tsx), tapi */
  /* belum pernah dibuktikan terisi oleh kasus nyata yang tuntas sampai */
  /* publish. Jangan jalankan langkah ini sebagai bukti round trip      */
  /* sebelum ada kasus yang benar-benar sampai status published dan     */
  /* callback ai-results sudah tercatat sampai ke panel ini.            */
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
            'published untuk pasien/exam ini. Jalankan ulang setelah ada kasus semacam itu, jangan ' +
            'dipaksa lulus dengan mengganti pasien/exam tanpa memverifikasi datanya nyata.'
        )
      }
      await measure(page, '07', locale, 'panel', panel)
      await measure(page, '07', locale, 'result-data', page.locator('.labDetails__content__precia_result_data'))
    },
    annotate: ({ locale }) => annotationsFor('07', locale, ['panel', 'result-data'])
  }
]
