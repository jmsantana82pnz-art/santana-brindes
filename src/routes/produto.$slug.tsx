import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPublicProduct, getPublicSettings } from "@/lib/public.functions";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ShoppingCart } from "lucide-react";
import { ShareButtons } from "@/components/site/ShareButtons";
import { useTrackEvent, TrackingScripts } from "@/components/site/Tracking";
import { useCart } from "@/hooks/useCart";
import { CartButton } from "@/components/site/CartButton";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { DetailSkeleton } from "@/components/site/PageSkeleton";
import { LoadError, withTimeout } from "@/components/site/LoadError";
import { toast } from "sonner";

export const Route = createFileRoute("/produto/$slug")({
  component: ProductPage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Minha Loja` },
    ],
  }),
  errorComponent: () => <div className="p-10 text-center">Erro ao carregar o produto.</div>,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      Produto não encontrado. <Link to="/" className="underline">Voltar ao catálogo</Link>
    </div>
  ),
});

function fmt(cents?: number | null) {
  if (cents == null) return "";
  return "R$ " + (cents / 100).toFixed(2).replace(".", ",");
}

function ProductPage() {
  const { slug } = Route.useParams();
  const productFn = useServerFn(getPublicProduct);
  const settingsFn = useServerFn(getPublicSettings);
  const cart = useCart();
  

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["public-product", slug],
    queryFn: async () => {
      console.log("PRODUCT LOAD START", slug);
      try {
        const result = await withTimeout(productFn({ data: { slug } }), 10_000, "getPublicProduct");
        console.log("PUBLIC PRODUCT", result);
        return result;
      } catch (e) {
        console.error("PRODUCT ERROR", e);
        throw e;
      }
    },
    retry: 1,
  });
  const { data: settings } = useQuery({ queryKey: ["public-settings"], queryFn: () => settingsFn() });

  const styleVars = useMemo(() => {
    const a: any = settings?.appearance ?? {};
    return {
      "--brand-primary": a.primary_color ?? "#111827",
      "--brand-whatsapp": a.whatsapp_color ?? "#25D366",
      "--brand-radius": (a.border_radius ?? "8") + "px",
    } as React.CSSProperties;
  }, [settings]);

  const [activeImg, setActiveImg] = useState(0);
  const [selOther, setSelOther] = useState<string | null>(null);
  const track = useTrackEvent();

  useEffect(() => {
    if (data?.product?.id) {
      track("product_view", { product_id: data.product.id, slug: data.product.slug });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.product?.id]);

  if (isError) {
    return (
      <LoadError
        message={(error as Error)?.message ?? "Falha ao carregar o produto."}
        onRetry={() => refetch()}
      />
    );
  }
  if (isLoading) return <DetailSkeleton />;
  if (!data) throw notFound();

  const { product, images, features, related, variants } = data as any;
  const gallery = images.length > 0 ? images : product.cover_image_url ? [{ url: product.cover_image_url }] : [];

  // Filter legacy kind='size'/'color' rows — show only real combos/options
  const displayVars = (variants as any[]).filter(
    (v) => v.attributes?.kind !== "size" && v.attributes?.kind !== "color",
  );
  const hasVariants = displayVars.length > 0;
  const selectionOk = !hasVariants || !!selOther;

  const selectedVariant = displayVars.find((v: any) => v.id === selOther) ?? null;
  const selectionLabel = selectedVariant?.name ?? "";

  const ensureSelection = () => {
    if (selectionOk) return true;
    toast.error("Escolha uma variação antes de continuar");
    return false;
  };

  const waNumber = (settings as any)?.whatsapp?.phone_number ? String((settings as any).whatsapp.phone_number).replace(/\D/g, "") : null;
  const productUrl = typeof window !== "undefined" ? window.location.href : "";
  const template = (settings as any)?.whatsapp?.product_message_template as string | undefined;
  const nameWithVariant = selectionLabel ? `${product.name} (${selectionLabel})` : product.name;
  const priceText = fmt(product.price_cents);
  const waMsg = product.whatsapp_message
    || (template
      ? template
          .replace(/\{\{product_name\}\}/g, nameWithVariant)
          .replace(/\{\{product_price\}\}/g, priceText)
          .replace(/\{\{product_url\}\}/g, productUrl)
      : `Olá, tenho interesse no produto ${nameWithVariant} (${priceText}) — ${productUrl}`);
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}` : null;

  const appearance: any = (settings as any)?.appearance ?? {};
  const buyEnabled = appearance.home_card_buy_button_enabled !== false;
  const waEnabled = appearance.home_card_whatsapp_button_enabled !== false;
  const buyLabel = appearance.home_card_buy_button_label || "COMPRAR";
  const buyColor = appearance.home_card_buy_button_color || "#111827";

  return (
    <div style={styleVars} className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Voltar ao catálogo
          </Link>
          <div className="ml-auto">
            <CartButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-square bg-muted overflow-hidden" style={{ borderRadius: "var(--brand-radius)" }}>
            {gallery[activeImg]?.url && <img src={gallery[activeImg].url} alt={product.name} className="w-full h-full object-cover" />}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {gallery.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square bg-muted overflow-hidden border-2 ${i === activeImg ? "border-foreground" : "border-transparent"}`}
                  style={{ borderRadius: "var(--brand-radius)" }}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex gap-2 mb-2">
            {product.is_new && <span className="text-[10px] font-semibold bg-black text-white px-2 py-0.5 rounded">NOVO</span>}
            {product.is_promotion && <span className="text-[10px] font-semibold bg-red-600 text-white px-2 py-0.5 rounded">OFERTA</span>}
            {product.is_featured && <span className="text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded">DESTAQUE</span>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold">{product.name}</h1>
          {product.short_description && <p className="mt-2 text-muted-foreground">{product.short_description}</p>}

          {appearance.show_product_price !== false && (
            <div className="mt-5 space-y-1">
              {product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents && (
                <div className="text-sm line-through text-muted-foreground">{fmt(product.compare_at_price_cents)}</div>
              )}
              <div className="text-3xl font-bold" style={{ color: "var(--brand-primary)" }}>{fmt(product.price_cents)}</div>
              {product.pix_price_cents && <div className="text-sm text-green-700 font-medium">PIX: {fmt(product.pix_price_cents)}</div>}
              {product.installment_text && <div className="text-sm text-muted-foreground">{product.installment_text}</div>}
            </div>
          )}

          {hasVariants && (
            <div className="mt-5">
              <div className="text-sm font-medium mb-2">
                Variações <span className="text-red-500">*</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {displayVars.map((v: any) => {
                  const active = selOther === v.id;
                  const hex = v.attributes?.color?.hex ?? v.attributes?.hex ?? null;
                  const outOfStock = typeof v.stock === "number" && v.stock <= 0;
                  return (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => !outOfStock && setSelOther(v.id)}
                      disabled={outOfStock}
                      className={`inline-flex items-center gap-2 border rounded-full ${hex ? "pl-1" : "pl-3"} pr-3 py-1 text-xs transition ${active ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40"} ${outOfStock ? "opacity-40 line-through cursor-not-allowed" : ""}`}
                    >
                      {hex && (
                        <span
                          className="h-5 w-5 rounded-full border border-black/10 shrink-0"
                          style={{ background: hex }}
                        />
                      )}
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            {buyEnabled && (
              <button
                type="button"
                onClick={async () => {
                  if (!ensureSelection()) return;
                  try {
                    await cart.add(product.id, 1);
                    track("add_to_cart", { product_id: product.id });
                    toast.success(selectionLabel ? `Adicionado: ${selectionLabel}` : "Adicionado ao carrinho");
                  } catch (err: any) {
                    console.error("addToCart failed", err);
                    toast.error(err?.message ?? "Falha ao adicionar ao carrinho");
                  }
                }}
                className={`${waEnabled && waLink ? "flex-1" : "w-full"} h-12 rounded-lg text-white text-sm font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition`}
                style={{ background: buyColor }}
              >
                <ShoppingCart className="h-5 w-5" /> {buyLabel}
              </button>
            )}
            {waEnabled && waLink && (
              <a
                href={waLink}
                target={selectionOk || !hasVariants ? "_blank" : undefined}
                rel="noreferrer"
                onClick={(e) => {
                  if (!ensureSelection()) {
                    e.preventDefault();
                    return;
                  }
                  track("whatsapp_click", { product_id: product.id });
                }}
                className={`${buyEnabled ? "w-14 shrink-0" : "w-full"} h-12 rounded-lg text-white inline-flex items-center justify-center gap-2 active:scale-[0.98] transition`}
                style={{ background: "var(--brand-whatsapp)" }}
                aria-label="Comprar pelo WhatsApp"
              >
                <WhatsAppIcon className="h-6 w-6" />
                {!buyEnabled && <span className="text-sm font-semibold">Comprar pelo WhatsApp</span>}
              </a>
            )}
          </div>


          <div className="mt-4">
            <ShareButtons url={productUrl} title={product.name} productId={product.id} />
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            {product.stock > 0 ? `${product.stock} em estoque` : "Consulte disponibilidade"}
            {product.sku && ` · SKU ${product.sku}`}
          </div>
        </div>
      </main>

      {product.description && (
        <ProductDescription text={product.description} />
      )}

      {features.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-6">
          <h2 className="text-lg font-semibold mb-3">Ficha técnica</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {features.map((f: any, i: number) => (
                  <tr key={f.id} className={i % 2 ? "bg-muted/30" : ""}>
                    <td className="px-4 py-2 font-medium w-1/3">{f.label}</td>
                    <td className="px-4 py-2 text-muted-foreground">{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-lg font-semibold mb-4">Produtos relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p: any) => (
              <Link
                key={p.id}
                to="/produto/$slug"
                params={{ slug: p.slug }}
                className="border overflow-hidden hover:shadow-md transition bg-background block"
                style={{ borderRadius: "var(--brand-radius)" }}
              >
                <div className="aspect-square bg-muted">
                  {p.cover_image_url && <img src={p.cover_image_url} alt={p.name} className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                  {appearance.show_product_price !== false && (
                    <div className="mt-1 font-semibold" style={{ color: "var(--brand-primary)" }}>{fmt(p.price_cents)}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("whatsapp_click", { product_id: product.id, location: "floating" })}
          className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-50 h-12 w-12 rounded-full flex items-center justify-center shadow-lg text-white md:bottom-4"
          style={{ background: "var(--brand-whatsapp)" }}
          aria-label="WhatsApp"
        >
          <WhatsAppIcon className="h-6 w-6" />
        </a>
      )}
      <TrackingScripts tracking={(settings as any)?.tracking} />
      <MobileBottomNav whatsappNumber={settings?.whatsapp?.phone_number as any} />
    </div>
  );
}

function ProductDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 320;
  const isLong = text.length > LIMIT;
  const shown = expanded || !isLong ? text : text.slice(0, LIMIT).trimEnd() + "…";
  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-lg font-semibold mb-3">Descrição</h2>
      <div className="relative">
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {shown}
        </p>
        {isLong && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-sm font-semibold underline underline-offset-4"
          style={{ color: "var(--brand-primary)" }}
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </section>
  );
}

