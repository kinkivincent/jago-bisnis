export type Category = "ads" | "video" | "marketing" | "marketplace" | "affiliate";

export const categories: Record<Category, { label: string; subtitle: string; description: string; icon: string; accent: string; tools: { id: string; label: string; description: string }[] }> = {
  ads: {
    label: "Ads AI", subtitle: "Iklan yang bikin orang berhenti scroll.", description: "Susun materi iklan yang relevan untuk berbagai channel dan tujuan bisnis.", icon: "megaphone", accent: "blue",
    tools: [
      { id: "facebook_ads", label: "Facebook Ads", description: "Headline, copy, dan CTA untuk kampanye Facebook." },
      { id: "instagram_ads", label: "Instagram Ads", description: "Hook, caption, dan angle visual untuk Instagram." },
      { id: "whatsapp_ads", label: "WhatsApp Ads", description: "Pesan promosi personal yang mendorong percakapan." },
      { id: "cta_generator", label: "CTA Generator", description: "Call-to-action yang jelas, menarik, dan relevan." },
    ],
  },
  video: {
    label: "Video Ads AI", subtitle: "Dari ide, jadi video yang siap direkam.", description: "Rangkai konsep video pendek dengan hook dan narasi yang kuat.", icon: "video", accent: "orange",
    tools: [
      { id: "video_script", label: "Video Script", description: "Script video vertikal dengan struktur yang jelas." },
      { id: "storyboard", label: "Storyboard", description: "Rincian visual dan adegan per scene." },
      { id: "visual_hook", label: "Visual Hook", description: "Ide pembuka visual untuk 1–3 detik pertama." },
      { id: "voice_over", label: "Voice Over", description: "Naskah narasi yang enak diucapkan." },
    ],
  },
  marketing: {
    label: "Marketing AI", subtitle: "Strategi matang, eksekusi lebih ringan.", description: "Buat rencana pemasaran yang konkret dan mudah dijalankan tim kecil.", icon: "chart", accent: "violet",
    tools: [
      { id: "marketing_strategy", label: "Marketing Strategy", description: "Rencana pemasaran praktis untuk 90 hari." },
      { id: "content_calendar", label: "Content Calendar 30 Hari", description: "Kalender konten lengkap selama satu bulan." },
      { id: "promotion_ideas", label: "Ide Promosi", description: "Promosi realistis tanpa harus selalu diskon besar." },
      { id: "campaign_planner", label: "Campaign Planner", description: "Rencana campaign dengan timeline dan KPI." },
      { id: "funnel_builder", label: "Funnel Builder", description: "Peta perjalanan pelanggan dari kenal hingga loyal." },
    ],
  },
  marketplace: {
    label: "Marketplace AI", subtitle: "Listing makin mudah ditemukan dan dipilih.", description: "Optimalkan produk untuk marketplace pilihan pelangganmu.", icon: "store", accent: "green",
    tools: [
      { id: "shopee_listing", label: "Shopee", description: "Judul, deskripsi, dan keyword untuk Shopee." },
      { id: "tokopedia_listing", label: "Tokopedia", description: "Listing produk yang jelas dan SEO-friendly." },
      { id: "tiktok_shop_listing", label: "TikTok Shop", description: "Listing yang cocok untuk social commerce." },
      { id: "seo_product", label: "SEO Product Generator", description: "Paket keyword dan optimasi produk lintas channel." },
    ],
  },
  affiliate: {
    label: "Affiliate AI", subtitle: "Konten affiliate yang menarik perhatian dan membangun kepercayaan.", description: "Temukan arah produk, hook, script review, caption, CTA, kalender konten, dan script live untuk kreator affiliate.", icon: "link", accent: "orange",
    tools: [
      { id: "affiliate_product_finder", label: "Product Finder", description: "Rekomendasi kategori dan kandidat produk affiliate sesuai audiens." },
      { id: "affiliate_hook", label: "Hook Generator", description: "Hook video yang menarik di tiga detik pertama." },
      { id: "affiliate_review_script", label: "Review Script Generator", description: "Script review produk yang natural dan informatif." },
      { id: "affiliate_caption", label: "Affiliate Caption Generator", description: "Caption terarah untuk TikTok, Instagram, dan Facebook." },
      { id: "affiliate_cta", label: "CTA Generator", description: "Ajakan klik dan konversi yang jelas tanpa klaim menyesatkan." },
      { id: "affiliate_content_calendar", label: "Content Calendar 30 Hari", description: "Rencana konten affiliate untuk satu bulan." },
      { id: "affiliate_live_script", label: "Live Shopping Script", description: "Alur live affiliate yang interaktif dan terstruktur." },
    ],
  },
};

export const agents: Record<Category, { slug: string; name: string; role: string; intro: string; description: string; accent: string; expertise: string[] }> = {
  ads: { slug: "ads-strategist", name: "Naya", role: "Ads Strategist", intro: "Mitra untuk kampanye yang lebih tepat sasaran.", description: "Menyusun angle, headline, copy, dan CTA yang selaras dengan channel dan tujuan campaign.", accent: "blue", expertise: ["Facebook Ads", "Instagram Ads", "WhatsApp Ads", "CTA & copy"] },
  video: { slug: "video-creative", name: "Raka", role: "Video Creative", intro: "Creative partner dari hook sampai voice over.", description: "Mengubah ide produk menjadi naskah video, storyboard, dan konsep visual yang siap diproduksi.", accent: "orange", expertise: ["Video script", "Storyboard", "Visual hook", "Voice over"] },
  marketing: { slug: "growth-strategist", name: "Dira", role: "Growth Strategist", intro: "Partner untuk strategi dan rencana pertumbuhan.", description: "Membantu menyusun strategi, kalender konten, campaign, promosi, dan funnel pelanggan.", accent: "violet", expertise: ["Strategi pemasaran", "Konten 30 hari", "Campaign planner", "Funnel builder"] },
  marketplace: { slug: "marketplace-specialist", name: "Bima", role: "Marketplace Specialist", intro: "Partner untuk listing yang jelas dan mudah ditemukan.", description: "Menyelaraskan judul, deskripsi, dan keyword produk dengan kebutuhan tiap marketplace.", accent: "green", expertise: ["Shopee", "Tokopedia", "TikTok Shop", "SEO produk"] },
  affiliate: { slug: "affiliate-creator", name: "Alya", role: "Affiliate Creator", intro: "Partner kreator untuk menemukan angle konten yang dipercaya audiens.", description: "Membantu Shopee Affiliate, TikTok Affiliate, content creator, dan UGC creator merancang konten yang informatif, menarik, dan siap diarahkan ke aksi.", accent: "orange", expertise: ["Shopee Affiliate", "TikTok Affiliate", "Content Creator", "UGC Creator"] },
};

export const categoryRoutes: Record<Category, string> = {
  ads: "/app/agents/ads-strategist",
  video: "/app/agents/video-creative",
  marketing: "/app/agents/growth-strategist",
  marketplace: "/app/agents/marketplace-specialist",
  affiliate: "/app/agents/affiliate-creator",
};
export const toolLabel = (id: string) => Object.values(categories).flatMap(item => item.tools).find(tool => tool.id === id)?.label ?? id;
