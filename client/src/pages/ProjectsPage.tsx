import { useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarDays, Check, Edit3, FolderKanban, Plus, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { agents } from "@/lib/product";
import "./SalesDashboard.css";

type CampaignStatus = "draft" | "active" | "paused" | "completed";
const campaignStatusLabels: Record<CampaignStatus, string> = {
  draft: "Draft",
  active: "Aktif",
  paused: "Dijeda",
  completed: "Selesai",
};
const dateLabel = (value: Date | string) => new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default function ProjectsPage() {
  const { user } = useAuth();
  const projects = trpc.projects.list.useQuery();
  const utils = trpc.useUtils();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [objective, setObjective] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("draft");

  useEffect(() => {
    setBusinessName(value => value || user?.businessName || "");
    setBusinessCategory(value => value || user?.businessCategory || "");
  }, [user?.businessName, user?.businessCategory]);

  const clearForm = () => {
    setEditingId(null);
    setName("");
    setBusinessName(user?.businessName || "");
    setBusinessCategory(user?.businessCategory || "");
    setObjective("");
    setStatus("draft");
  };
  const onSaved = async () => {
    await Promise.all([utils.projects.list.invalidate(), utils.analytics.overview.invalidate()]);
    toast.success(editingId ? "Project diperbarui." : "Project baru siap dikerjakan.");
    clearForm();
  };
  const create = trpc.projects.create.useMutation({ onSuccess: onSaved, onError: error => toast.error(error.message) });
  const update = trpc.projects.update.useMutation({ onSuccess: onSaved, onError: error => toast.error(error.message) });
  const updateStatus = trpc.projects.setStatus.useMutation({
    onSuccess: async () => { await utils.projects.list.invalidate(); toast.success("Status campaign diperbarui."); },
    onError: error => toast.error(error.message || "Status campaign belum berhasil diperbarui."),
  });
  const busy = create.isPending || update.isPending;
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = { name, businessName, businessCategory, objective, status };
    if (editingId) update.mutate({ id: editingId, ...values });
    else create.mutate(values);
  };
  const edit = (project: NonNullable<typeof projects.data>[number]) => {
    setEditingId(project.id);
    setName(project.name);
    setBusinessName(project.businessName);
    setBusinessCategory(project.businessCategory || "");
    setObjective(project.objective || "");
    setStatus(project.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <div className="projects-page">
    <section className="projects-page-heading">
      <div><span className="app-breadcrumb-label">WORKSPACE <span>/</span> PROJECTS</span><h1>Recent Projects</h1><p>Satukan brief, tim agent, dan campaign dalam workspace yang sama.</p></div>
      <span className="project-count"><FolderKanban size={16}/>{projects.data?.length ?? 0} project</span>
    </section>
    <div className="projects-layout">
      <section className="project-form-card">
        <div className="project-form-heading"><span className="project-heading-icon"><Plus size={18}/></span><div><h2>{editingId ? "Edit project" : "Buat project baru"}</h2><p>{editingId ? "Perbarui konteks bisnis dan status campaign." : "Mulai workspace terarah untuk bisnis atau campaign."}</p></div></div>
        <form className="project-form" onSubmit={submit}>
          <label className="form-field"><span>Nama project <i>*</i></span><input id="project-name" required minLength={2} maxLength={160} value={name} onChange={event => setName(event.target.value)} placeholder="Contoh: Peluncuran menu Ramadan"/></label>
          <label className="form-field"><span>Nama bisnis <i>*</i></span><input required minLength={2} maxLength={160} value={businessName} onChange={event => setBusinessName(event.target.value)} placeholder="Contoh: Kedai Kopi Pagi"/></label>
          <label className="form-field"><span>Kategori bisnis</span><input maxLength={120} value={businessCategory} onChange={event => setBusinessCategory(event.target.value)} placeholder="Contoh: makanan & minuman"/></label>
          <label className="form-field"><span>Tujuan project</span><textarea maxLength={240} rows={3} value={objective} onChange={event => setObjective(event.target.value)} placeholder="Apa yang ingin dicapai tim?"/></label>
          <label className="form-field"><span>Status campaign</span><select value={status} onChange={event => setStatus(event.target.value as CampaignStatus)}>{Object.entries(campaignStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <div className="project-form-actions">{editingId && <button type="button" className="button button-outline" onClick={clearForm}>Batal</button>}<button className="button button-primary" disabled={busy}>{busy ? <span className="button-spinner"/> : editingId ? <Check size={16}/> : <Plus size={16}/>} {editingId ? "Simpan perubahan" : "Buat project"}</button></div>
        </form>
      </section>
      <section className="project-list-panel">
        <div className="project-list-heading"><div><span className="section-eyebrow">RUANG KERJA</span><h2>Project terbaru</h2><p>Tandai status untuk mengatur Campaign aktif di Dashboard.</p></div><span className="project-list-number">{projects.data?.length ?? 0}</span></div>
        {projects.isLoading ? <div className="projects-loading"><span className="loader-ring"/> Memuat project…</div> : projects.data?.length ? <div className="project-card-list">{projects.data.map((project, index) => <article className="project-card" key={project.id}>
          <span className={`project-card-icon project-color-${index % 4}`}><BriefcaseBusiness size={19}/></span>
          <div className="project-card-main"><span className="project-card-kicker">{project.businessCategory || "PROJECT MARKETING"}</span><h3>{project.name}</h3><p>{project.businessName}{project.objective ? ` · ${project.objective}` : ""}</p><div className="project-card-meta"><span><Sparkles size={13}/> {project.generationCount} hasil AI</span><span><CalendarDays size={13}/> Diperbarui {dateLabel(project.updatedAt)}</span></div></div>
          <div className="project-card-actions">
            <label className="project-status-control"><span>Status</span><select aria-label={`Status campaign ${project.name}`} value={project.status} onChange={event => updateStatus.mutate({ id: project.id, status: event.target.value as CampaignStatus })} disabled={updateStatus.isPending}>{Object.entries(campaignStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <button className="icon-button" title="Edit project" aria-label={`Edit ${project.name}`} onClick={() => edit(project)}><Edit3 size={16}/></button>
            <Link className="project-use-button" href={`/app?projectId=${project.id}#quick-generate`}><span>Buka workspace</span><ArrowRight size={16}/></Link>
          </div>
        </article>)}</div> : <div className="projects-empty"><span><FolderKanban size={22}/></span><strong>Belum ada project</strong><p>Buat project pertama agar konteks bisnis dan campaign tersusun rapi.</p><button className="button button-outline" onClick={() => document.getElementById("project-name")?.focus()}><Plus size={15}/> Buat project</button></div>}
        <div className="project-agent-tip"><span><Sparkles size={15}/></span><p>Project terhubung ke agent <strong>{Object.values(agents).map(agent => agent.role).join(", ")}</strong> melalui workspace.</p></div>
      </section>
    </div>
  </div>;
}
