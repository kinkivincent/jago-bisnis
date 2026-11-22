import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, ChevronRight, FolderKanban, Sparkles, TrendingUp, WandSparkles } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { agents, type Category } from "@/lib/product";

const weekLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const categoryNames: Record<Category, string> = { ads: "Ads Strategist", video: "Video Creative", marketing: "Growth Strategist", marketplace: "Marketplace Specialist", affiliate: "Affiliate Creator" };

export default function AnalyticsPage() {
  const analytics = trpc.analytics.overview.useQuery(undefined, { retry: false, refetchOnWindowFocus: false, meta: { suppressConsoleError: true } });
  const projects = trpc.projects.list.useQuery();
  const data = analytics.data;
  const hasGenerationData = (data?.totalGenerations ?? 0) > 0;
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - 6 + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { key, label: weekLabels[date.getDay()], value: data?.activity.find(item => item.day === key)?.total ?? 0 };
  });
  const peak = Math.max(1, ...days.map(day => day.value));
  const agentsSorted = [...(data?.byAgent ?? [])].sort((a, b) => b.total - a.total);
  const maxAgent = Math.max(1, ...agentsSorted.map(item => item.total));
  const topAgent = agentsSorted[0]?.category as Category | undefined;

  return <div className="analytics-page">
    <section className="analytics-page-heading">
      <div><span className="app-breadcrumb-label">WORKSPACE <span>/</span> ANALYTICS</span><h1>Analytics workspace</h1><p>Lihat ritme kerja tim AI dan project yang tersimpan.</p></div>
      <span className="analytics-period"><CalendarDays size={15}/> Sejak workspace dimulai</span>
    </section>

    <section className="analytics-summary-grid">
      <article className="analytics-summary-card"><span className="analytics-summary-icon icon-blue"><WandSparkles size={18}/></span><span className="analytics-summary-label">Total draft dibuat</span><strong>{analytics.isLoading ? "—" : data?.totalGenerations ?? 0}</strong><small>Hasil generasi tersimpan</small></article>
      <article className="analytics-summary-card"><span className="analytics-summary-icon icon-orange"><FolderKanban size={18}/></span><span className="analytics-summary-label">Total project</span><strong>{projects.isLoading ? "—" : projects.data?.length ?? 0}</strong><small>Project tersimpan di workspace</small></article>
      <article className="analytics-summary-card"><span className="analytics-summary-icon icon-violet"><TrendingUp size={18}/></span><span className="analytics-summary-label">Agent paling aktif</span><strong className="analytics-text-value">{topAgent ? agents[topAgent].role : "Belum ada"}</strong><small>{topAgent ? `${agents[topAgent].name} · berdasarkan draft tersimpan` : "Mulai brief pertama bersama agent"}</small></article>
    </section>

    <div className="analytics-main-grid">
      <section className="analytics-panel">
        <div className="analytics-panel-heading"><div><span className="section-eyebrow">AKTIVITAS WORKSPACE</span><h2>Generasi AI · 7 hari terakhir</h2><p>Jumlah draft yang tersimpan setiap hari.</p></div><span className="analytics-panel-icon"><BarChart3 size={18}/></span></div>
        {analytics.isLoading ? <div className="projects-loading"><span className="loader-ring"/> Memuat analytics…</div> : hasGenerationData ? <div className="weekly-chart">{days.map(day => <div className="weekly-chart-col" key={day.key}><span className="weekly-chart-value">{day.value || ""}</span><div className="weekly-bar-track"><i style={{ height: `${day.value ? Math.max(8, day.value / peak * 100) : 3}%` }}/></div><span className="weekly-chart-label">{day.label}</span></div>)}</div> : <div className="analytics-empty"><span><Sparkles size={18}/></span><strong>Belum ada data</strong><p>Grafik aktivitas akan muncul setelah ada hasil generasi yang tersimpan.</p></div>}
        <div className="analytics-chart-foot"><span><i/> Draft AI yang disimpan</span><span>Periode 7 hari</span></div>
      </section>

      <section className="analytics-panel agent-activity-panel">
        <div className="analytics-panel-heading"><div><span className="section-eyebrow">KONTRIBUSI TIM</span><h2>Draft per agent</h2><p>Pembagian output yang tercatat.</p></div><Sparkles size={18} className="analytics-spark"/></div>
        {analytics.isLoading ? <div className="projects-loading"><span className="loader-ring"/> Memuat…</div> : agentsSorted.length ? <div className="agent-activity-list">{agentsSorted.map(item => { const category = item.category as Category; const percent = Math.round(item.total / maxAgent * 100); return <div className="agent-activity-row" key={item.category}><div><strong>{categoryNames[category] || item.category}</strong><span>{agents[category]?.name}</span></div><div className="agent-activity-track"><i className={`bar-${agents[category]?.accent || "blue"}`} style={{ width: `${percent}%` }}/></div><b>{item.total}</b></div>; })}</div> : <div className="analytics-empty"><span><Sparkles size={18}/></span><strong>Belum ada data</strong><p>Kontribusi agent akan muncul setelah hasil pertama tersimpan.</p><Link href="/app/agents" className="text-link">Kenali tim agent <ChevronRight size={15}/></Link></div>}
      </section>
    </div>

    <section className="analytics-note"><span><Sparkles size={17}/></span><div><strong>Analytics yang jujur, berangkat dari aktivitas nyata.</strong><p>Dashboard ini menghitung draft dan project yang tersimpan. Metrik seperti klik, konversi, atau ROAS belum tersedia karena belum terhubung ke akun iklan dan marketplace.</p></div><span className="analytics-note-mark">{data?.totalGenerations ? <ArrowUpRight size={19}/> : <ArrowDownRight size={19}/>}</span></section>
  </div>;
}
