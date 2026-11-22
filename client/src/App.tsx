import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import type { Category } from "./lib/product";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AppLayout = lazy(() => import("./pages/AppLayout"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const GeneratorPage = lazy(() => import("./pages/GeneratorPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AgentWorkspacePage = lazy(() => import("./pages/AgentWorkspacePage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const SalesAgentsPage = lazy(() => import("./pages/SalesAgentsPage"));

const agentBySlug: Record<string, Category> = { "ads-strategist": "ads", "video-creative": "video", "growth-strategist": "marketing", "marketplace-specialist": "marketplace", "affiliate-creator": "affiliate" };

function ProtectedRoute({ page, category, historyId }: { page: string; category?: Category; historyId?: number }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => { if (!loading && !user) navigate("/login"); }, [loading, user, navigate]);
  if (loading || !user) return <div className="route-loader"><span className="loader-ring" /><span>Menyiapkan ruang kerjamu…</span></div>;
  let content;
  if (page === "dashboard") content = <DashboardPage />;
  else if (page === "agents") content = <AgentWorkspacePage />;
  else if (page === "projects") content = <ProjectsPage />;
  else if (page === "sales-agents") content = <SalesAgentsPage />;
  else if (page === "analytics") content = <AnalyticsPage />;
  else if (category) content = <GeneratorPage category={category} />;
  else if (page === "history") content = <HistoryPage />;
  else if (page === "history-detail" && historyId) content = <HistoryPage id={historyId} />;
  else if (page === "pricing") content = <PricingPage inApp />;
  else if (page === "profile") content = <ProfilePage />;
  else content = <NotFound />;
  const active = category ? `agent-${category}` : page === "history-detail" ? "history" : page;
  return <AppLayout active={active}>{content}</AppLayout>;
}

function Router() {
  return <Switch>
    <Route path="/" component={LandingPage} />
    <Route path="/login" component={LoginPage} />
    <Route path="/pricing">{() => <PricingPage />}</Route>
    <Route path="/app/history/:id">{params => <ProtectedRoute page="history-detail" historyId={Number(params.id)} />}</Route>
    <Route path="/app/agents/:slug">{params => <ProtectedRoute page="agent" category={agentBySlug[params.slug]} />}</Route>
    <Route path="/app/agents"><ProtectedRoute page="agents" /></Route>
    <Route path="/app/projects"><ProtectedRoute page="projects" /></Route>
    <Route path="/app/sales-agents"><ProtectedRoute page="sales-agents" /></Route>
    <Route path="/app/analytics"><ProtectedRoute page="analytics" /></Route>
    <Route path="/app/ads"><ProtectedRoute page="agent" category="ads" /></Route>
    <Route path="/app/video"><ProtectedRoute page="agent" category="video" /></Route>
    <Route path="/app/marketing"><ProtectedRoute page="agent" category="marketing" /></Route>
    <Route path="/app/marketplace"><ProtectedRoute page="agent" category="marketplace" /></Route>
    <Route path="/app/history"><ProtectedRoute page="history" /></Route>
    <Route path="/app/pricing"><ProtectedRoute page="pricing" /></Route>
    <Route path="/app/profile"><ProtectedRoute page="profile" /></Route>
    <Route path="/app"><ProtectedRoute page="dashboard" /></Route>
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster position="top-right" /><Suspense fallback={<div className="route-loader"><span className="loader-ring" /><span>Menyiapkan JagoBisnis AI…</span></div>}><Router /></Suspense></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
