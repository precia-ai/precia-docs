/**
 * Alur transaksi dari SIMRS MEDICCA ke PRECIA.
 *
 * Spec ini menangkap dua sistem sekaligus:
 *
 *   1. Sisi PRECIA (langkah 01, 09 dan 10). Memakai `role` sehingga helper
 *      login standar dipakai, dengan akun yang benar benar berada di dalam
 *      organisasi tenant MEDICCA, bukan organisasi platform. Tanpa itu
 *      tangkapan layar akan menampilkan data organisasi lain dan menyesatkan
 *      pembaca.
 *   2. Sisi MEDICCA (langkah 02 sampai 08). MEDICCA bukan aplikasi PRECIA,
 *      jadi spec ini tidak memakai `role` melainkan login sendiri di
 *      preActions memakai kredensial MEDICCA.
 *
 * Variabel lingkungan yang dibutuhkan (lihat .env.local.example):
 *   PRECIA_BASE_URL
 *   PRECIA_DEMO_MDOC_EMAIL / PRECIA_DEMO_MDOC_PASSWORD
 *   MEDICCA_BASE_URL
 *   MEDICCA_ADMIN_USERNAME / MEDICCA_ADMIN_PASSWORD
 *   MEDICCA_OPERATOR_USERNAME / MEDICCA_OPERATOR_PASSWORD
 *
 * Catatan bahasa: antarmuka MEDICCA hanya tersedia dalam Bahasa Indonesia.
 * Spec tetap dijalankan untuk kedua locale supaya halaman dokumentasi versi
 * Inggris memiliki berkas gambar sendiri, tetapi isi layar MEDICCA pada kedua
 * berkas identik dan berbahasa Indonesia. Halaman PRECIA memang berganti
 * bahasa mengikuti locale.
 *
 * Catatan data: langkah yang menampilkan formulir hanya mengisi kolom dan
 * tidak pernah menekan tombol simpan, supaya menjalankan ulang generator
 * tidak menambah pasien, registrasi, atau akun baru pada basis data MEDICCA
 * dev, dan tidak mengubah hak akses yang sedang berlaku.
 *
 * Catatan anotasi: seluruh kotak anotasi dihitung dari bounding box elemen
 * nyata saat preActions selesai, bukan dari koordinat tetap. Fungsi measure()
 * melempar galat bila tidak ada satu pun elemen yang terukur, sehingga
 * screenshot tanpa anotasi tidak mungkin dihasilkan.
 *
 * Langkah 09 dan 10 (daftar kerja dan detail transaksi di PRECIA) memakai
 * kasus nyata yang diverifikasi ulang pada 23 Agustus 2026: pasien
 * DEWI LESTARI CONTOH (No RM 000004, Poliklinik Umum), didaftarkan lewat
 * skrip verifikasi terpisah yang benar-benar menekan tombol simpan (generator
 * ini sendiri tidak pernah menyimpan, lihat catatan data di atas), lalu
 * transaksinya muncul otomatis di PRECIA dalam hitungan detik lewat worker
 * MEDICCA yang berjalan terus-menerus. Ini bukti pertama alur MEDICCA sampai
 * ke PRECIA sejak perbaikan panjang kode transaksi dan penargetan organisasi;
 * sebelumnya daftar kerja ini selalu kosong. TX_CODE dan TX_ID di bawah
 * merujuk transaksi itu; ganti keduanya bila kasus itu suatu saat dibersihkan
 * dari data dev.
 */
const MEDICCA_BASE = process.env.MEDICCA_BASE_URL || 'https://medicca-dev.precia.site'
const MEDICCA_LOGIN_URL = `${MEDICCA_BASE}/login.php`
const TX_CODE = '{2308202613124489A4962D9641FCE2D2BC5895164EF479}'
const TX_ID = '5d85b627-8a1d-4f62-9585-d3cdd26a3e93'
const VIEWPORT = { width: 1440, height: 900 }
const PRECIA_ROLE = 'MDOC'

/** Kotak anotasi hasil pengukuran preActions, dikunci per id spec. */
const measured = Object.create(null)

function mediccaCredentials(kind) {
  const username = process.env[`MEDICCA_${kind}_USERNAME`]
  const password = process.env[`MEDICCA_${kind}_PASSWORD`]
  if (!username || !password) {
    throw new Error(
      `Missing env vars MEDICCA_${kind}_USERNAME / MEDICCA_${kind}_PASSWORD. ` +
        'Copy .env.local.example to .env.local and fill in the MEDICCA accounts.'
    )
  }
  return { username, password }
}

async function loginToMedicca(page, kind) {
  const { username, password } = mediccaCredentials(kind)
  await page.goto(MEDICCA_LOGIN_URL, { waitUntil: 'networkidle' })
  await page.waitForSelector('#username', { timeout: 15000 })
  await page.fill('#username', username)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
}

/**
 * Mengukur bounding box sejumlah locator dan menyimpannya sebagai anotasi
 * kotak. Melempar bila tidak ada satu pun elemen yang terukur, supaya tidak
 * pernah ada screenshot tanpa anotasi.
 */
async function measure(page, id, locators, padding = 6) {
  const boxes = []
  for (const locator of locators) {
    const target = typeof locator === 'string' ? page.locator(locator).first() : locator
    let box = null
    try {
      box = await target.boundingBox()
    } catch (err) {
      box = null
    }
    if (!box || box.width <= 0 || box.height <= 0) continue
    const x = Math.max(0, Math.round(box.x - padding))
    const y = Math.max(0, Math.round(box.y - padding))
    boxes.push({
      type: 'box',
      x,
      y,
      width: Math.min(VIEWPORT.width - x, Math.round(box.width + padding * 2)),
      height: Math.min(VIEWPORT.height - y, Math.round(box.height + padding * 2))
    })
  }
  if (boxes.length === 0) throw new Error(`No annotation target resolved for ${id}`)
  measured[id] = boxes
}

function annotationsFor(id) {
  return () => {
    const boxes = measured[id]
    if (!boxes || boxes.length === 0) throw new Error(`Annotations for ${id} were never measured`)
    return boxes
  }
}

function baseSpec(stepSlug, preActions, extra = {}) {
  const id = `integrasi-simrs__medicca__${stepSlug}`
  return {
    id,
    section: 'integrasi-simrs',
    pageSlug: 'medicca',
    stepSlug,
    viewport: VIEWPORT,
    preActions: (page, ctx) => preActions(page, id, ctx),
    annotate: annotationsFor(id),
    ...extra
  }
}

/** Langkah pada aplikasi PRECIA: pakai helper login bawaan plus route. */
function preciaSpec(stepSlug, route, preActions) {
  return baseSpec(stepSlug, preActions, { role: PRECIA_ROLE, route })
}

/** Langkah pada aplikasi MEDICCA: tanpa role dan tanpa route. */
function mediccaSpec(stepSlug, preActions) {
  return baseSpec(stepSlug, preActions)
}

module.exports = [
  // --- Bagian 1. Penyiapan di PRECIA ---
  preciaSpec('01-unit-poliklinik-di-precia', '/units', async (page, id) => {
    await page.waitForSelector('a[href^="/units/"]', { timeout: 20000 })
    await page.waitForTimeout(1200)
    await measure(page, id, [
      'a[href^="/units/"] >> nth=1',
      'a[href^="/units/"] >> nth=2',
      'a[href^="/units/"] >> nth=3'
    ])
  }),

  // --- Bagian 2. Penyiapan di MEDICCA, dikerjakan administrator ---
  mediccaSpec('02-hak-akses-petugas-loket', async (page, id) => {
    await loginToMedicca(page, 'ADMIN')
    await page.goto(`${MEDICCA_BASE}/lokuserlevelslist.php`, { waitUntil: 'networkidle' })
    await page.click('a[href="userpriv.php?userlevelid=2"]')
    await page.waitForSelector('#btn-submit', { timeout: 15000 })
    await page.waitForTimeout(600)
    await measure(page, id, [
      page.locator('table.ewjtable tr', { hasText: 'REGISTRASI PASIEN' }).first(),
      page.locator('table.ewjtable tr', { hasText: 'HISTORI REGISTRASI' }).first(),
      '#btn-submit'
    ])
  }),

  mediccaSpec('03-akun-petugas-loket', async (page, id) => {
    await loginToMedicca(page, 'ADMIN')
    await page.goto(`${MEDICCA_BASE}/vlokpetugaslist.php`, { waitUntil: 'networkidle' })
    await page.click('a.ew-add-edit.ew-add[data-table="vlokpetugas"]')
    await page.waitForSelector('#x_Nama_Petugas', { timeout: 15000 })
    await page.fill('#x_Nama_Petugas', 'AYU PETUGAS LOKET')
    await page.fill('#x_NIK', '3201010101990004')
    await page.fill('#x_Username', 'loket04')
    await page.fill('#x_Password', 'ContohKataSandi')
    await page.selectOption('#x_Userlevel', '2')
    await page.waitForTimeout(400)
    await measure(page, id, [
      '#x_Username',
      '#x_Password',
      '#x_Userlevel',
      '.modal-footer button[type="submit"]',
      '.modal-footer .btn-primary'
    ])
  }),

  // --- Bagian 3. Membuat transaksi di MEDICCA, dikerjakan petugas loket ---
  mediccaSpec('04-masuk-ke-medicca', async (page, id) => {
    await page.goto(MEDICCA_LOGIN_URL, { waitUntil: 'networkidle' })
    await page.waitForSelector('#username', { timeout: 15000 })
    await measure(page, id, ['#username', '#password', 'button[type="submit"]'])
  }),

  mediccaSpec('05-daftar-pasien', async (page, id) => {
    await loginToMedicca(page, 'OPERATOR')
    await page.goto(`${MEDICCA_BASE}/lokpasienlist.php`, { waitUntil: 'networkidle' })
    await page.waitForSelector('a.ew-add-edit.ew-add[data-table="lokpasien"]', { timeout: 15000 })
    await measure(page, id, [
      'nav a.nav-link.active',
      'a.ew-add-edit.ew-add[data-table="lokpasien"]',
      'tbody tr:first-child a[href^="lokdaftaradd.php"]'
    ])
  }),

  mediccaSpec('06-formulir-pasien-baru', async (page, id) => {
    await loginToMedicca(page, 'OPERATOR')
    await page.goto(`${MEDICCA_BASE}/lokpasienlist.php`, { waitUntil: 'networkidle' })
    await page.click('a.ew-add-edit.ew-add[data-table="lokpasien"]')
    await page.waitForSelector('#x_Nama_Pasien', { timeout: 15000 })
    await page.fill('#x_Nama_Pasien', 'DEWI LESTARI CONTOH')
    await page.fill('#x_No_KTP', '3171010101900004')
    await page.fill('#x_Tempat_Lahir', 'Bandung')
    await page.fill('#x_Tgl_Lahir', '15-06-1982')
    await page.fill('#x_Alamat', 'Jalan Melati No 12')
    await page.waitForTimeout(400)
    await measure(page, id, [
      '#x_Nama_Pasien',
      '#el_lokpasien_Id_Kelurahan',
      '.modal-footer button[type="submit"]',
      '.modal-footer .btn-primary'
    ])
  }),

  mediccaSpec('07-formulir-registrasi-rawat-jalan', async (page, id) => {
    await loginToMedicca(page, 'OPERATOR')
    await page.goto(`${MEDICCA_BASE}/lokpasienlist.php`, { waitUntil: 'networkidle' })
    await page.locator('tbody tr a[href^="lokdaftaradd.php"]').first().click()
    await page.waitForSelector('#el_lokdaftar_Id_Poliklinik', { timeout: 15000 })
    await page.locator('input[name="x_Id_Poliklinik"]').nth(1).check()
    await page.locator('input[name="x_Id_BiayaDaftar"]').nth(1).check()
    await page.waitForTimeout(800)
    await measure(page, id, [
      '#el_lokdaftar_Id_Poliklinik',
      '#el_lokdaftar_Id_BiayaDaftar',
      'button[type="submit"]'
    ])
  }),

  mediccaSpec('08-histori-registrasi', async (page, id) => {
    await loginToMedicca(page, 'OPERATOR')
    await page.goto(`${MEDICCA_BASE}/lokdaftarlist.php`, { waitUntil: 'networkidle' })
    await page.waitForSelector('tbody tr', { timeout: 15000 })
    await measure(page, id, ['nav a.nav-link.active', 'tbody tr:first-child'])
  }),

  // --- Bagian 4. Memeriksa hasilnya di PRECIA ---
  preciaSpec('09-daftar-kerja-transaksi-precia', '/clinical?unit=general', async (page, id) => {
    const row = page.locator('tbody tr', { hasText: TX_CODE })
    await row.first().waitFor({ timeout: 20000 })
    await page.waitForTimeout(1000)
    await measure(page, id, ['span.inline-flex.rounded-full', row])
  }),

  preciaSpec('10-detail-transaksi-precia', `/clinical/transactions/${TX_ID}`, async (page, id) => {
    await page.locator('h1').first().waitFor({ timeout: 20000 })
    await page.waitForTimeout(1200)
    await measure(page, id, [
      page.locator('h1').first(),
      page.locator('p', { hasText: 'Kunjungan' }).first(),
      page.locator('div.rounded-lg.border', { hasText: 'Poliklinik Umum' }).last()
    ])
  })
]
