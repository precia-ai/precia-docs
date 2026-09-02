/**
 * Integrasi SIMRS OpenEMR.
 *
 * Halaman dokumentasi: content/{id,en}/integrasi-simrs/openemr.mdx
 *
 * Sebelas langkah pertama diambil dari antarmuka web OpenEMR di
 * https://openemr-dev.precia.site , tiga langkah terakhir dari PRECIA.
 *
 * Prasyarat menjalankan spec ini (semuanya lewat environment variable,
 * tidak ada kredensial yang disimpan di dalam berkas):
 *
 *   OPENEMR_USER            akun admin OpenEMR pada server dev
 *   OPENEMR_PASSWORD        kata sandi akun tersebut
 *   PRECIA_DEMO_OED_EMAIL   akun PRECIA pada organisasi "RS Uji Coba OpenEMR"
 *   PRECIA_DEMO_OED_PASSWORD
 *
 * Kredensial OpenEMR tersimpan pada berkas .env deployment di server dev
 * (folder aplikasi /srv/precia/apps/openemr). Akun PRECIA harus disediakan
 * lebih dahulu pada organisasi tersebut: build yang ter-deploy belum
 * menyediakan endpoint reset kata sandi untuk pengguna lain, jadi akun baru
 * perlu dibuat setiap kali kata sandi lama tidak diketahui.
 *
 * Menjalankan:
 *   npm run shots -- --only=integrasi-simrs__openemr__
 *
 * Catatan penting: tidak satu pun spec di berkas ini menekan tombol Save,
 * Save and Continue, atau Transmit Order pada OpenEMR. Formulir hanya diisi
 * sampai siap disimpan lalu difoto, sehingga menjalankan ulang generator
 * tidak menambah order baru pada data demo. Langkah "permintaan tersimpan"
 * memotret order yang memang sudah tersimpan pada kunjungan tersebut.
 */

const OPENEMR = 'https://openemr-dev.precia.site'
const OPENEMR_LOGIN = OPENEMR + '/interface/login/login.php'
const TRANSACTION_ID = '698e4073-71f0-45d4-b7f9-3d3e9b7b6936'

function openemrCredentials() {
  const user = process.env.OPENEMR_USER
  const password = process.env.OPENEMR_PASSWORD
  if (!user || !password) {
    throw new Error(
      'Missing env vars OPENEMR_USER / OPENEMR_PASSWORD. Export them from the ' +
        'OpenEMR deployment env file before running npm run shots.'
    )
  }
  return { user, password }
}

async function openemrLogin(page) {
  const { user, password } = openemrCredentials()
  await page.waitForSelector('#authUser', { timeout: 30000 })
  await page.fill('#authUser', user)
  await page.fill('#clearPass', password)
  await page.click('#login-button')
  await page.waitForTimeout(9000)
}

async function openAdminPage(page, url) {
  await openemrLogin(page)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(4000)
}

async function searchPatient(page) {
  await openemrLogin(page)
  await page.locator('input[placeholder*="demographics" i]').first().fill('Budi')
}

async function openPatientChart(page) {
  await searchPatient(page)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(8000)
  const finder = page.frames().find((f) => f.url().includes('dynamic_finder'))
  await finder.click('text=Santoso, Budi')
  await page.waitForTimeout(10000)
}

async function openEncounter(page) {
  await openPatientChart(page)
  await page.click('text=Select Encounter')
  await page.waitForTimeout(2500)
  await page.click('a.dropdown-item:has-text("Office Visit")')
  await page.waitForTimeout(11000)
}

async function openOrdersMenu(page) {
  await openEncounter(page)
  const forms = page.frames().find((f) => f.url().includes('encounter/forms.php'))
  await forms.click('text=Orders')
  await page.waitForTimeout(2500)
  return forms
}

async function openProcedureOrderForm(page) {
  const forms = await openOrdersMenu(page)
  await forms.click('a:has-text("Procedure Order")')
  await page.waitForTimeout(13000)
  return page.frames().find((f) => /procedure_order/.test(f.url()))
}

async function fillOrderHeader(page) {
  const po = await openProcedureOrderForm(page)
  await po.selectOption('select[name="form_order_status"]', 'pending')
  await po.selectOption('select[name="form_order_priority"]', 'normal')
  await po.selectOption('select[name="form_performer_type"]', 'radiology')
  await po.selectOption('select[name="form_location_id"]', { label: 'RS Demo PRECIA' })
  await po.selectOption('select[name="procedure_type_names"]', 'imaging')
  await po.fill(
    'textarea[name="form_clinical_hx"]',
    'Sesak napas saat aktivitas. Permintaan foto toraks PA untuk penilaian kardiomegali.'
  )
  await page.waitForTimeout(1500)
  return po
}

async function openProcedurePicker(page) {
  const po = await fillOrderHeader(page)
  await po.click('input[name="form_proc_type_desc[0]"]')
  await page.waitForTimeout(6000)
  const picker = page.frames().find((f) => /find_order_popup/.test(f.url()))
  await picker.fill('input[name="search_term"], input[type=text]', 'Toraks')
  await picker.click('button:has-text("Search"), input[value="Search"]')
  await page.waitForTimeout(5000)
  return { po, picker }
}

/**
 * Pasien pembuktian arah balik (Elektrokardiografi 12 Sadapan, unit
 * KARDIO). Berbeda dari searchPatient()/openPatientChart() di atas, yang
 * memakai pasien "Budi" dari alur permintaan Foto Toraks PA: unit RAD tidak
 * memiliki modul AI aktif, sehingga tidak ada hasil untuk difoto di
 * Documents. Rahmawati adalah pasien yang benar benar punya kasus KARDIO
 * dengan hasil AI-ECG-LVEF yang sudah dipublikasikan.
 *
 * Klik ikon <img onmousedown="objTreeMenu_1.toggleBranch(...)"> lewat
 * page.click biasa terbukti macet menunggu navigasi yang tidak pernah
 * selesai pada pohon dokumen OpenEMR (banyak iframe bersarang). Dipanggil
 * langsung lewat evaluate() sebagai gantinya, sama seperti yang terbukti
 * jalan saat pembuktian arah balik OpenEMR-2-15.
 */
async function openDocumentsLabReport(page) {
  await page.locator('input[placeholder*="demographics" i]').first().fill('Rahmawati')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(8000)
  const finder = page.frames().find((f) => f.url().includes('dynamic_finder'))
  await finder.click('text=Rahmawati')
  await page.waitForTimeout(10000)

  for (const f of page.frames()) {
    const link = f.locator('a:has-text("Documents")').first()
    if (await link.count().catch(() => 0)) {
      await link.click({ timeout: 5000 }).catch(() => {})
      break
    }
  }
  await page.waitForTimeout(6000)

  let docFrame = null
  for (let i = 0; i < 20 && !docFrame; i++) {
    docFrame = page.frames().find((f) => f.url().includes('controller.php') && f.url().includes('document'))
    if (!docFrame) await page.waitForTimeout(1000)
  }
  if (!docFrame) throw new Error('Frame daftar dokumen (controller.php?document) tidak pernah muncul.')
  await docFrame.evaluate(() => {
    const all = Array.from(document.querySelectorAll('a'))
    const target = all.find((a) => a.textContent && a.textContent.trim() === 'Lab Report')
    if (!target) return
    const parent = target.closest('li') || target.parentElement
    const toggle = parent && parent.querySelector('img[onmousedown]')
    if (toggle) toggle.onmousedown()
  })
  await page.waitForTimeout(2500)
  return docFrame
}

module.exports = [
  {
    id: 'integrasi-simrs__openemr__01-penyedia-layanan',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '01-penyedia-layanan',
    route: OPENEMR_LOGIN,
    preActions: async (page) => {
      await openAdminPage(page, OPENEMR + '/interface/orders/procedure_provider_list.php')
    },
    annotate: [{ type: 'box', x: 165, y: 200, width: 1110, height: 48 }]
  },
  {
    id: 'integrasi-simrs__openemr__02-kamus-pemeriksaan',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '02-kamus-pemeriksaan',
    route: OPENEMR_LOGIN,
    preActions: async (page) => {
      await openAdminPage(page, OPENEMR + '/interface/orders/types.php')
      await page.click('#td1')
      await page.waitForTimeout(4000)
    },
    annotate: [{ type: 'box', x: 165, y: 248, width: 1110, height: 80 }]
  },
  {
    id: 'integrasi-simrs__openemr__03-masuk-openemr',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '03-masuk-openemr',
    route: OPENEMR_LOGIN,
    preActions: async (page) => {
      await page.waitForSelector('#authUser', { timeout: 30000 })
      await page.waitForTimeout(1500)
    },
    annotate: [
      { type: 'box', x: 654, y: 436, width: 284, height: 48 },
      { type: 'box', x: 654, y: 490, width: 284, height: 48 },
      { type: 'box', x: 503, y: 598, width: 434, height: 48 }
    ]
  },
  {
    id: 'integrasi-simrs__openemr__04-cari-pasien',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '04-cari-pasien',
    route: OPENEMR_LOGIN,
    preActions: async (page) => {
      await searchPatient(page)
      await page.waitForTimeout(1500)
    },
    annotate: [
      { type: 'box', x: 1092, y: 12, width: 240, height: 40 },
      { type: 'arrow', from: { x: 980, y: 140 }, to: { x: 1150, y: 58 } }
    ]
  },
  {
    id: 'integrasi-simrs__openemr__05-hasil-pencarian',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '05-hasil-pencarian',
    route: OPENEMR_LOGIN,
    preActions: async (page) => {
      await searchPatient(page)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(8000)
    },
    annotate: [{ type: 'box', x: 16, y: 424, width: 320, height: 40 }]
  },
  {
    id: 'integrasi-simrs__openemr__06-buka-kunjungan',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '06-buka-kunjungan',
    route: OPENEMR_LOGIN,
    preActions: async (page) => {
      await openPatientChart(page)
      await page.click('text=Select Encounter')
      await page.waitForTimeout(2500)
    },
    annotate: [
      { type: 'box', x: 829, y: 68, width: 174, height: 40 },
      { type: 'box', x: 830, y: 110, width: 222, height: 40 }
    ]
  },
  {
    id: 'integrasi-simrs__openemr__07-buka-formulir',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '07-buka-formulir',
    route: OPENEMR_LOGIN,
    preActions: async (page) => {
      await openOrdersMenu(page)
    },
    annotate: [
      { type: 'box', x: 690, y: 240, width: 94, height: 42 },
      { type: 'box', x: 691, y: 288, width: 180, height: 40 }
    ]
  },
  {
    id: 'integrasi-simrs__openemr__08-isi-formulir',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '08-isi-formulir',
    route: OPENEMR_LOGIN,
    preActions: async (page) => {
      await fillOrderHeader(page)
      await page.waitForTimeout(2000)
    },
    annotate: [
      { type: 'box', x: 356, y: 418, width: 184, height: 48 },
      { type: 'box', x: 1082, y: 310, width: 184, height: 48 }
    ]
  },
  {
    id: 'integrasi-simrs__openemr__09-pilih-pemeriksaan',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '09-pilih-pemeriksaan',
    route: OPENEMR_LOGIN,
    preActions: async (page) => {
      await openProcedurePicker(page)
    },
    annotate: [{ type: 'box', x: 356, y: 184, width: 720, height: 34 }]
  },
  {
    id: 'integrasi-simrs__openemr__10-formulir-terisi',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '10-formulir-terisi',
    route: OPENEMR_LOGIN,
    preActions: async (page) => {
      const { picker } = await openProcedurePicker(page)
      await picker.click('text=Foto Toraks PA')
      await page.waitForTimeout(6000)
    },
    annotate: [
      { type: 'box', x: 144, y: 758, width: 416, height: 48 },
      { type: 'box', x: 501, y: 822, width: 196, height: 48 }
    ]
  },
  {
    id: 'integrasi-simrs__openemr__11-permintaan-tersimpan',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '11-permintaan-tersimpan',
    route: OPENEMR_LOGIN,
    preActions: async (page) => {
      await openEncounter(page)
    },
    annotate: [{ type: 'box', x: 160, y: 586, width: 1120, height: 196 }]
  },
  {
    id: 'integrasi-simrs__openemr__12-daftar-unit',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '12-daftar-unit',
    route: '/clinical',
    role: 'OED',
    preActions: async (page) => {
      await page.waitForTimeout(6000)
    },
    annotate: [{ type: 'box', x: 301, y: 312, width: 361, height: 80 }]
  },
  {
    id: 'integrasi-simrs__openemr__13-daftar-kasus',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '13-daftar-kasus',
    route: '/clinical',
    role: 'OED',
    preActions: async (page) => {
      await page.getByText('Radiologi', { exact: true }).first().click()
      await page.waitForTimeout(8000)
    },
    annotate: [{ type: 'box', x: 302, y: 476, width: 1090, height: 70 }]
  },
  {
    id: 'integrasi-simrs__openemr__14-detail-kasus',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '14-detail-kasus',
    route: '/clinical/transactions/' + TRANSACTION_ID,
    role: 'OED',
    preActions: async (page) => {
      await page.waitForTimeout(6000)
    },
    annotate: [
      { type: 'box', x: 299, y: 114, width: 418, height: 66 },
      { type: 'box', x: 299, y: 406, width: 418, height: 84 }
    ]
  },
  {
    id: 'integrasi-simrs__openemr__15-dokumen-hasil-ai',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '15-dokumen-hasil-ai',
    route: OPENEMR_LOGIN,
    preActions: async (page) => {
      await openemrLogin(page)
      await openDocumentsLabReport(page)
    },
    annotate: [{ type: 'box', x: 15, y: 480, width: 330, height: 60 }]
  },
  {
    id: 'integrasi-simrs__openemr__16-isi-hasil-ai',
    section: 'integrasi-simrs',
    pageSlug: 'openemr',
    stepSlug: '16-isi-hasil-ai',
    route: OPENEMR_LOGIN,
    preActions: async (page) => {
      await openemrLogin(page)
      const docFrame = await openDocumentsLabReport(page)
      await docFrame.click('text=precia-AI-ECG-LVEF-OPENEMR-2-15')
      await page.waitForTimeout(3000)
    },
    annotate: [{ type: 'box', x: 383, y: 305, width: 1017, height: 45 }]
  }
]
