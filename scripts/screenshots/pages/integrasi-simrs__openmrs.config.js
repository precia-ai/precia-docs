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
 */
const O3 = process.env.OPENMRS_BASE_URL || 'https://openmrs-dev.precia.site'
const O3_LOGIN = `${O3}/openmrs/spa/login`
const PATIENT_UUID = '5b338deb-f8aa-4631-b464-c9763fcaca56'
const PATIENT_QUERY = 'Betty%20Williams'
const UNIT_UUID = '095dd538-c619-4d28-821e-dd54cd475c36'
const TRANSACTION_UUID = '2eee5073-7854-4254-8823-c3555b36f7c1'

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
  }
]
