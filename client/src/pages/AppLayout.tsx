import { useState } from "react";
import { BarChart3, Bell, BriefcaseBusiness, ChevronDown, CreditCard, History, LayoutDashboard, Link2, LogOut, Megaphone, Menu, Search, Settings2, Sparkles, Store, Target, Video, UsersRound, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import BrandLogo from "@/components/BrandLogo";
import { agents, categoryRoutes, type Category } from "@/lib/product";

const overviewNavigation = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, active: "dashboard" },
  { href: "/app/sales-agents", label: "Sales Agent Workspace", icon: Target, active: "sales-agents" },
  { href: "/app/agents", label: "Agent Workspace", icon: UsersRound, active: "agents" },
  { href: "/app/projects", label: "Recent Projects", icon: BriefcaseBusiness, active: "projects" },
];
const agentIcons = { ads: Megaphone, video: Video, marketing: BarChart3, marketplace: Store, affiliate: Link2 };
const agentNavigation = (Object.keys(agents) as Category[]).map(category => ({ href: categoryRoutes[category], label: agents[category].role, icon: agentIcons[category], active: `agent-${category}` }));
const workspaceNavigation = [
  { href: "/app/pricing", label: "Paket & harga", icon: CreditCard, active: "pricing" },
];
const technicalNavigation = [
  { href: "/app/analytics", label: "Analytics", icon: BarChart3, active: "analytics" },
  { href: "/app/history", label: "History", icon: History, active: "history" },
];
const allNavigation = [...overviewNavigation, ...agentNavigation, ...workspaceNavigation, ...technicalNavigation];

export default function AppLayout({ active, children }: { active: string; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = allNavigation.find(item => item.active === active) || allNavigation.find(item => item.href === location || location.startsWith(`${item.href}/`));
  const closeMenu = () => setMobileOpen(false);
  const menu = (items: typeof overviewNavigation) => items.map(item => {
    const Icon = item.icon;
    const selected = item.active === active || (item.href === "/app/history" && location.startsWith("/app/history"));
    return <Link key={item.href} href={item.href} onClick={closeMenu} className={`sidebar-link ${selected ? "sidebar-link-active" : ""}`}><Icon size={17}/><span>{item.label}</span>{selected && <span className="active-indicator"/>}</Link>;
  });
  const sidebarContent = <>
    <div className="sidebar-brand"><Link href="/app" onClick={closeMenu}><BrandLogo/></Link><button className="sidebar-close mobile-only" onClick={closeMenu} aria-label="Tutup menu"><X size={20}/></button></div>
    <div className="workspace-select"><span className="workspace-icon"><BriefcaseBusiness size={16}/></span><span className="workspace-copy"><strong>{user?.businessName || "Workspace saya"}</strong><small>AI Growth Platform</small></span><ChevronDown size={15}/></div>
    <div className="sidebar-label">OVERVIEW</div><nav className="sidebar-nav">{menu(overviewNavigation)}</nav>
    <div className="sidebar-label sidebar-label-space">AGENT TEAM</div><nav className="sidebar-nav sidebar-agent-nav">{menu(agentNavigation)}</nav>
    <div className="sidebar-label sidebar-label-space">KELOLA</div><nav className="sidebar-nav">{menu(workspaceNavigation)}</nav>
    <div className="sidebar-spacer"/>
    <div className="sidebar-plan"><div className="plan-spark"><Sparkles size={16}/></div><strong>Ruang untuk terus tumbuh</strong><p>Kenali pilihan paket dan rencana workspace kamu.</p><Link href="/app/pricing" onClick={closeMenu}>Lihat paket <span>→</span></Link><div className="plan-deco"/></div>
    <Link href="/app/profile" onClick={closeMenu} className={`sidebar-user ${active === "profile" ? "sidebar-user-active" : ""}`}><span className="user-avatar">{(user?.name || "J").slice(0,1).toUpperCase()}</span><span className="sidebar-user-copy"><strong>{user?.name || "Akun pengguna"}</strong><small>{user?.email || "Profil saya"}</small></span><Settings2 size={16}/></Link>
  </>;
  return <div className="app-shell">{mobileOpen && <button className="mobile-scrim" onClick={closeMenu} aria-label="Tutup navigasi"/>}<aside className={`app-sidebar ${mobileOpen ? "sidebar-open" : ""}`}>{sidebarContent}</aside><div className="app-main-area"><header className="app-topbar"><div className="topbar-left"><button className="mobile-menu-trigger" onClick={() => setMobileOpen(true)} aria-label="Buka navigasi"><Menu size={21}/></button><div className="breadcrumbs"><Link href="/app">Workspace</Link><span>/</span><strong>{current?.label || (active === "profile" ? "Profil" : "Workspace")}</strong></div></div><div className="topbar-right"><label className="topbar-search"><Search size={16}/><input placeholder="Cari project atau agent..." aria-label="Cari workspace" onKeyDown={event => { if (event.key === "Enter") window.location.href = "/app/projects"; }}/><kbd>⌘ K</kbd></label><button className="icon-button notification-button" aria-label="Notifikasi"><Bell size={18}/><i/></button><Link href="/app/profile" className="topbar-avatar">{(user?.name || "J").slice(0,1).toUpperCase()}</Link><button className="logout-button" title="Keluar" onClick={async () => { await logout(); window.location.href = "/"; }}><LogOut size={17}/></button></div></header><main className="app-content">{children}</main></div></div>;
}
