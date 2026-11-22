# JagoBisnis AI — Hasil Kerja

- [x] **Landing page dan login** — Buat landing page profesional untuk “JagoBisnis AI”, sebuah “AI Growth Platform untuk UMKM dan Toko Online”, dengan warna utama biru dan oranye. Jelaskan manfaat produk dan perkenalkan tim AI beserta area keahliannya, sediakan CTA pendaftaran, tautan halaman pricing, serta halaman login untuk akses ke aplikasi.
- [x] **Dashboard profesional dan Agent Workspace** — Sediakan dashboard modern terpadu dengan lima area keahlian: Ads AI, Video Ads AI, Marketing AI, Marketplace AI, dan Affiliate AI. Jangan menampilkan area tersebut sebagai tool terpisah; sajikan sebagai tim marketing AI, dengan Agent Workspace dan halaman khusus untuk setiap agent tetap berada dalam satu dashboard utama.
- [x] **Ads AI** — Sediakan generator headline iklan, copywriting, dan CTA berdasarkan brief bisnis atau produk, dengan channel Facebook Ads, Instagram Ads, dan WhatsApp Ads serta CTA Generator.
- [x] **Video Ads AI** — Sediakan Video Script/script video, storyboard, visual hook, dan voice over berdasarkan brief pengguna.
- [x] **Marketing AI** — Sediakan strategi pemasaran, kalender konten 30 hari, ide promosi, Campaign Planner, dan Funnel Builder berdasarkan brief pengguna.
- [x] **Marketplace AI** — Sediakan pembuatan judul produk, deskripsi produk, dan keyword SEO untuk Shopee, Tokopedia, dan TikTok Shop, serta SEO Product Generator.
- [x] **Affiliate AI** — Tambahkan agent kelima untuk Shopee Affiliate, TikTok Affiliate, Content Creator, dan UGC Creator. Sediakan Product Finder dengan rekomendasi produk affiliate; Hook Generator untuk hook video tiga detik pertama; Review Script Generator; Affiliate Caption Generator untuk TikTok, Instagram, dan Facebook; CTA Generator untuk mendorong klik dan konversi; Content Calendar affiliate 30 hari; serta Live Shopping Script.
- [x] **Projects dan Quick Generate** — Sediakan Recent Projects yang dapat dibuat dan dikelola, serta Quick Generate di dashboard untuk mengarahkan brief ke agent yang tepat dan mengaitkan generasi dengan project pilihan.
- [x] **History dan Analytics** — Sediakan History dalam dashboard untuk melihat, membuka, menyalin, memakai ulang, dan membuat variasi hasil. Sediakan Analytics berdasarkan aktivitas generasi dan project tersimpan pengguna; jangan mengklaim metrik klik, konversi, atau ROAS yang belum tersedia.
- [x] **Analytics tanpa riwayat** — Pastikan tabel `generation_history` tersedia dengan kolom `userId` dan `createdAt`. Dashboard tetap berfungsi ketika belum ada data analytics, menampilkan “Belum ada data”, dan tidak mencetak console error untuk query analytics yang ditangani.
- [x] **Pricing dan profil pengguna** — Sediakan halaman pricing dengan pilihan paket yang jelas, serta halaman profil pengguna untuk melihat dan memperbarui informasi akun.
- [x] **Responsif mobile** — Pastikan landing page dan seluruh area aplikasi tampil responsif di desktop dan perangkat mobile.

## V1.1 Quality Upgrade

- [x] **Aturan fakta global** — Hapus instruksi “gunakan asumsi wajar”. Ganti dengan: “Jangan membuat fakta, angka, spesifikasi, pengalaman pengguna, testimonial, atau KPI yang tidak diberikan pengguna.”
- [x] **Penanganan data kurang** — Jika data kurang, jelaskan bahwa informasi tidak tersedia, gunakan bahasa netral, dan berikan placeholder yang harus diisi pengguna.
- [x] **Konsistensi lima agent** — Terapkan aturan kualitas tersebut secara konsisten ke Ads AI, Video AI, Marketing AI, Marketplace AI, dan Affiliate AI, termasuk menghapus instruksi tool yang bertentangan.
- [x] **Disclaimer hasil** — Tambahkan disclaimer persis: “Hasil AI harus diverifikasi sebelum dipublikasikan. Jangan gunakan sebagai fakta produk tanpa pengecekan.”
- [x] **Validasi dan checkpoint** — Jalankan kembali test, check, dan build; simpan perubahan sebagai checkpoint baru.

## Landing Page Penjualan

- [x] **Hero dan target pengguna** — Buat hero section yang lebih menjual untuk UMKM, Seller Shopee, dan Affiliate, dengan penjelasan manfaat yang tidak memakai klaim performa atau testimoni yang belum dibuktikan.
- [x] **Fitur utama dan contoh output** — Tampilkan fitur inti lima agent serta contoh output yang jelas dilabeli sebagai ilustrasi, bukan hasil kampanye atau klaim produk yang terverifikasi.
- [x] **Pricing dan FAQ** — Tampilkan informasi paket/pricing yang konsisten dengan halaman pricing saat ini serta FAQ untuk pertanyaan utama calon pengguna.
- [x] **CTA dan kesinambungan desain** — Tambahkan CTA yang jelas menuju pendaftaran/workspace dan pricing; pertahankan tampilan modern biru-oranye serta pengalaman responsif desktop/mobile.

## Dashboard V2 — Sales Workspace

- [x] **Fokus halaman utama** — Ubah Dashboard saat ini yang terasa seperti dashboard developer menjadi dashboard bisnis dan sales dengan fokus: “Saya harus jual apa hari ini?” Buat halaman pertama terasa seperti memiliki tim sales profesional.
- [x] **Tujuh ringkasan sales** — Halaman pertama menampilkan Target omzet, Progress omzet, Sales Agent, Produk aktif, Peluang hari ini, Tugas hari ini, dan Campaign aktif; gunakan data yang tersimpan atau empty state yang jelas, bukan angka maupun klaim fiktif.
- [x] **Sembunyikan elemen teknis dari Dashboard** — Jangan tampilkan Analytics teknis, Generation history, atau Prompt settings pada halaman pertama.
- [x] **Validasi dan simpan** — Jalankan pemeriksaan project setelah perubahan dan simpan hasil sebagai checkpoint di main tanpa menerbitkan aplikasi kecuali konfigurasi publikasi memang mengizinkan.

## Sales Agent Workspace V3 + Lynk Destination

- [x] **Tiga sales track tetap memakai lima spesialis yang ada** — Buat Sales Agent A dengan Target Omzet Rp1.000.000 dan kategori Fashion Muslim; Sales Agent B dengan Target Omzet Rp5.000.000 dan kategori Produk Digital; serta Sales Agent C dengan Target Omzet Rp2.000.000 dan kategori Affiliate. Ketiganya bekerja untuk peluang penjualan dan mengarahkan traffic ke Lynk milik pengguna. Gunakan spesialis yang sudah ada di belakang layar: Naya (Ads AI), Raka (Video AI), Dira (Growth AI), Bima (Marketplace AI), dan Alya (Affiliate AI). Jangan menambah agent baru, jangan mengubah branding, dan jangan membuat integrasi Shopee/TikTok.
- [x] **Konfigurasi workspace dan Sales Destination Link** — Setiap Sales Agent mempunyai Target Omzet, Produk yang Dikelola, dan Sales Destination Link (Lynk) yang dapat diatur oleh pengguna. Simpan konfigurasi secara persisten dan terlingkup ke pengguna; pengguna sendiri yang memasukkan URL Lynk. Tidak ada URL yang diberikan pada permintaan ini, jadi jangan menampilkan URL rekaan, jangan membuat API/integrasi Lynk, dan berikan empty state/link setup sampai pengguna mengisinya.
- [x] **Daily Brief dan Opportunity Report** — Setiap track menyediakan Daily Brief serta Opportunity Report yang disusun untuk kategori dan produk yang dikelola, menggunakan informasi pengguna dan spesialis yang ada. Bila data produk/performa tidak tersedia, jelaskan informasi yang belum tersedia dan gunakan bahasa netral; jangan membuat fakta, angka, testimoni, pengalaman pengguna, atau KPI. Progress tahap dan riwayat Opportunity Report V3 diisolasi menurut pengguna, track, dan produk yang sama.
- [x] **Rekomendasi hingga traffic menuju Lynk** — Setiap track menyediakan Ads Recommendation, Video Recommendation, dan Campaign Recommendation. Alur workspace adalah Daily Brief → Opportunity Report → Ads & Video Recommendation → Campaign Recommendation → traffic diarahkan ke Lynk pengguna. Rekomendasi memakai jalur generasi AI nyata yang sudah ada, menyimpan salesProductId bersama track dan workflow stage ke generation_history, dan tidak mengklaim klik, konversi, atau ROAS tanpa data; sediakan CTA tujuan Lynk hanya setelah pengguna memasukkan link.
- [x] **Dashboard utama berorientasi sales V3** — Pertahankan Dashboard bisnis dan branding yang ada; fokuskan ringkasan pada Progress Target, Produk Aktif, Sales Link (Lynk), Peluang Hari Ini, Campaign Aktif, dan Tugas Hari Ini. Nilai target per Sales Agent mengikuti target A/B/C di atas; tampilkan omzet aktual dan progress per track, dengan status “Belum dicatat” bila omzet belum diinput. Produk, tautan, peluang, campaign, dan tugas memakai data tersimpan atau empty state yang jelas, bukan angka/URL/klaim rekaan. Tampilkan Opportunity Report V3 terbaru yang tersimpan. Jangan menampilkan Analytics teknis, Generation History, atau Prompt Settings sebagai fokus halaman pertama.

## Daily Brief Pagi berbasis Rekomendasi

- [x] **Laporan pagi nyata untuk Sales Agent A, B, dan C** — Sediakan Daily Brief untuk setiap track dan tampilkan seperti laporan pagi di Dashboard. Ringkas rekomendasi tersimpan untuk produk yang sama: Opportunity Report, Campaign Recommendation, Ads Recommendation, dan Video Recommendation. Jawab fokus “Apa yang harus dilakukan hari ini untuk mengejar target omzet?” dengan langkah prioritas yang bersumber dari empat rekomendasi dan target/omzet yang dicatat pengguna. Buat laporan melalui jalur AI terkelola yang nyata, simpan hasil di `generation_history`, dan dukung regenerate dari history. Jangan mengarang omzet, fakta produk, performa, KPI, atau URL Lynk; URL Sales Link dan hostname/path-nya disamarkan sebelum prompt, dan URL keluaran dibersihkan sebelum disimpan. Target bawaan track tidak diperlakukan sebagai target tercatat: hanya target yang disimpan pengguna dan omzet aktual yang dicatat manual boleh masuk sebagai angka. Bila salah satu rekomendasi sumber belum ada untuk user, track, dan produk yang sama, tampilkan tahap yang kurang dan jangan panggil AI atau membuat history palsu.
