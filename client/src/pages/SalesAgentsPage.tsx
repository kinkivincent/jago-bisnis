import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight, BadgeCheck, Check, Copy, ExternalLink, Link2, LoaderCircle,
  Package, Plus, Save, Sparkles, Target, WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import MarkdownOutput from "@/components/MarkdownOutput";
import { trpc } from "@/lib/trpc";
import { agents, categoryRoutes, type Category } from "@/lib/product";
import {
  getMissingDailyBriefSources, SALES_AGENT_DEFAULTS, SALES_DAILY_BRIEF_LABEL,
  SALES_DAILY_BRIEF_SOURCE_LABELS, SALES_DAILY_BRIEF_SOURCE_STAGES,
  SALES_DAILY_BRIEF_STAGE, SALES_WORKFLOW_LABELS, type SalesAgentKey, type SalesWorkflowStage,
} from "@shared/salesAgents";
import "./SalesAgentWorkspace.css";

const rupiah = (amount: number) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0,
}).format(amount);

const workflowSteps: Array<{
  stage: SalesWorkflowStage;
  description: string;
  category: Category | "affiliate";
  tool: string;
}> = [
  { stage: "daily_brief", description: "Ringkasan fokus dan langkah kerja hari ini.", category: "marketing", tool: "marketing_strategy" },
  { stage: "opportunity_report", description: "Peluang sebagai hipotesis yang perlu divalidasi.", category: "marketplace", tool: "seo_product" },
  { stage: "ads_recommendation", description: "Angle iklan, copy, dan CTA menuju Sales Link.", category: "ads", tool: "facebook_ads" },
  { stage: "video_recommendation", description: "Konsep hook, naskah, visual, dan CTA.", category: "video", tool: "video_script" },
  { stage: "campaign_recommendation", description: "Rangkai peluang dan materi menjadi arahan campaign.", category: "marketing", tool: "campaign_planner" },
];

const specialistFor = (stage: SalesWorkflowStage, key: SalesAgentKey): Category => {
  if (stage === "daily_brief" || stage === "campaign_recommendation") return "marketing";
  if (stage === "opportunity_report") return key === "C" ? "affiliate" : "marketplace";
  if (stage === "ads_recommendation") return "ads";
  return "video";
};

const stageRecipe = (stage: SalesWorkflowStage, key: SalesAgentKey) => {
  if (stage === "opportunity_report" && key === "C") return { category: "affiliate" as const, tool: "affiliate_product_finder" as const };
  const step = workflowSteps.find(item => item.stage === stage)!;
  return { category: step.category, tool: step.tool as "marketing_strategy" | "seo_product" | "facebook_ads" | "video_script" | "campaign_planner" };
};

const generationLabel = (workflowStage: string | null, title: string) => {
  if (workflowStage === SALES_DAILY_BRIEF_STAGE) return SALES_DAILY_BRIEF_LABEL;
  if (workflowStage && workflowStage in SALES_WORKFLOW_LABELS) return SALES_WORKFLOW_LABELS[workflowStage as SalesWorkflowStage];
  return title;
};

export default function SalesAgentsPage() {
  const { user } = useAuth();
  const [selectedKey, setSelectedKey] = useState<SalesAgentKey>("A");
  const [targetInput, setTargetInput] = useState("");
  const [actualInput, setActualInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductAudience, setNewProductAudience] = useState("");
  const [assignProductId, setAssignProductId] = useState("");
  const [generatingStage, setGeneratingStage] = useState<SalesWorkflowStage | null>(null);
  const [selectedGenerationId, setSelectedGenerationId] = useState<number | null>(null);

  const overview = trpc.sales.agents.overview.useQuery();
  const workspace = overview.data?.workspaces.find(item => item.key === selectedKey);
  const history = trpc.sales.agents.history.useQuery({ agentKey: selectedKey, productId: selectedProductId ? Number(selectedProductId) : null });
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!workspace) return;
    setTargetInput(String(workspace.targetRevenue));
    setActualInput(workspace.actualRevenue == null ? "" : String(workspace.actualRevenue));
    setDestinationInput(workspace.destinationUrl);
  }, [workspace?.targetRevenue, workspace?.actualRevenue, workspace?.destinationUrl, selectedKey]);

  const products = workspace?.products ?? [];
  useEffect(() => {
    if (!products.some(product => String(product.id) === selectedProductId)) {
      setSelectedProductId(products[0] ? String(products[0].id) : "");
    }
  }, [products, selectedProductId]);
  const selectedProduct = products.find(product => String(product.id) === selectedProductId);
  const selectedGeneration = useMemo(
    () => history.data?.find(item => item.id === selectedGenerationId) ?? history.data?.[0],
    [history.data, selectedGenerationId],
  );
  const completedStages = new Set((history.data ?? []).map(item => item.workflowStage).filter((stage): stage is SalesWorkflowStage => Boolean(stage)));
  const missingDailyBriefSources = getMissingDailyBriefSources((history.data ?? []).map(item => item.workflowStage ?? ""));
  const latestDailyBrief = history.data?.find(item => item.workflowStage === SALES_DAILY_BRIEF_STAGE);
  const availableProducts = (overview.data?.products ?? []).filter(product => !product.salesAgentKey || product.salesAgentKey === selectedKey);
  const existingTeam = Object.keys(agents) as Category[];

  const invalidateWorkspace = async () => Promise.all([
    utils.sales.agents.overview.invalidate(),
    utils.sales.overview.invalidate(),
  ]);
  const updateWorkspace = trpc.sales.agents.updateWorkspace.useMutation({
    onSuccess: async () => { await invalidateWorkspace(); toast.success("Target, omzet, dan Sales Link diperbarui."); },
    onError: error => toast.error(error.message || "Pengaturan Sales Agent belum berhasil disimpan."),
  });
  const createProduct = trpc.sales.agents.createProduct.useMutation({
    onSuccess: async () => {
      await invalidateWorkspace();
      setNewProductName("");
      setNewProductAudience("");
      toast.success("Produk ditambahkan ke track ini.");
    },
    onError: error => toast.error(error.message || "Produk belum berhasil disimpan."),
  });
  const assignProduct = trpc.sales.agents.assignProduct.useMutation({
    onSuccess: async () => { await invalidateWorkspace(); toast.success("Penugasan produk diperbarui."); },
    onError: error => toast.error(error.message || "Produk belum berhasil dipetakan."),
  });
  const generate = trpc.ai.generate.useMutation({
    onSuccess: async result => {
      setGeneratingStage(null);
      setSelectedGenerationId(result.id);
      await Promise.all([
        utils.sales.agents.history.invalidate({ agentKey: selectedKey, productId: selectedProduct?.id ?? null }),
        utils.ai.history.list.invalidate(),
        utils.analytics.overview.invalidate(),
      ]);
      toast.success(`${result.title} berhasil dibuat dan disimpan.`);
    },
    onError: error => {
      setGeneratingStage(null);
      toast.error(error.message || "Tahap workflow belum berhasil dibuat.");
    },
  });
  const generateDailyBrief = trpc.sales.agents.generateDailyBrief.useMutation({
    onSuccess: async result => {
      setSelectedGenerationId(result.id);
      await Promise.all([
        utils.sales.agents.history.invalidate({ agentKey: selectedKey, productId: selectedProduct?.id ?? null }),
        utils.sales.agents.overview.invalidate(),
        utils.ai.history.list.invalidate(),
        utils.analytics.overview.invalidate(),
      ]);
      toast.success("Daily Brief Pagi berhasil dibuat dan disimpan.");
    },
    onError: error => toast.error(error.message || "Daily Brief Pagi belum berhasil dibuat."),
  });

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetRevenue = Number(targetInput);
    const actualRevenue = actualInput.trim() ? Number(actualInput) : null;
    if (!Number.isSafeInteger(targetRevenue) || targetRevenue < 0 || (actualRevenue !== null && (!Number.isSafeInteger(actualRevenue) || actualRevenue < 0))) {
      toast.error("Masukkan nominal rupiah berupa bilangan bulat yang valid.");
      return;
    }
    updateWorkspace.mutate({
      agentKey: selectedKey,
      targetRevenue,
      actualRevenue,
      destinationUrl: destinationInput.trim(),
    });
  };

  const addProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createProduct.mutate({
      agentKey: selectedKey,
      name: newProductName.trim(),
      targetAudience: newProductAudience.trim() || null,
    });
  };

  const assignExistingProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignProductId) return;
    assignProduct.mutate({ productId: Number(assignProductId), agentKey: selectedKey });
  };

  const startStage = (stage: SalesWorkflowStage) => {
    if (!workspace || !selectedProduct) {
      toast.error("Pilih atau tambahkan produk yang dikelola track ini terlebih dahulu.");
      return;
    }
    const recipe = stageRecipe(stage, selectedKey);
    setGeneratingStage(stage);
    setSelectedGenerationId(null);
    generate.mutate({
      ...recipe,
      platform: "",
      businessName: user?.businessName || "",
      businessCategory: workspace.category,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      audience: selectedProduct.targetAudience || "",
      objective: `Mendukung peluang penjualan Sales Agent ${selectedKey} dan mengarahkan traffic ke Sales Link pengguna.`,
      tone: "Ramah, jelas, dan faktual",
      details: "Gunakan hanya informasi bisnis dan produk yang tercatat pengguna. Jangan membuat spesifikasi, klaim, performa, testimoni, pengalaman penggunaan, angka target, atau KPI yang tidak tersedia.",
      salesAgentKey: selectedKey,
      workflowStage: stage,
    });
  };

  const startDailyBrief = () => {
    if (!workspace || !selectedProduct) {
      toast.error("Pilih produk yang dikelola track ini terlebih dahulu.");
      return;
    }
    if (missingDailyBriefSources.length) {
      toast.error(`Lengkapi terlebih dahulu: ${missingDailyBriefSources.map(stage => SALES_DAILY_BRIEF_SOURCE_LABELS[stage]).join(", ")}.`);
      return;
    }
    setSelectedGenerationId(null);
    generateDailyBrief.mutate({ agentKey: selectedKey, productId: selectedProduct.id });
  };

  const stageIsLocked = (stage: SalesWorkflowStage) => {
    if (!selectedProduct) return true;
    if (stage === "opportunity_report") return !completedStages.has("daily_brief");
    if (stage === "ads_recommendation" || stage === "video_recommendation") {
      return !completedStages.has("opportunity_report") || !workspace?.destinationUrl;
    }
    if (stage === "campaign_recommendation") {
      return !completedStages.has("ads_recommendation") || !completedStages.has("video_recommendation") || !workspace?.destinationUrl;
    }
    return false;
  };

  const copyDestination = async () => {
    if (!workspace?.destinationUrl) return;
    try {
      await navigator.clipboard.writeText(workspace.destinationUrl);
      toast.success("Sales Link disalin.");
    } catch {
      toast.error("Link belum dapat disalin dari browser ini.");
    }
  };

  const progress = workspace?.actualRevenue != null && workspace.targetRevenue > 0
    ? Math.min(100, Math.round((workspace.actualRevenue / workspace.targetRevenue) * 100))
    : null;

  return <div className="sales-agents-page">
    <header className="sales-agents-hero">
      <div className="sales-agents-hero-copy">
        <span className="sales-overline"><i/> SALES AGENT WORKSPACE V3 <span>·</span> LIMA SPESIALIS, TIGA TRACK</span>
        <h1>Semua peluang menuju Sales Link-mu.</h1>
        <p>Atur produk dan tujuan traffic untuk tiap track. Tim spesialis menyiapkan brief hingga rekomendasi campaign—kamu tetap meninjau setiap hasil.</p>
      </div>
      <div className="sales-agents-hero-icon"><Target size={23}/><span>3</span></div>
    </header>

    <nav className="sales-track-tabs" aria-label="Pilih Sales Agent">
      {SALES_AGENT_DEFAULTS.map(track => {
        const selected = selectedKey === track.key;
        const trackData = overview.data?.workspaces.find(item => item.key === track.key);
        return <button key={track.key} className={`sales-track-tab ${selected ? "is-selected" : ""}`} onClick={() => { setSelectedKey(track.key); setSelectedGenerationId(null); }} aria-pressed={selected}>
          <span className="sales-track-tab-letter">{track.key}</span>
          <span className="sales-track-tab-copy"><strong>{track.name}</strong><small>{track.category}</small></span>
          <span className="sales-track-tab-target">{rupiah(trackData?.targetRevenue ?? track.targetRevenue)}</span>
        </button>;
      })}
    </nav>

    {overview.isLoading ? <div className="sales-agents-loading">Memuat workspace…</div> : overview.isError ? <div className="sales-load-error" role="alert"><span>Sales Agent Workspace belum dapat dimuat.</span><button onClick={() => overview.refetch()}>Coba lagi</button></div> : workspace && <>
      <section className="sales-track-summary">
        <div className="sales-track-identity"><span className="sales-track-key">{selectedKey}</span><div><span className="sales-mini-label">SALES TRACK · {selectedKey}</span><h2>{workspace.name}</h2><p>{workspace.category}</p></div></div>
        <div className="sales-track-metrics">
          <div><small>Target omzet</small><strong>{rupiah(workspace.targetRevenue)}</strong></div>
          <div><small>Omzet tercatat manual</small><strong>{workspace.actualRevenue == null ? "Belum dicatat" : rupiah(workspace.actualRevenue)}</strong></div>
          <div><small>Produk dikelola</small><strong>{products.length}</strong></div>
        </div>
        <div className="sales-track-progress">
          <div className="sales-track-progress-label"><span>Progress target track</span><strong>{progress == null ? "Belum ada catatan omzet" : `${progress}%`}</strong></div>
          <div className="sales-progress-track" role="progressbar" aria-label={`Progress target ${workspace.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress ?? 0}><i style={{ width: `${progress ?? 0}%` }}/></div>
          <small>{progress == null ? "Masukkan omzet aktual secara manual untuk menghitung progress." : `${rupiah(workspace.actualRevenue ?? 0)} dari ${rupiah(workspace.targetRevenue)} · input manual`}</small>
        </div>
      </section>

      <div className="sales-agent-workspace-grid">
        <aside className="sales-agent-settings-column">
          <section className="sales-agent-card sales-destination-card">
            <div className="sales-agent-card-heading"><span className="sales-settings-icon"><Link2 size={17}/></span><div><span className="sales-mini-label">SALES DESTINATION</span><h2>Sales Link (Lynk)</h2></div></div>
            <p className="sales-card-intro">URL Lynk milikmu dipakai sebagai tujuan traffic dari CTA campaign. Tidak ada integrasi atau URL yang dibuat otomatis.</p>
            {workspace.destinationUrl ? <div className="sales-destination-preview"><span className="sales-destination-status"><i/> LINK TERSIMPAN</span><a href={workspace.destinationUrl} target="_blank" rel="noopener noreferrer">{workspace.destinationUrl}<ExternalLink size={13}/></a><button type="button" className="sales-copy-link" onClick={copyDestination}><Copy size={13}/> Salin link</button></div> : <div className="sales-destination-empty"><Link2 size={16}/><span>Belum ada Lynk. Tambahkan URL milikmu sebelum membuat rekomendasi Ads, Video, dan Campaign.</span></div>}
            <form className="sales-agent-settings-form" onSubmit={saveSettings}>
              <label className="sales-agent-field"><span>URL Sales Destination Link</span><input type="url" inputMode="url" maxLength={2048} value={destinationInput} onChange={event => setDestinationInput(event.target.value)} placeholder="https://…"/><small>Gunakan URL lengkap yang diawali https://. URL tidak dikirim ke layanan AI.</small></label>
              <div className="sales-settings-divider"/>
              <label className="sales-agent-field"><span>Target omzet (Rp)</span><input type="number" min="0" step="1000" inputMode="numeric" value={targetInput} onChange={event => setTargetInput(event.target.value)}/></label>
              <label className="sales-agent-field"><span>Omzet tercatat manual (Rp) <i>opsional</i></span><input type="number" min="0" step="1000" inputMode="numeric" value={actualInput} onChange={event => setActualInput(event.target.value)} placeholder="Kosongkan jika belum dicatat"/></label>
              <button className="button button-primary sales-save-settings" type="submit" disabled={updateWorkspace.isPending}><Save size={15}/>{updateWorkspace.isPending ? "Menyimpan…" : "Simpan pengaturan"}</button>
            </form>
          </section>

          <section className="sales-agent-card sales-products-managed-card">
            <div className="sales-agent-card-heading"><span className="sales-settings-icon sales-product-icon"><Package size={17}/></span><div><span className="sales-mini-label">KATALOG TRACK</span><h2>Produk yang Dikelola</h2></div><span className="sales-managed-count">{products.length}</span></div>
            {products.length ? <div className="sales-managed-product-list">{products.map(product => <div className="sales-managed-product" key={product.id}>
              <span className="sales-managed-product-mark"><Package size={15}/></span><span className="sales-managed-product-copy"><strong>{product.name}</strong><small>{product.targetAudience || "Target audiens belum dicatat"}</small></span><span className={`sales-product-badge ${product.isActive ? "is-active" : "is-inactive"}`}>{product.isActive ? "Aktif" : "Nonaktif"}</span>
            </div>)}</div> : <div className="sales-managed-empty">Tambahkan produk atau petakan dari katalog yang sudah ada untuk memulai workflow.</div>}
            <form className="sales-assign-product-form" onSubmit={assignExistingProduct}>
              <label className="sales-agent-field"><span>Petakan produk dari katalog</span><select value={assignProductId} onChange={event => setAssignProductId(event.target.value)} disabled={!availableProducts.length}><option value="">{availableProducts.length ? "Pilih produk" : "Tidak ada produk yang tersedia"}</option>{availableProducts.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
              <button type="submit" className="button button-outline" disabled={!assignProductId || assignProduct.isPending}><Plus size={14}/> Petakan</button>
            </form>
            <details className="sales-add-product-details"><summary><Plus size={14}/> Tambah produk baru langsung ke track</summary><form className="sales-add-product-form" onSubmit={addProduct}>
              <label className="sales-agent-field"><span>Nama produk <i>*</i></span><input required minLength={2} maxLength={160} value={newProductName} onChange={event => setNewProductName(event.target.value)} placeholder="Nama sesuai informasi produk"/></label>
              <label className="sales-agent-field"><span>Target audiens <i>opsional</i></span><input maxLength={220} value={newProductAudience} onChange={event => setNewProductAudience(event.target.value)} placeholder="Hanya jika sudah diketahui"/></label>
              <button type="submit" className="button button-primary" disabled={createProduct.isPending}>{createProduct.isPending ? "Menyimpan…" : "Simpan produk"}</button>
            </form></details>
            <div className="sales-ai-disclaimer"><BadgeCheck size={14}/> Data produk hanya memakai informasi yang kamu masukkan.</div>
          </section>
        </aside>

        <main className="sales-agent-workflow-column">
          <section className="sales-agent-card sales-workflow-card">
            <div className="sales-agent-card-heading sales-workflow-heading"><span className="sales-settings-icon sales-workflow-icon"><Sparkles size={17}/></span><div><span className="sales-mini-label">URUTAN KERJA</span><h2>Dari brief ke traffic</h2></div><span className="sales-workflow-team-count">5 spesialis</span></div>
            <div className="sales-specialist-roster" aria-label="Spesialis yang bekerja di belakang layar">{existingTeam.map(category => <span key={category} className={`sales-specialist-chip team-${agents[category].accent}`} title={`${agents[category].name} · ${agents[category].role}`}><i>{agents[category].name.slice(0, 1)}</i>{agents[category].name}</span>)}</div>
            <ol className="sales-workflow-steps">{workflowSteps.map((step, index) => {
              const existing = history.data?.find(item => item.workflowStage === step.stage);
              const specialist = specialistFor(step.stage, selectedKey);
              const locked = stageIsLocked(step.stage);
              const isPending = generatingStage === step.stage && generate.isPending;
              return <li className={`sales-workflow-step ${existing ? "is-complete" : ""} ${locked ? "is-locked" : ""}`} key={step.stage}>
                <span className="sales-step-number">{existing ? <Check size={15}/> : index + 1}</span>
                <div className="sales-step-copy"><div className="sales-step-title-row"><strong>{SALES_WORKFLOW_LABELS[step.stage]}</strong>{existing && <span className="sales-step-done">TERSIMPAN</span>}</div><p>{step.description}</p><small>{agents[specialist].name} · {agents[specialist].role}</small></div>
                <button className={`sales-step-action ${existing ? "is-regenerate" : ""}`} onClick={() => startStage(step.stage)} disabled={locked || generate.isPending} title={locked ? "Selesaikan tahap sebelumnya dan lengkapi persyaratan" : `Generate dengan ${agents[specialist].name}`}>
                  {isPending ? <LoaderCircle size={15} className="sales-spin"/> : existing ? <Sparkles size={14}/> : <WandSparkles size={14}/>}<span>{isPending ? "Menyusun…" : existing ? "Ulangi" : "Buat"}</span>
                </button>
              </li>;
            })}</ol>
            <div className="sales-workflow-footnote"><BadgeCheck size={14}/><span>Setiap tahap memakai jalur AI spesialis yang sudah ada. Hasil disimpan ke History. CTA menuju Lynk aktif setelah URL milikmu disimpan.</span></div>
          </section>

          <section className="sales-agent-card sales-morning-brief-card">
            <div className="sales-agent-card-heading"><span className="sales-settings-icon sales-morning-icon"><Sparkles size={17}/></span><div><span className="sales-mini-label">LAPORAN PAGI · {selectedProduct?.name ?? "PILIH PRODUK"}</span><h2>{SALES_DAILY_BRIEF_LABEL}</h2></div><span className="sales-workflow-team-count">AI</span></div>
            <p className="sales-card-intro">Sintesis dari Opportunity Report, Campaign Recommendation, Ads Recommendation, dan Video Recommendation tersimpan untuk produk dan track yang sama. Menjawab: “Apa yang harus dilakukan hari ini untuk mengejar target omzet?”</p>
            <div className="sales-daily-brief-sources" aria-label="Kelengkapan sumber laporan pagi">{SALES_DAILY_BRIEF_SOURCE_STAGES.map(stage => {
              const missing = missingDailyBriefSources.includes(stage);
              return <div className={`sales-daily-brief-source ${missing ? "is-missing" : "is-ready"}`} key={stage}><span>{missing ? "Belum tersedia" : "Tersimpan"}</span><strong>{SALES_DAILY_BRIEF_SOURCE_LABELS[stage]}</strong></div>;
            })}</div>
            {selectedProduct && !history.isLoading && missingDailyBriefSources.length > 0 && <p className="sales-daily-brief-prerequisite">Belum dapat dibuat untuk produk ini. Selesaikan dan simpan: {missingDailyBriefSources.map(stage => SALES_DAILY_BRIEF_SOURCE_LABELS[stage]).join(", ")}.</p>}
            {!selectedProduct && <p className="sales-daily-brief-prerequisite">Tambahkan atau pilih produk pada track ini, lalu lengkapi empat rekomendasi sumber.</p>}
            {!workspace.targetRevenueRecorded && <p className="sales-daily-brief-prerequisite">Target yang tampil masih nilai bawaan. Simpan target omzet di pengaturan track agar Daily Brief dapat menggunakannya; omzet aktual hanya dipakai jika kamu mencatatnya.</p>}
            <button type="button" className="button button-primary sales-daily-brief-action" onClick={startDailyBrief} disabled={!selectedProduct || history.isLoading || missingDailyBriefSources.length > 0 || generateDailyBrief.isPending}>
              {generateDailyBrief.isPending ? <><LoaderCircle size={15} className="sales-spin"/> Menyusun laporan pagi…</> : <><WandSparkles size={15}/>{latestDailyBrief ? "Susun ulang laporan hari ini" : "Buat Daily Brief Pagi"}</>}
            </button>
            {latestDailyBrief && <article className="sales-daily-brief-output"><div className="sales-generation-output-heading"><div><span>{SALES_DAILY_BRIEF_LABEL} · {workspace.name}</span><small>{new Date(latestDailyBrief.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</small></div></div><div className="sales-generation-markdown"><MarkdownOutput content={latestDailyBrief.result}/></div><div className="sales-ai-disclaimer"><BadgeCheck size={14}/> Hasil AI harus diverifikasi sebelum dipublikasikan. Jangan gunakan sebagai fakta produk tanpa pengecekan.</div></article>}
          </section>

          <section className="sales-agent-card sales-generation-results-card">
            <div className="sales-agent-card-heading"><span className="sales-settings-icon sales-results-icon"><Sparkles size={17}/></span><div><span className="sales-mini-label">HASIL WORKFLOW</span><h2>Draft untuk ditinjau</h2></div><span className="sales-managed-count">{history.data?.length ?? 0}</span></div>
            {history.isLoading ? <div className="sales-agents-loading">Memuat hasil track…</div> : history.data?.length ? <>
              <div className="sales-generation-tabs" role="list" aria-label="Hasil workflow tersimpan">{history.data.slice(0, 8).map(item => <button key={item.id} className={`sales-generation-tab ${selectedGeneration?.id === item.id ? "is-active" : ""}`} onClick={() => setSelectedGenerationId(item.id)}>{generationLabel(item.workflowStage, item.title)}<small>{new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</small></button>)}</div>
              {selectedGeneration && <article className="sales-generation-output"><div className="sales-generation-output-heading"><div><span>{generationLabel(selectedGeneration.workflowStage, selectedGeneration.title)}</span><small>{new Date(selectedGeneration.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</small></div>{workspace.destinationUrl && <a className="sales-output-destination" href={workspace.destinationUrl} target="_blank" rel="noopener noreferrer">Buka Sales Link <ExternalLink size={13}/></a>}</div><div className="sales-generation-markdown"><MarkdownOutput content={selectedGeneration.result}/></div><div className="sales-ai-disclaimer"><BadgeCheck size={14}/> Hasil AI harus diverifikasi sebelum dipublikasikan. Jangan gunakan sebagai fakta produk tanpa pengecekan.</div></article>}
            </> : <div className="sales-results-empty"><span><Sparkles size={19}/></span><strong>Belum ada hasil workflow</strong><p>{products.length ? "Mulai dari Daily Brief untuk menyiapkan tahapan berikutnya." : "Tambahkan produk ke track ini, lalu mulai dari Daily Brief."}</p></div>}
          </section>
        </main>
      </div>

      <section className="sales-agent-specialist-footer"><div><span className="sales-mini-label">SPESIALIS YANG BEKERJA DI BELAKANG LAYAR</span><p>Tiga Sales Agent adalah track kerja, bukan agent baru. Workflow menggunakan Naya, Raka, Dira, Bima, dan Alya sesuai jenis rekomendasinya.</p></div><div className="sales-specialist-footer-links">{existingTeam.map(category => <a key={category} href={categoryRoutes[category]}>{agents[category].name} <ArrowRight size={12}/></a>)}</div></section>
    </>}
  </div>;
}
