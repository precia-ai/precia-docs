/**
 * Alur operator loket di SIMRS MEDICCA (dev).
 *
 * Berbeda dengan spec lain di folder ini, target screenshot bukan aplikasi
 * PRECIA melainkan aplikasi MEDICCA. Karena itu spec ini tidak memakai
 * field `role` (helper login PRECIA), melainkan login sendiri di preActions.
 *
 * Variabel lingkungan yang dibutuhkan (lihat .env.local.example):
 *   MEDICCA_BASE_URL
 *   MEDICCA_ADMIN_USERNAME
 *   MEDICCA_ADMIN_PASSWORD
 *   MEDICCA_OPERATOR_USERNAME
 *   MEDICCA_OPERATOR_PASSWORD
 *
 * Akun administrator adalah akun bawaan yang didefinisikan pada berkas
 * konfigurasi aplikasi MEDICCA, bukan baris pada tabel pegawai. Akun ini
 * hanya dipakai untuk dua langkah prasyarat (hak akses dan pembuatan akun
 * petugas). Sisa alur dijalankan sebagai petugas loket biasa.
 *
 * Catatan bahasa: antarmuka MEDICCA hanya tersedia dalam Bahasa Indonesia.
 * Spec tetap dijalankan untuk kedua locale supaya halaman dokumentasi versi
 * Inggris punya berkas gambar sendiri, tetapi isi layar pada kedua berkas
 * identik dan berbahasa Indonesia.
 *
 * Catatan data: langkah yang menampilkan formulir hanya mengisi kolom dan
 * tidak pernah menekan tombol simpan, supaya menjalankan ulang generator
 * tidak menambah pasien, registrasi, atau akun baru di basis data MEDICCA
 * dev, dan tidak mengubah hak akses yang sedang berlaku.
 *
 * Catatan anotasi: kotak anotasi dihitung dari bounding box elemen nyata
 * pada saat preActions selesai, bukan dari koordinat tetap. Dengan begitu
 * anotasi tetap menempel pada kontrol yang benar walaupun jumlah baris data
 * di MEDICCA dev berubah.
 */
const BASE = process.env.MEDICCA_BASE_URL || 'https://medicca-dev.precia.site'
const LOGIN_URL = `${BASE}/login.php`
const VIEWPORT = { width: 1440, height: 900 }

/** Kotak anotasi hasil pengukuran preActions, dikunci per id spec. */
const measured = Object.create(null)

function credentials(kind) {
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

async function loginAs(page, kind) {
  const { username, password } = credentials(kind)
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle' })
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

function spec(stepSlug, preActions) {
  const id = `integrasi-simrs__alur-operator-medicca__${stepSlug}`
  return {
    id,
    section: 'integrasi-simrs',
    pageSlug: 'alur-operator-medicca',
    stepSlug,
    viewport: VIEWPORT,
    preActions: (page, ctx) => preActions(page, id, ctx),
    annotate: annotationsFor(id)
  }
}

module.exports = [
  // --- Prasyarat, dikerjakan administrator MEDICCA ---
  spec('01-hak-akses-petugas-loket', async (page, id) => {
    await loginAs(page, 'ADMIN')
    await page.goto(`${BASE}/lokuserlevelslist.php`, { waitUntil: 'networkidle' })
    await page.click('a[href="userpriv.php?userlevelid=2"]')
    await page.waitForSelector('#btn-submit', { timeout: 15000 })
    await page.waitForTimeout(600)
    await measure(page, id, [
      page.locator('table.ewjtable tr', { hasText: 'REGISTRASI PASIEN' }).first(),
      page.locator('table.ewjtable tr', { hasText: 'HISTORI REGISTRASI' }).first(),
      '#btn-submit'
    ])
  }),

  spec('02-tambah-petugas-loket', async (page, id) => {
    await loginAs(page, 'ADMIN')
    await page.goto(`${BASE}/vlokpetugaslist.php`, { waitUntil: 'networkidle' })
    await page.click('a.ew-add-edit.ew-add[data-table="vlokpetugas"]')
    await page.waitForSelector('#x_Nama_Petugas', { timeout: 15000 })
    await page.fill('#x_Nama_Petugas', 'AYU OPERATOR LOKET')
    await page.fill('#x_NIK', '3201010101990003')
    await page.fill('#x_Username', 'loket03')
    await page.fill('#x_Password', 'ContohKataSandi')
    await page.selectOption('#x_Userlevel', '2')
    await page.waitForTimeout(400)
    await measure(page, id, ['#x_Username', '#x_Password', '#x_Userlevel', '.modal-footer button[type="submit"]'])
  }),

  // --- Alur petugas loket ---
  spec('03-halaman-login', async (page, id) => {
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle' })
    await page.waitForSelector('#username', { timeout: 15000 })
    await measure(page, id, ['#username', '#password', 'button[type="submit"]'])
  }),

  spec('04-daftar-pasien', async (page, id) => {
    await loginAs(page, 'OPERATOR')
    await page.goto(`${BASE}/lokpasienlist.php`, { waitUntil: 'networkidle' })
    await page.waitForSelector('a.ew-add-edit.ew-add[data-table="lokpasien"]', { timeout: 15000 })
    await measure(page, id, [
      '#ew-navbar',
      'a.ew-add-edit.ew-add[data-table="lokpasien"]',
      'tbody tr:first-child a[href^="lokdaftaradd.php"]'
    ])
  }),

  spec('05-form-pasien-baru', async (page, id) => {
    await loginAs(page, 'OPERATOR')
    await page.goto(`${BASE}/lokpasienlist.php`, { waitUntil: 'networkidle' })
    await page.click('a.ew-add-edit.ew-add[data-table="lokpasien"]')
    await page.waitForSelector('#x_Nama_Pasien', { timeout: 15000 })
    await page.fill('#x_Nama_Pasien', 'SITI RAHAYU CONTOH')
    await page.fill('#x_No_KTP', '3171010101900003')
    await page.fill('#x_Tempat_Lahir', 'Surabaya')
    await page.fill('#x_Tgl_Lahir', '02-11-1979')
    await page.fill('#x_Alamat', 'Jalan Kenanga No 7')
    await page.waitForTimeout(400)
    await measure(page, id, ['#x_Nama_Pasien', '#el_lokpasien_Id_Kelurahan', '.modal-footer button[type="submit"]'])
  }),

  spec('06-form-registrasi', async (page, id) => {
    await loginAs(page, 'OPERATOR')
    await page.goto(`${BASE}/lokpasienlist.php`, { waitUntil: 'networkidle' })
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

  spec('07-histori-registrasi', async (page, id) => {
    await loginAs(page, 'OPERATOR')
    await page.goto(`${BASE}/lokdaftarlist.php`, { waitUntil: 'networkidle' })
    await page.waitForSelector('tbody tr', { timeout: 15000 })
    await measure(page, id, [
      '#ew-navbar a[href="lokdaftarlist.php"]',
      'tbody tr:first-child'
    ])
  })
]
