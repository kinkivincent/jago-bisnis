import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import BrandLogo from "@/components/BrandLogo";
import { useEffect } from "react";

const benefits = ["Semua tools marketing dalam satu tempat", "Brief dan hasil tersimpan di akunmu", "Dibuat khusus untuk bisnis Indonesia"];

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => { if (!loading && user) navigate("/app"); }, [loading, user, navigate]);
  return (
    <main className="login-page">
      <div className="login-left">
        <Link href="/" className="login-back"><ArrowLeft size={16} /> Kembali ke beranda</Link>
        <div className="login-left-content"><BrandLogo light /><span className="login-kicker"><Sparkles size={14} /> RUANG KERJA PERTUMBUHANMU</span><h1>Waktunya bisnis<br />kamu <span>naik level.</span></h1><p>Satu tempat untuk bikin marketing yang lebih jago, lebih konsisten, dan lebih mudah dijalankan.</p><div className="login-benefits">{benefits.map(item => <div key={item}><span><Check size={14} /></span>{item}</div>)}</div><div className="login-quote"><span>“</span><p>Fokus ke yang paling penting: pelanggan dan bisnismu.</p><small>JagoBisnis AI · Teman tumbuh UMKM</small></div></div>
        <span className="login-ambient login-ambient-one"/><span className="login-ambient login-ambient-two"/>
      </div>
      <div className="login-right"><div className="login-card">
        <div className="login-card-logo"><BrandLogo /></div><div className="login-card-heading"><span className="login-welcome-icon"><Sparkles size={18} /></span><h2>Selamat datang kembali</h2><p>Masuk ke ruang kerja JagoBisnis AI kamu.</p></div>
        <button className="button button-primary login-submit" onClick={() => startLogin()}>Lanjutkan dengan akun Manus <ArrowRight size={17} /></button>
        <div className="login-divider"><span>AMAN & PRAKTIS</span></div><div className="login-security"><ShieldCheck size={18} /><div><strong>Login aman, tanpa password baru</strong><span>Gunakan akun Manus untuk masuk atau membuat akun dengan aman.</span></div></div>
        <p className="login-terms">Dengan melanjutkan, kamu menyetujui <a href="#ketentuan">Ketentuan Layanan</a> dan <a href="#privasi">Kebijakan Privasi</a>.</p>
        <p className="login-signup">Belum punya akun? <button onClick={() => startLogin()}>Daftar gratis</button></p>
      </div><div className="login-footer"><span>© 2026 JagoBisnis AI</span><span>Dirancang untuk bisnis yang terus bertumbuh</span></div></div>
    </main>
  );
}
