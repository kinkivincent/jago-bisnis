import { ArrowRight, BarChart3, Check, ChevronRight, Link2, Megaphone, Sparkles, Store, UsersRound, Video, type LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { agents, categoryRoutes, type Category } from "@/lib/product";

const icons: Record<Category, LucideIcon> = { ads: Megaphone, video: Video, marketing: BarChart3, marketplace: Store, affiliate: Link2 };
const team = Object.keys(agents) as Category[];

export default function AgentWorkspacePage() {
  const history = trpc.ai.history.list.useQuery();
  return <div className="agent-workspace-page">
    <section className="team-page-hero"><div className="team-page-copy"><span className="section-eyebrow">AGENT WORKSPACE · SATU TIM, SATU TUJUAN</span><h1>Tim marketing AI-mu siap bergerak.</h1><p>Lima partner spesialis bekerja di ruang kerja yang sama—termasuk partner creator affiliate. Pilih siapa yang kamu butuhkan, ceritakan konteks project, lalu arahkan hasilnya.</p><div className="team-page-proof"><span className="team-avatar-stack">{team.map(category => <i className={`team-avatar-${agents[category].accent}`} key={category}>{agents[category].name.slice(0, 1)}</i>)}</span><span>{team.length} agent spesialis · brief dan history tetap terhubung</span></div></div><div className="team-page-orbit"><div className="team-orbit-ring"/><div className="team-center-mark"><Sparkles size={28}/></div>{team.map((category, index) => <i className={`orbit-member orbit-member-${index + 1}`} key={category} title={agents[category].role}>{agents[category].name.slice(0, 1)}</i>)}</div></section>
    <div className="team-section-heading"><div><span className="section-eyebrow">KENALI TIMMU</span><h2>Pilih partner untuk langkah berikutnya</h2><p>Setiap agent punya spesialisasi dan halaman kerja sendiri dalam dashboard ini.</p></div><span className="team-status"><i/> Tim siap</span></div>
    <section className="agent-team-grid">{team.map((category, index) => { const agent = agents[category]; const Icon = icons[category]; const drafts = history.data?.filter(item => item.category === category).length ?? 0; return <Link key={category} href={categoryRoutes[category]} className={`agent-team-card agent-${agent.accent}`}><div className="agent-card-top"><span className="agent-avatar"><span>{agent.name.slice(0, 1)}</span><i><Icon size={13}/></i></span><span className="agent-online"><i/> SIAP MEMBANTU</span></div><div className="agent-card-identity"><span>{agent.role} · Agent 0{index + 1}</span><h3>{agent.name}</h3><p>{agent.intro}</p></div><p className="agent-card-description">{agent.description}</p><div className="agent-expertise">{agent.expertise.map(item => <span key={item}>{item}</span>)}</div><div className="agent-card-footer"><span><Sparkles size={14}/> {drafts} draft tersimpan</span><span className="agent-card-open">Buka ruang agent <ArrowRight size={15}/></span></div></Link>; })}</section>
    <section className="team-collaboration"><span className="team-collab-icon"><UsersRound size={19}/></span><div><strong>Kamu tetap memimpin. Tim AI membantu mengeksekusi.</strong><p>Semua draft, project, dan konteks bisnis berada dalam satu workspace—mudah ditinjau dan diarahkan kembali olehmu.</p></div><Link href="/app" className="text-link">Mulai dari brief <ChevronRight size={16}/></Link><Check className="team-collab-check" size={18}/></section>
  </div>;
}
