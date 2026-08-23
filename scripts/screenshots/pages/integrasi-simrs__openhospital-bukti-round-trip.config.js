/**
 * Bukti round trip Open Hospital ke PRECIA dan kembali, kasus `laboratory-1`
 * di lingkungan dev (unit Kardiologi, modul ECG EF Screening, pasien SITI
 * RAHMAWATI, MRN 1). Kasus ini sudah terlihat pada langkah 6 halaman dasar
 * `integrasi-simrs/openhospital.mdx`, dokumen ini melanjutkannya sampai hasil
 * AI tervalidasi dan tersinkron kembali ke Open Hospital.
 *
 * BELUM DIJALANKAN. Berkas ini disiapkan sebelum host PRECIA dapat dijangkau
 * (insiden jaringan precia.site berulang sepanjang 2026-08-23), supaya
 * eksekusi berikutnya tinggal jalan tanpa menyusun ulang selector dari nol.
 * Koordinat `annotate` pada langkah 1 dan 2 adalah perkiraan awal dari tata
 * letak yang sama pada `06-detail-kasus-precia.png` di halaman dasar
 * (kartu Transaction Details mulai x=298 y=598), BUKAN hasil pengukuran
 * screenshot nyata dari tab ECG EF Screening yang belum pernah dibuka. Ukur
 * ulang dari tangkapan layar mentah pertama sebelum dipakai sebagai final.
 *
 * Langkah Open Hospital-side (hasil tampil di rekam medis) SENGAJA TIDAK ada
 * di sini. Panel penampil hasil AI sudah ada sebagai kode
 * (openhospital-ui cabang `feat/precia-ai-result-display`) tetapi belum
 * di-push ke Gitea maupun dideploy, jadi belum ada apa pun untuk difoto di
 * sisi Open Hospital. Sampai itu selesai, buktinya memakai respons API
 * `GET /precia-integration/ai-results/{sourceType}/{sourceCode}`, lihat
 * skrip terpisah `scripts/screenshots/oh-roundtrip-api-evidence.js` di
 * repositori ini untuk langkah itu (di luar pipeline run.js karena API itu
 * berada di Open Hospital, bukan di app-dev.precia.site).
 */

const CASE_TEXT = 'laboratory-1'

module.exports = [
  {
    id: 'integrasi-simrs__openhospital-bukti-round-trip__01-hasil-ai-siap-divalidasi',
    section: 'integrasi-simrs',
    pageSlug: 'openhospital-bukti-round-trip',
    stepSlug: '01-hasil-ai-siap-divalidasi',
    // Akun demo di dalam organisasi Open Hospital dev, bukan SUP: transaksi
    // klinis tidak terlihat lintas organisasi lewat halaman ini (pola yang
    // sama dipakai integrasi-simrs__bahmni.config.js dan __care.config.js,
    // lihat komentarnya di .env.local.example). Perlu
    // PRECIA_DEMO_OPENHOSPITAL_EMAIL / PRECIA_DEMO_OPENHOSPITAL_PASSWORD
    // ditambahkan ke .env.local sebelum dijalankan; entri kosongnya sudah
    // ditambahkan di .env.local.example. Akun CAD dev sudah diterbitkan
    // (openhospital-prove-cad@precia.ai) dan bisa dipakai sebagai isinya.
    role: 'OPENHOSPITAL',
    route: '/validation',
    viewport: { width: 1440, height: 900 },
    preActions: async (page) => {
      await page.waitForTimeout(2500)
      await page.locator(`text=${CASE_TEXT}`).first().click()
      await page.waitForTimeout(2500)
      // TODO: klik tab "ECG EF Screening" pada panel kiri sebelum tangkap,
      // supaya hasil AI (confidence score, nilai EF) yang difoto, bukan tab
      // Patient Info bawaan. Selector belum diverifikasi dari DOM nyata.
    },
    annotate: [
      // Perkiraan awal, ukur ulang: blok hasil AI (confidence + disclaimer).
      { type: 'box', x: 843, y: 330, width: 707, height: 140 }
    ]
  },
  {
    id: 'integrasi-simrs__openhospital-bukti-round-trip__02-validasi-dipublikasikan',
    section: 'integrasi-simrs',
    pageSlug: 'openhospital-bukti-round-trip',
    stepSlug: '02-validasi-dipublikasikan',
    role: 'OPENHOSPITAL',
    route: '/validation',
    viewport: { width: 1440, height: 900 },
    preActions: async (page) => {
      await page.waitForTimeout(2500)
      await page.locator(`text=${CASE_TEXT}`).first().click()
      await page.waitForTimeout(2500)
      await page.selectOption('#start-decision', { value: 'accepted' }).catch(() => {})
      await page.fill(
        '#start-notes',
        'Hasil AI konsisten dengan gambaran EKG. Pasien dirujuk untuk ekokardiografi konfirmasi.'
      )
      // Tombol "Record decision" lalu "Publish validation" tidak punya
      // data-testid (lihat app/(dashboard)/validation/page.tsx baris ~429
      // dan ~543), jadi dicari lewat teks terjemahan per locale. Label
      // sudah diverifikasi terhadap lib/i18n/translations.ts baris 1737,
      // 1751, 3984, 3998 (kunci validation.recordDecision dan
      // validation.publishValidation).
      await page
        .locator('button')
        .filter({ hasText: /Record decision|Catat keputusan/ })
        .first()
        .click()
      await page.waitForTimeout(3000)
      await page
        .locator('button')
        .filter({ hasText: /Publish validation|Publikasikan validasi/ })
        .first()
        .click()
      await page.waitForTimeout(2000)
      const confirmBtn = page
        .locator('.modal button, [role=dialog] button')
        .filter({ hasText: /Publish|Confirm|Ya|Publikasikan/i })
        .first()
      if (await confirmBtn.count()) {
        await confirmBtn.click()
      }
      await page.waitForTimeout(3000)
    },
    annotate: [
      // Perkiraan awal, ukur ulang: keterangan "already published" / status.
      { type: 'box', x: 843, y: 470, width: 707, height: 60 }
    ]
  }
]
