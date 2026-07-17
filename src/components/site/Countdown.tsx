import { useEffect, useState } from "react";

export function Countdown({ endsAt, title, bgColor, textColor }: {
  endsAt: string; title?: string | null; bgColor?: string; textColor?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(endsAt).getTime() - now);
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <div
      className="w-full py-2 text-center text-sm font-medium"
      style={{ background: bgColor ?? "#111", color: textColor ?? "#fff" }}
    >
      {title || "Oferta termina em:"}{" "}
      <span className="font-mono tabular-nums">
        {String(d).padStart(2,"0")}d {String(h).padStart(2,"0")}h {String(m).padStart(2,"0")}m {String(s).padStart(2,"0")}s
      </span>
    </div>
  );
}
