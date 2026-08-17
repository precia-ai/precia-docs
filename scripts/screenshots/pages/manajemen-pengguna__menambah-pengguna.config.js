/**
 * Halaman tambah pengguna (org-scope): /users/create
 * Selector diverifikasi dari precia-fe/components/users/CreateUserForm.tsx:
 *  - input[name="email"|"username"|"full_name"|"password"] (name attr stabil,
 *    id dihasilkan dari label sehingga TIDAK dipakai karena beda per locale)
 *  - input[name="organization"] (readOnly, field organisasi terkunci)
 *  - select#status
 *  - kartu role: label[class*="roleCard"], urutan tetap dari API (index 7 =
 *    "Nurse / Technician"), TIDAK memakai teks visible karena nama field ini
 *    memang sama di kedua locale tapi tetap dihindari sesuai aturan
 *  - tombol submit: button[type="submit"]
 *  - banner sukses: [class*="successBanner"]
 */

const ROLE_CARD_SELECTOR = 'label[class*="roleCard"]'
const NURSE_ROLE_INDEX = 7 // "Nurse / Technician" / "Perawat/Teknisi"

async function fillForm(page, { email, username } = {}) {
  await page.fill('input[name="email"]', email || 'pengguna.contoh@precia.ai')
  await page.fill('input[name="username"]', username || 'pengguna.contoh')
  await page.fill('input[name="full_name"]', 'Pengguna Contoh Dokumentasi')
  await page.fill('input[name="password"]', 'ContohAman123!')
  const cards = await page.$$(ROLE_CARD_SELECTOR)
  await cards[NURSE_ROLE_INDEX].click()
}

module.exports = [
  {
    id: 'manajemen-pengguna__menambah-pengguna__01-form-kosong',
    section: 'manajemen-pengguna',
    pageSlug: 'menambah-pengguna',
    stepSlug: '01-form-kosong',
    route: '/users/create',
    role: 'SUP',
    fullPage: true,
    annotate: [
      { type: 'box', x: 375, y: 208, width: 947, height: 172 },
      { type: 'box', x: 375, y: 508, width: 947, height: 500 },
      { type: 'box', x: 1173, y: 1015, width: 147, height: 45 }
    ]
  },
  {
    id: 'manajemen-pengguna__menambah-pengguna__02-form-terisi',
    section: 'manajemen-pengguna',
    pageSlug: 'menambah-pengguna',
    stepSlug: '02-form-terisi',
    route: '/users/create',
    role: 'SUP',
    fullPage: true,
    preActions: async (page) => {
      await fillForm(page)
      await page.waitForTimeout(300)
    },

    annotate: [
      { type: 'box', x: 847, y: 828, width: 474, height: 88 },
      { type: 'box', x: 1216, y: 515, width: 94, height: 34 }
    ]
  },
  {
    id: 'manajemen-pengguna__menambah-pengguna__03-berhasil-dibuat',
    section: 'manajemen-pengguna',
    pageSlug: 'menambah-pengguna',
    stepSlug: '03-berhasil-dibuat',
    route: '/users/create',
    role: 'SUP',
    fullPage: true,
    preActions: async (page, { locale }) => {
      // Submit sungguhan (bukan preview) supaya bisa menunjukkan banner
      // sukses. Email/username diberi akhiran locale supaya run id+en tidak
      // bentrok unique constraint di backend saat dijalankan berurutan.
      // Catatan: menjalankan ulang spec ini akan gagal (email sudah
      // terpakai) karena backend belum punya endpoint hapus user dari UI;
      // ganti akhiran di bawah kalau perlu regenerasi ulang.
      await fillForm(page, {
        email: `pengguna.contoh.doc.${locale}@precia.ai`,
        username: `pengguna.contoh.doc.${locale}`
      })
      await page.click('button[type="submit"]')
      await page.waitForSelector('[class*="successBanner"]', { timeout: 10000 })
    },
    annotate: [
      { type: 'box', x: 376, y: 1022, width: 936, height: 55 }
    ]
  }
]
