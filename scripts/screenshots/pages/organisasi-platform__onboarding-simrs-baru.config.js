/**
 * Wizard "Onboarding SIMRS Baru" (/platform/simrs-onboarding), 7 langkah:
 * organization -> adapter -> fields -> units -> credential -> config -> selftest.
 *
 * Setiap spec me-reset dulu settings.simrs org demo (via fetch API langsung,
 * pakai access token yang sudah ada di localStorage) supaya wizard SELALU
 * mulai dari kondisi "belum pernah onboarding" — reproducible walau
 * script ini dijalankan berkali-kali. Org yang dipakai: "PRECIA Demo Booth"
 * (DEMO), sudah punya 11 unit klinis jadi representatif untuk langkah
 * pemetaan unit. Tidak pernah membuat organisasi baru permanen — panel
 * "Buat organisasi baru" cuma difoto, tombolnya tidak diklik.
 *
 * Tombol "Lanjut"/"Next" dan "Jalankan self-test"/"Run self-test" teksnya
 * beda per locale, jadi dipilih pakai variabel LABEL berdasarkan {locale}
 * yang dikirim run.js ke preActions — bukan selector visible-text yang fixed.
 */
const DEMO_ORG_ID = 'fd35fae1-e016-42f9-bc77-785359b5d284'

const LABEL = {
  next: { id: 'Lanjut', en: 'Next' },
  runSelfTest: { id: 'Jalankan self-test', en: 'Run self-test' }
}

async function resetOrgSettings(page) {
  await page.evaluate(async (orgId) => {
    const token = window.localStorage.getItem('precia_access_token')
    const apiBase = 'https://api-dev.precia.site/api'
    const getRes = await fetch(`${apiBase}/organizations/${orgId}/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const org = await getRes.json()
    const settings = { ...(org.settings || {}) }
    delete settings.simrs
    delete settings.simrs_onboarding_lock
    await fetch(`${apiBase}/organizations/${orgId}/update/`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings })
    })
  }, DEMO_ORG_ID)
}

async function gotoWizard(page) {
  const base = process.env.PRECIA_BASE_URL || 'https://app-dev.precia.site'
  await page.goto(`${base}/platform/simrs-onboarding`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
}

async function selectOrg(page) {
  await page.waitForSelector('#org-select')
  await page.selectOption('#org-select', DEMO_ORG_ID)
  await page.waitForTimeout(700)
}

async function clickNext(page, locale) {
  await page.click(`button:has-text("${LABEL.next[locale]}")`)
  await page.waitForTimeout(500)
}

async function pickAdapter(page, index) {
  const radios = await page.$$('[role="radio"]')
  await radios[index].click()
  await page.waitForTimeout(200)
}

async function fillKoneksi(page) {
  await page.fill('#callback-url', 'https://simrs.demo-booth.example/precia/callback')
  await page.fill('#shared-secret', 'contoh-jwt-token-abc123')
  await page.fill('#auth-username', 'precia_integrator')
  await page.fill('#auth-password', 'ContohPassword123!')
  await page.waitForTimeout(200)
}

async function fillUnitRow(page) {
  await page.fill('input[placeholder="RAD"]', 'RAD')
  await page.selectOption('select', { index: 1 })
  await page.waitForTimeout(200)
}

// Membawa wizard sampai step "unit" (index 3), lalu isi mapping dan tekan
// Lanjut supaya benar-benar tersimpan (submitOnboarding), sebelum melangkah
// ke step credential/config/selftest.
async function walkToCredential(page, locale) {
  await resetOrgSettings(page)
  await gotoWizard(page)
  await selectOrg(page)
  await clickNext(page, locale) // -> adapter
  await pickAdapter(page, 0) // Open Hospital
  await clickNext(page, locale) // -> fields
  await fillKoneksi(page)
  await clickNext(page, locale) // -> units
  await page.waitForTimeout(600)
  await fillUnitRow(page)
  await clickNext(page, locale) // saves onboarding, -> credential
  await page.waitForTimeout(1200)
}

module.exports = [
  // 1. Organisasi: pilih existing + panel buat baru (tidak diklik/disubmit)
  {
    id: 'organisasi-platform__onboarding-simrs-baru__01-organisasi',
    section: 'organisasi-platform',
    pageSlug: 'onboarding-simrs-baru',
    stepSlug: '01-organisasi',
    route: '/platform/simrs-onboarding',
    role: 'SUP',
    preActions: async (page) => {
      await resetOrgSettings(page)
      await gotoWizard(page)
      await selectOrg(page)
    },
    annotate: [
      { type: 'box', x: 417, y: 393, width: 862, height: 60 },
      { type: 'box', x: 417, y: 523, width: 862, height: 204 }
    ]
  },

  // 2. Validasi: klik Lanjut tanpa pilih organisasi
  {
    id: 'organisasi-platform__onboarding-simrs-baru__02-organisasi-validasi',
    section: 'organisasi-platform',
    pageSlug: 'onboarding-simrs-baru',
    stepSlug: '02-organisasi-validasi',
    route: '/platform/simrs-onboarding',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await resetOrgSettings(page)
      await gotoWizard(page)
      await clickNext(page, locale)
    },
    annotate: [{ type: 'box', x: 417, y: 731, width: 862, height: 73 }]
  },

  // 3. Adapter: tiga pilihan SIMRS, belum ada yang dipilih
  {
    id: 'organisasi-platform__onboarding-simrs-baru__03-adapter',
    section: 'organisasi-platform',
    pageSlug: 'onboarding-simrs-baru',
    stepSlug: '03-adapter',
    route: '/platform/simrs-onboarding',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await resetOrgSettings(page)
      await gotoWizard(page)
      await selectOrg(page)
      await clickNext(page, locale)
    },
    annotate: [{ type: 'box', x: 417, y: 367, width: 862, height: 192 }]
  },

  // 4. Validasi: klik Lanjut tanpa pilih adapter
  {
    id: 'organisasi-platform__onboarding-simrs-baru__04-adapter-validasi',
    section: 'organisasi-platform',
    pageSlug: 'onboarding-simrs-baru',
    stepSlug: '04-adapter-validasi',
    route: '/platform/simrs-onboarding',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await resetOrgSettings(page)
      await gotoWizard(page)
      await selectOrg(page)
      await clickNext(page, locale)
      await clickNext(page, locale)
    },
    annotate: [{ type: 'box', x: 417, y: 563, width: 862, height: 73 }]
  },

  // 5. Koneksi: Open Hospital dipilih, klik Lanjut tanpa isi Callback URL
  {
    id: 'organisasi-platform__onboarding-simrs-baru__05-koneksi-validasi',
    section: 'organisasi-platform',
    pageSlug: 'onboarding-simrs-baru',
    stepSlug: '05-koneksi-validasi',
    route: '/platform/simrs-onboarding',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await resetOrgSettings(page)
      await gotoWizard(page)
      await selectOrg(page)
      await clickNext(page, locale)
      await pickAdapter(page, 0)
      await clickNext(page, locale)
      await clickNext(page, locale)
    },
    annotate: [
      { type: 'box', x: 417, y: 250, width: 862, height: 56 },
      { type: 'box', x: 417, y: 790, width: 862, height: 56 }
    ]
  },

  // 6. Koneksi: semua field terisi, siap lanjut
  {
    id: 'organisasi-platform__onboarding-simrs-baru__06-koneksi-terisi',
    section: 'organisasi-platform',
    pageSlug: 'onboarding-simrs-baru',
    stepSlug: '06-koneksi-terisi',
    route: '/platform/simrs-onboarding',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await resetOrgSettings(page)
      await gotoWizard(page)
      await selectOrg(page)
      await clickNext(page, locale)
      await pickAdapter(page, 0)
      await clickNext(page, locale)
      await fillKoneksi(page)
    },
    annotate: [{ type: 'box', x: 417, y: 695, width: 862, height: 120 }]
  },

  // 7. Unit: klik Lanjut tanpa memetakan ward apapun
  {
    id: 'organisasi-platform__onboarding-simrs-baru__07-unit-validasi',
    section: 'organisasi-platform',
    pageSlug: 'onboarding-simrs-baru',
    stepSlug: '07-unit-validasi',
    route: '/platform/simrs-onboarding',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await resetOrgSettings(page)
      await gotoWizard(page)
      await selectOrg(page)
      await clickNext(page, locale)
      await pickAdapter(page, 0)
      await clickNext(page, locale)
      await fillKoneksi(page)
      await clickNext(page, locale)
      await page.waitForTimeout(600)
      await clickNext(page, locale)
    },
    annotate: [{ type: 'box', x: 417, y: 569, width: 862, height: 73 }]
  },

  // 8. Unit: ward "RAD" dipetakan ke unit Cardiology
  {
    id: 'organisasi-platform__onboarding-simrs-baru__08-unit-terisi',
    section: 'organisasi-platform',
    pageSlug: 'onboarding-simrs-baru',
    stepSlug: '08-unit-terisi',
    route: '/platform/simrs-onboarding',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await resetOrgSettings(page)
      await gotoWizard(page)
      await selectOrg(page)
      await clickNext(page, locale)
      await pickAdapter(page, 0)
      await clickNext(page, locale)
      await fillKoneksi(page)
      await clickNext(page, locale)
      await page.waitForTimeout(600)
      await fillUnitRow(page)
    },
    annotate: [
      { type: 'box', x: 417, y: 459, width: 373, height: 46 },
      { type: 'box', x: 834, y: 457, width: 373, height: 50 }
    ]
  },

  // 9. Credential: form label, belum generate
  {
    id: 'organisasi-platform__onboarding-simrs-baru__09-credential',
    section: 'organisasi-platform',
    pageSlug: 'onboarding-simrs-baru',
    stepSlug: '09-credential',
    route: '/platform/simrs-onboarding',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await walkToCredential(page, locale)
    },
    annotate: [{ type: 'box', x: 417, y: 541, width: 232, height: 48 }]
  },

  // 10. Credential: hasil generate (email + password, ditampilkan sekali)
  {
    id: 'organisasi-platform__onboarding-simrs-baru__10-credential-hasil',
    section: 'organisasi-platform',
    pageSlug: 'onboarding-simrs-baru',
    stepSlug: '10-credential-hasil',
    route: '/platform/simrs-onboarding',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await walkToCredential(page, locale)
      await page.fill('#credential-label', 'Konektor Open Hospital RS Demo Booth')
      await page.click('button:has-text("Generate credential")')
      await page.waitForTimeout(1200)
    },
    annotate: [{ type: 'box', x: 417, y: 367, width: 862, height: 112 }]
  },

  // 11. Config: blok siap-copas berisi kredensial & mapping yang baru dibuat
  {
    id: 'organisasi-platform__onboarding-simrs-baru__11-config',
    section: 'organisasi-platform',
    pageSlug: 'onboarding-simrs-baru',
    stepSlug: '11-config',
    route: '/platform/simrs-onboarding',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await walkToCredential(page, locale)
      await page.fill('#credential-label', 'Konektor Open Hospital RS Demo Booth')
      await page.click('button:has-text("Generate credential")')
      await page.waitForTimeout(1200)
      await clickNext(page, locale)
      await page.waitForTimeout(600)
    },
    annotate: [{ type: 'box', x: 418, y: 442, width: 860, height: 260 }]
  },

  // 12. Self-test: siap dijalankan
  {
    id: 'organisasi-platform__onboarding-simrs-baru__12-selftest',
    section: 'organisasi-platform',
    pageSlug: 'onboarding-simrs-baru',
    stepSlug: '12-selftest',
    route: '/platform/simrs-onboarding',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await walkToCredential(page, locale)
      await page.fill('#credential-label', 'Konektor Open Hospital RS Demo Booth')
      await page.click('button:has-text("Generate credential")')
      await page.waitForTimeout(1200)
      await clickNext(page, locale)
      await page.waitForTimeout(600)
      await clickNext(page, locale)
      await page.waitForTimeout(400)
    },
    annotate: [{ type: 'box', x: 417, y: 490, width: 224, height: 48 }]
  },

  // 13. Self-test: hasil pemeriksaan (contoh ini gagal karena domain callback
  // memang tidak nyata/tidak resolve DNS — dijelaskan di teks halaman)
  {
    id: 'organisasi-platform__onboarding-simrs-baru__13-selftest-hasil',
    section: 'organisasi-platform',
    pageSlug: 'onboarding-simrs-baru',
    stepSlug: '13-selftest-hasil',
    route: '/platform/simrs-onboarding',
    role: 'SUP',
    fullPage: true,
    preActions: async (page, { locale }) => {
      await walkToCredential(page, locale)
      await page.fill('#credential-label', 'Konektor Open Hospital RS Demo Booth')
      await page.click('button:has-text("Generate credential")')
      await page.waitForTimeout(1200)
      await clickNext(page, locale)
      await page.waitForTimeout(600)
      await clickNext(page, locale)
      await page.waitForTimeout(400)
      await page.click(`button:has-text("${LABEL.runSelfTest[locale]}")`)
      await page.waitForTimeout(3000)
    },
    annotate: [{ type: 'box', x: 417, y: 630, width: 862, height: 320 }]
  }
]
