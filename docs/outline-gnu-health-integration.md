# Integrasi GNU Health dengan PRECIA

## Ringkasan

GNU Health adalah SIMRS open source berbasis kerangka kerja Tryton, ditulis dengan Python dan memakai PostgreSQL. Stack ini paling dekat dengan PRECIA di antara seluruh kandidat SIMRS pada program Proof of Concept.

Integrasi berjalan dua arah:

| Arah | Jalur teknis | Status |
|---|---|---|
| GNU Health ke PRECIA | Pembacaan `gnuhealth.imaging.test.request`, lalu `POST /api/simrs-connectors/ingest/transactions/` | Terbukti end to end, tetapi belum ada layanan pengirim yang dideploy |
| PRECIA ke GNU Health | `GnuhealthAdapter` menulis `ir.note` lewat Tryton JSON-RPC | Terbukti end to end sebagai kode produk |

Antarmuka petugas memakai klien web Tryton (sao) yang disajikan langsung oleh instansi GNU Health, sehingga seluruh alur klinis dapat dikerjakan dari peramban tanpa aplikasi desktop GTK.

## Kendala yang menentukan desain

Empat temuan berikut berasal dari survei kode dan diverifikasi ulang terhadap instansi yang berjalan. Keempatnya menutup jalur integrasi yang secara naluri akan dipilih lebih dulu, sehingga perlu dicatat sebelum membaca bagian desain.

1. **Server FHIR GNU Health bersifat read mostly.** Operasi create dan update membalas 405. Menulis hasil AI lewat FHIR tidak mungkin.
2. **Model permintaan pencitraan tidak membawa lampiran maupun rujukan DICOM.** Model `gnuhealth.imaging.test.request` tidak menyediakan keduanya. Sebuah order pencitraan saja tidak memberi PRECIA artefak apa pun untuk diproses, dan tidak ada kolom pencitraan yang bisa diisi balik.
3. **Dua transisi state dijalankan di dalam satu metode.** Metode `WizardGenerateResult.do_open_` memanggil `requested` lalu `done` secara berurutan. Polling terhadap state `requested` melewatkan jalur normal. Selain itu `done` tidak memiliki dekorator `ModelView.button` sehingga tidak dapat dipanggil lewat RPC. Pemicu berbasis state transition bukan pilihan yang aman.
4. **Selubung JSON-RPC trytond bergantung pada jumlah kunci.** `trytond.protocols.jsonrpc.JSONProtocol.response` hanya melaporkan fault sebagai HTTP 200 dengan anggota `error` ketika body berisi tepat kunci `id`, `method` dan `params`. Menambahkan kunci keempat `jsonrpc` membuat trytond mengembalikan hasil telanjang dan memetakan kegagalan ke kode status HTTP: `UserError` menjadi 400, login ditolak menjadi 403.

Poin keempat berkonsekuensi langsung pada kode pemanggil. Dengan selubung empat kunci, pemanggil tidak boleh mengindeks `["result"]`, dan sebaliknya kegagalan tidak lagi tersembunyi di balik HTTP 200. Selubung tiga kunci akan menyembunyikan kegagalan.

## Desain integrasi

### Arah masuk, GNU Health ke PRECIA

Permintaan pemeriksaan yang disimpan petugas pada model `gnuhealth.imaging.test.request` dibaca, lalu dikirim ke endpoint ingest PRECIA sebagai satu transaksi klinis.

Bentuk payload yang dipakai pada pengujian:

```json
{
  "unit_code": "RAD",
  "external_case_id": "gnuhealth.imaging.test.request,7",
  "patient_mrn": "GNU777ORG",
  "patient_name": "Ana Isabel Betz",
  "patient_gender": "female",
  "patient_dob": "1980-08-28",
  "priority": "normal",
  "notes": "GNU Health imaging order 007."
}
```

Catatan desain:

- `external_case_id` sengaja memakai bentuk referensi Tryton `<model>,<id>`. Nilai yang sama menjadi `code` transaksi PRECIA, dan adapter arah balik memakainya kembali untuk menentukan record tujuan tanpa perlu tabel pemetaan terpisah.
- `patient_mrn` diisi dari PUID pasien GNU Health.
- Endpoint bersifat idempoten terhadap `external_case_id`. Pengiriman pertama membalas 201, pengiriman ulang membalas 200 dengan id transaksi yang sama dan tidak membuat kasus ganda.
- Pengiriman dijalankan oleh akun layanan konektor milik organisasi, dibuat lewat endpoint credentials pada proses onboarding.

### Arah keluar, PRECIA ke GNU Health

`GnuhealthAdapter` pada `apps/simrs_connectors/adapters/gnuhealth.py` menulis hasil validasi kembali ke GNU Health. Karena FHIR tertutup untuk tulis dan model pencitraan tidak punya kolom hasil, hasil difile sebagai `ir.note` yang menempel pada record asal. Klien sao menampilkannya pada tab Notes record tersebut.

Rancangan pemanggilan:

- Endpoint adalah dispatcher Tryton `POST /<database>/`. Rute werkzeug tidak cocok tanpa garis miring di akhir dan membalas 404, bukan redirect, untuk POST. Properti `callback_url` adapter karena itu selalu menambahkan garis miring penutup.
- Metode yang dipanggil adalah `model.ir.note.create`.
- Selubung memakai empat kunci termasuk `jsonrpc`, sesuai alasan pada bagian kendala di atas.
- Otentikasi memakai header `Authorization: Basic <shared_secret>`, dengan shared secret berisi base64 dari `login:password`. trytond memakai `res.user.get_login` untuk header Authorization non sesi, sehingga tidak perlu ronde login terpisah.
- Referensi resource dibentuk dari `transaction.code`. Bila code sudah berbentuk `<model>,<id>` nilainya dipakai apa adanya. Bila tidak, segmen numerik terakhir diambil dan diresolusi terhadap `gnuhealth.imaging.test.request`. Code yang tidak memenuhi keduanya memunculkan `AdapterConfigurationError`, bukan diam diam gagal.

Isi catatan yang ditulis:

```
PRECIA AI result
Module: <kode modul AI>
Confidence: <skor atau n/a>
Validation: <status validasi>
PRECIA transaction: <uuid transaksi>
PRECIA job: <uuid inference job>
Result: <JSON hasil, sort_keys aktif>
```

`sort_keys` dipakai agar pengiriman ulang menghasilkan teks identik, sehingga duplikasi dapat dikenali secara visual dan tidak menyamar sebagai catatan baru karena urutan kunci berubah.

## Konfigurasi organisasi

GNU Health terdaftar sebagai adapter `gnuhealth` pada `apps/simrs_connectors/api/constants.py`. Adapter ini masuk `ONBOARDING_ADAPTERS` dan `CALLBACK_ADAPTERS`, dengan `shared_secret` sebagai field wajib.

Alur penyiapan satu organisasi:

1. `POST /api/simrs-connectors/organizations/{id}/onboarding/` dengan adapter `gnuhealth`, callback URL instansi GNU Health, shared secret, dan pemetaan unit.
2. `POST /api/simrs-connectors/organizations/{id}/self-test/` untuk memverifikasi konektivitas, TLS dan pemetaan unit.
3. `POST .../credentials/` untuk membuat akun layanan konektor.

Peringatan yang berlaku umum dan relevan di sini: `Organization.settings` adalah satu JSONField dengan banyak sub kunci, dan `update_organization()` melakukan full replace lewat `setattr`. Setiap penulis wajib melakukan read merge write, kalau tidak sub kunci milik fitur lain akan terhapus.

## Deployment

### Repositori dan CI

| Komponen | Repositori Gitea (org precia) | Job Jenkins |
|---|---|---|
| Sumber aplikasi | `simrs-gnuhealth` | `simrs-gnuhealth-dev`, `simrs-gnuhealth-main` |
| Dockerfile | `simrs-gnuhealth-dockerfile` | mengikuti job di atas |
| Compose deploy | `simrs-gnuhealth-docker-compose` | mengikuti job di atas |

Image dipublikasikan ke Harbor sebagai `harbor.precia.site/precia/simrs-gnuhealth`, tag `dev` untuk dev dan `latest` untuk prod, memakai credential Jenkins `harbor-registry`.

### Topologi runtime

Folder deploy pada kedua server adalah `/srv/precia/apps/gnuhealth`.

| Environment | Server | Container aplikasi | Container basis data | Port host | Hostname |
|---|---|---|---|---|---|
| Dev | workstation-1 | `gnuhealth-dev` | `gnuhealth-db-dev` | 18600 ke 8000 | gnuhealth-dev.precia.site |
| Prod | workstation-2 | `gnuhealth` | `gnuhealth-db` | 18600 ke 8000 | gnuhealth.precia.site |

Container aplikasi bergabung ke dua network, yaitu `gnuhealth-net` internal dan network `proxy` bersama. Nginx Proxy Manager meneruskan permintaan berdasarkan nama container di network `proxy`, bukan alamat IP. Kedua hostname melayani HTTPS dengan sertifikat Let's Encrypt dan terpantau membalas 200.

Basis data memakai `postgres:16.2`.

### Dua keputusan compose yang perlu dijaga

1. **Nama basis data Postgres sengaja dibiarkan kosong.** Variabel `POSTGRES_DB` tidak diisi. Postgres kemudian membuat basis data bernama sama dengan `POSTGRES_USER`, yang bukan basis data Tryton dan otomatis tersaring keluar dari pemilih database pada layar login sao. Membuat basis data bernama `ghdemo44` di tahap ini justru membuat entrypoint aplikasi mengira dump demo sudah dipulihkan lalu melewatinya, sehingga sistem berakhir kosong.
2. **Volume data aplikasi bersifat load bearing.** Volume `app-data` dipetakan ke `/opt/gnuhealth/var/lib`. Tryton menyimpan setiap biner `ir.attachment` di filesystem dalam bentuk content addressed di bawah direktori per basis data, bukan di dalam Postgres. Backup yang hanya mencakup basis data akan kehilangan seluruh artefak klinis dan meninggalkan baris `ir_attachment` menggantung.

Efek gabungan konfigurasi tersebut adalah instansi dengan tepat satu basis data Tryton bernama `ghdemo44`, sehingga layar login sao tidak menampilkan pemilih database dan petugas langsung masuk dengan nama pengguna dan kata sandi.

### Seed

Folder `seed` pada direktori deploy berisi skrip pemulihan data demo, seeding entitas PRECIA, dan rotasi kata sandi admin. Kata sandi admin dirotasi saat deploy.

## Hasil uji end to end

Seluruh angka di bawah diukur, bukan disimpulkan.

| Tahap | Tindakan | Hasil terukur |
|---|---|---|
| A | Petugas menyimpan imaging request di sao pada dev | Order 007, record id 7, state draft |
| B | Onboarding adapter gnuhealth | 200 |
| B | Self test | 200, overall pass. Connectivity, TLS dan unit mapping pass. Auth skipped secara desain karena memakai shared secret statis |
| B | Pembuatan akun layanan | 201 |
| B | Ingest transaksi | 201 |
| B | Ingest diulang dengan payload sama | 200, id transaksi sama, tanpa kasus ganda |
| C | Kasus tampil di daftar kerja dan halaman detail PRECIA | Tampil lengkap dengan nama pasien, MRN, tanggal lahir, nomor order GNU Health pada catatan, dan pembuat berupa akun layanan konektor |
| D | `POST /api/inference/clinical-validations/{id}/publish/` | 200, memakai celery task dan `GnuhealthAdapter` yang sebenarnya |
| D | Jumlah `ir.note` pada instansi GNU Health dev | 0 sebelum, 1 sesudah. Resource `gnuhealth.imaging.test.request,7`, penulis `PRECIA AI Integration` |

## Batasan dan pekerjaan lanjutan

1. **PRECIA belum berjalan di dev untuk alur ini.** `https://api-dev.precia.site/api/simrs-connectors/ingest/transactions/` membalas 404. Dev sudah memiliki endpoint onboarding, credentials, units lookup dan self test, tetapi belum memiliki endpoint ingest maupun adapter gnuhealth. Cabang backend belum dipush sesuai instruksi, sehingga pengujian dijalankan dari worktree lokal terhadap instansi GNU Health dev yang sebenarnya. Setelah cabang dideploy, tahap ini diulang tanpa perubahan.
2. **Konektor arah masuk belum menjadi komponen yang dikirim.** Tidak ada layanan di repositori yang memantau GNU Health lalu memanggil endpoint ingest. Poller yang dipakai pada pengujian adalah skrip pembuktian. Arah sebaliknya, PRECIA ke GNU Health, sudah berjalan sebagai kode produk. Layanan konektor atau job terjadwal masih harus dibangun dan dideploy.
3. **Modul AI belum benar benar dijalankan.** Layanan AI satelit tidak terjangkau dari mesin pengujian, sehingga baris `InferenceJob` dan `AIResult` ditulis langsung ke basis data sebagai pengganti inferensi yang selesai. Seluruh tahap sejak publish validasi ke atas berjalan asli.
4. **Filter poller masih naif.** Skrip pembuktian memilih `state = draft`. Bila petugas menekan REQUEST, state berubah menjadi `requested` dan kasus terlewat. Konektor sebenarnya harus mengamati `create_date` atau `write_date`, atau menerima beberapa state sekaligus. Perhatikan juga kendala `done` yang tidak dapat dipanggil lewat RPC.
5. **Akun operator masih admin.** Instansi dev belum memiliki kata sandi klinisi demo. Hanya kata sandi admin yang dirotasi saat deploy.
6. **Kasus masuk belum dapat diproses.** Kebijakan AI unit belum diatur untuk unit RAD pada organisasi demo, sehingga halaman detail menampilkan nol slot modul AI dan transaksi berhenti pada status unprocessed.
7. **Penanganan tanggal sao.** Kolom tanggal memakai format bulan/tanggal/tahun dan disimpan sebagai UTC. Rekonsiliasi waktu antara kedua sistem harus memperhitungkan hal ini.
8. **Frontend belum menawarkan GNU Health.** Baik pemilih adapter pada halaman Pengaturan Integrasi SIMRS maupun pemilih pada wizard onboarding platform masih membatasi pilihan pada Khanza, MEDICCA dan Open Hospital. Pendaftaran organisasi GNU Health saat ini dilakukan lewat API. Salinan teks wizard juga masih menyebut tiga SIMRS terintegrasi.
9. **Klon lokal GNU Health bukan rilis.** Klon yang tersedia sebelumnya adalah cabang pengembangan: berkas versi menyebut 3.7.0 sementara ujung changelog bertanggal 23 November 2019 dan tag sebelumnya adalah 3.6.1, sehingga rilis 3.7.0 tidak pernah ada. Deployment ini memakai distribusi resmi, bukan klon tersebut.

## Dua jebakan operasional pada klien sao

Keduanya sempat menggagalkan satu putaran pengujian dan relevan bagi siapa pun yang menulis otomasi terhadap sao.

1. Selector `#database` cocok ke dua elemen, yaitu satu select tersembunyi dan satu input teks, sehingga upaya mengisinya menggantung. Kolom itu memang tidak perlu disentuh karena hanya ada satu basis data.
2. Klik ganda di sembarang tempat pada baris daftar akan membuka relasi yang dipegang sel tersebut. Klik ganda harus mendarat pada sel yang benar, misalnya sel Order, bukan sekadar pada barisnya.
