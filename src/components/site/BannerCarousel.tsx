import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type BannerSlide = {
  id: string;
  image: string;
  link?: string | null;
  title?: string | null;
  subtitle?: string | null;
  cta_label?: string | null;
};

export function BannerCarousel({ slides, radius }: { slides: BannerSlide[]; radius?: string }) {
  const [i, setI] = useState(0);
  const n = slides.length;

  useEffect(() => {
    if (n <= 1) return;
    const id = setInterval(() => setI((v) => (v + 1) % n), 5500);
    return () => clearInterval(id);
  }, [n]);

  if (n === 0) return null;

  const go = (d: number) => setI((v) => (v + d + n) % n);
  const s = slides[i];

  const inner = (
    <img src={s.image} alt={s.title ?? ""} className="w-full h-auto block select-none" draggable={false} />
  );

  // Swipe (touch) para trocar de banner no mobile
  const touch = { x: 0, active: false };
  const onTouchStart = (e: React.TouchEvent) => {
    touch.x = e.touches[0].clientX;
    touch.active = true;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.active) return;
    const dx = e.changedTouches[0].clientX - touch.x;
    touch.active = false;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 pt-4">
      <div
        className="relative group overflow-hidden"
        style={{ borderRadius: radius ?? "12px" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {s.link ? (
          <a href={s.link} className="block">{inner}</a>
        ) : (
          inner
        )}

        {(s.title || s.subtitle || s.cta_label) && (
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <div className="px-6 sm:px-10 text-white max-w-lg pointer-events-auto">
              {s.title && <h2 className="text-2xl sm:text-4xl font-bold drop-shadow">{s.title}</h2>}
              {s.subtitle && <p className="mt-2 text-sm sm:text-base drop-shadow">{s.subtitle}</p>}
              {s.cta_label && s.link && (
                <a
                  href={s.link}
                  className="mt-4 inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold"
                  style={{ background: "var(--brand-primary)", color: "#fff" }}
                >
                  {s.cta_label}
                </a>
              )}
            </div>
          </div>
        )}

        {n > 1 && (
          <>
            {/* Setas apenas em telas maiores; no mobile usa-se swipe */}
            <button
              aria-label="Anterior"
              onClick={() => go(-1)}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white text-black shadow items-center justify-center transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              aria-label="Próximo"
              onClick={() => go(1)}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white text-black shadow items-center justify-center transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Ir para banner ${idx + 1}`}
                  onClick={() => setI(idx)}
                  className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-2 bg-white/60"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
