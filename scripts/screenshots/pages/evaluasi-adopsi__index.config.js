/**
 * Evaluasi Adopsi > Daftar siklus evaluasi (index)
 * Route: /evaluation
 *
 * Akun SUP (System Administrator) punya permission evaluation:read_dashboard
 * dan evaluation:set_scope, jadi tombol "New cycle" dan daftar siklus
 * sama-sama tampil.
 */
module.exports = [
  {
    id: 'evaluasi-adopsi__index__01-daftar-siklus',
    section: 'evaluasi-adopsi',
    pageSlug: 'index',
    stepSlug: '01-daftar-siklus',
    route: '/evaluation',
    role: 'SUP',
    annotate: [
      // Kotak: tombol untuk membuat siklus evaluasi baru
      { type: 'box', x: 846, y: 126, width: 154, height: 34 },
      // Kotak: judul siklus bisa diklik untuk masuk ke halaman detail siklus
      { type: 'box', x: 296, y: 253, width: 400, height: 40 }
    ]
  }
]
