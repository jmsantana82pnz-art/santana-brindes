import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CatalogHeroSlide } from "@/lib/catalog-hero.functions";

export function CatalogHero({ slides }: { slides: CatalogHeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), 6000);
    return () => clearInterval(id);
  }, [total]);

  if (total === 0) return null;
  const s = slides[Math.min(index, total - 1)];

  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + total) % total);

  const isExternal = (s.button_link ?? "").startsWith("http");

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: s.background_color ?? "#f4f1ec", color: s.text_color ?? "#111" }}
    >
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_1.2fr_1fr] items-center gap-6 min-h-[280px] sm:min-h-[380px]">
          {/* Left: brand + title */}
          <div className="relative z-10 order-2 md:order-1">
            {s.brand_logo_url ? (
              <img src={s.brand_logo_url} alt="" className="h-8 sm:h-10 mb-4 object-contain" />
            ) : s.eyebrow ? (
              <div className="text-sm uppercase tracking-widest mb-3 opacity-80">{s.eyebrow}</div>
            ) : null}
            <h1 className="text-4xl sm:text-6xl font-extrabold leading-none">{s.title}</h1>
          </div>

          {/* Center: image (desktop hides mobile img and vice-versa) */}
          <div className="relative order-1 md:order-2 flex items-center justify-center">
            {s.image_desktop_url && (
              <img
                src={s.image_desktop_url}
                alt=""
                className="hidden sm:block w-full h-56 md:h-80 object-contain"
              />
            )}
            {s.image_mobile_url ? (
              <img src={s.image_mobile_url} alt="" className="sm:hidden w-full h-48 object-contain" />
            ) : s.image_desktop_url ? (
              <img src={s.image_desktop_url} alt="" className="sm:hidden w-full h-48 object-contain" />
            ) : null}
          </div>

          {/* Right: discount + button */}
          <div className="relative z-10 order-3 flex flex-col items-start md:items-end text-left md:text-right">
            {s.highlight_prefix && (
              <div className="text-sm sm:text-base opacity-80">{s.highlight_prefix}</div>
            )}
            {s.highlight_value && (
              <div className="text-6xl sm:text-8xl font-black leading-none tracking-tight">
                {s.highlight_value}
                {s.highlight_suffix && (
                  <span className="text-2xl sm:text-3xl align-top font-bold ml-1">
                    {s.highlight_suffix}
                  </span>
                )}
              </div>
            )}
            {s.button_text && s.button_link && (
              isExternal ? (
                <a
                  href={s.button_link}
                  className="mt-4 inline-flex items-center justify-center px-8 py-3 text-sm sm:text-base font-medium min-w-[180px]"
                  style={{
                    backgroundColor: s.button_bg_color ?? "#0f766e",
                    color: s.button_text_color ?? "#fff",
                  }}
                >
                  {s.button_text}
                </a>
              ) : (
                <Link
                  to={s.button_link}
                  className="mt-4 inline-flex items-center justify-center px-8 py-3 text-sm sm:text-base font-medium min-w-[180px]"
                  style={{
                    backgroundColor: s.button_bg_color ?? "#0f766e",
                    color: s.button_text_color ?? "#fff",
                  }}
                >
                  {s.button_text}
                </Link>
              )
            )}
            {s.disclaimer && (
              <div className="mt-3 text-xs opacity-70">{s.disclaimer}</div>
            )}
          </div>
        </div>

        {/* Arrows */}
        {total > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Anterior"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-black"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Próximo"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-black"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="h-2 w-2 rounded-full transition"
                  style={{
                    backgroundColor:
                      i === index ? s.text_color ?? "#111" : "rgba(0,0,0,0.25)",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
