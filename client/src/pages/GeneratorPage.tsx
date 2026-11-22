import { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart3, Check, ChevronDown, Copy, FolderKanban, Link2, Megaphone, RotateCw, Sparkles, Store, Video, WandSparkles, type LucideIcon } from "lucide-react";
import MarkdownOutput from "@/components/MarkdownOutput";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { agents, categories, type Category } from "@/lib/product";

type ToolId = (typeof categories)[Category]["tools"][number]["id"];
const tones = ["Ramah dan persuasif", "Santai dan akrab", "Profesional", "Ceria dan playful", "Premium dan elegan"];
const prompts: Record<Category, string> = {
  ads: "Ceritakan produk dan alasan pelanggan harus memilihnya.",
  video: "Apa hal paling menarik yang ingin ditonjolkan dalam video?",
  marketing: "Ceritakan target dan tantangan pemasaran bisnismu.",
  marketplace: "Apa keunggulan, bahan, ukuran, atau manfaat produk ini?",
  affiliate: "Ceritakan niche creator, platform, audiens, atau kategori produk yang ingin dipromosikan.",
};
const agentIcons: Record<Category, LucideIcon> = { ads: Megaphone, video: Video, marketing: BarChart3, marketplace: Store, affiliate: Link2 };

export default function GeneratorPage({ category }: { category: Category }) {
  const info = categories[category];
  const agent = agents[category];
  const AgentIcon = agentIcons[category];
  const { user } = useAuth();
  const projects = trpc.projects.list.useQuery();
  const [selectedTool, setSelectedTool] = useState<ToolId>(info.tools[0].id as ToolId);
  const [projectId, setProjectId] = useState(() => new URLSearchParams(window.location.search).get("projectId") || "");
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [productName, setProductName] = useState("");
  const [audience, setAudience] = useState("");
  const [objective, setObjective] = useState("");
  const [tone, setTone] = useState(tones[0]);
  const [details, setDetails] = useState("");
  const [generated, setGenerated] = useState<{ id: number; title: string; result: string } | null>(null);
  const reuseId = Number(new URLSearchParams(window.location.search).get("reuse") || 0);
  const oldBrief = trpc.ai.history.get.useQuery({ id: reuseId }, { enabled: reuseId > 0, retry: false });
  const hydratedBriefId = useRef(0);
  const utils = trpc.useUtils();
  useEffect(() => { setSelectedTool(info.tools[0].id as ToolId); setGenerated(null); }, [category, info.tools]);
  useEffect(() => {
    const project = projects.data?.find(item => String(item.id) === projectId);
    setBusinessName(value => value || project?.businessName || user?.businessName || "");
    setBusinessCategory(value => value || project?.businessCategory || user?.businessCategory || "");
    setObjective(value => value || project?.objective || "");
  }, [projectId, projects.data, user?.businessName, user?.businessCategory]);
  useEffect(() => {
    if (!oldBrief.data || hydratedBriefId.current === oldBrief.data.id) return;
    try {
      const previous = JSON.parse(oldBrief.data.input) as { tool?: string; projectId?: number | null; businessName?: string; businessCategory?: string; productName?: string; audience?: string; objective?: string; tone?: string; details?: string };
      setSelectedTool((previous.tool || info.tools[0].id) as ToolId);
      setProjectId(previous.projectId ? String(previous.projectId) : "");
      setBusinessName(previous.businessName || ""); setBusinessCategory(previous.businessCategory || ""); setProductName(previous.productName || ""); setAudience(previous.audience || ""); setObjective(previous.objective || ""); setTone(previous.tone || tones[0]); setDetails(previous.details || "");
      hydratedBriefId.current = oldBrief.data.id;
      toast.success("Brief lama dimuat. Kamu bisa edit sebelum generate lagi.");
    } catch { toast.error("Brief lama tidak bisa dibuka."); }
  }, [oldBrief.data, info.tools]);
  const mutation = trpc.ai.generate.useMutation({
    onSuccess: result => { setGenerated(result); void utils.ai.history.list.invalidate(); void utils.projects.list.invalidate(); toast.success("Hasil siap dipakai dan tersimpan di History."); },
    onError: error => toast.error(error.message || "Belum berhasil membuat draft. Coba lagi."),
  });
  const currentTool = info.tools.find(tool => tool.id === selectedTool) ?? info.tools[0];
  const selectedProject = projects.data?.find(project => String(project.id) === projectId);
  const platform = selectedTool === "facebook_ads" ? "Facebook" : selectedTool === "instagram_ads" ? "Instagram" : selectedTool === "whatsapp_ads" ? "WhatsApp" : selectedTool === "shopee_listing" ? "Shopee" : selectedTool === "tokopedia_listing" ? "Tokopedia" : selectedTool === "tiktok_shop_listing" ? "TikTok Shop" : currentTool.label;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productName.trim() && category === "marketplace") { toast.error("Isi nama produk terlebih dahulu."); return; }
    setGenerated(null);
    mutation.mutate({ category, tool: selectedTool as "facebook_ads" | "instagram_ads" | "whatsapp_ads" | "cta_generator" | "video_script" | "storyboard" | "visual_hook" | "voice_over" | "marketing_strategy" | "content_calendar" | "promotion_ideas" | "campaign_planner" | "funnel_builder" | "shopee_listing" | "tokopedia_listing" | "tiktok_shop_listing" | "seo_product" | "affiliate_product_finder" | "affiliate_hook" | "affiliate_review_script" | "affiliate_caption" | "affiliate_cta" | "affiliate_content_calendar" | "affiliate_live_script", platform, projectId: projectId ? Number(projectId) : null, businessName, businessCategory, productName, audience, objective, tone, details });
  }
  const copyResult = async () => { if (!generated) return; await navigator.clipboard.writeText(generated.result); toast.success("Hasil berhasil disalin."); };

  return <div className="generator-page agent-detail-page">
    <div className="generator-page-heading"><div><div className="app-breadcrumb-label">AGENT WORKSPACE <span>/</span> {agent.role.toUpperCase()}</div><div className="generator-title-row"><span className={`agent-profile-avatar agent-${agent.accent}`}>{agent.name.slice(0,1)}<i><AgentIcon size={12}/></i></span><div><span className="agent-role-eyebrow">{agent.role} · SPESIALIS MARKETING AI</span><h1>{agent.name} <span className="agent-page-name">/ {info.label}</span></h1><p>{agent.intro}</p></div></div></div><span className="usage-badge"><span className="usage-dot"/> Siap menerima brief</span></div>
    <div className="agent-detail-summary"><Sparkles size={16}/><span>{agent.description}</span><span className="agent-summary-separator"/> <span className="agent-summary-expertise">{agent.expertise.join(" · ")}</span></div>
    <div className="generator-layout"><section className="generator-form-card"><div className="generator-card-heading"><div><span className="section-eyebrow">BRIEF KE {agent.name.toUpperCase()}</span><h2>Arahkan pekerjaan agent</h2><p>Satu brief, fokus kerja terpilih—kamu bisa review dan mengedit hasilnya.</p></div><span className="form-spark"><WandSparkles size={18}/></span></div>
      <label className="form-field focus-select-field"><span>Fokus kerja</span><span className="select-wrap"><select value={selectedTool} onChange={event => setSelectedTool(event.target.value as ToolId)}>{info.tools.map(tool => <option key={tool.id} value={tool.id}>{tool.label} — {tool.description}</option>)}</select><ChevronDown size={16}/></span></label>
      <form className="generator-form" onSubmit={submit}><label className="form-field"><span>Project terkait</span><span className="select-wrap"><select value={projectId} onChange={event => setProjectId(event.target.value)}><option value="">Tanpa project</option>{projects.data?.map(project => <option value={project.id} key={project.id}>{project.name} · {project.businessName}</option>)}</select><ChevronDown size={16}/></span><small className="field-help">Project akan membawa konteks bisnis ke hasil dan menyimpan draft bersama project tersebut. <a href="/app/projects">Kelola project</a></small></label>
        <div className="form-row"><label className="form-field"><span>Nama bisnis</span><input value={businessName} onChange={event => setBusinessName(event.target.value)} placeholder="Contoh: Kopi Pagi Studio" maxLength={160}/></label><label className="form-field"><span>{category === "marketplace" ? "Nama produk" : category === "affiliate" ? "Produk / niche creator" : "Produk / layanan"} <i>{category === "marketplace" ? "*" : ""}</i></span><input value={productName} onChange={event => setProductName(event.target.value)} placeholder={category === "marketplace" ? "Contoh: Tote Bag Kanvas" : category === "affiliate" ? "Contoh: skincare pemula atau niche fashion" : "Contoh: Cold brew gula aren"} maxLength={160}/></label></div>
        <div className="form-row"><label className="form-field"><span>Kategori bisnis</span><input value={businessCategory} onChange={event => setBusinessCategory(event.target.value)} placeholder="Contoh: makanan & minuman" maxLength={120}/></label><label className="form-field"><span>Target pelanggan</span><input value={audience} onChange={event => setAudience(event.target.value)} placeholder="Contoh: pekerja muda yang suka kopi praktis" maxLength={220}/></label></div>
        <div className="form-row"><label className="form-field"><span>Tujuan utama</span><input value={objective} onChange={event => setObjective(event.target.value)} placeholder="Contoh: meningkatkan pesanan" maxLength={300}/></label><label className="form-field select-field"><span>Gaya bahasa</span><span className="select-wrap"><select value={tone} onChange={event => setTone(event.target.value)}>{tones.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={16}/></span></label></div>
        <label className="form-field"><span>{prompts[category]}</span><textarea value={details} onChange={event => setDetails(event.target.value)} placeholder="Tambahkan keunggulan, harga, promo, atau detail lain yang penting..." rows={4} maxLength={1200}/></label>
        <div className="form-footer"><span><span className="form-lock-dot"/> Brief dan hasil tersimpan dalam History</span><button type="submit" className="button button-primary generate-button" disabled={mutation.isPending}>{mutation.isPending ? <><span className="button-spinner"/> {agent.name} sedang bekerja...</> : <><WandSparkles size={17}/> Kirim brief ke {agent.name} <ArrowRight size={16}/></>}</button></div>
      </form></section>
      <aside className="generator-side-note"><div className="side-note-art"><div className="note-art-circle"><WandSparkles size={29}/></div><span className="note-art-star star-a">✦</span><span className="note-art-star star-b">✳</span><span className="note-art-orbit"/></div><span className="section-eyebrow">CATATAN DARI {agent.name.toUpperCase()}</span><h3>{agent.intro}</h3><p>{prompts[category]} {selectedProject ? `Project “${selectedProject.name}” sudah terhubung sebagai konteks.` : "Hubungkan project agar konteks bisnis dan brief tetap rapi."}</p><div className="tip-divider"/><div className="side-tip-foot"><span className="tip-check"><Check size={14}/></span><span><FolderKanban size={12}/> Setiap hasil otomatis masuk History. Project bisa dipilih di atas.</span></div></aside>
    </div>
    {generated ? <section className="generated-result-card" id="generated-result"><div className="generated-result-head"><div><span className="result-ready"><span/> DRAFT DARI {agent.name.toUpperCase()}</span><h2>{generated.title}</h2><p>Tinjau bersama timmu dan arahkan revisi berikutnya.</p></div><div className="result-actions"><button className="button button-outline" onClick={copyResult}><Copy size={15}/> Salin</button><button className="button button-soft" onClick={() => { setGenerated(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}><RotateCw size={15}/> Edit brief</button></div></div><div className="result-content"><MarkdownOutput>{generated.result}</MarkdownOutput></div><div className="result-footer"><span><Sparkles size={14}/> Hasil AI harus diverifikasi sebelum dipublikasikan. Jangan gunakan sebagai fakta produk tanpa pengecekan.</span><button className="text-link" onClick={() => { void utils.ai.history.list.invalidate(); window.location.href = "/app/history"; }}>Buka History <ArrowRight size={15}/></button></div></section> : mutation.isPending ? <section className="result-loading-card"><div className="loading-aurora"><span/><span/><span/></div><div><strong>{agent.name} sedang menyiapkan draft…</strong><p>Mengolah brief dan konteks project. Hasilmu akan tersimpan otomatis.</p></div></section> : <section className="generator-empty-result"><span className="empty-orbit"><Sparkles size={24}/></span><div><strong>{agent.name} siap mengerjakan brief-mu.</strong><p>Pilih fokus kerja, hubungkan project jika ada, lalu arahkan apa yang ingin dicapai.</p></div><span className="empty-result-mark">✦</span></section>}
  </div>;
}
