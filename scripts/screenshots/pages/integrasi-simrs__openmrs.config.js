/**
 * Alur integrasi OpenMRS 3 (O3 Reference Application) ke PRECIA.
 *
 * Spec 01 sampai 12 memotret OpenMRS 3 di https://openmrs-dev.precia.site,
 * spec 13 sampai 15 memotret PRECIA di https://app-dev.precia.site.
 *
 * Catatan teknis:
 * - Spec OpenMRS TIDAK memakai field `role`. Field itu hanya untuk login
 *   PRECIA. Login OpenMRS dikerjakan di preActions memakai env
 *   OPENMRS_DEMO_USERNAME / OPENMRS_DEMO_PASSWORD dari .env.local.
 * - Antarmuka OpenMRS 3 tidak mengikuti locale PRECIA, jadi tangkapan layar
 *   untuk locale id dan en identik isinya dan hanya berbeda jalur berkas.
 *   Karena itu selector berbasis teks aman dipakai di sisi OpenMRS.
 * - Spec PRECIA memakai role OPENMRS3 (env PRECIA_DEMO_OPENMRS3_EMAIL /
 *   PRECIA_DEMO_OPENMRS3_PASSWORD), akun peninjau dokumentasi di organisasi
 *   RS Uji Coba OpenMRS 3. Koordinat anotasi PRECIA sudah diukur pada kedua
 *   locale dan hasilnya identik, jadi satu set koordinat cukup.
 * - Alur ini sengaja BERHENTI sebelum tombol "Sign and close" ditekan supaya
 *   setiap kali dokumentasi digenerate ulang tidak lahir order baru di data
 *   demo. Spec 12 memotret tabel Orders yang sudah berisi order hasil uji
 *   coba sebelumnya.
 *
 * ---------------------------------------------------------------------
 * SPEC 16-18 DITAMBAHKAN 2026-08-23, BELUM PERNAH DIJALANKAN LEWAT run.js,
 * TAPI SUDAH DICOCOKKAN TERHADAP BUKTI NYATA - BACA DULU
 * ---------------------------------------------------------------------
 * app-dev.precia.site sempat berkedip hari ini (lihat catatan yang sama di
 * integrasi-simrs__care.config.js), jadi spec ini belum pernah benar-benar
 * dijalankan lewat run.js. TAPI selector dan koordinat di bawah BUKAN
 * tebakan buta: diukur dari tangkapan layar nyata hasil rehearsal manual
 * pada 2026-08-22 malam, tersimpan di:
 *   public/screenshots/_evidence/dev/openmrs3-09-precia-ai-result.png
 *   public/screenshots/_evidence/dev/openmrs3-11-precia-validation-queue.png
 *   public/screenshots/_evidence/dev/openmrs3-14-precia-validation-published.png
 *   public/screenshots/_evidence/dev/openmrs3-18-openmrs-results-precia-ai-value.png
 * Gambar-gambar itu 1600x1000px, sedangkan viewport default file ini
 * 1440x900 (rasio ×0.9 tepat pada kedua sumbu). Koordinat `annotate` di
 * bawah adalah hasil pengukuran-dengan-mata pada gambar 1600x1000 lalu
 * dikali 0.9, BUKAN pengukuran piksel presisi dan BUKAN dijamin sama
 * dengan capture baru bila tata letak berbeda pada lebar lain. Tetap wajib
 * dikoreksi terhadap PNG mentah pertama, tapi risikonya jauh lebih rendah
 * dari spec CARE 10-15 yang benar-benar buta.
 *
 * BEDA dengan spec 13-15 di atas, spec 16-18 TIDAK menunggu kasus apa pun
 * tiba. precia-tracker mengonfirmasi lewat query DB langsung pada
 * 2026-08-23 (~12:40 waktu lokal) bahwa dua transaksi asal OpenMRS 3 di
 * app-dev SUDAH mencapai status doctor_reviewed dengan baris SimrsDelivery
 * berstatus succeeded:
 *   - eb0d127b-0917-4dc8-8289-61418f3fa2e1 (delivery sukses 2026-08-22
 *     15:49:47 UTC) - DIKONFIRMASI lewat bukti visual di atas: pasien Mary
 *     Smith, MRN 10000F1, unit Kardiologi, modul AI "ECG Mitral Valve
 *     Screening", validasi Accepted/Published, AI result Confidence 86.0%.
 *     Dipakai di bawah sebagai ROUND_TRIP_TRANSACTION_ID justru karena ini
 *     yang punya bukti visual, bukan yang lebih dulu ditemukan di DB.
 *   - 53f56457-c07c-4fcb-9d9d-21ea52a61f6a (delivery sukses 2026-08-22
 *     16:14:56 UTC) - hanya dikonfirmasi lewat DB, belum ada bukti visual,
 *     jadi cadangan saja. Bila dipakai, ROUND_TRIP_PATIENT_NAME/MRN di
 *     bawah perlu diverifikasi ulang, kemungkinan besar pasien BEDA.
 * KOREKSI 2026-08-27: kedua UUID di atas TERNYATA kolom `code` transaksi
 * (referensi order OpenMRS 3 sendiri), BUKAN `id` transaksi PRECIA -
 * keduanya sama-sama berformat UUID polos tanpa prefiks (beda dari CARE
 * yang codenya berprefiks "CARE-"), jadi asumsi awal "code sudah pasti id"
 * di atas keliru. Dibuktikan lewat GET /api/clinical/transactions/{code}/
 * yang membalas 404 untuk kedua UUID itu ketika route diminta langsung.
 * `id` PRECIA yang benar, dikonfirmasi lewat
 * GET /api/clinical/transactions/?source=simrs&page_size=50 dengan akun
 * PRECIA_DEMO_OPENMRS3_EMAIL:
 *   - code eb0d127b-0917-4dc8-8289-61418f3fa2e1 -> id
 *     0a564fef-05ce-4809-94dc-977f6a679cdb (dipakai di bawah)
 *   - code 53f56457-c07c-4fcb-9d9d-21ea52a61f6a -> id
 *     95e35460-47d7-4f1a-8755-6f8344cfd459 (cadangan)
 * Kedua transaksi ternyata pasien dan modul yang SAMA (Mary Smith, MRN
 * 10000F1, Kardiologi, ECG Mitral Valve Screening), bukan pasien berbeda
 * seperti dugaan semula - jadi ROUND_TRIP_PATIENT_NAME/MRN di bawah valid
 * untuk keduanya, cadangan tidak perlu diverifikasi ulang lagi.
 *
 * KARENA kasusnya sudah selesai (bukan sedang menunggu divalidasi), spec
 * 17 TIDAK melakukan aksi validasi apa pun (beda dari pola
 * integrasi-simrs__openhospital-bukti-round-trip.config.js yang menekan
 * tombol Record decision/Publish validation secara langsung). Spec 17
 * hanya memotret status yang sudah ada, mengikuti pola
 * integrasi-simrs__khanza-bukti-round-trip.config.js.
 *
 * Status dan hasil validasi TIDAK tampil pada halaman detail transaksi
 * (route spec 15/16). Keduanya tampil pada halaman terpisah, route
 * `/validation` ("Clinical Validation"), persis seperti dipakai
 * integrasi-simrs__openhospital-bukti-round-trip.config.js. Kartu kanan
 * "Validation Detail" pada halaman itu sekaligus menampilkan HASIL AI
 * (Confidence + disclaimer) DAN KEPUTUSAN dokter (Decision/Status) dalam
 * satu tampilan, jadi spec 17 memotret keduanya sekaligus dengan dua kotak
 * anotasi terpisah, bukan dua spec terpisah.
 *
 * TEMUAN 2026-08-23 (kredensial), DIKONFIRMASI SELESAI 2026-08-27: akun
 * yang tampil pada bukti /validation (openmrs3-11 dan openmrs3-14)
 * berprofil "Dokter Validator OpenMRS3", beda dari profil "Perawat OpenMRS
 * 3" pada bukti openmrs3-09, sehingga sempat diduga spec 17 perlu
 * kredensial peran ketiga (mirip kode peran CVL) selain
 * PRECIA_DEMO_OPENMRS3_EMAIL/PASSWORD yang dipakai spec 13-16. Probe
 * langsung 2026-08-27 dengan akun PRECIA_DEMO_OPENMRS3_EMAIL yang ADA
 * (peran CAD) menunjukkan akun ini BISA membuka /validation dan melihat
 * daftar "RECORDED DECISIONS" termasuk transaksi round trip ini berstatus
 * Published - berbeda profil rupanya tidak menghalangi akses BACA ke
 * keputusan yang sudah dipublikasikan, hanya aksi create_decision/
 * publish_result (tidak dipakai spec 17, lihat catatan di bawah) yang
 * kemungkinan masih terbatas pada peran validator. Kredensial CVL
 * terpisah TIDAK diperlukan untuk spec 17 sebagaimana ditulis sekarang.
 *
 * Spec 18 (sisi OpenMRS) memakai ROUND_TRIP_PATIENT_NAME yang SUDAH
 * dikonfirmasi dari bukti visual di atas ("Mary Smith"), bukan hasil baca
 * dinamis dari halaman PRECIA - jauh lebih murah dan lebih tahan daripada
 * menebak selector kartu identitas. Tab yang difoto adalah "Results",
 * dikonfirmasi ada di navigasi kiri OpenMRS pada openmrs3-18. Hasilnya
 * tampil langsung pada kartu teratas panel Results begitu tab dibuka
 * (kartu "PRECIA AI ECG Mitral Regurgitation Assessment" dengan nilai
 * "Control"), tanpa perlu mencentang pohon Tests di kiri.
 * ---------------------------------------------------------------------
 */
const O3 = process.env.OPENMRS_BASE_URL || 'https://openmrs-dev.precia.site'
const O3_LOGIN = `${O3}/openmrs/spa/login`
const PATIENT_UUID = '5b338deb-f8aa-4631-b464-c9763fcaca56'
const PATIENT_QUERY = 'Betty%20Williams'
const UNIT_UUID = '095dd538-c619-4d28-821e-dd54cd475c36'
const TRANSACTION_UUID = '2eee5073-7854-4254-8823-c3555b36f7c1'

// Transaksi round trip yang sudah terbukti selesai (doctor_reviewed, delivery
// succeeded) DAN dikonfirmasi lewat bukti visual 2026-08-22. Lihat catatan
// SPEC 16-18 di atas untuk kenapa ini yang dipilih sebagai utama, bukan yang
// lebih dulu ditemukan di DB.
const ROUND_TRIP_TRANSACTION_ID = '0a564fef-05ce-4809-94dc-977f6a679cdb'
const ROUND_TRIP_TRANSACTION_ID_FALLBACK = '95e35460-47d7-4f1a-8755-6f8344cfd459'
// Worklist Validasi PRECIA menampilkan kolom `code` transaksi (referensi
// order OpenMRS 3), BUKAN `id` di atas - dikonfirmasi lewat probe langsung
// 2026-08-27 terhadap /validation, baris "RECORDED DECISIONS" menampilkan
// teks eb0d127b-... apa adanya, bukan 0a564fef-.... Dipakai khusus untuk
// pencarian teks pada langkah 17, terpisah dari id rute di atas.
const ROUND_TRIP_TRANSACTION_CODE = 'eb0d127b-0917-4dc8-8289-61418f3fa2e1'
// Dikonfirmasi dari public/screenshots/_evidence/dev/openmrs3-09-precia-ai-result.png
// untuk ROUND_TRIP_TRANSACTION_ID di atas. Bila dipaksa memakai id cadangan,
// dua nilai ini BELUM diverifikasi dan kemungkinan besar salah.
const ROUND_TRIP_PATIENT_NAME = 'Mary Smith'
const ROUND_TRIP_PATIENT_MRN = '10000F1'

const REFERENCE_NUMBER = 'PRECIA-DEMO-261444'
const INSTRUCTIONS =
  'Permintaan analisis AI PRECIA untuk estimasi fraksi ejeksi ventrikel kiri dari rekaman EKG.'

/** Isi username, lanjut ke layar kata sandi. */
async function o3FillUsername(page) {
  await page.waitForSelector('#username', { timeout: 45000 })
  await page.fill('#username', process.env.OPENMRS_DEMO_USERNAME)
}

/** Login penuh sampai layar pemilihan lokasi terbuka. */
async function o3LoginUntilLocation(page) {
  await o3FillUsername(page)
  await page.click('button[type="submit"]')
  await page.waitForSelector('#password', { timeout: 45000 })
  await page.fill('#password', process.env.OPENMRS_DEMO_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/login\/location/, { timeout: 45000 })
  await page.waitForTimeout(2500)
}

/** Login penuh, pilih lokasi Outpatient Clinic, tunggu aplikasi siap. */
async function o3Login(page) {
  await o3LoginUntilLocation(page)
  await page.getByText('Outpatient Clinic', { exact: true }).first().click()
  await page.waitForTimeout(600)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !/\/login/.test(url.pathname), { timeout: 60000 })
  await page.waitForTimeout(6000)
}

/** Buka tab Orders pada rekam pasien demo. */
async function o3OpenOrdersTab(page) {
  await page.goto(`${O3}/openmrs/spa/patient/${PATIENT_UUID}/chart/orders`, {
    waitUntil: 'networkidle'
  })
  await page.waitForTimeout(10000)
}

function addButtons(page) {
  return page.locator('button, a').filter({ hasText: /^Add$/ })
}

/** Klik Add pada tabel Orders sehingga panel Order basket terbuka. */
async function o3OpenBasket(page) {
  const before = await addButtons(page).all()
  await before[before.length - 1].click()
  for (let i = 0; i < 30; i += 1) {
    if ((await addButtons(page).count()) >= 3) break
    await page.waitForTimeout(1000)
  }
  await page.waitForTimeout(2500)
}

/** Klik Add pada baris Lab orders di dalam Order basket. */
async function o3OpenLabOrderPanel(page) {
  const candidates = await addButtons(page).all()
  let target = null
  for (const candidate of candidates) {
    const box = await candidate.boundingBox()
    if (box && box.x > 1100 && box.y > 150 && box.y < 300) target = candidate
  }
  await target.click()
  await page.waitForTimeout(5000)
}

/** Ketik kata kunci PRECIA pada pencarian jenis pemeriksaan. */
async function o3SearchPreciaTest(page) {
  await page.getByPlaceholder('Search for a test type').fill('PRECIA')
  await page.waitForTimeout(5000)
}

/** Buka formulir order dan isi nomor rujukan serta instruksi tambahan. */
async function o3FillOrderForm(page) {
  await page.getByRole('button', { name: /Order form/ }).first().click()
  await page.waitForSelector('#labReferenceNumberInput', { timeout: 45000 })
  await page.waitForTimeout(2500)
  await page.fill('#labReferenceNumberInput', REFERENCE_NUMBER)
  await page.fill('#additionalInstructionsInput', INSTRUCTIONS)
  await page.waitForTimeout(1200)
}

/**
 * Buka menu Validation di PRECIA dan klik baris kasus round trip. Dicari
 * lewat teks UUID transaksi, yang tampil apa adanya pada baris worklist
 * (dikonfirmasi pada openmrs3-11-precia-validation-queue.png dan
 * openmrs3-14-precia-validation-published.png) sehingga aman dipakai di
 * kedua locale, tidak seperti mencari lewat nama pasien atau label status
 * yang mungkin diterjemahkan.
 */
async function openValidationDetailFor(page, transactionId) {
  await page.waitForSelector('text=Clinical Validation, text=Validasi Klinis', {
    timeout: 20000
  }).catch(() => {})
  await page.waitForTimeout(1500)
  // Dikoreksi 2026-08-27: `a, div, button` cocok SEMBILAN elemen bersarang
  // untuk baris yang sama (dikonfirmasi lewat probe langsung), dan
  // `.first()` mengambil DIV pembungkus paling luar (seluruh halaman),
  // bukan baris itu sendiri - klik itu tidak melakukan apa pun, hasilnya
  // "Belum ada kasus yang dipilih" tanpa error. Baris worklist yang
  // sungguh bisa diklik adalah elemen <button>.
  await page.getByRole('button').filter({ hasText: transactionId }).first().click()
  await page.waitForTimeout(1500)
}

/**
 * Sisi OpenMRS dari spec 18: cari pasien round trip lewat nama yang SUDAH
 * dikonfirmasi (ROUND_TRIP_PATIENT_NAME, lihat catatan SPEC 16-18 di atas),
 * buka rekamnya, lalu buka tab "Results" (dikonfirmasi ada di navigasi kiri
 * pada openmrs3-18-openmrs-results-precia-ai-value.png). Hasil PRECIA AI
 * tampil langsung di kartu teratas begitu tab dibuka, tanpa perlu mencentang
 * pohon Tests di kiri.
 */
async function o3OpenResultsForRoundTripPatient(page) {
  await o3Login(page)
  await page.goto(
    `${O3}/openmrs/spa/search?query=${encodeURIComponent(ROUND_TRIP_PATIENT_NAME)}`,
    { waitUntil: 'networkidle' }
  )
  await page.waitForTimeout(6000)
  await page
    .locator('a, [role="link"]')
    .filter({ hasText: ROUND_TRIP_PATIENT_NAME })
    .first()
    .click()
  await page.waitForTimeout(6000)
  await page.getByText('Results', { exact: true }).first().click()
  await page.waitForTimeout(6000)
}

module.exports = [
  {
    id: 'integrasi-simrs__openmrs__01-masuk-openmrs',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '01-masuk-openmrs',
    route: O3_LOGIN,
    preActions: async (page) => {
      await page.waitForSelector('#username', { timeout: 45000 })
      await page.waitForTimeout(2000)
    },
    annotate: [
      { type: 'box', x: 573, y: 484, width: 296, height: 56 },
      { type: 'box', x: 573, y: 572, width: 296, height: 56 }
    ]
  },
  {
    id: 'integrasi-simrs__openmrs__02-kata-sandi',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '02-kata-sandi',
    route: O3_LOGIN,
    preActions: async (page) => {
      await o3FillUsername(page)
      await page.click('button[type="submit"]')
      await page.waitForSelector('#password', { timeout: 45000 })
      await page.waitForTimeout(2000)
    },
    annotate: [
      { type: 'box', x: 573, y: 528, width: 296, height: 56 },
      { type: 'box', x: 573, y: 616, width: 296, height: 56 }
    ]
  },
  {
    id: 'integrasi-simrs__openmrs__03-pilih-lokasi',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '03-pilih-lokasi',
    route: O3_LOGIN,
    preActions: async (page) => {
      await o3LoginUntilLocation(page)
      await page.getByText('Outpatient Clinic', { exact: true }).first().click()
      await page.waitForTimeout(1200)
    },
    annotate: [
      { type: 'box', x: 557, y: 320, width: 326, height: 48 },
      { type: 'box', x: 557, y: 771, width: 326, height: 56 }
    ]
  },
  {
    id: 'integrasi-simrs__openmrs__04-beranda',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '04-beranda',
    route: O3_LOGIN,
    preActions: async (page) => {
      await o3Login(page)
    },
    annotate: [
      { type: 'box', x: 1197, y: 2, width: 52, height: 44 },
      { type: 'arrow', from: { x: 1060, y: 150 }, to: { x: 1205, y: 52 } }
    ]
  },
  {
    id: 'integrasi-simrs__openmrs__05-cari-pasien',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '05-cari-pasien',
    route: O3_LOGIN,
    preActions: async (page) => {
      await o3Login(page)
      await page.goto(`${O3}/openmrs/spa/search?query=${PATIENT_QUERY}`, {
        waitUntil: 'networkidle'
      })
      await page.waitForTimeout(8000)
    },
    annotate: [{ type: 'box', x: 552, y: 98, width: 608, height: 148 }]
  },
  {
    id: 'integrasi-simrs__openmrs__06-rekam-pasien',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '06-rekam-pasien',
    route: O3_LOGIN,
    preActions: async (page) => {
      await o3Login(page)
      await page.goto(`${O3}/openmrs/spa/patient/${PATIENT_UUID}/chart/Patient%20Summary`, {
        waitUntil: 'networkidle'
      })
      await page.waitForTimeout(10000)
    },
    annotate: [
      { type: 'box', x: 4, y: 158, width: 247, height: 36 },
      { type: 'box', x: 268, y: 62, width: 460, height: 62 }
    ]
  },
  {
    id: 'integrasi-simrs__openmrs__07-daftar-order',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '07-daftar-order',
    route: O3_LOGIN,
    preActions: async (page) => {
      await o3Login(page)
      await o3OpenOrdersTab(page)
    },
    annotate: [{ type: 'box', x: 1281, y: 424, width: 94, height: 56 }]
  },
  {
    id: 'integrasi-simrs__openmrs__08-keranjang-order',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '08-keranjang-order',
    route: O3_LOGIN,
    preActions: async (page) => {
      await o3Login(page)
      await o3OpenOrdersTab(page)
      await o3OpenBasket(page)
    },
    annotate: [{ type: 'box', x: 1248, y: 189, width: 104, height: 44 }]
  },
  {
    id: 'integrasi-simrs__openmrs__09-cari-jenis-tes',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '09-cari-jenis-tes',
    route: O3_LOGIN,
    preActions: async (page) => {
      await o3Login(page)
      await o3OpenOrdersTab(page)
      await o3OpenBasket(page)
      await o3OpenLabOrderPanel(page)
      await o3SearchPreciaTest(page)
    },
    annotate: [
      { type: 'box', x: 969, y: 141, width: 427, height: 56 },
      { type: 'box', x: 1228, y: 275, width: 135, height: 56 }
    ]
  },
  {
    id: 'integrasi-simrs__openmrs__10-formulir-order',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '10-formulir-order',
    route: O3_LOGIN,
    preActions: async (page) => {
      await o3Login(page)
      await o3OpenOrdersTab(page)
      await o3OpenBasket(page)
      await o3OpenLabOrderPanel(page)
      await o3SearchPreciaTest(page)
      await o3FillOrderForm(page)
    },
    annotate: [
      { type: 'box', x: 985, y: 244, width: 395, height: 42 },
      { type: 'box', x: 1186, y: 838, width: 204, height: 58 }
    ]
  },
  {
    id: 'integrasi-simrs__openmrs__11-tanda-tangan',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '11-tanda-tangan',
    route: O3_LOGIN,
    preActions: async (page) => {
      await o3Login(page)
      await o3OpenOrdersTab(page)
      await o3OpenBasket(page)
      await o3OpenLabOrderPanel(page)
      await o3SearchPreciaTest(page)
      await o3FillOrderForm(page)
      await page.getByRole('button', { name: /^Save order$/ }).click()
      await page.waitForTimeout(5000)
    },
    annotate: [
      { type: 'box', x: 984, y: 234, width: 396, height: 60 },
      { type: 'box', x: 1186, y: 838, width: 204, height: 58 }
    ]
  },
  {
    id: 'integrasi-simrs__openmrs__12-order-tersimpan',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '12-order-tersimpan',
    route: O3_LOGIN,
    preActions: async (page) => {
      await o3Login(page)
      await o3OpenOrdersTab(page)
    },
    annotate: [{ type: 'box', x: 274, y: 512, width: 1100, height: 150 }]
  },
  {
    id: 'integrasi-simrs__openmrs__13-pilih-unit',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '13-pilih-unit',
    route: '/clinical',
    role: 'OPENMRS3',
    preActions: async (page) => {
      await page.waitForTimeout(5000)
    },
    annotate: [{ type: 'box', x: 667, y: 225, width: 362, height: 82 }]
  },
  {
    id: 'integrasi-simrs__openmrs__14-daftar-kerja',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '14-daftar-kerja',
    route: `/clinical?unit=${UNIT_UUID}`,
    role: 'OPENMRS3',
    preActions: async (page) => {
      await page.waitForTimeout(6000)
    },
    annotate: [{ type: 'box', x: 302, y: 476, width: 1092, height: 70 }]
  },
  {
    id: 'integrasi-simrs__openmrs__15-detail-kasus',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '15-detail-kasus',
    route: `/clinical/transactions/${TRANSACTION_UUID}`,
    role: 'OPENMRS3',
    preActions: async (page) => {
      await page.waitForTimeout(6000)
    },
    annotate: [
      { type: 'box', x: 299, y: 114, width: 494, height: 44 },
      { type: 'box', x: 299, y: 421, width: 412, height: 72 }
    ]
  },
  // -----------------------------------------------------------------
  // Spec 16-18: bukti round trip sampai hasil AI tervalidasi dan
  // tersinkron balik ke OpenMRS, untuk transaksi yang sudah benar-benar
  // selesai (bukan simulasi). Lihat catatan SPEC 16-18 di atas file ini,
  // termasuk sumber setiap koordinat annotate.
  // -----------------------------------------------------------------
  {
    id: 'integrasi-simrs__openmrs__16-hasil-ai',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '16-hasil-ai',
    route: `/clinical/transactions/${ROUND_TRIP_TRANSACTION_ID}`,
    role: 'OPENMRS3',
    preActions: async (page) => {
      await page.waitForTimeout(6000)
      // Tab "Info Pasien"/"Patient Info" aktif secara default. getByText
      // dengan nama modul cocok DUA elemen (badge di kartu kiri, dan tombol
      // tab di kanan) - getByRole('button', ...) memaksa cocok hanya
      // tombol tab, dikonfirmasi unik lewat probe langsung 2026-08-27.
      await page.getByRole('button', { name: /ECG Mitral Valve Screening/ }).click()
      await page.waitForTimeout(1500)
    },
    annotate: [
      // Baris "Modul AI"/"AI Modules" pada kartu Detail Transaksi (kolom
      // kiri), di bawah baris Unit/Prioritas - dikoreksi 2026-08-27,
      // koordinat evidence lama ternyata menunjuk baris Unit/Prioritas,
      // bukan baris Modul AI.
      { type: 'box', x: 299, y: 626, width: 260, height: 70 },
      // Kartu modul pada tab kanan setelah tab diklik: nama modul, domain,
      // dan badge status "Completed" - diukur ulang 2026-08-27 dari probe
      // langsung (1440x900, setelah page.getByRole('button', ...).click()).
      { type: 'box', x: 763, y: 330, width: 627, height: 80 }
    ]
  },
  {
    id: 'integrasi-simrs__openmrs__17-hasil-ai-dan-validasi',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '17-hasil-ai-dan-validasi',
    // Status dan hasil validasi TIDAK ada di halaman detail transaksi, ada
    // di menu Validation terpisah. Akun CAD yang sama dengan spec 13-16
    // sebenarnya sudah cukup untuk melihat keputusan yang sudah
    // dipublikasikan (dikonfirmasi lewat probe), tapi dipakai akun CVL
    // asli (docs-demo-creds, 2026-08-27) karena itu persona yang secara
    // semantik benar untuk tangkapan layar validasi - lihat catatan SPEC
    // 16-18 di atas.
    route: '/validation',
    role: 'OPENMRS3_VALIDATOR',
    preActions: async (page) => {
      // Worklist menampilkan `code`, bukan `id` - lihat catatan
      // ROUND_TRIP_TRANSACTION_CODE di atas.
      await openValidationDetailFor(page, ROUND_TRIP_TRANSACTION_CODE)
    },
    annotate: [
      // Diukur dari openmrs3-14-precia-validation-published.png
      // (1600x1000, ×0.9): baris Decision/Status pada kartu Validation
      // Detail.
      { type: 'box', x: 847, y: 265, width: 560, height: 55 },
      // Kotak hasil AI (Confidence + disclaimer) pada kartu yang sama.
      { type: 'box', x: 873, y: 428, width: 520, height: 125 }
    ]
  },
  {
    id: 'integrasi-simrs__openmrs__18-hasil-tersinkron-openmrs',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '18-hasil-tersinkron-openmrs',
    // Sisi OpenMRS, bukan PRECIA - tidak memakai role, sama seperti spec
    // 01-12. ROUND_TRIP_PATIENT_NAME sudah dikonfirmasi (lihat catatan
    // SPEC 16-18), jadi tidak perlu membaca halaman PRECIA lebih dulu.
    route: O3_LOGIN,
    preActions: async (page) => {
      await o3OpenResultsForRoundTripPatient(page)
    },
    annotate: [
      // Diukur dari openmrs3-18-openmrs-results-precia-ai-value.png
      // (1600x1000, ×0.9): kartu teratas dan baris tabel panel Results
      // yang bernilai PRECIA AI.
      { type: 'box', x: 573, y: 255, width: 800, height: 200 }
    ]
  }
]
