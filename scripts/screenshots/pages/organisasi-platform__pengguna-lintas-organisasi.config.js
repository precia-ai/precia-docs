/**
 * Halaman pengguna lintas organisasi (platform-scope):
 *  - Daftar: /platform/users
 *  - Buat pengguna: /platform/users/create
 *
 * Kedua halaman memakai komponen yang sama dengan versi berlingkup organisasi
 * (UsersWorkspace / CreateUserForm di manajemen-pengguna), dibedakan oleh:
 *  - PlatformScopeNotice (banner "Menampilkan seluruh organisasi") di atas
 *  - CreateUserForm menerima allowOrganizationSelection sehingga kolom
 *    Organisasi jadi <select> berisi seluruh organisasi, bukan field terkunci
 *
 * Selector diverifikasi via boundingBox() langsung di app-dev.precia.site
 * (bukan tebakan dari kode saja), dan dari precia-fe/components/users/*.tsx:
 *  - banner scope: [role="note"]
 *  - tombol tambah: a[href="/platform/users/create"]
 *  - grid statistik: [class*="statsGrid"]
 *  - menu titik tiga per baris: table tbody tr:first-child button[aria-label]
 *  - dropdown menu aksi: [class*="menuDropdown"]
 *  - select organisasi: select[name="organization"] (TIDAK ada pada form
 *    org-scope, ini pembeda utama halaman ini)
 *  - kartu peran: label[class*="roleCard"], index 3 = Clinician (grid 2
 *    kolom: AI Engineer, Auditor, Clinical Administrator, Clinician, ...)
 *  - tombol submit: button[type="submit"]
 *  - banner sukses: [class*="successBanner"]
 */

const DEMO_ORG_ID = 'fd35fae1-e016-42f9-bc77-785359b5d284' // PRECIA Demo Booth (DEMO)
const ROLE_CARD_SELECTOR = 'label[class*="roleCard"]'
const CLINICIAN_ROLE_INDEX = 3
const BASE_URL = process.env.PRECIA_BASE_URL || 'https://app-dev.precia.site'

/**
 * /platform/users never reaches Playwright's "networkidle" (run.js's normal
 * page.goto wait condition): with ~20+ rows, Next.js keeps prefetching every
 * row's detail-page Link and the platform sidebar links in the background,
 * so background requests never fully stop. Confirmed by watching
 * page.on('request') for 90s: the request stream never quiets down, even
 * from a warm dev-server cache. Workaround for the two list-page shots:
 * leave `route` unset (skips run.js's networkidle goto) and navigate here
 * with 'domcontentloaded' + an explicit wait for the table instead.
 */
async function gotoUsersList(page) {
  await page.goto(`${BASE_URL}/platform/users`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  })
  await page.waitForSelector('table tbody tr', { timeout: 15000 })
  await page.waitForTimeout(500)
}

async function fillForm(page, { email, username } = {}) {
  await page.fill('input[name="email"]', email || 'lintas.org.contoh@precia.ai')
  await page.fill('input[name="username"]', username || 'lintas.org.contoh')
  await page.fill('input[name="full_name"]', 'Pengguna Lintas Organisasi Contoh')
  await page.fill('input[name="password"]', 'ContohAman123!')
  await page.selectOption('select[name="organization"]', DEMO_ORG_ID)
  const cards = await page.$$(ROLE_CARD_SELECTOR)
  await cards[CLINICIAN_ROLE_INDEX].click()
}

module.exports = [
  {
    id: 'organisasi-platform__pengguna-lintas-organisasi__01-daftar',
    section: 'organisasi-platform',
    pageSlug: 'pengguna-lintas-organisasi',
    stepSlug: '01-daftar',
    role: 'SUP',
    preActions: async (page) => {
      await gotoUsersList(page)
    },
    annotate: ({ locale }) => [
      // Banner "Menampilkan seluruh organisasi"
      { type: 'box', x: 288, y: 32, width: 1120, height: 62 },
      // Tombol "Tambah Pengguna" / "Add User" — right-aligned, lebar beda
      // per locale (teks EN lebih pendek), diukur boundingBox() per locale
      // supaya kotaknya pas menempel pada tombol, bukan menggantung kosong
      locale === 'en'
        ? { type: 'box', x: 1260, y: 127, width: 131, height: 40 }
        : { type: 'box', x: 1185, y: 127, width: 206, height: 40 },
      // Grid statistik (total / aktif / terkunci / menunggu)
      { type: 'box', x: 305, y: 212, width: 1086, height: 70 }
    ]
  },
  {
    id: 'organisasi-platform__pengguna-lintas-organisasi__02-menu-tindakan',
    section: 'organisasi-platform',
    pageSlug: 'pengguna-lintas-organisasi',
    stepSlug: '02-menu-tindakan',
    role: 'SUP',
    preActions: async (page) => {
      await gotoUsersList(page)
      await page.click('table tbody tr:first-child button[aria-label]')
      await page.waitForTimeout(300)
    },
    annotate: [
      // Tombol "Detail" pada baris
      { type: 'box', x: 1273, y: 471.5, width: 67, height: 32 },
      // Dropdown menu aksi (nonaktifkan/kunci/buka kunci)
      { type: 'box', x: 1226, y: 506.5, width: 148, height: 76 }
    ]
  },
  {
    id: 'organisasi-platform__pengguna-lintas-organisasi__03-form-kosong',
    section: 'organisasi-platform',
    pageSlug: 'pengguna-lintas-organisasi',
    stepSlug: '03-form-kosong',
    route: '/platform/users/create',
    role: 'SUP',
    fullPage: true,
    annotate: [
      // Banner "Menampilkan seluruh organisasi"
      { type: 'box', x: 288, y: 32, width: 1120, height: 62 },
      // Kolom Organisasi, jadi dropdown pilihan (beda dari form org-scope
      // yang field-nya terkunci ke organisasi pembuat)
      { type: 'box', x: 856, y: 374, width: 455, height: 65 }
    ]
  },
  {
    id: 'organisasi-platform__pengguna-lintas-organisasi__04-organisasi-terpilih',
    section: 'organisasi-platform',
    pageSlug: 'pengguna-lintas-organisasi',
    stepSlug: '04-organisasi-terpilih',
    route: '/platform/users/create',
    role: 'SUP',
    fullPage: true,
    preActions: async (page) => {
      await fillForm(page)
      await page.waitForTimeout(300)
    },
    annotate: ({ locale }) => [
      // Kolom Organisasi sudah terisi "PRECIA Demo Booth (DEMO)"
      { type: 'box', x: 856, y: 374, width: 455, height: 65 },
      // Tombol simpan — right-aligned, lebar beda per locale, lihat catatan
      // pada shot 01 soal boundingBox() per locale
      locale === 'en'
        ? { type: 'box', x: 1182, y: 1196, width: 129, height: 40 }
        : { type: 'box', x: 1156, y: 1196, width: 155, height: 40 }
    ]
  },
  {
    id: 'organisasi-platform__pengguna-lintas-organisasi__05-berhasil-dibuat',
    section: 'organisasi-platform',
    pageSlug: 'pengguna-lintas-organisasi',
    stepSlug: '05-berhasil-dibuat',
    route: '/platform/users/create',
    role: 'SUP',
    fullPage: true,
    preActions: async (page, { locale }) => {
      // Submit sungguhan supaya bisa menunjukkan banner sukses. Akhiran
      // locale mencegah bentrok unique constraint saat run id+en berurutan.
      // Catatan: menjalankan ulang spec ini akan gagal (email sudah
      // terpakai) karena backend belum punya endpoint hapus user dari UI;
      // ganti akhiran di bawah kalau perlu regenerasi ulang.
      await fillForm(page, {
        email: `lintas.org.contoh.doc.${locale}@precia.ai`,
        username: `lintas.org.contoh.doc.${locale}`
      })
      await page.click('button[type="submit"]')
      await page.waitForSelector('[class*="successBanner"]', { timeout: 10000 })
    },
    annotate: [
      { type: 'box', x: 385, y: 1211, width: 926, height: 55 }
    ]
  }
]
