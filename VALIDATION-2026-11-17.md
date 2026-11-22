# Laporan Validasi AI Nyata — JagoBisnis AI

Tanggal: 17 November 2026  
Metode: menjalankan `ai.generate` melalui Preview aplikasi yang sudah login, memakai `invokeLLM` dan provider AI platform sungguhan. Tidak menggunakan mock untuk generasi validasi ini. Setiap mutation yang sukses disimpan oleh aplikasi ke `generation_history`.

## Ringkasan

- Seluruh **12 skenario output unik** yang diminta berhasil menghasilkan output: Ads (1), Video Ads (3), Marketing (3), Marketplace (1), Affiliate (4).
- Sebanyak **14 baris** tersimpan dalam `generation_history`: 12 output unik dan 2 salinan tambahan Affiliate Caption/CTA. Salinan tambahan terjadi karena batch browser awal melewati timeout tool, tetap menyelesaikan panggilan belakangan, lalu kedua skenario itu dijalankan ulang setelah pemeriksaan status.
- `ai.history.list` berhasil (HTTP 200); halaman History menampilkan **14 hasil tersimpan**.
- `analytics.overview` berhasil setelah perbaikan (HTTP 200): **14 total generasi**, aktivitas 7 hari **14** pada 17 Nov 2026, rincian Ads 1, Video 3, Marketing 3, Marketplace 1, Affiliate 6.
- Semua output dibuat oleh provider AI nyata lewat API platform—bukan respons placeholder atau mock.

## Hasil per agent

| Agent | Skenario/output yang berhasil dibuat | Status | Riwayat tersimpan |
|---|---|---|---|
| Ads AI | Facebook Ads menghasilkan 3 variasi; masing-masing mencakup headline, primary copy, dan CTA untuk Kopi Nusantara / Kopi Arabika Premium / Karyawan Kantor. Contoh headline yang dihasilkan: “Ubah Jam Istirahat Kantor Jadi Momen Ngopi Berkelas”. | Berhasil | ID 1, 1 baris |
| Video Ads AI | Visual hook 1–3 detik, script video vertikal 30 detik, dan storyboard 6 scene untuk Blender Portable / Ibu Rumah Tangga. | Berhasil | ID 2–4, 3 baris |
| Marketing AI | Strategi pemasaran 90 hari, kalender konten 30 hari, dan 12 ide promosi untuk Toko Frozen Food / Mahasiswa. | Berhasil | ID 5–7, 3 baris |
| Marketplace AI | Shopee listing untuk Botol Minum Stainless berisi 5 opsi judul, deskripsi, serta 15 keyword. | Berhasil | ID 8, 1 baris |
| Affiliate AI | Hook video, 3 versi script review, caption native TikTok/Instagram/Facebook, dan 15 CTA untuk Power Bank / Mahasiswa. | Berhasil untuk 4 skenario unik | ID 9–12 (4 output unik); caption dan CTA masing-masing juga tersimpan ulang di ID 30001 dan 30002. Total 6 baris Affiliate. |

## Analytics dan History

Database berisi 14 baris untuk akun validasi. History API dan UI sama-sama menunjukkan 14 hasil. Analytics API dan UI menampilkan 14 generasi serta 14 aktivitas pada hari validasi; rincian per agent di atas menjumlah 14. Tidak ada kegagalan generasi yang tercatat pada 12 skenario yang disetujui.

## Error yang ditemukan dan perbaikannya

Sebelum perbaikan, `analytics.overview` membalas HTTP 500 setelah generation history tidak kosong. MySQL `ONLY_FULL_GROUP_BY` menolak query aktivitas harian: ekspresi `DATE(createdAt)` pada SELECT tidak identik dengan ekspresi `DATE(generation_history.createdAt)` yang dipakai pada GROUP BY. Query SELECT/GROUP BY/ORDER BY kini memakai ekspresi tanggal berkualifikasi yang sama. Setelah perubahan, panggilan database, API, Analytics UI, dan agregasi 14 hasil semuanya berhasil.

Tidak ditemukan error runtime/API pada 12 generasi nyata. Batch browser sempat mencapai timeout 30 detik, tetapi request yang tertunda tetap selesai sebagian; status History diperiksa sebelum menjalankan dua output Affiliate terakhir. Karena hasil lanjutan itu tiba kemudian, Caption dan CTA tersimpan dua kali. Data tidak dihapus agar tidak membuang riwayat; duplikasi dicatat di sini.

## Catatan mutu output

Keberhasilan teknis tidak menjamin setiap klaim isi tervalidasi. Beberapa output Affiliate menyisipkan pengalaman orang pertama atau spesifikasi Power Bank (termasuk contoh kapasitas) yang tidak ada di brief; output marketplace/iklan juga membuat asumsi produk/konteks. Tinjau dan verifikasi fakta, spesifikasi, pengalaman, serta klaim produk sebelum memublikasikan. Catatan ini adalah evaluasi konten—bukan verifikasi fakta dari listing aktual.

## Pemeriksaan kode

- `pnpm check`: lulus.
- `pnpm test`: lulus, 13 test.
- `pnpm build`: lulus.
- Health endpoint Preview: OK.
- Perbaikan Analytics tersimpan dalam checkpoint Git baru di branch `main` setelah pemeriksaan final.
