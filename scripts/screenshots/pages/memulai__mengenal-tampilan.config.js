/**
 * "Mengenal Tampilan" (memulai section) — dashboard overview with annotated
 * sidebar, and the platform sidebar shown at /platform/organizations.
 */
module.exports = [
  {
    id: 'memulai__mengenal-tampilan__01-dashboard-sidebar',
    section: 'memulai',
    pageSlug: 'mengenal-tampilan',
    stepSlug: '01-dashboard-sidebar',
    route: '/dashboard',
    role: 'SUP',
    annotate: [
      // Daftar menu utama (Dasbor s/d Evaluasi)
      { type: 'box', x: 16, y: 116, width: 223, height: 356 },
      // Link "Beralih ke Platform" (khusus admin platform)
      { type: 'box', x: 16, y: 521, width: 223, height: 34 },
      // Nama organisasi aktif di kartu profil bawah
      { type: 'box', x: 16, y: 838, width: 223, height: 27 }
    ]
  },
  {
    id: 'memulai__mengenal-tampilan__02-mode-platform',
    section: 'memulai',
    pageSlug: 'mengenal-tampilan',
    stepSlug: '02-mode-platform',
    route: '/platform/organizations',
    role: 'SUP',
    annotate: [
      // Badge "Mode Platform" + link kembali ke organisasi
      { type: 'box', x: 16, y: 88, width: 223, height: 62 },
      // Menu platform (lintas organisasi)
      { type: 'box', x: 16, y: 182, width: 223, height: 226 }
    ]
  }
]
