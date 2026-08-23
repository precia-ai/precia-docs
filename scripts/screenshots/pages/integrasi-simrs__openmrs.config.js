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
 * SPEC 16-18 DITAMBAHKAN 2026-08-23, BELUM PERNAH DIJALANKAN, BACA DULU
 * ---------------------------------------------------------------------
 * Ditulis sementara app-dev.precia.site sedang berkedip (lihat catatan yang
 * sama di integrasi-simrs__care.config.js hari ini), jadi tidak satu pun
 * selector di bawah pernah diverifikasi terhadap DOM nyata. Sebelum
 * dipercaya sebagai final: jalankan sekali, periksa PNG mentahnya, lalu
 * ukur ulang koordinat `annotate` dengan cara yang sama probe.js dipakai di
 * tempat lain pada direktori ini.
 *
 * BEDA dengan spec 13-15 di atas, spec 16-18 TIDAK dibiarkan menunggu
 * kasus apa pun tiba. precia-tracker mengonfirmasi lewat query DB langsung
 * pada 2026-08-23 (~12:40 waktu lokal) bahwa dua transaksi asal OpenMRS 3
 * di app-dev SUDAH mencapai status doctor_reviewed dengan baris
 * SimrsDelivery berstatus succeeded, artinya seluruh rantai (AI selesai,
 * divalidasi dokter, tersinkron balik ke OpenMRS) sudah benar-benar
 * terjadi untuk keduanya:
 *   - 53f56457-c07c-4fcb-9d9d-21ea52a61f6a (delivery sukses 2026-08-22
 *     16:14:56 UTC) - dipakai di bawah sebagai ROUND_TRIP_TRANSACTION_ID.
 *   - eb0d127b-0917-4dc8-8289-61418f3fa2e1 (delivery sukses 2026-08-22
 *     15:49:47 UTC) - cadangan bila transaksi pertama ternyata sudah
 *     berubah/dihapus saat capture dijalankan.
 * Kolom `code` transaksi OpenMRS 3 berisi UUID itu sendiri (bukan format
 * "OPENMRS3-xxx" seperti CARE), jadi kedua id di atas langsung dipakai
 * sebagai id transaksi PRECIA, bukan hasil pencarian dinamis.
 *
 * KARENA kasusnya sudah selesai (bukan sedang menunggu divalidasi), spec
 * 17 TIDAK melakukan aksi validasi apa pun (beda dari pola
 * integrasi-simrs__openhospital-bukti-round-trip.config.js yang menekan
 * tombol Record decision/Publish validation secara langsung). Spec 17
 * hanya memotret status yang sudah ada, mengikuti pola
 * integrasi-simrs__khanza-bukti-round-trip.config.js.
 *
 * Halaman persis tempat status validasi dan catatan tervalidasi tampil
 * BELUM diverifikasi. Spec 16 dan 17 sama-sama memotret halaman detail
 * transaksi PRECIA (route yang sama dan sudah terbukti jalan di spec 15),
 * dengan asumsi kartu Modul AI dan riwayat validasi sama-sama tampil di
 * situ setelah status berubah dari "Belum Diproses". Bila ternyata
 * validasi hanya tampil di halaman lain (misalnya /validation, seperti
 * dipakai integrasi-simrs__openhospital-bukti-round-trip.config.js),
 * pisahkan spec 17 ke route itu dan ukur ulang.
 *
 * Spec 18 (sisi OpenMRS) TIDAK memakai PATIENT_UUID/PATIENT_QUERY yang
 * sudah ada di atas, karena belum dikonfirmasi kedua transaksi round trip
 * ini memakai pasien demo yang sama (Betty Williams) dengan spec 01-15.
 * Spec 18 justru membaca nama pasien dari halaman detail transaksi PRECIA
 * (spec 16) lebih dulu di dalam preActions-nya sendiri, baru mencari nama
 * itu di OpenMRS lewat alur pencarian yang sama dipakai spec 05, supaya
 * seluruh urutan tetap berjalan tanpa pengawasan dalam satu kali run,
 * bukan bergantung pada UUID pasien yang ditebak. Tab yang difoto adalah
 * "Results", bukan "Orders" seperti spec 07-12: order yang sudah selesai
 * dan diisi hasil biasanya tampil di tab terpisah dari order yang masih
 * berjalan, tapi nama tab persis di versi OpenMRS 3 ini belum
 * dikonfirmasi. Dicari lewat teks ("Results"), bukan lewat path URL yang
 * ditebak, supaya lebih tahan bila nama workspace-nya berbeda.
 * ---------------------------------------------------------------------
 */
const O3 = process.env.OPENMRS_BASE_URL || 'https://openmrs-dev.precia.site'
const O3_LOGIN = `${O3}/openmrs/spa/login`
const PATIENT_UUID = '5b338deb-f8aa-4631-b464-c9763fcaca56'
const PATIENT_QUERY = 'Betty%20Williams'
const UNIT_UUID = '095dd538-c619-4d28-821e-dd54cd475c36'
const TRANSACTION_UUID = '2eee5073-7854-4254-8823-c3555b36f7c1'

// Transaksi round trip yang sudah terbukti selesai (doctor_reviewed, delivery
// succeeded), dikonfirmasi lewat DB pada 2026-08-23. Lihat catatan SPEC 16-18
// di atas. Cadangan dipakai bila yang utama sudah berubah saat capture jalan.
const ROUND_TRIP_TRANSACTION_ID = '53f56457-c07c-4fcb-9d9d-21ea52a61f6a'
const ROUND_TRIP_TRANSACTION_ID_FALLBACK = 'eb0d127b-0917-4dc8-8289-61418f3fa2e1'

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
 * Baca nama pasien dari kartu identitas pada halaman detail transaksi PRECIA
 * yang sedang terbuka (pola yang sama dipakai spec 15: nama pasien tampil di
 * kartu identitas dekat kode transaksi). Dipakai spec 18 supaya pencarian di
 * OpenMRS tidak bergantung pada UUID pasien yang ditebak. Selector belum
 * diverifikasi terhadap DOM nyata, lihat catatan SPEC 16-18 di atas.
 */
async function readPreciaPatientName(page) {
  const identityCard = page.locator('h1, h2').first()
  const text = (await identityCard.textContent()) || ''
  return text.trim()
}

/**
 * Sisi OpenMRS dari spec 18: cari pasien lewat nama yang dibaca dari PRECIA,
 * buka rekamnya, lalu buka tab "Results" (dicari lewat teks, bukan path URL
 * yang ditebak, lihat catatan SPEC 16-18 di atas).
 */
async function o3OpenResultsForPatientNamed(page, patientName) {
  await o3Login(page)
  await page.goto(`${O3}/openmrs/spa/search?query=${encodeURIComponent(patientName)}`, {
    waitUntil: 'networkidle'
  })
  await page.waitForTimeout(6000)
  await page.locator('a, [role="link"]').filter({ hasText: patientName }).first().click()
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
  // selesai (bukan simulasi). Lihat catatan SPEC 16-18 di atas file ini.
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
    },
    annotate: [
      // Perkiraan awal, ukur ulang: kartu Modul AI berisi hasil (confidence,
      // temuan), menggantikan keterangan "belum ada slot" pada spec 15.
      { type: 'box', x: 299, y: 560, width: 800, height: 220 }
    ]
  },
  {
    id: 'integrasi-simrs__openmrs__17-validasi-dokter',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '17-validasi-dokter',
    route: `/clinical/transactions/${ROUND_TRIP_TRANSACTION_ID}`,
    role: 'OPENMRS3',
    fullPage: true,
    preActions: async (page) => {
      await page.waitForTimeout(6000)
      // TODO: belum dikonfirmasi status/riwayat validasi tampil di halaman
      // ini. Bila tidak, pindahkan ke route /validation seperti pola
      // integrasi-simrs__openhospital-bukti-round-trip.config.js dan cari
      // kasusnya lewat teks (nama pasien atau kode transaksi), lalu ukur
      // ulang seluruh spec ini dari nol.
    },
    annotate: [
      // Perkiraan awal, ukur ulang: badge status (mis. "Ditinjau Dokter")
      // beserta catatan/keputusan validasi.
      { type: 'box', x: 299, y: 800, width: 800, height: 160 }
    ]
  },
  {
    id: 'integrasi-simrs__openmrs__18-hasil-tersinkron-openmrs',
    section: 'integrasi-simrs',
    pageSlug: 'openmrs',
    stepSlug: '18-hasil-tersinkron-openmrs',
    route: `/clinical/transactions/${ROUND_TRIP_TRANSACTION_ID}`,
    role: 'OPENMRS3',
    preActions: async (page) => {
      // Dua tahap dalam satu preActions supaya seluruh urutan tetap
      // berjalan tanpa pengawasan dalam satu kali run: baca nama pasien
      // dari PRECIA dulu (halaman ini sudah dimuat oleh route di atas),
      // baru pindah ke OpenMRS dan cari nama itu. Lihat readPreciaPatientName
      // dan o3OpenResultsForPatientNamed di atas file ini.
      await page.waitForTimeout(4000)
      const patientName = await readPreciaPatientName(page)
      await o3OpenResultsForPatientNamed(page, patientName)
    },
    annotate: [
      // Perkiraan awal, ukur ulang: baris hasil bernilai PRECIA AI pada tab
      // Results, mengikuti referensi visual
      // public/screenshots/_evidence/dev/openmrs3-18-openmrs-results-precia-ai-value.png
      { type: 'box', x: 274, y: 300, width: 1100, height: 150 }
    ]
  }
]
