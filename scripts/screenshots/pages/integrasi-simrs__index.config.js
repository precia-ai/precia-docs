/**
 * Halaman pengaturan integrasi SIMRS tingkat organisasi.
 * Route: /settings/simrs-integration
 *
 * Catatan: akun demo SUP yang dipakai untuk semua screenshot sudah punya
 * organisasi ("System Health Organization") dengan pengaturan SIMRS yang
 * tersimpan (adapter Open Hospital). Tidak ada cara di UI untuk berpindah
 * organisasi ke organisasi lain yang belum dikonfigurasi, jadi step 1 di
 * bawah menampilkan kondisi "sudah dikonfigurasi" apa adanya (bukan empty
 * state literal). Step 2 mengganti adapter dan mengisi field endpoint +
 * shared secret dengan nilai contoh di form (TANPA klik Simpan), untuk
 * menunjukkan bagaimana bentuk form saat sedang diisi.
 */
/* ------------------------------------------------------------------ */
/* Kartu Pemetaan unit (langkah 03-05): anotasi diukur dari elemen      */
/* sungguhan, karena tata letak berubah mengikuti jumlah baris yang     */
/* sudah tersimpan untuk organisasi demo SUP ("System Health            */
/* Organization") di app-dev.precia.site, bukan koordinat piksel tetap. */
/* ------------------------------------------------------------------ */

const unitMappingMeasured = {}

function unitMappingKey(step, locale, name) {
  return `${step}:${locale}:${name}`
}

async function measureUnitMapping(page, step, locale, name, locator, padding = 8) {
  const box = await locator.first().boundingBox()
  if (!box) {
    throw new Error(`Tidak dapat mengukur elemen "${name}" pada langkah ${step} (${locale}).`)
  }
  unitMappingMeasured[unitMappingKey(step, locale, name)] = {
    type: 'box',
    x: Math.round(box.x - padding),
    y: Math.round(box.y - padding),
    width: Math.round(box.width + padding * 2),
    height: Math.round(box.height + padding * 2)
  }
}

async function measureUnitMappingUnion(page, step, locale, name, locators, padding = 8) {
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
  unitMappingMeasured[unitMappingKey(step, locale, name)] = {
    type: 'box',
    x: Math.round(left - padding),
    y: Math.round(top - padding),
    width: Math.round(right - left + padding * 2),
    height: Math.round(bottom - top + padding * 2)
  }
}

function unitMappingAnnotationsFor(step, locale, names) {
  const boxes = names.map((name) => unitMappingMeasured[unitMappingKey(step, locale, name)]).filter(Boolean)
  if (boxes.length === 0) {
    throw new Error(`Tidak ada anotasi yang terukur untuk langkah ${step} (${locale}).`)
  }
  return boxes
}

// Label kolom dan tombol berbeda per locale (lib/i18n/translations.ts:
// simrs.unitMapping.*), jadi locator dipilih lewat teks yang terlihat,
// bukan id/class (komponen tidak memberi id/data-testid pada elemen ini).
const UNIT_MAPPING_TEXT = {
  id: {
    simrsCodeHeader: 'Kode SIMRS',
    preciaUnitHeader: 'Unit PRECIA',
    saveButton: 'Simpan pemetaan unit',
    addButton: 'Tambah pemetaan',
    newRowCodeLabel: 'Kode SIMRS, baris 4',
    newRowUnitLabel: 'Unit PRECIA, baris 4',
    successMessage: 'Pemetaan unit tersimpan.'
  },
  en: {
    simrsCodeHeader: 'SIMRS code',
    preciaUnitHeader: 'PRECIA unit',
    saveButton: 'Save unit mapping',
    addButton: 'Add mapping',
    newRowCodeLabel: 'SIMRS code, row 4',
    newRowUnitLabel: 'PRECIA unit, row 4',
    successMessage: 'Unit mapping saved.'
  }
}

module.exports = [
  {
    id: 'integrasi-simrs__index__01-tampilan-form',
    section: 'integrasi-simrs',
    pageSlug: 'index',
    stepSlug: '01-tampilan-form',
    route: '/settings/simrs-integration',
    role: 'SUP',
    annotate: ({ locale }) =>
      locale === 'en'
        ? [
            { type: 'box', x: 325, y: 292, width: 575, height: 40 },
            { type: 'box', x: 325, y: 398, width: 575, height: 40 }
          ]
        : [
            { type: 'box', x: 325, y: 271, width: 575, height: 40 },
            { type: 'box', x: 325, y: 377, width: 575, height: 40 }
          ]
  },
  {
    id: 'integrasi-simrs__index__02-isi-form',
    section: 'integrasi-simrs',
    pageSlug: 'index',
    stepSlug: '02-isi-form',
    route: '/settings/simrs-integration',
    role: 'SUP',
    preActions: async (page) => {
      await page.waitForSelector('#simrs-adapter', { timeout: 15000 })
      await page.selectOption('#simrs-adapter', 'khanza')
      await page.fill('#simrs-endpoint-url', 'https://klinik-demo.example.org/simrs/callback')
      await page.fill('#simrs-shared-secret', 'contoh-kunci-rahasia-12345')
    },
    annotate: ({ locale }) =>
      locale === 'en'
        ? [
            { type: 'box', x: 325, y: 504, width: 575, height: 40 },
            { type: 'box', x: 665, y: 589, width: 235, height: 40 }
          ]
        : [
            { type: 'box', x: 325, y: 483, width: 575, height: 40 },
            { type: 'box', x: 646, y: 568, width: 254, height: 40 }
          ]
  },
  /**
   * Kartu Pemetaan unit (companion precia-be #103 / precia-fe #91).
   * Organisasi demo SUP ("System Health Organization") di
   * app-dev.precia.site sudah punya tiga baris pemetaan tersimpan
   * (RAD/URO/KARDIO) dari pemakaian nyata sebelumnya, jadi langkah 03 di
   * bawah menampilkan kondisi itu apa adanya (bukan kartu kosong).
   * Langkah 04 menambah satu baris baru (ONKO -> Oncology) tanpa
   * menyimpan, dan langkah 05 mengklik Simpan sungguhan sehingga baris
   * itu ikut tersimpan permanen di organisasi demo tersebut.
   */
  {
    id: 'integrasi-simrs__index__03-pemetaan-unit-id',
    section: 'integrasi-simrs',
    pageSlug: 'index',
    stepSlug: '03-pemetaan-unit',
    route: '/settings/simrs-integration',
    role: 'SUP',
    locales: ['id'],
    preActions: async (page, { locale }) => {
      const text = UNIT_MAPPING_TEXT[locale]
      await page.waitForSelector('select', { timeout: 15000 })
      await page.waitForTimeout(500)
      await measureUnitMappingUnion(page, '03', locale, 'simrs-code-column', [
        page.getByText(text.simrsCodeHeader, { exact: true }),
        page.locator('input[placeholder="RAD"]').first()
      ])
      await measureUnitMappingUnion(page, '03', locale, 'precia-unit-column', [
        page.getByText(text.preciaUnitHeader, { exact: true }),
        page.locator('select').nth(1)
      ])
    },
    annotate: ({ locale }) =>
      unitMappingAnnotationsFor('03', locale, ['simrs-code-column', 'precia-unit-column'])
  },
  {
    id: 'integrasi-simrs__index__03-pemetaan-unit-en',
    section: 'integrasi-simrs',
    pageSlug: 'index',
    stepSlug: '03-unit-mapping',
    route: '/settings/simrs-integration',
    role: 'SUP',
    locales: ['en'],
    preActions: async (page, { locale }) => {
      const text = UNIT_MAPPING_TEXT[locale]
      await page.waitForSelector('select', { timeout: 15000 })
      await page.waitForTimeout(500)
      await measureUnitMappingUnion(page, '03', locale, 'simrs-code-column', [
        page.getByText(text.simrsCodeHeader, { exact: true }),
        page.locator('input[placeholder="RAD"]').first()
      ])
      await measureUnitMappingUnion(page, '03', locale, 'precia-unit-column', [
        page.getByText(text.preciaUnitHeader, { exact: true }),
        page.locator('select').nth(1)
      ])
    },
    annotate: ({ locale }) =>
      unitMappingAnnotationsFor('03', locale, ['simrs-code-column', 'precia-unit-column'])
  },
  {
    id: 'integrasi-simrs__index__04-tambah-baris-pemetaan-id',
    section: 'integrasi-simrs',
    pageSlug: 'index',
    stepSlug: '04-tambah-baris-pemetaan',
    route: '/settings/simrs-integration',
    role: 'SUP',
    locales: ['id'],
    preActions: async (page, { locale }) => {
      const text = UNIT_MAPPING_TEXT[locale]
      await page.waitForSelector('select', { timeout: 15000 })
      await page.waitForTimeout(500)
      await page.getByRole('button', { name: text.addButton }).click()
      await page.waitForTimeout(300)
      // Locator diambil lewat .last(), BUKAN indeks baris tetap: dua
      // proses berbeda (id lalu en) berjalan terhadap organisasi demo yang
      // sama, dan urutan kunci unit_mapping yang dikembalikan backend pada
      // load berikutnya tidak selalu sama dengan urutan saat baris itu
      // ditambahkan di sesi sebelumnya (JSONB Postgres tidak menjamin
      // urutan kunci). Indeks baris tetap sempat salah menimpa baris
      // KARDIO yang sudah ada dan menghapusnya dari pemetaan tersimpan;
      // .last() selalu mengenai baris yang baru saja ditambahkan lewat
      // klik Tambah pemetaan di atas, apa pun urutan baris-baris sebelumnya.
      const newCodeInput = page.locator('input[placeholder="RAD"]').last()
      const newUnitSelect = page.locator('select').last()
      await newCodeInput.fill('ONKO')
      await newUnitSelect.selectOption({ label: 'Oncology (ONCO)' })
      await measureUnitMappingUnion(page, '04', locale, 'new-row', [newCodeInput, newUnitSelect])
      await measureUnitMapping(
        page,
        '04',
        locale,
        'save-button',
        page.getByRole('button', { name: text.saveButton })
      )
    },
    annotate: ({ locale }) => unitMappingAnnotationsFor('04', locale, ['new-row', 'save-button'])
  },
  {
    id: 'integrasi-simrs__index__04-tambah-baris-pemetaan-en',
    section: 'integrasi-simrs',
    pageSlug: 'index',
    stepSlug: '04-add-mapping-row',
    route: '/settings/simrs-integration',
    role: 'SUP',
    locales: ['en'],
    preActions: async (page, { locale }) => {
      const text = UNIT_MAPPING_TEXT[locale]
      await page.waitForSelector('select', { timeout: 15000 })
      await page.waitForTimeout(500)
      await page.getByRole('button', { name: text.addButton }).click()
      await page.waitForTimeout(300)
      // Locator diambil lewat .last(), BUKAN indeks baris tetap: dua
      // proses berbeda (id lalu en) berjalan terhadap organisasi demo yang
      // sama, dan urutan kunci unit_mapping yang dikembalikan backend pada
      // load berikutnya tidak selalu sama dengan urutan saat baris itu
      // ditambahkan di sesi sebelumnya (JSONB Postgres tidak menjamin
      // urutan kunci). Indeks baris tetap sempat salah menimpa baris
      // KARDIO yang sudah ada dan menghapusnya dari pemetaan tersimpan;
      // .last() selalu mengenai baris yang baru saja ditambahkan lewat
      // klik Tambah pemetaan di atas, apa pun urutan baris-baris sebelumnya.
      const newCodeInput = page.locator('input[placeholder="RAD"]').last()
      const newUnitSelect = page.locator('select').last()
      await newCodeInput.fill('ONKO')
      await newUnitSelect.selectOption({ label: 'Oncology (ONCO)' })
      await measureUnitMappingUnion(page, '04', locale, 'new-row', [newCodeInput, newUnitSelect])
      await measureUnitMapping(
        page,
        '04',
        locale,
        'save-button',
        page.getByRole('button', { name: text.saveButton })
      )
    },
    annotate: ({ locale }) => unitMappingAnnotationsFor('04', locale, ['new-row', 'save-button'])
  },
  {
    id: 'integrasi-simrs__index__05-pemetaan-unit-tersimpan-id',
    section: 'integrasi-simrs',
    pageSlug: 'index',
    stepSlug: '05-pemetaan-unit-tersimpan',
    route: '/settings/simrs-integration',
    role: 'SUP',
    locales: ['id'],
    preActions: async (page, { locale }) => {
      const text = UNIT_MAPPING_TEXT[locale]
      await page.waitForSelector('select', { timeout: 15000 })
      await page.waitForTimeout(500)
      await page.getByRole('button', { name: text.addButton }).click()
      await page.waitForTimeout(300)
      // Locator diambil lewat .last(), BUKAN indeks baris tetap: dua
      // proses berbeda (id lalu en) berjalan terhadap organisasi demo yang
      // sama, dan urutan kunci unit_mapping yang dikembalikan backend pada
      // load berikutnya tidak selalu sama dengan urutan saat baris itu
      // ditambahkan di sesi sebelumnya (JSONB Postgres tidak menjamin
      // urutan kunci). Indeks baris tetap sempat salah menimpa baris
      // KARDIO yang sudah ada dan menghapusnya dari pemetaan tersimpan;
      // .last() selalu mengenai baris yang baru saja ditambahkan lewat
      // klik Tambah pemetaan di atas, apa pun urutan baris-baris sebelumnya.
      const newCodeInput = page.locator('input[placeholder="RAD"]').last()
      const newUnitSelect = page.locator('select').last()
      await newCodeInput.fill('ONKO')
      await newUnitSelect.selectOption({ label: 'Oncology (ONCO)' })
      // Klik Simpan sungguhan: PATCH /api/simrs-connectors/unit-mapping/
      // benar-benar dipanggil dan baris ONKO ikut tersimpan permanen di
      // organisasi demo ini pada app-dev.precia.site.
      await page.getByRole('button', { name: text.saveButton }).click()
      await page.waitForSelector(`text=${text.successMessage}`, { timeout: 10000 })
      await page.waitForTimeout(300)
      await measureUnitMapping(page, '05', locale, 'success', page.getByText(text.successMessage))
      const warningBlock = page.locator('[role="status"]', { hasText: 'RAD' })
      await measureUnitMapping(page, '05', locale, 'warning', warningBlock)
    },
    annotate: ({ locale }) => unitMappingAnnotationsFor('05', locale, ['success', 'warning'])
  },
  {
    id: 'integrasi-simrs__index__05-pemetaan-unit-tersimpan-en',
    section: 'integrasi-simrs',
    pageSlug: 'index',
    stepSlug: '05-unit-mapping-saved',
    route: '/settings/simrs-integration',
    role: 'SUP',
    locales: ['en'],
    preActions: async (page, { locale }) => {
      const text = UNIT_MAPPING_TEXT[locale]
      await page.waitForSelector('select', { timeout: 15000 })
      await page.waitForTimeout(500)
      await page.getByRole('button', { name: text.addButton }).click()
      await page.waitForTimeout(300)
      // Locator diambil lewat .last(), BUKAN indeks baris tetap: dua
      // proses berbeda (id lalu en) berjalan terhadap organisasi demo yang
      // sama, dan urutan kunci unit_mapping yang dikembalikan backend pada
      // load berikutnya tidak selalu sama dengan urutan saat baris itu
      // ditambahkan di sesi sebelumnya (JSONB Postgres tidak menjamin
      // urutan kunci). Indeks baris tetap sempat salah menimpa baris
      // KARDIO yang sudah ada dan menghapusnya dari pemetaan tersimpan;
      // .last() selalu mengenai baris yang baru saja ditambahkan lewat
      // klik Tambah pemetaan di atas, apa pun urutan baris-baris sebelumnya.
      const newCodeInput = page.locator('input[placeholder="RAD"]').last()
      const newUnitSelect = page.locator('select').last()
      await newCodeInput.fill('ONKO')
      await newUnitSelect.selectOption({ label: 'Oncology (ONCO)' })
      await page.getByRole('button', { name: text.saveButton }).click()
      await page.waitForSelector(`text=${text.successMessage}`, { timeout: 10000 })
      await page.waitForTimeout(300)
      await measureUnitMapping(page, '05', locale, 'success', page.getByText(text.successMessage))
      const warningBlock = page.locator('[role="status"]', { hasText: 'RAD' })
      await measureUnitMapping(page, '05', locale, 'warning', warningBlock)
    },
    annotate: ({ locale }) => unitMappingAnnotationsFor('05', locale, ['success', 'warning'])
  }
]
