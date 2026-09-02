/**
 * Alur transaksi dari SIMRS Khanza ke PRECIA (lingkungan dev).
 *
 * Tiga sumber tangkapan layar:
 *   1. Halaman pengaturan Integrasi SIMRS di PRECIA (peran SUP), untuk
 *      menunjukkan pemilihan adapter Khanza pada form.
 *   2. Klien operator Khanza yang disajikan lewat noVNC. Spec ini memakai URL
 *      penuh pada `route` dan TIDAK memakai `role`, karena tidak ada login
 *      PRECIA di sisi Khanza.
 *   3. Halaman daftar kerja dan detail transaksi PRECIA yang terbentuk dari
 *      kasus Khanza 2026/07/28/000001.
 *   4. Langkah 08 dan 09 (arah balik, hasil AI ditarik ke Khanza) BELUM
 *      TERBUKTI. Lihat komentar pada masing-masing spec untuk daftar
 *      asumsi yang wajib diverifikasi lebih dulu: URL portal webapps/,
 *      apakah kredensial klien Swing juga berlaku di sana, dan apakah
 *      kasus contoh sudah punya baris hasil di precia_result_in.
 *
 * KLIEN KHANZA HANYA MERESPONS KEYBOARD, DAN INI SUDAH DIVERIFIKASI.
 * Setiap peristiwa mouse yang masuk ke jendela Java memicu
 * NoClassDefFoundError jdk/swing/interop/SwingInterOpUtils dari listener
 * JFXPanel, sehingga thread AWT-EventQueue mati dan peristiwa tersebut hilang
 * sebelum sampai ke komponen. Peristiwa keyboard tidak melewati jalur itu,
 * jadi mnemonik Alt dan navigasi menu tetap bekerja. Karena itu seluruh
 * preActions di bawah memakai keyboard, bukan page.mouse.
 *
 * Sesi X di kontainer klien Khanza bersifat persisten dan dipakai bergantian
 * oleh kedua locale, jadi setiap spec Khanza selalu memanggil resetKhanza()
 * lebih dulu supaya berangkat dari kondisi yang sama, yaitu belum login dan
 * tanpa jendela modul yang terbuka.
 *
 * Kredensial operator Khanza dibaca dari env KHANZA_UI_USER dan
 * KHANZA_UI_PASSWORD di .env.local, tidak pernah ditulis di file ini.
 */

const KHANZA_URL = process.env.KHANZA_UI_URL || 'https://khanza-ui-dev.precia.site'

/**
 * Base URL portal web terpisah (webapps/) tempat preciahasil.php berada.
 * BELUM DIKONFIRMASI: nilai bawaan di bawah adalah tebakan berpola sama
 * dengan KHANZA_UI_URL, bukan alamat yang sudah diverifikasi berjalan.
 * Set KHANZA_WEBAPPS_URL di .env.local begitu tim infrastruktur
 * mengonfirmasi alamat sesungguhnya.
 */
function khanzaWebappsUrl(pathSuffix) {
  const base = (process.env.KHANZA_WEBAPPS_URL || 'https://khanza-webapps-dev.precia.site').replace(/\/$/, '')
  return `${base}${pathSuffix}`
}

// Diperbarui 2026-09-02 setelah pemetaan unit per poli diperbaiki
// (fix/khanza-unit-mapping-and-results-access): nilai lama di atas berasal
// dari UNITPRECIA yang dihardcode dan sudah dihapus, dan tidak lagi
// merepresentasikan perilaku sungguhan. Kasus di bawah nyata: didaftarkan
// pada poli U0008 (Radiologi) di Khanza dev, didorong otomatis oleh
// khanza-precia-service-dev yang sudah berjalan (bukan panggilan API
// terkontrol), dan diverifikasi lewat audit trail PRECIA.
const TX_ID = '1db84be0-254a-4ff5-b803-78f958f636b5'
const TX_CODE = '2026-09-02-000001-ai-ecg-digitization'
const RAD_UNIT_ID = '303b3072-60af-4313-be3f-70a95b1571bf'

/**
 * Kotak anotasi yang diukur dari elemen sungguhan saat preActions berjalan.
 * Kunci: "<stepSlug>:<locale>:<nama>". annotate() melempar galat kalau kosong,
 * supaya tangkapan layar tanpa anotasi tidak mungkin diterbitkan.
 */
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

function annotationsFor(step, locale, names) {
  const boxes = names.map((name) => measured[keyOf(step, locale, name)]).filter(Boolean)
  if (boxes.length === 0) {
    throw new Error(`Tidak ada anotasi yang terukur untuk langkah ${step} (${locale}).`)
  }
  return boxes
}

/* ------------------------------------------------------------------ */
/* Bantuan sisi Khanza (keyboard saja)                                  */
/* ------------------------------------------------------------------ */

async function openKhanza(page) {
  await page.waitForSelector('canvas', { timeout: 45000 })
  await page.waitForTimeout(4000)
}

async function press(page, key, settleMs = 800) {
  await page.keyboard.press(key)
  await page.waitForTimeout(settleMs)
}

async function typeSlow(page, text) {
  for (const ch of text) {
    await page.keyboard.press(ch)
    await page.waitForTimeout(150)
  }
}

/**
 * Membaca keadaan sesi langsung dari piksel kanvas noVNC.
 *
 * Layar jarak jauh berukuran 1600x900 dan digambar apa adanya pada kanvas,
 * jadi koordinat di bawah memakai satuan layar jarak jauh, bukan satuan
 * viewport peramban. Wilayah yang dibaca adalah tulisan "Registrasi" pada
 * baris tombol: berwarna gelap saat operator sudah masuk dan pucat saat tombol
 * itu masih nonaktif. Ambang 0.06 diambil dari pengukuran kedua keadaan.
 */
const REGISTRASI_LABEL = { x: 108, y: 58, width: 68, height: 20 }

/** Wilayah kotak login pada layar jarak jauh, dipakai untuk mendeteksi kotak. */
const LOGIN_DIALOG_AREA = { x: 655, y: 385, width: 285, height: 165 }

async function darkRatio(page, region) {
  return page.evaluate((r) => {
    const canvas = document.querySelector('canvas')
    const ctx = canvas.getContext('2d')
    const { data } = ctx.getImageData(r.x, r.y, r.width, r.height)
    let dark = 0
    for (let i = 0; i < data.length; i += 4) {
      const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      if (luminance < 120) dark += 1
    }
    return dark / (r.width * r.height)
  }, region)
}

async function isLoggedIn(page) {
  // Terukur 0.107 saat sudah masuk dan 0.000 saat belum masuk.
  return (await darkRatio(page, REGISTRASI_LABEL)) > 0.05
}

async function isLoginDialogOpen(page) {
  // Terukur 0.135 saat kotak login terbuka dan 0.000 saat tidak ada kotak.
  return (await darkRatio(page, LOGIN_DIALOG_AREA)) > 0.05
}

async function expectSession(page, shouldBeLoggedIn, step) {
  const actual = await isLoggedIn(page)
  if (actual !== shouldBeLoggedIn) {
    throw new Error(
      `Keadaan sesi Khanza tidak sesuai pada langkah ${step}: diharapkan ${
        shouldBeLoggedIn ? 'sudah masuk' : 'belum masuk'
      }.`
    )
  }
}

function khanzaCredentials() {
  const user = process.env.KHANZA_UI_USER
  const pass = process.env.KHANZA_UI_PASSWORD
  if (!user || !pass) {
    throw new Error('Set KHANZA_UI_USER dan KHANZA_UI_PASSWORD di .env.local')
  }
  return { user, pass }
}

/**
 * Membuka menu Program lalu memilih butir pertama. Butir itu berbunyi "Log In"
 * saat operator belum masuk dan "Log Out" saat sudah masuk.
 * Alt+P membuka menu Presensi Pegawai, ArrowLeft berpindah ke menu Program.
 *
 * Jangan panggil fungsi ini saat kotak login sedang terbuka. Kotak login
 * bersifat modal, sehingga baris menu tidak terbuka dan tombol Enter justru
 * menekan tombol Log-in dengan kolom kosong.
 */
async function chooseFirstProgramItem(page) {
  await press(page, 'Alt+p', 1000)
  await press(page, 'ArrowLeft', 1000)
  await press(page, 'ArrowDown', 600)
  await press(page, 'Enter', 2500)
}

/**
 * Menutup kotak login yang mungkin masih terbuka dari langkah sebelumnya.
 *
 * Kotak login Khanza tidak dapat ditutup dengan Escape maupun mnemonik, dan
 * tombol Batal tidak punya mnemonik, sehingga satu-satunya jalan adalah
 * menekan salah satu tombol di dalamnya. Fokus berpindah dalam empat
 * perhentian, yaitu ID Admin, Password, tombol Log-in, dan tombol Batal,
 * sedangkan posisi fokus saat fungsi ini dipanggil tidak dapat dibaca.
 *
 * Karena itu setiap perhentian dibersihkan lalu diisi kredensial yang sama,
 * sehingga kedua kolom teks pasti terisi benar apa pun titik awalnya, lalu
 * spasi ditekan sambil berpindah perhentian sampai kotak benar-benar tertutup.
 * Keadaan kotak dibaca dari piksel kanvas sebelum setiap penekanan, supaya
 * spasi tidak pernah jatuh ke layar utama.
 *
 * Pengisian kredensial di setiap perhentian hanya berlaku bila nama pengguna
 * dan kata sandi operator bernilai sama. Bila berbeda, kotak tetap ditutup
 * lewat tombol Batal.
 */
async function fillEveryFocusStop(page, value) {
  // Empat kali Tab mengembalikan fokus ke perhentian semula, sehingga posisi
  // fokus tidak berubah setelah fungsi ini selesai.
  for (let i = 0; i < 4; i += 1) {
    await press(page, 'Control+a', 200)
    await press(page, 'Delete', 250)
    await typeSlow(page, value)
    await press(page, 'Tab', 400)
  }
}

async function closeLoginDialogIfOpen(page) {
  if (!(await isLoginDialogOpen(page))) return
  const { user, pass } = khanzaCredentials()
  const sameCredential = user === pass

  for (let stop = 0; stop < 4; stop += 1) {
    // Escape menutup kotak pesan kesalahan yang mungkin muncul dari percobaan
    // masuk sebelumnya, tetapi tidak menutup kotak login itu sendiri.
    await press(page, 'Escape', 500)
    if (sameCredential) {
      // Isi ulang kedua kolom teks supaya spasi yang sempat masuk pada
      // perhentian sebelumnya tidak merusak kredensial.
      await fillEveryFocusStop(page, user)
    }
    await press(page, 'Space', 3000)
    if (!(await isLoginDialogOpen(page))) return
    await press(page, 'Tab', 400)
  }
  throw new Error('Kotak login Khanza tidak dapat ditutup.')
}

/**
 * Mengembalikan klien Khanza ke kondisi awal: belum login, tanpa jendela modul,
 * tanpa kotak login yang menggantung.
 *
 * Ctrl+F4 menutup jendela modul yang sedang terbuka; fluxbox ikut menangkap
 * kombinasi itu dan berpindah ruang kerja, jadi Ctrl+F1 dipakai untuk kembali
 * ke Workspace 1. Keluar sesi dilakukan lewat menu Program, dan hanya
 * dijalankan bila pembacaan kanvas menunjukkan operator memang sedang masuk.
 */
async function resetKhanza(page) {
  await press(page, 'Escape', 400)
  await press(page, 'Escape', 400)
  await closeLoginDialogIfOpen(page)
  for (let i = 0; i < 2; i += 1) {
    await press(page, 'Control+F4', 1600)
    await press(page, 'Control+F1', 1600)
  }
  // Baris menu kadang tidak menanggapi Alt+P pada percobaan pertama sesudah
  // sebuah jendela modul baru saja ditutup, jadi keluar sesi dicoba beberapa
  // kali sampai pembacaan kanvas menunjukkan operator benar-benar keluar.
  for (let attempt = 0; attempt < 3 && (await isLoggedIn(page)); attempt += 1) {
    await press(page, 'Escape', 400)
    await chooseFirstProgramItem(page)
    await page.waitForTimeout(1500)
  }
  await expectSession(page, false, 'reset')
}

async function loginKhanza(page) {
  const { user, pass } = khanzaCredentials()
  await chooseFirstProgramItem(page)
  if (!(await isLoginDialogOpen(page))) {
    throw new Error('Kotak login Khanza tidak terbuka saat proses masuk.')
  }
  await typeSlow(page, user)
  await press(page, 'Tab', 500)
  await typeSlow(page, pass)
  await press(page, 'Enter', 4000)
  if (!(await isLoggedIn(page)) && (await isLoginDialogOpen(page))) {
    // Sebagian rilis Khanza tidak mengikat Enter ke tombol Log-in. Pindahkan
    // fokus dari kolom Password ke tombol Log-in lalu tekan spasi.
    await press(page, 'Tab', 500)
    await press(page, 'Space', 4000)
  }
  await expectSession(page, true, 'login')
}

module.exports = [
  {
    id: 'integrasi-simrs__khanza__01-pengaturan-adapter',
    section: 'integrasi-simrs',
    pageSlug: 'khanza',
    stepSlug: '01-pengaturan-adapter',
    route: '/settings/simrs-integration',
    role: 'SUP',
    viewport: { width: 1440, height: 900 },
    preActions: async (page, { locale }) => {
      await page.waitForSelector('#simrs-adapter', { timeout: 20000 })
      await page.selectOption('#simrs-adapter', 'khanza')
      // Nilai contoh, tidak disimpan, hanya supaya tangkapan layar tidak
      // menampilkan endpoint organisasi lain yang kebetulan tersimpan.
      await page.fill('#simrs-endpoint-url', 'https://simrs.contoh-rs.example/khanza')
      await page.waitForTimeout(800)
      await measure(page, '01', locale, 'adapter', page.locator('#simrs-adapter'))
    },
    annotate: ({ locale }) => annotationsFor('01', locale, ['adapter'])
  },
  {
    id: 'integrasi-simrs__khanza__02-buka-klien-khanza',
    section: 'integrasi-simrs',
    pageSlug: 'khanza',
    stepSlug: '02-buka-klien-khanza',
    route: KHANZA_URL,
    viewport: { width: 1440, height: 900 },
    preActions: async (page) => {
      await openKhanza(page)
      await resetKhanza(page)
    },
    annotate: [
      // Menu Program di baris menu.
      { type: 'box', x: 4, y: 64, width: 76, height: 24 },
      // Status di kiri bawah, masih berbunyi Log Out karena belum ada operator.
      { type: 'box', x: 4, y: 811, width: 232, height: 20 },
      { type: 'arrow', from: { x: 300, y: 300 }, to: { x: 60, y: 92 } }
    ]
  },
  {
    id: 'integrasi-simrs__khanza__03-dialog-login',
    section: 'integrasi-simrs',
    pageSlug: 'khanza',
    stepSlug: '03-dialog-login',
    route: KHANZA_URL,
    viewport: { width: 1440, height: 900 },
    preActions: async (page) => {
      await openKhanza(page)
      await resetKhanza(page)
      await chooseFirstProgramItem(page)
      if (!(await isLoginDialogOpen(page))) {
        throw new Error('Kotak login Khanza tidak terbuka pada langkah 03.')
      }
    },
    annotate: [
      // Kolom ID Admin.
      { type: 'box', x: 652, y: 428, width: 186, height: 24 },
      // Kolom Password.
      { type: 'box', x: 652, y: 454, width: 186, height: 24 },
      // Tombol Log-in.
      { type: 'box', x: 606, y: 497, width: 88, height: 28 }
    ]
  },
  {
    id: 'integrasi-simrs__khanza__04-berhasil-masuk',
    section: 'integrasi-simrs',
    pageSlug: 'khanza',
    stepSlug: '04-berhasil-masuk',
    route: KHANZA_URL,
    viewport: { width: 1440, height: 900 },
    preActions: async (page) => {
      await openKhanza(page)
      await resetKhanza(page)
      await loginKhanza(page)
    },
    annotate: [
      // ID operator disamarkan: pada deployment ini password sama persis
      // dengan nomor induk, sehingga menampilkannya berarti menerbitkan
      // kredensial yang masih berlaku.
      { type: 'redact', x: 120, y: 811, width: 116, height: 20 },
      // Status di kiri bawah kini menampilkan bahwa operator sudah masuk.
      { type: 'box', x: 4, y: 811, width: 232, height: 20 },
      // Tombol Registrasi yang sudah aktif.
      { type: 'box', x: 78, y: 92, width: 88, height: 28 }
    ]
  },
  {
    id: 'integrasi-simrs__khanza__05-daftar-registrasi',
    section: 'integrasi-simrs',
    pageSlug: 'khanza',
    stepSlug: '05-daftar-registrasi',
    route: KHANZA_URL,
    viewport: { width: 1440, height: 900 },
    preActions: async (page) => {
      await openKhanza(page)
      await resetKhanza(page)
      await loginKhanza(page)
      await press(page, 'Alt+r', 7000)
      // Baris judul kolom tabel registrasi hanya tampil bila jendela terbuka.
      const header = await darkRatio(page, { x: 10, y: 150, width: 1580, height: 22 })
      if (header < 0.01) {
        throw new Error('Jendela Registrasi tidak terbuka pada langkah 05.')
      }
    },
    annotate: [
      // Judul jendela Registrasi Periksa Hari Ini.
      { type: 'box', x: 2, y: 124, width: 180, height: 18 },
      // Kolom No.Rawat pada tabel registrasi.
      { type: 'box', x: 72, y: 180, width: 100, height: 20 },
      // Penyaring Periode di bagian bawah jendela.
      { type: 'box', x: 8, y: 722, width: 282, height: 26 }
    ]
  },
  {
    id: 'integrasi-simrs__khanza__06-daftar-kerja-precia',
    section: 'integrasi-simrs',
    pageSlug: 'khanza',
    stepSlug: '06-daftar-kerja-precia',
    route: `/clinical?unit=${RAD_UNIT_ID}`,
    role: 'DEMOSAD',
    viewport: { width: 1440, height: 900 },
    preActions: async (page, { locale }) => {
      const row = page.locator('tbody tr', { hasText: TX_CODE })
      await row.first().waitFor({ timeout: 20000 })
      await page.waitForTimeout(800)
      await measure(page, '06', locale, 'row', row)
    },
    annotate: ({ locale }) => annotationsFor('06', locale, ['row'])
  },
  {
    id: 'integrasi-simrs__khanza__07-detail-transaksi',
    section: 'integrasi-simrs',
    pageSlug: 'khanza',
    stepSlug: '07-detail-transaksi',
    route: `/clinical/transactions/${TX_ID}`,
    role: 'DEMOSAD',
    viewport: { width: 1440, height: 900 },
    preActions: async (page, { locale }) => {
      await page.locator('h1').first().waitFor({ timeout: 20000 })
      await page.waitForTimeout(1500)
      await measure(page, '07', locale, 'kode', page.locator('h1'))
      await measure(page, '07', locale, 'catatan', page.locator('p', { hasText: 'no_rawat=' }))
      await measure(
        page,
        '07',
        locale,
        'unit',
        page.locator('div.rounded-lg.border', { hasText: 'Radiologi' }).last()
      )
    },
    annotate: ({ locale }) => annotationsFor('07', locale, ['kode', 'catatan', 'unit'])
  },

  /* ------------------------------------------------------------------ */
  /* Arah balik: hasil AI ditarik kembali ke Khanza                       */
  /*                                                                      */
  /* BELUM TERBUKTI. Langkah 08 dan 09 di bawah belum pernah dijalankan   */
  /* sampai selesai terhadap host hidup, dan wajib diverifikasi lebih     */
  /* dulu sebelum dianggap siap eksekusi tanpa pengawasan:                */
  /*                                                                      */
  /*   1. URL portal webapps/preciahasil.php belum diketahui. Env         */
  /*      KHANZA_WEBAPPS_URL di bawah adalah tebakan (subdomain sejenis   */
  /*      KHANZA_UI_URL, path webapps/), belum dikonfirmasi ke tim        */
  /*      infrastruktur.                                                  */
  /*   2. Portal ini punya login sendiri (session ses_admin_login),       */
  /*      terpisah dari klien operator Swing yang dipakai langkah 02-05.  */
  /*      Selektor #TxtIsi1 / #TxtIsi2 / tombol submit "Log-In" diambil   */
  /*      dari pembacaan simrs/SIMRS-Khanza/webapps/index.php, bukan dari */
  /*      DOM sungguhan, jadi tetap perlu dicocokkan saat host hidup.     */
  /*      Query login memeriksa tabel `admin` maupun `user` dengan skema  */
  /*      aes_encrypt yang sama dengan klien Swing, sehingga              */
  /*      KHANZA_UI_USER/KHANZA_UI_PASSWORD KEMUNGKINAN BESAR berlaku di  */
  /*      sini juga, tetapi ini asumsi, bukan fakta terverifikasi.        */
  /*   3. Kasus 2026/07/29/000001 dipakai sebagai contoh karena sisi      */
  /*      PRECIA-nya sudah terbukti selesai (lihat                       */
  /*      integrasi-simrs__khanza-bukti-round-trip.config.js). Belum ada  */
  /*      kepastian baris hasilnya sudah muncul di precia_result_in pada  */
  /*      staging Khanza; kalau tabel kosong saat host hidup, ganti       */
  /*      KHANZA_RESULT_NO_RAWAT dengan kasus lain yang statusnya sudah   */
  /*      Selesai di PRECIA.                                              */
  /*                                                                      */
  /* Karena field selector di sini diturunkan dari kode PHP, bukan dari   */
  /* observasi, kedua langkah memakai waitForSelector dengan pesan galat  */
  /* eksplisit alih-alih delay tetap, supaya kegagalan selector terlihat  */
  /* jelas alih-alih menghasilkan tangkapan layar halaman galat.          */
  /* ------------------------------------------------------------------ */

  {
    id: 'integrasi-simrs__khanza__08-login-portal-hasil',
    section: 'integrasi-simrs',
    pageSlug: 'khanza',
    stepSlug: '08-login-portal-hasil',
    // PENDING: subdomain/path belum dikonfirmasi tim infrastruktur.
    route: khanzaWebappsUrl('/index.php'),
    viewport: { width: 1440, height: 900 },
    preActions: async (page, { locale }) => {
      const { user, pass } = khanzaCredentials()
      await page.waitForSelector('#TxtIsi1', { timeout: 20000 })
      await page.fill('#TxtIsi1', user)
      await page.fill('#TxtIsi2', pass)
      // Tangkapan layar diambil SEBELUM submit, supaya kolom password yang
      // terisi masih terlihat pada anotasi tanpa menerbitkan nilainya
      // (redact menutup kotak sebelum garis kotak digambar).
      await measure(page, '08', locale, 'user', page.locator('#TxtIsi1'))
      await measure(page, '08', locale, 'password', page.locator('#TxtIsi2'))
      await measure(page, '08', locale, 'tombol', page.locator('input[name="BtnLogin"]'))
      // Salin kotak password sebagai redaksi, memakai geometri yang sama.
      measured[keyOf('08', locale, 'password-redact')] = {
        ...measured[keyOf('08', locale, 'password')],
        type: 'redact'
      }
    },
    annotate: ({ locale }) => [
      ...annotationsFor('08', locale, ['password-redact']),
      ...annotationsFor('08', locale, ['user', 'password', 'tombol'])
    ]
  },
  {
    id: 'integrasi-simrs__khanza__09-halaman-hasil-ai',
    section: 'integrasi-simrs',
    pageSlug: 'khanza',
    stepSlug: '09-halaman-hasil-ai',
    // Berangkat dari halaman login yang sama seperti langkah 08: setiap
    // spec berjalan pada browser context baru (lihat run.js), jadi sesi
    // ses_admin_login TIDAK terbawa dari langkah 08 dan login harus
    // diulang di sini.
    route: khanzaWebappsUrl('/index.php'),
    viewport: { width: 1440, height: 900 },
    preActions: async (page, { locale }) => {
      const { user, pass } = khanzaCredentials()
      const noRawat = process.env.KHANZA_RESULT_NO_RAWAT || '2026/07/29/000001'

      await page.waitForSelector('#TxtIsi1', { timeout: 20000 })
      await page.fill('#TxtIsi1', user)
      await page.fill('#TxtIsi2', pass)
      await Promise.all([
        page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
        page.click('input[name="BtnLogin"]')
      ])

      await page.goto(khanzaWebappsUrl(`/preciahasil.php?no_rawat=${encodeURIComponent(noRawat)}`), {
        waitUntil: 'networkidle'
      })

      const row = page.locator('table tbody tr')
      try {
        await row.first().waitFor({ timeout: 20000 })
      } catch {
        throw new Error(
          `Tidak ada baris hasil untuk no_rawat ${noRawat}. Kemungkinan penyebab: login ke portal ` +
          'gagal (cek KHANZA_UI_USER/KHANZA_UI_PASSWORD berlaku di tabel admin/user portal ini), ' +
          'atau precia_result_in di staging Khanza belum berisi hasil untuk kasus ini. Ganti ' +
          'KHANZA_RESULT_NO_RAWAT dengan kasus lain yang statusnya sudah Selesai di PRECIA.'
        )
      }
      await page.waitForTimeout(500)

      await measure(page, '09', locale, 'form', page.locator('#no_rawat'))
      await measure(page, '09', locale, 'baris', row.first())
      const tandaiLink = row.first().locator('a', { hasText: /dibaca/i })
      if (await tandaiLink.count()) {
        await measure(page, '09', locale, 'tandai', tandaiLink)
      }
    },
    annotate: ({ locale }) =>
      annotationsFor('09', locale, ['form', 'baris', 'tandai'].filter((name) => measured[keyOf('09', locale, name)]))
  }
]
