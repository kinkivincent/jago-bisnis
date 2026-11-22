import { useState } from "react";
import { ArrowLeft, ArrowRight, BarChart3, CalendarDays, Check, Clock3, Copy, History, Link2, Megaphone, RotateCw, Sparkles, Store, Video, WandSparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import MarkdownOutput from "@/components/MarkdownOutput";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { categories, categoryRoutes, toolLabel, type Category } from "@/lib/product";

const icons: Record<Category, typeof Megaphone> = { ads: Megaphone, video: Video, marketing: BarChart3, marketplace: Store, affiliate: Link2 };
const categoryNames: Record<Category, string> = { ads: "Ads AI", video: "Video Ads AI", marketing: "Marketing AI", marketplace: "Marketplace AI", affiliate: "Affiliate AI" };
const dateLabel = (value: Date | string) => new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

export default function HistoryPage({ id }: { id?: number }) {
  const [, navigate] = useLocation();
  const list = trpc.ai.history.list.useQuery();
  const detail = trpc.ai.history.get.useQuery({ id: id ?? 0 }, { enabled: Boolean(id), retry: false });
  const utils = trpc.useUtils();
  const [copied, setCopied] = useState(false);
  const regenerate = trpc.ai.regenerate.useMutation({ onSuccess: async result => { await utils.ai.history.list.invalidate(); toast.success("Variasi baru sudah tersimpan."); navigate(`/app/history/${result.id}`); }, onError: error => toast.error(error.message) });
  const item = detail.data;
  const Icon = item ? icons[item.category as Category] ?? Sparkles : History;
  const copy = async (text: string) => { await navigator.clipboard.writeText(text); setCopied(true); toast.success("Hasil disalin ke clipboard."); window.setTimeout(() => setCopied(false), 1800); };

  if (id) {
    if (detail.isLoading) return <div className="history-loading"><span className="loader-ring"/> Membuka hasil…</div>;
    if (detail.error || !item) return <div className="history-error"><span className="empty-spark"><History size={20}/></span><h2>Hasil tidak ditemukan</h2><p>Hasil ini mungkin sudah tidak tersedia.</p><Link href="/app/history" className="button button-outline"><ArrowLeft size={15}/> Kembali ke riwayat</Link></div>;
    return <div className="history-detail-page"><Link href="/app/history" className="back-link"><ArrowLeft size={15}/> Kembali ke riwayat</Link><div className="history-detail-heading"><div><span className={`history-detail-icon category-${item.category}`}><Icon size={20}/></span><span className="section-eyebrow">{categoryNames[item.category as Category] || "JAGO AI"} <span>/</span> {toolLabel(item.tool)}</span><h1>{item.title}</h1><p><CalendarDays size={15}/> {dateLabel(item.createdAt)}</p></div><div className="result-actions"><button className="button button-outline" onClick={() => void copy(item.result)}>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Tersalin" : "Salin hasil"}</button><button className="button button-soft" onClick={() => navigate(`${categoryRoutes[item.category as Category]}?reuse=${item.id}`)}><WandSparkles size={15}/> Gunakan brief</button><button className="button button-primary" disabled={regenerate.isPending} onClick={() => regenerate.mutate({ id: item.id })}>{regenerate.isPending ? <span className="button-spinner"/> : <RotateCw size={15}/>} Buat variasi baru</button></div></div><div className="history-output"><div className="history-output-top"><span><Sparkles size={15}/> HASIL GENERASI</span><span><Clock3 size={14}/> {dateLabel(item.createdAt)}</span></div><div className="result-content"><MarkdownOutput>{item.result}</MarkdownOutput></div></div><div className="history-detail-tip"><span><Check size={15}/></span><p>Hasil AI harus diverifikasi sebelum dipublikasikan. Jangan gunakan sebagai fakta produk tanpa pengecekan.</p></div></div>;
  }

  return <div className="history-page"><div className="history-page-heading"><div><div className="app-breadcrumb-label">WORKSPACE <span>/</span> RIWAYAT</div><h1>Riwayat Generate</h1><p>Semua ide bagusmu, tersimpan rapi dan siap digunakan kembali. Hasil AI harus diverifikasi sebelum dipublikasikan. Jangan gunakan sebagai fakta produk tanpa pengecekan.</p></div><span className="history-count"><History size={16}/> {list.data?.length ?? 0} hasil tersimpan</span></div><div className="history-filter-row"><span className="history-filter-active">Semua hasil <span>{list.data?.length ?? 0}</span></span><span className="history-filter-note"><Clock3 size={14}/> Terbaru lebih dulu</span></div>{list.isLoading ? <div className="history-loading"><span className="loader-ring"/> Memuat riwayat…</div> : list.data?.length ? <div className="history-list">{list.data.map(item => { const ItemIcon = icons[item.category as Category] ?? Sparkles; return <Link href={`/app/history/${item.id}`} key={item.id} className="history-row"><span className={`history-row-icon category-${item.category}`}><ItemIcon size={18}/></span><span className="history-row-main"><strong>{item.title}</strong><span className="history-row-meta"><span>{categoryNames[item.category as Category] || "Jago AI"}</span><i>·</i><span>{toolLabel(item.tool)}</span><i>·</i><span>{dateLabel(item.createdAt)}</span></span><span className="history-row-preview">{item.result.replace(/[#*`>]/g, "").slice(0, 180)}{item.result.length > 180 ? "…" : ""}</span></span><span className="history-row-action"><span>Buka hasil</span><ArrowRight size={16}/></span></Link>; })}</div> : <div className="empty-state history-empty"><span className="empty-spark"><History size={21}/></span><h2>Belum ada hasil di sini.</h2><p>Ide pertama yang kamu buat akan muncul di sini dan selalu bisa dibuka kembali.</p><Link href="/app/agents" className="button button-primary"><Sparkles size={16}/> Buat hasil pertama</Link></div>}</div>;
}
