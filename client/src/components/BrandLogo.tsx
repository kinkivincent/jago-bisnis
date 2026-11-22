import { Sparkles } from "lucide-react";

export default function BrandLogo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <span className={`brand-lockup ${light ? "brand-lockup-light" : ""} ${compact ? "brand-lockup-compact" : ""}`}>
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 44 44" role="img" className="brand-symbol-svg">
          <rect x="1" y="1" width="42" height="42" rx="14" fill="currentColor" />
          <path d="M11 29.5 19.5 20l5.2 5.1L34 14" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M27.5 14H34v6.5" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="11" cy="29.5" r="2" fill="#ff9b58" />
          <path d="M31.5 7.5 32.7 10l2.5 1.2-2.5 1.2-1.2 2.5-1.2-2.5-2.5-1.2 2.5-1.2 1.2-2.5Z" fill="#ff9b58" />
        </svg>
      </span>
      {!compact && <span className="brand-wordmark">JagoBisnis<span className="brand-ai">AI</span></span>}
    </span>
  );
}
