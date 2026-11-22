import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight, BadgeCheck, BarChart3, CalendarCheck2, Check, ChevronRight,
  CircleDollarSign, Clock3, Lightbulb, Link2, Package, Pause, Play, Plus, Sparkles,
  Target, UsersRound, WandSparkles,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import MarkdownOutput from "@/components/MarkdownOutput";
import { trpc } from "@/lib/trpc";
import { agents, categoryRoutes, type Category } from "@/lib/product";
import "./SalesDashboard.css";

const jakartaToday = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
const rupiah = (amount: number) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0,
}).format(amount);
const periodName = (period: string) => new Date(`${period}-01T00:00:00+07:00`).toLocaleDateString("id-ID", {
  month: "long", year: "numeric", timeZone: "Asia/Jakarta",
});
const campaignStatuses = {
  draft: "Draft",
  active: "Aktif",
  paused: "Dijeda",
  completed: "Selesai",
} as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const today = jakartaToday();
  const period = today.slice(0, 7);
  const utils = trpc.useUtils();
  const sales = trpc.sales.overview.useQuery({ period, today });
  const projects = trpc.projects.list.useQuery();
  const salesAgents = trpc.sales.agents.overview.useQuery();

  const [metricsOpen, setMetricsOpen] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [actualInput, setActualInput] = useState("");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productAudience, setProductAudience] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [opportunityResult, setOpportunityResult] = useState("");

  const products = sales.data?.products ?? [];
  const activeProducts = useMemo(() => products.filter(product => product.isActive), [products]);
  const tasks = sales.data?.tasks ?? [];
  const activeCampaigns = (projects.data ?? []).filter(project => project.status === "active");
  const targetRevenue = sales.data?.targetRevenue ?? 0;
  const actualRevenue = sales.data?.actualRevenue ?? 0;
  const progressPercent = targetRevenue > 0 ? Math.round((actualRevenue / targetRevenue) * 100) : 0;
  const selectedProduct = activeProducts.find(product => String(product.id) === selectedProductId);
  const selectedCampaign = activeCampaigns.find(project => String(project.id) === selectedCampaignId);

  useEffect(() => {
    if (!metricsOpen) {
      setTargetInput(targetRevenue ? String(targetRevenue) : "");
      setActualInput(actualRevenue ? String(actualRevenue) : "");
    }
  }, [actualRevenue, metricsOpen, targetRevenue]);

  useEffect(() => {
    if (!activeProducts.some(product => String(product.id) === selectedProductId)) {
      setSelectedProductId(activeProducts[0] ? String(activeProducts[0].id) : "");
    }
  }, [activeProducts, selectedProductId]);

  useEffect(() => {
    if (!activeCampaigns.some(project => String(project.id) === selectedCampaignId)) {
      setSelectedCampaignId(activeCampaigns[0] ? String(activeCampaigns[0].id) : "");
    }
  }, [activeCampaigns, selectedCampaignId]);

  const invalidateSales = async () => Promise.all([
    utils.sales.overview.invalidate(),
    utils.projects.list.invalidate(),
  ]);

  const saveMetrics = trpc.sales.setMonthlyMetrics.useMutation({
    onSuccess: async () => { await utils.sales.overview.invalidate(); setMetricsOpen(false); toast.success("Target dan omzet bulan ini diperbarui."); },
    onError: error => toast.error(error.message || "Target omzet belum berhasil disimpan."),
  });
  const createProduct = trpc.sales.createProduct.useMutation({
    onSuccess: async () => { await utils.sales.overview.invalidate(); setProductName(""); setProductAudience(""); setProductFormOpen(false); toast.success("Produk ditambahkan ke daftar aktif."); },
    onError: error => toast.error(error.message || "Produk belum berhasil disimpan."),
  });
  const setProductActive = trpc.sales.setProductActive.useMutation({
    onSuccess: invalidateSales,
    onError: error => toast.error(error.message || "Status produk belum berhasil diperbarui."),
  });
  const createTask = trpc.sales.createTask.useMutation({
    onSuccess: async () => { await utils.sales.overview.invalidate(); setTaskTitle(""); toast.success("Tugas ditambahkan untuk hari ini."); },
    onError: error => toast.error(error.message || "Tugas belum berhasil disimpan."),
  });
  const setTaskCompleted = trpc.sales.setTaskCompleted.useMutation({
    onSuccess: invalidateSales,
    onError: error => toast.error(error.message || "Status tugas belum berhasil diperbarui."),
  });
  const setCampaignStatus = trpc.projects.setStatus.useMutation({
    onSuccess: invalidateSales,
    onError: error => toast.error(error.message || "Status campaign belum berhasil diperbarui."),
  });
  const generateOpportunity = trpc.ai.generate.useMutation({
    onSuccess: async result => {
      setOpportunityResult(result.result);
      await Promise.all([utils.ai.history.list.invalidate(), utils.analytics.overview.invalidate(), utils.projects.list.invalidate()]);
      toast.success("Saran peluang disiapkan oleh Dira.");
    },
    onError: error => toast.error(error.message || "Saran belum berhasil dibuat. Coba lagi."),
  });

  const saveRevenue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = Number(targetInput || 0);
    const actual = Number(actualInput || 0);
    if (!Number.isSafeInteger(target) || target < 0 || !Number.isSafeInteger(actual) || actual < 0) {
      toast.error("Masukkan nominal rupiah berupa bilangan bulat yang valid.");
      return;
    }
    saveMetrics.mutate({ period, targetRevenue: target, actualRevenue: actual });
  };

  const addProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createProduct.mutate({ name: productName.trim(), targetAudience: productAudience.trim() });
  };

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createTask.mutate({ title: taskTitle.trim(), dueDate: today });
  };

  const askSalesAgent = () => {
    if (!selectedProduct) {
      toast.error("Tambahkan atau pilih produk aktif terlebih dahulu.");
      return;
    }
    setOpportunityResult("");
    generateOpportunity.mutate({
      category: "marketing",
      tool: "promotion_ideas",
      platform: "",
      businessName: selectedCampaign?.businessName || user?.businessName || "",
      businessCategory: selectedCampaign?.businessCategory || user?.businessCategory || "",
      projectId: selectedCampaign?.id ?? null,
      productName: selectedProduct.name,
      audience: selectedProduct.targetAudience || "",
      objective: "Mencari ide promosi yang dapat dicoba hari ini",
      tone: "Ramah dan persuasif",
      details: [
        `Fokus hari ini: ide promosi untuk produk aktif yang dipilih pengguna, ${selectedProduct.name}.`,
        selectedProduct.targetAudience ? `Target audiens yang dicatat pengguna: ${selectedProduct.targetAudience}.` : "Target audiens produk belum dicatat.",
        targetRevenue > 0 ? `Target omzet bulan ini yang diinput manual: ${rupiah(targetRevenue)}.` : "Target omzet bulan ini belum diatur.",
        actualRevenue > 0 ? `Omzet bulan ini yang dicatat manual: ${rupiah(actualRevenue)}.` : "Omzet aktual bulan ini belum dicatat.",
        selectedCampaign ? `Campaign yang dipilih: ${selectedCampaign.name}.` : "Belum ada campaign aktif yang dipilih.",
        "Berikan ide yang dapat diuji hari ini. Data transaksi, stok, diskon, tren pasar, dan performa kanal tidak tersedia kecuali tertulis di brief. Jangan mengklaim produk paling laris atau menjanjikan hasil penjualan.",
      ].join("\n"),
    });
  };

  const firstName = (user?.name || "Teman").split(" ")[0];
  const growthAgent = agents.marketing;
  const completedTasks = tasks.filter(task => task.status === "completed").length;
  const pendingTasks = tasks.filter(task => task.status === "pending").length;
  const activityDate = new Date(`${today}T12:00:00+07:00`).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jakarta",
  });

  return <div className="sales-dashboard">
    <header className="sales-dashboard-header">
      <div>
        <span className="sales-overline"><i/> SALES WORKSPACE <span>·</span> {activityDate}</span>
        <h1>Saya harus jual apa hari ini, {firstName}?</h1>
        <p>Fokus pada produk aktif, lihat target bulan ini, lalu minta tim AI menyiapkan ide yang bisa kamu uji.</p>
      </div>
      <Link className="button button-outline sales-header-action" href="/app/sales-agents"><BriefcaseIcon/> Buka Sales Agent</Link>
    </header>

    <section className="sales-overview-grid" aria-label="Ringkasan target omzet dan tim sales">
      <article className="sales-revenue-panel">
        <div className="sales-panel-heading"><span className="sales-panel-icon sales-blue"><Target size={18}/></span><div><span className="sales-mini-label">TARGET OMZET</span><h2>{periodName(period)}</h2></div><button className="sales-small-action" onClick={() => setMetricsOpen(value => !value)}>{metricsOpen ? "Tutup" : "Atur target"}</button></div>
        <div className="sales-revenue-values">
          <div><small>Target bulan ini</small><strong>{sales.isLoading ? "Memuat…" : targetRevenue ? rupiah(targetRevenue) : "Belum diatur"}</strong></div>
          <div className="sales-revenue-separator"/>
          <div><small>Omzet tercatat <em>manual</em></small><strong>{sales.isLoading ? "Memuat…" : actualRevenue ? rupiah(actualRevenue) : "Belum ada catatan"}</strong></div>
        </div>
        <div className="sales-progress-row"><span>Progress omzet</span><strong>{targetRevenue > 0 ? `${progressPercent}%` : "Atur target"}</strong></div>
        <div className="sales-progress-track" role="progressbar" aria-label="Progress omzet bulan ini" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(progressPercent, 100)}><i style={{ width: `${Math.min(progressPercent, 100)}%` }}/></div>
        <div className="sales-progress-caption">{targetRevenue > 0 ? `${rupiah(actualRevenue)} dari target ${rupiah(targetRevenue)} · angka diinput manual` : "Catat target dan omzet untuk melihat progress."}</div>
        {metricsOpen && <form className="sales-inline-form sales-metrics-form" onSubmit={saveRevenue}>
          <label className="sales-field"><span>Target omzet bulan ini (Rp)</span><input type="number" min="0" step="1000" inputMode="numeric" value={targetInput} onChange={event => setTargetInput(event.target.value)} placeholder="Contoh: 15000000"/></label>
          <label className="sales-field"><span>Omzet tercatat bulan ini (Rp)</span><input type="number" min="0" step="1000" inputMode="numeric" value={actualInput} onChange={event => setActualInput(event.target.value)} placeholder="Masukkan data manual"/></label>
          <div className="sales-form-note">Tidak terhubung ke Shopee atau kanal penjualan; angka ini hanya sesuai input kamu.</div>
          <button className="button button-primary" type="submit" disabled={saveMetrics.isPending}>{saveMetrics.isPending ? "Menyimpan…" : "Simpan angka"}</button>
        </form>}
      </article>

      <article className="sales-agent-panel">
        <div className="sales-agent-top"><span className="sales-panel-icon sales-orange"><Sparkles size={18}/></span><span className="sales-status-pill">5 SPESIALIS</span></div>
        <span className="sales-mini-label">SALES AGENT</span>
        <h2>Rencana jualan, dibantu tim.</h2>
        <p>Dira membantu menyusun peluang promosi dari produk dan data yang kamu masukkan. Tidak ada klaim penjualan atau tren tanpa sumber.</p>
        <div className="sales-team-strip" aria-label="Tim agent yang tersedia">{(Object.keys(agents) as Category[]).map(category => <Link key={category} className={`sales-team-avatar team-${agents[category].accent}`} href={categoryRoutes[category]} title={`${agents[category].name} · ${agents[category].role}`}>{agents[category].name.slice(0, 1)}</Link>)}<span className="sales-team-caption"><UsersRound size={13}/> 5 spesialis AI</span></div>
        <Link className="sales-agent-link" href={categoryRoutes.marketing}>{growthAgent.name} · {growthAgent.role}<ArrowRight size={14}/></Link>
      </article>
    </section>

    <section className="sales-tracks-overview" aria-label="Target, produk, dan Sales Link per Sales Agent">
      <div className="sales-tracks-overview-heading"><div><span className="sales-mini-label">TIGA TRACK PENJUALAN</span><h2>Sales Agent Workspace</h2><p>Target dan tujuan traffic tiap track; omzet hanya berdasarkan input manual.</p></div><Link href="/app/sales-agents">Atur workspace <ArrowRight size={14}/></Link></div>
      {salesAgents.isLoading ? <div className="sales-loading">Memuat Sales Agent…</div> : salesAgents.data?.workspaces.length ? <div className="sales-tracks-overview-grid">{salesAgents.data.workspaces.map(workspace => {
        const progress = workspace.actualRevenue == null ? null : workspace.targetRevenue > 0 ? Math.round(workspace.actualRevenue / workspace.targetRevenue * 100) : 0;
        return <article className="sales-track-overview-card" key={workspace.key}>
          <div className="sales-track-overview-top"><span className={`sales-track-overview-letter track-letter-${workspace.key.toLowerCase()}`}>{workspace.key}</span><div><strong>{workspace.name}</strong><small>{workspace.category}</small></div></div>
          <div className="sales-track-overview-metrics"><div><small>Target omzet</small><strong>{rupiah(workspace.targetRevenue)}</strong></div><div><small>Produk aktif</small><strong>{workspace.products.filter(product => product.isActive).length}</strong></div></div>
          <div className="sales-track-overview-revenue"><div><span>Omzet aktual</span><strong>{workspace.actualRevenue == null ? "Belum dicatat" : rupiah(workspace.actualRevenue)}</strong></div><span>{progress == null ? "Progress belum tersedia" : `${progress}%`}</span></div>
          <div className="sales-track-overview-progress" role="progressbar" aria-label={`Progress omzet ${workspace.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(progress ?? 0, 100)}><i style={{ width: `${Math.min(progress ?? 0, 100)}%` }}/></div>
          <div className="sales-track-overview-link">{workspace.destinationUrl ? <a href={workspace.destinationUrl} target="_blank" rel="noopener noreferrer"><Link2 size={13}/> Sales Link tersimpan <ArrowRight size={12}/></a> : <Link href="/app/sales-agents"><Link2 size={13}/> Atur Sales Link <ArrowRight size={12}/></Link>}</div>
          <Link className="sales-track-overview-open" href="/app/sales-agents">Buka track <ArrowRight size={13}/></Link>
        </article>;
      })}</div> : <div className="sales-loading">Workspace Sales Agent belum dapat dimuat.</div>}
      {salesAgents.isError && <div className="sales-load-error" role="alert"><span>Sales Agent belum dapat dimuat.</span><button onClick={() => salesAgents.refetch()}>Coba lagi</button></div>}
    </section>

    <section className="sales-daily-brief-section" aria-label="Daily Brief Pagi untuk Sales Agent A, B, dan C">
      <div className="sales-daily-brief-heading"><div><span className="sales-mini-label">LAPORAN PAGI · TIGA SALES TRACK</span><h2>Apa yang harus dilakukan hari ini untuk mengejar target omzet?</h2><p>Ringkasan AI dari empat rekomendasi tersimpan untuk produk dan track yang sama.</p></div><Sparkles size={19}/></div>
      {salesAgents.isLoading ? <div className="sales-loading">Memuat laporan pagi…</div> : salesAgents.data?.workspaces.length ? <div className="sales-daily-brief-grid">{salesAgents.data.workspaces.map(workspace => {
        const brief = salesAgents.data.dailyBriefs.find(item => item.salesAgentKey === workspace.key);
        return <article className="sales-daily-brief-track" key={workspace.key}>
          <div className="sales-daily-brief-track-heading"><span className={`sales-track-overview-letter track-letter-${workspace.key.toLowerCase()}`}>{workspace.key}</span><div><strong>{workspace.name}</strong><small>{brief ? `${brief.productName} · ${new Date(brief.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}` : "Belum ada laporan pagi hari ini"}</small></div></div>
          {brief ? <><h3>{brief.title}</h3><div className="sales-daily-brief-content"><MarkdownOutput content={brief.result}/></div><div className="sales-disclaimer">Hasil AI harus diverifikasi sebelum dipublikasikan. Jangan gunakan sebagai fakta produk tanpa pengecekan.</div></> : <div className="sales-daily-brief-empty"><strong>Daily Brief belum tersedia</strong><p>Untuk produk yang sama, simpan Opportunity Report, Campaign Recommendation, Ads Recommendation, dan Video Recommendation. Setelah itu buat laporan pagi di workspace.</p></div>}
          <Link className="sales-saved-opportunity-link" href="/app/sales-agents">{brief ? "Buka track dan susun ulang" : "Lengkapi sumber di workspace"} <ArrowRight size={14}/></Link>
        </article>;
      })}</div> : <div className="sales-loading">Workspace Sales Agent belum dapat dimuat.</div>}
      {salesAgents.isError && <div className="sales-inline-error">Daily Brief Pagi belum dapat dimuat. Coba muat ulang Dashboard.</div>}
    </section>

    <section className="sales-saved-opportunity" aria-label="Opportunity Report V3 terbaru">
      <div className="sales-saved-opportunity-heading"><div><span className="sales-mini-label">LAPORAN WORKSPACE V3</span><h2>Opportunity Report terbaru</h2><p>Laporan tersimpan dari workflow Sales Agent, ditampilkan tanpa menjalankan generasi baru.</p></div><Lightbulb size={18}/></div>
      {salesAgents.isLoading ? <div className="sales-loading">Memuat laporan tersimpan…</div> : salesAgents.data?.latestOpportunityReport ? <article className="sales-saved-opportunity-report">
        <div className="sales-saved-opportunity-meta"><strong>{salesAgents.data.latestOpportunityReport.workspaceName ?? "Sales Agent"} · {salesAgents.data.latestOpportunityReport.productName}</strong><span>{new Date(salesAgents.data.latestOpportunityReport.createdAt).toLocaleString("id-ID")}</span></div>
        <h3>{salesAgents.data.latestOpportunityReport.title}</h3>
        <div className="sales-saved-opportunity-content"><MarkdownOutput content={salesAgents.data.latestOpportunityReport.result}/></div>
        <div className="sales-disclaimer">Hasil AI harus diverifikasi sebelum dipublikasikan. Jangan gunakan sebagai fakta produk tanpa pengecekan.</div>
        <Link className="sales-saved-opportunity-link" href="/app/sales-agents">Buka Sales Agent Workspace <ArrowRight size={14}/></Link>
      </article> : <div className="sales-saved-opportunity-empty"><strong>Belum ada Opportunity Report V3 tersimpan</strong><p>Mulai workflow dari Daily Brief di Sales Agent Workspace. Laporan yang tersimpan untuk produk terpilih akan muncul di sini.</p><Link href="/app/sales-agents">Buka workspace <ArrowRight size={14}/></Link></div>}
      {salesAgents.isError && <div className="sales-inline-error">Laporan tersimpan belum dapat dimuat. Coba muat ulang Dashboard.</div>}
    </section>

    <section className="sales-work-grid" aria-label="Produk dan peluang hari ini">
      <article className="sales-card sales-products-card">
        <div className="sales-card-heading"><div><span className="sales-mini-label">KATALOG KERJA</span><h2>Produk aktif</h2><p>{activeProducts.length} produk bisa dipilih untuk ide jualan hari ini.</p></div><button className="sales-icon-action" onClick={() => setProductFormOpen(open => !open)} aria-label="Tambah produk"><Plus size={18}/></button></div>
        {productFormOpen && <form className="sales-inline-form" onSubmit={addProduct}>
          <label className="sales-field"><span>Nama produk <i>*</i></span><input autoFocus required minLength={2} maxLength={160} value={productName} onChange={event => setProductName(event.target.value)} placeholder="Contoh: Kerudung Zafira"/></label>
          <label className="sales-field"><span>Target audiens <small>opsional</small></span><input maxLength={220} value={productAudience} onChange={event => setProductAudience(event.target.value)} placeholder="Hanya jika sudah diketahui"/></label>
          <div className="sales-form-actions"><button type="button" className="sales-text-button" onClick={() => setProductFormOpen(false)}>Batal</button><button type="submit" className="button button-primary" disabled={createProduct.isPending}>{createProduct.isPending ? "Menyimpan…" : "Simpan produk"}</button></div>
        </form>}
        {sales.isLoading ? <div className="sales-loading">Memuat produk…</div> : products.length ? <div className="sales-product-list">{products.slice(0, 6).map(product => <div className={`sales-product-row ${product.isActive ? "" : "sales-product-inactive"}`} key={product.id}><span className="sales-product-mark"><Package size={16}/></span><span className="sales-product-copy"><strong>{product.name}</strong><small>{product.targetAudience || "Target audiens belum dicatat"}</small></span><span className={`sales-product-badge ${product.isActive ? "is-active" : "is-inactive"}`}>{product.isActive ? "Aktif" : "Nonaktif"}</span><button className="sales-row-action" onClick={() => setProductActive.mutate({ id: product.id, isActive: !product.isActive })} disabled={setProductActive.isPending}>{product.isActive ? "Nonaktifkan" : "Aktifkan"}</button></div>)}</div> : <div className="sales-empty-state"><span><Package size={20}/></span><strong>Belum ada produk tersimpan</strong><p>Tambahkan nama produk agar Sales Agent bisa menyusun ide yang relevan.</p><button className="button button-outline" onClick={() => setProductFormOpen(true)}><Plus size={14}/> Tambah produk</button></div>}
        <div className="sales-card-foot"><span><BadgeCheck size={14}/> Informasi produk hanya dari input kamu</span><Link href={categoryRoutes.marketplace}>Buka Marketplace AI <ArrowRight size={14}/></Link></div>
      </article>

      <article className="sales-card sales-opportunity-card">
        <div className="sales-card-heading"><div><span className="sales-mini-label">FOKUS HARI INI</span><h2>Peluang hari ini</h2><p>Minta Dira menyiapkan ide untuk produk yang kamu pilih.</p></div><span className="sales-opportunity-icon"><Lightbulb size={19}/></span></div>
        <div className="sales-opportunity-controls">
          <label className="sales-field"><span>Produk yang ingin didorong</span><select value={selectedProductId} onChange={event => { setSelectedProductId(event.target.value); setOpportunityResult(""); }} disabled={!activeProducts.length}><option value="">{activeProducts.length ? "Pilih produk aktif" : "Tambahkan produk aktif dahulu"}</option>{activeProducts.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <label className="sales-field"><span>Campaign terkait <small>opsional</small></span><select value={selectedCampaignId} onChange={event => setSelectedCampaignId(event.target.value)}><option value="">Tanpa campaign</option>{activeCampaigns.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <button className="button button-primary sales-opportunity-submit" onClick={askSalesAgent} disabled={!selectedProduct || generateOpportunity.isPending}>{generateOpportunity.isPending ? <><span className="button-spinner"/> Dira sedang menyiapkan ide…</> : <><WandSparkles size={16}/> Cari peluang untuk produk ini <ArrowRight size={15}/></>}</button>
        </div>
        {generateOpportunity.isError && <div className="sales-inline-error">Saran belum berhasil dibuat. Periksa koneksi lalu coba lagi.</div>}
        {opportunityResult ? <div className="sales-opportunity-result"><div className="sales-result-title"><span><Sparkles size={15}/> Draft dari Dira</span><button className="sales-text-button" onClick={() => setOpportunityResult("")}>Tutup</button></div><MarkdownOutput content={opportunityResult}/><div className="sales-disclaimer">Hasil AI harus diverifikasi sebelum dipublikasikan. Jangan gunakan sebagai fakta produk tanpa pengecekan.</div></div> : <div className="sales-opportunity-empty"><span className="sales-lightbulb"><Lightbulb size={18}/></span><div><strong>{activeProducts.length ? "Belum ada saran untuk hari ini" : "Tambahkan produk untuk mulai"}</strong><p>{activeProducts.length ? "Pilih satu produk lalu minta Sales Agent menyusun ide yang bisa diuji." : "Sales Agent hanya menyarankan berdasarkan informasi yang kamu simpan."}</p></div></div>}
        <div className="sales-opportunity-note"><Clock3 size={13}/> Saran AI bukan prediksi pasar; uji dan verifikasi sebelum dipakai.</div>
      </article>
    </section>

    <section className="sales-bottom-grid" aria-label="Tugas dan campaign aktif">
      <article className="sales-card sales-tasks-card">
        <div className="sales-card-heading"><div><span className="sales-mini-label">EKSEKUSI</span><h2>Tugas hari ini</h2><p>{pendingTasks} belum selesai{completedTasks ? ` · ${completedTasks} selesai` : ""}</p></div><span className="sales-task-icon"><CalendarCheck2 size={18}/></span></div>
        <form className="sales-task-form" onSubmit={addTask}><input required minLength={2} maxLength={180} value={taskTitle} onChange={event => setTaskTitle(event.target.value)} placeholder="Tambahkan satu langkah yang ingin dikerjakan…" aria-label="Tugas baru"/><button className="sales-icon-action" type="submit" disabled={createTask.isPending || !taskTitle.trim()} aria-label="Simpan tugas"><Plus size={18}/></button></form>
        {sales.isLoading ? <div className="sales-loading">Memuat tugas…</div> : tasks.length ? <div className="sales-task-list">{tasks.map(task => <div className={`sales-task-row ${task.status === "completed" ? "is-complete" : ""}`} key={task.id}><button className="sales-task-check" onClick={() => setTaskCompleted.mutate({ id: task.id, completed: task.status !== "completed" })} disabled={setTaskCompleted.isPending} aria-label={task.status === "completed" ? "Tandai belum selesai" : "Tandai selesai"}>{task.status === "completed" && <Check size={13}/>}</button><span>{task.title}</span><small>{task.status === "completed" ? "Selesai" : "Hari ini"}</small></div>)}</div> : <div className="sales-task-empty"><Check size={15}/> Belum ada tugas untuk hari ini. Tambahkan langkah pertama di atas.</div>}
      </article>

      <article className="sales-card sales-campaign-card">
        <div className="sales-card-heading"><div><span className="sales-mini-label">AKTIVITAS BERJALAN</span><h2>Campaign aktif</h2><p>{activeCampaigns.length} campaign ditandai aktif di workspace.</p></div><span className="sales-campaign-icon"><BarChart3 size={18}/></span></div>
        {projects.isLoading ? <div className="sales-loading">Memuat campaign…</div> : activeCampaigns.length ? <div className="sales-campaign-list">{activeCampaigns.slice(0, 4).map(project => <article className="sales-campaign-row" key={project.id}><span className="sales-campaign-mark"><MegaphoneIcon/></span><div className="sales-campaign-copy"><strong>{project.name}</strong><small>{project.businessName}{project.objective ? ` · ${project.objective}` : ""}</small></div><span className="sales-campaign-status">Aktif</span><button className="sales-row-action" onClick={() => setCampaignStatus.mutate({ id: project.id, status: "paused" })} disabled={setCampaignStatus.isPending}><Pause size={13}/> Jeda</button></article>)}</div> : <div className="sales-empty-state sales-campaign-empty"><span><BarChart3 size={19}/></span><strong>Belum ada campaign aktif</strong><p>Aktifkan project campaign dari daftar project untuk menampilkannya di sini.</p><Link className="button button-outline" href="/app/projects"><Play size={14}/> Kelola campaign</Link></div>}
        <div className="sales-card-foot"><span><Sparkles size={14}/> Project berstatus aktif</span><Link href="/app/projects">Lihat semua project <ArrowRight size={14}/></Link></div>
      </article>
    </section>

    {sales.isError && <div className="sales-load-error" role="alert"><span>Data sales belum dapat dimuat.</span><button onClick={() => sales.refetch()}>Coba lagi</button></div>}
    {projects.isError && <div className="sales-load-error" role="alert"><span>Daftar campaign belum dapat dimuat.</span><button onClick={() => projects.refetch()}>Coba lagi</button></div>}
  </div>;
}

function BriefcaseIcon() {
  return <BriefcaseBusinessIcon/>;
}

function BriefcaseBusinessIcon() {
  return <span className="sales-button-glyph"><UsersRound size={15}/></span>;
}

function MegaphoneIcon() {
  return <span className="sales-campaign-glyph"><BarChart3 size={16}/></span>;
}
