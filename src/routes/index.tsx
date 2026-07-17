import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { getPublicHome } from "@/lib/public.functions";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { Instagram as InstagramIcon } from "lucide-react";
import { Countdown } from "@/components/site/Countdown";
import { TrackingScripts, useTrackPageView } from "@/components/site/Tracking";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { HomeSkeleton } from "@/components/site/PageSkeleton";
import { LoadError, withTimeout } from "@/components/site/LoadError";
import { SiteHeader } from "@/components/site/SiteHeader";
import { InstallAppButton } from "@/components/site/InstallAppButton";
import { CategoryNavBar } from "@/components/site/CategoryNavBar";
import { BannerCarousel, type BannerSlide } from "@/components/site/BannerCarousel";
import { ProductRowCarousel } from "@/components/site/ProductRowCarousel";
import { HomeProductCard } from "@/components/site/HomeProductCard";
import { PaymentBadge, SecurityBadge } from "@/components/site/PaymentIcons";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({
    cat: typeof s.cat === "string" && s.cat ? s.cat : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Minha Loja" },
      { name: "description", content: "Catálogo online com atendimento por WhatsApp." },
      { property: "og:title", content: "Minha Loja" },
      { property: "og:description", content: "Catálogo online com atendimento por WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function PageViewTracker() { useTrackPageView(); return null; }

function Home() {
  const { cat } = Route.useSearch();
  const fn = useServerFn(getPublicHome);
  const { data, isLoading, isError, error, refetch } = useQuery(
    queryOptions({
      queryKey: ["public-home"],
      queryFn: async () => {
        console.log("HOME LOAD START");
        try {
          const result = await withTimeout(fn(), 10_000, "getPublicHome");
          console.log("PUBLIC HOME", result);
          console.log("PUBLIC HOME SECTIONS", (result as any)?.sections ?? []);
          return result;
        } catch (e) {
          console.error("HOME ERROR", e);
          throw e;
        }
      },
      retry: 1,
    }),
  );

  const styleVars = useMemo(() => {
    const a: any = data?.settings?.appearance ?? {};
    return {
      "--brand-primary": a.primary_color ?? "#111827",
      "--brand-secondary": a.secondary_color ?? "#6b7280",
      "--brand-accent": a.accent_color ?? "#f59e0b",
      "--brand-bg": a.background_color ?? "#ffffff",
      "--brand-text": a.text_color ?? "#111827",
      "--brand-whatsapp": a.whatsapp_color ?? "#25D366",
      "--brand-radius": (a.border_radius ?? "8") + "px",
    } as React.CSSProperties;
  }, [data]);

  if (isError) {
    return (
      <LoadError
        message={(error as Error)?.message ?? "Falha ao carregar a página inicial."}
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading || !data) {
    return <HomeSkeleton />;
  }

  const { sections, products, categories, settings, campaigns, banners } = data as any;
  const safeSections = Array.isArray(sections) ? sections : [];
  const safeBanners = Array.isArray(banners) ? banners : [];

  // Extract slides for the top carousel: banners table entries + hero/banner sections that have an image.
  const carouselSlides: BannerSlide[] = [
    ...safeBanners
      .filter((b: any) => b.is_active !== false && (b.image_url || b.image_mobile_url))
      .map((b: any) => ({
        id: `b-${b.id}`,
        image: b.image_url || b.image_mobile_url,
        link: b.link_url || null,
        title: b.title || null,
        subtitle: b.subtitle || null,
        cta_label: b.cta_label || null,
      })),
    ...safeSections
      .filter((s: any) => {
        const t = normalizeSectionType(s.type);
        return t === "hero" || t === "banner";
      })
      .flatMap((s: any) => {
        const cfg = normalizeSectionConfig(s);
        const t = normalizeSectionType(s.type);
        const slides: any[] =
          t === "hero" && Array.isArray(cfg.slides) && cfg.slides.length > 0
            ? cfg.slides
            : cfg.image_desktop || cfg.image_mobile
            ? [{
                image_desktop: cfg.image_desktop,
                image_mobile: cfg.image_mobile,
                button_text: cfg.button_text,
                button_link: cfg.link || cfg.button_link,
              }]
            : [];
        return slides
          .filter((sl) => sl.image_desktop || sl.image_mobile)
          .map((sl, idx) => ({
            id: `s-${s.id}-${idx}`,
            image: sl.image_desktop || sl.image_mobile,
            link: sl.button_link || sl.link || null,
            title: s.title || null,
            subtitle: s.subtitle || null,
            cta_label: sl.button_text || null,
          } as BannerSlide));
      }),

  ];

  // Sections that should render outside the carousel (everything except hero/banner).
  const nonCarouselSections = safeSections.filter((section: any) => {
    const t = normalizeSectionType(section.type);
    if (t === "hero" || t === "banner") return false;
    return canRenderHomeSection(section, products ?? [], categories ?? []);
  });
  const categoriesSection = nonCarouselSections.find(
    (s: any) => normalizeSectionType(s.type) === "categories",
  );
  const visibleSections = nonCarouselSections.filter(
    (s: any) => normalizeSectionType(s.type) !== "categories",
  );

  const hasVisibleContent =
    carouselSlides.length > 0 ||
    visibleSections.length > 0 ||
    ((campaigns?.length ?? 0) > 0);
  const store: any = settings.store ?? {};
  const promo: any = settings.promo ?? {};
  const whatsapp: any = settings.whatsapp ?? {};
  const contact: any = settings.contact ?? {};
  const tracking: any = settings.tracking ?? {};
  const countdown: any = settings.countdown ?? {};
  const appearance: any = settings.appearance ?? {};

  const waLink = whatsapp.phone_number
    ? `https://wa.me/${String(whatsapp.phone_number).replace(/\D/g, "")}${whatsapp.default_message ? `?text=${encodeURIComponent(whatsapp.default_message)}` : ""}`
    : null;

  return (
    <div style={styleVars} className="min-h-screen flex flex-col" >
      <TrackingScripts tracking={tracking} />
      <PageViewTracker />
      {/* Countdown */}
      {countdown?.is_active && countdown?.ends_at && (
        <Countdown endsAt={countdown.ends_at} title={countdown.title} bgColor={countdown.bg_color} textColor={countdown.text_color}/>
      )}
      {/* Promo bar */}
      {promo?.is_active && promo?.text && (() => {
        const now = new Date();
        const okStart = !promo.starts_at || new Date(promo.starts_at) <= now;
        const okEnd = !promo.ends_at || new Date(promo.ends_at) >= now;
        if (!(okStart && okEnd)) return null;
        return (
          <div className="w-full text-center text-xs sm:text-sm py-2 px-4" style={{ background: promo.bg_color || "#111", color: promo.text_color || "#fff" }}>
            {promo.text}
            {promo.link_url && promo.link_label && (
              <a href={promo.link_url} className="ml-2 underline">{promo.link_label}</a>
            )}
          </div>
        );
      })()}

      {/* Header */}
      <SiteHeader storeName={store.name} logoUrl={store.logo_url} waLink={waLink} />

      {/* PWA install prompt */}
      {settings?.pwa?.active && (
        <div className="max-w-6xl mx-auto px-4 pt-3 flex flex-wrap items-center justify-between gap-2">
          {settings.pwa.install_message && (
            <p className="text-sm text-muted-foreground">{settings.pwa.install_message}</p>
          )}
          <InstallAppButton label={settings.pwa.short_name ? `Instalar ${settings.pwa.short_name}` : null} />
        </div>
      )}

      {/* Category nav */}
      <CategoryNavBar categories={categories ?? []} />

      {/* Sections */}
      <main className="flex-1">
        {cat ? (
          (() => {
            const activeCat = (categories ?? []).find((c: any) => c.slug === cat);
            const filtered = (products ?? []).filter(
              (p: any) => activeCat && p.category_id === activeCat.id,
            );
            return (
              <section className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-semibold">
                      {activeCat?.name ?? "Categoria"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
                    </p>
                  </div>
                  <Link to="/" className="text-sm hover:underline">← Voltar</Link>
                </div>
                {filtered.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    Nenhum produto encontrado nesta categoria.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map((p: any) => (
                      <HomeProductCard
                        key={p.id}
                        product={p}
                        radius="var(--brand-radius)"
                        appearance={appearance}
                        whatsappNumber={whatsapp?.phone_number}
                        productMessageTemplate={whatsapp?.product_message_template}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })()
        ) : (
          <>
        {/* Banner carousel */}
        {carouselSlides.length > 0 && (
          <BannerCarousel slides={carouselSlides} radius="var(--brand-radius)" />
        )}
        {/* Categorias sempre logo abaixo do banner */}
        {categoriesSection && (
          <SectionRenderer section={categoriesSection} products={products} categories={categories} waLink={waLink} appearance={appearance} whatsapp={whatsapp} />
        )}


        {!hasVisibleContent && (
          <div className="max-w-3xl mx-auto text-center py-24 px-4">
            <h1 className="text-3xl font-semibold mb-3">Configure sua Home no painel administrativo</h1>
            <p className="text-muted-foreground mb-6">
              Adicione ou ajuste seções visíveis para a página inicial não ficar vazia.
            </p>
            <Button asChild>
              <Link to="/admin/home">Configurar Home</Link>
            </Button>
          </div>
        )}

        {campaigns && campaigns.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-semibold mb-4">Campanhas</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c: any) => {
                const inner = (
                  <>
                    {c.image_url && <img src={c.image_url} alt={c.title || c.name} className="w-full aspect-video object-cover"/>}
                    <div className="p-4">
                      <div className="font-semibold">{c.title || c.name}</div>
                      {c.description && <div className="text-sm text-muted-foreground mt-1">{c.description}</div>}
                    </div>
                  </>
                );
                return c.link_url ? (
                  <a key={c.id} href={c.link_url} className="block border overflow-hidden hover:shadow-md transition bg-background" style={{ borderRadius:"var(--brand-radius)" }}>{inner}</a>
                ) : (
                  <div key={c.id} className="block border overflow-hidden bg-background" style={{ borderRadius:"var(--brand-radius)" }}>{inner}</div>
                );
              })}
            </div>
          </section>
        )}

        {visibleSections.map((s: any) => (
          <SectionRenderer key={s.id} section={s} products={products} categories={categories} waLink={waLink} appearance={appearance} whatsapp={whatsapp} />
        ))}
          </>
        )}
      </main>

      {/* Footer */}
      {(() => {
        const showContact = appearance.footer_show_contact !== false;
        const showSocial = appearance.footer_show_social !== false;
        const showPayments = appearance.footer_show_payments !== false;
        const showBadges = appearance.footer_show_security_badges !== false;
        const institutional = appearance.footer_institutional_text || contact.about_text || "";
        const footerText = appearance.footer_text || `© ${new Date().getFullYear()} ${store.name ?? "Minha Loja"}`;
        const payments: string[] = Array.isArray(appearance.payment_methods) ? appearance.payment_methods : [];
        const badges: string[] = Array.isArray(appearance.security_badges) ? appearance.security_badges : [];
        const hasContactContent = contact.email || contact.phone || contact.address;
        const hasSocialContent = contact.instagram_url || waLink || contact.facebook_url || contact.tiktok_url;
        return (
          <footer className="border-t bg-muted/30 mt-12" style={{ background: appearance.footer_bg_color || undefined, color: appearance.footer_text_color || undefined }}>
            <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-3 text-sm">
              <div>
                <div className="font-semibold mb-2">{store.name ?? "Minha Loja"}</div>
                {institutional && <p className="text-muted-foreground whitespace-pre-line">{institutional}</p>}
              </div>
              {showContact && (
                <div>
                  <div className="font-semibold mb-2">Contato</div>
                  {hasContactContent ? (
                    <ul className="space-y-1 text-muted-foreground">
                      {contact.email && <li>{contact.email}</li>}
                      {contact.phone && <li>{contact.phone}</li>}
                      {contact.address && <li>{contact.address}</li>}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-xs">Preencha os dados de contato no admin.</p>
                  )}
                </div>
              )}
              {showSocial && (
                <div>
                  <div className="font-semibold mb-2">Redes</div>
                  {hasSocialContent ? (
                    <div className="flex gap-3 text-muted-foreground">
                      {contact.instagram_url && (
                        <a href={contact.instagram_url} target="_blank" rel="noreferrer" className="hover:text-foreground">
                          <InstagramIcon className="h-4 w-4" />
                        </a>
                      )}
                      {waLink && (
                        <a href={waLink} target="_blank" rel="noreferrer" className="hover:text-foreground">
                          <WhatsAppIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">Adicione suas redes sociais no admin.</p>
                  )}
                </div>
              )}
            </div>

            {((showPayments && payments.length > 0) || (showBadges && badges.length > 0)) && (
              <div className="max-w-6xl mx-auto px-4 pb-6 border-t pt-6 flex flex-col items-center gap-4">
                {showPayments && payments.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide mr-1">Pagamento</span>
                    {payments.map((p) => (
                      <PaymentBadge key={p} name={p} className="h-7 w-auto" />
                    ))}
                  </div>
                )}
                {showBadges && badges.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide mr-1">Segurança</span>
                    {badges.map((b) => (
                      <SecurityBadge key={b} name={b} className="h-7 w-auto" />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="border-t">
              <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">{footerText}</div>
            </div>
          </footer>
        );
      })()}

      {/* Floating WhatsApp */}
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-50 h-12 w-12 rounded-full flex items-center justify-center shadow-lg text-white md:bottom-4"
          style={{ background: "var(--brand-whatsapp)" }}
          aria-label="Falar no WhatsApp"
        >
          <WhatsAppIcon className="h-6 w-6" />
        </a>
      )}
      <MobileBottomNav whatsappNumber={store?.whatsapp_number ?? settings?.whatsapp?.phone_number as any} />
    </div>
  );
}

function normalizeSectionType(type: string) {
  if (type === "featured" || type === "products") return "products_grid";
  if (type === "category") return "categories";
  return type;
}

function normalizeSectionConfig(section: any) {
  if (section.type === "featured") {
    return { source: "featured", limit: 8, ...(section.config ?? {}) };
  }
  if (section.type === "products") {
    return { source: "newest", limit: 8, ...(section.config ?? {}) };
  }
  if (section.type === "category") {
    return { limit: 8, ...(section.config ?? {}) };
  }
  return section.config ?? {};
}

function canRenderHomeSection(section: any, products: any[], categories: any[]) {
  const type = normalizeSectionType(section.type);
  const cfg = normalizeSectionConfig(section);
  switch (type) {
    case "hero":
      return Boolean(section.title || section.subtitle || cfg.image_desktop || cfg.image_mobile || cfg.button_text);
    case "banner":
      return Boolean(cfg.image_desktop || cfg.image_mobile || section.title || section.subtitle);
    case "categories":
      return categories.length > 0;
    case "products_grid": {
      const source = cfg.source ?? "newest";
      if (source === "featured") return products.some((p: any) => p.is_featured);
      if (source === "sale") return products.some((p: any) => p.is_promotion || (p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents));
      return products.length > 0;
    }
    case "benefits":
      return (cfg.items ?? []).length > 0;
    case "about":
      return Boolean(section.title || section.subtitle || cfg.body || cfg.image);
    case "instagram":
      return Boolean(section.title || section.subtitle || cfg.instagram_url || (cfg.images ?? []).length > 0);
    case "custom":
      return Boolean(cfg.html);
    default:
      console.error("Unknown section type", section.type, section);
      return false;
  }
}

function SectionRenderer({ section, products, categories, waLink, appearance, whatsapp }: any) {
  const cfg = normalizeSectionConfig(section);
  const type = normalizeSectionType(section.type);
  switch (type) {
    case "hero": {
      const heroImg = cfg.image_desktop || cfg.image_mobile;
      return (
        <section className="relative">
          {heroImg ? (
            <div className="relative">
              <img src={heroImg} alt={section.title ?? ""} className="w-full h-auto block" />
              {(section.title || section.subtitle || (cfg.show_button && cfg.button_text)) && (
                <div className="absolute inset-0 bg-black/30 flex items-center">
                  <div className="max-w-6xl mx-auto px-6 text-white">
                    {section.title && <h1 className="text-3xl sm:text-5xl font-bold max-w-xl">{section.title}</h1>}
                    {section.subtitle && <p className="mt-3 max-w-lg text-white/90">{section.subtitle}</p>}
                    {cfg.show_button && cfg.button_text && (
                      <Button asChild className="mt-6" style={{ background: "var(--brand-primary)" }}>
                        <a href={cfg.button_link || "/"}>{cfg.button_text}</a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-6xl mx-auto px-6 py-20 text-center">
              {section.title && <h1 className="text-4xl font-bold">{section.title}</h1>}
              {section.subtitle && <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{section.subtitle}</p>}
              {cfg.show_button && cfg.button_text && (
                <Button asChild className="mt-6"><a href={cfg.button_link || "/"}>{cfg.button_text}</a></Button>
              )}
            </div>
          )}
        </section>
      );
    }

    case "banner": {
      const bannerImg = cfg.image_desktop || cfg.image_mobile;
      return (
        <section className="max-w-6xl mx-auto px-4 py-6">
          <a href={cfg.link || "#"} className="block overflow-hidden rounded-lg" style={{ borderRadius: "var(--brand-radius)" }}>
            {bannerImg && <img src={bannerImg} alt={section.title ?? ""} className="w-full h-auto block" />}
          </a>
        </section>
      );
    }

    case "categories": {
      const limit = Number(cfg.limit ?? 8);
      const list = categories.slice(0, limit);
      if (list.length === 0) return null;
      return (
        <section className="max-w-6xl mx-auto px-4 py-8">
          {section.title && <h2 className="text-2xl font-semibold mb-2 text-center">{section.title}</h2>}
          {section.subtitle && <p className="text-muted-foreground mb-6 text-center">{section.subtitle}</p>}
          <div className="flex gap-4 sm:gap-8 overflow-x-auto pb-2 justify-start sm:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {list.map((c: any) => (
              <a key={c.id} href={`/?cat=${c.slug}`} className="group shrink-0 flex flex-col items-center gap-3 w-24 sm:w-28">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-muted overflow-hidden group-hover:shadow-md transition">
                  {c.image_url && <img src={c.image_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition" />}
                </div>
                <div className="text-sm font-medium text-center line-clamp-2">{c.name}</div>
              </a>
            ))}
          </div>
        </section>
      );
    }

    case "products_grid": {
      const src = cfg.source ?? "newest";
      const isAllProducts = /todos\s+os\s+produtos/i.test(section.title ?? "");
      const limit = isAllProducts ? 20 : Number(cfg.limit ?? 8);
      let list = [...products];
      if (src === "featured") list = list.filter((p: any) => p.is_featured);
      if (src === "sale") list = list.filter((p: any) => p.is_promotion || (p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents));
      // Embaralha para evitar sequência repetida entre seções
      list = list
        .map((p) => ({ p, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .map(({ p }) => p)
        .slice(0, limit);
      if (list.length === 0) return null;
      return (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="mb-6">
            {section.title && <h2 className="text-2xl font-semibold">{section.title}</h2>}
            {section.subtitle && <p className="text-muted-foreground">{section.subtitle}</p>}
          </div>
          {isAllProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {list.map((p: any) => (
                <HomeProductCard
                  key={p.id}
                  product={p}
                  radius="var(--brand-radius)"
                  appearance={appearance}
                  whatsappNumber={whatsapp?.phone_number}
                  productMessageTemplate={whatsapp?.product_message_template}
                />
              ))}
            </div>
          ) : (
            <ProductRowCarousel>
              {list.map((p: any) => (
                <HomeProductCard
                  key={p.id}
                  product={p}
                  radius="var(--brand-radius)"
                  appearance={appearance}
                  whatsappNumber={whatsapp?.phone_number}
                  productMessageTemplate={whatsapp?.product_message_template}
                />
              ))}
            </ProductRowCarousel>
          )}
        </section>
      );
    }




    case "benefits": {
      const items = cfg.items ?? [];
      if (items.length === 0) return null;
      return (
        <section className="border-y bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((b: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="text-2xl">{b.icon}</div>
                <div>
                  <div className="font-medium">{b.title}</div>
                  <div className="text-sm text-muted-foreground">{b.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "about":
      return (
        <section className="max-w-6xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-2 items-center">
          {cfg.image && (
            <img src={cfg.image} alt={section.title ?? ""} className="w-full aspect-video object-cover" style={{ borderRadius: "var(--brand-radius)" }} />
          )}
          <div>
            {section.title && <h2 className="text-2xl font-semibold mb-3">{section.title}</h2>}
            <p className="text-muted-foreground whitespace-pre-line">{cfg.body}</p>
          </div>
        </section>
      );

    case "instagram": {
      const imgs = (cfg.images ?? []) as string[];
      return (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="text-center mb-6">
            {section.title && <h2 className="text-2xl font-semibold">{section.title}</h2>}
            {section.subtitle && <p className="text-muted-foreground">{section.subtitle}</p>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {imgs.map((src, i) => (
              <a key={i} href={cfg.instagram_url || "#"} target="_blank" rel="noreferrer" className="aspect-square bg-muted overflow-hidden">
                <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition" />
              </a>
            ))}
          </div>
          {cfg.instagram_url && (
            <div className="text-center mt-6">
              <Button asChild variant="outline">
                <a href={cfg.instagram_url} target="_blank" rel="noreferrer">
                  <InstagramIcon className="h-4 w-4 mr-2" /> Seguir no Instagram
                </a>
              </Button>
            </div>
          )}
        </section>
      );
    }

    case "custom":
      return (
        <section className="max-w-6xl mx-auto px-4 py-8" dangerouslySetInnerHTML={{ __html: cfg.html ?? "" }} />
      );

    default:
      console.error("Unknown section type", section.type, section);
      return null;
  }
}
