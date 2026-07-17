import { ShoppingCart } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { useCart } from "@/hooks/useCart";
import { useTrackEvent } from "@/components/site/Tracking";
import { toast } from "sonner";

function fmt(cents?: number | null) {
  if (cents == null) return "";
  return "R$ " + (cents / 100).toFixed(2).replace(".", ",");
}

export function HomeProductCard({
  product,
  radius,
  appearance,
  whatsappNumber,
  productMessageTemplate,
}: {
  product: any;
  radius: string;
  appearance: any;
  whatsappNumber?: string | null;
  productMessageTemplate?: string | null;
}) {
  const cart = useCart();
  const track = useTrackEvent();

  const buyEnabled = appearance?.home_card_buy_button_enabled !== false;
  const waEnabled = appearance?.home_card_whatsapp_button_enabled !== false;
  const buyLabel = appearance?.home_card_buy_button_label || "COMPRAR";
  const buyColor = appearance?.home_card_buy_button_color || "#111827";
  const waColor = appearance?.whatsapp_color || "#25D366";

  const productUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/produto/${product.slug}`
      : `/produto/${product.slug}`;

  const priceText = fmt(product.price_cents);
  const digitsWa = whatsappNumber ? String(whatsappNumber).replace(/\D/g, "") : null;
  const template =
    productMessageTemplate ||
    "Olá, tenho interesse no produto {{product_name}} ({{product_price}}) — {{product_url}}";
  const msg = template
    .replace(/\{\{product_name\}\}/g, product.name)
    .replace(/\{\{product_price\}\}/g, priceText)
    .replace(/\{\{product_url\}\}/g, productUrl);
  const waLink = digitsWa ? `https://wa.me/${digitsWa}?text=${encodeURIComponent(msg)}` : null;

  const handleBuy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await cart.add(product.id, 1);
      track("add_to_cart", { product_id: product.id, from: "home_card" });
      toast.success("Adicionado ao carrinho");
    } catch (err: any) {
      toast.error(err?.message ?? "Falha ao adicionar");
    }
  };

  const handleWa = (e: React.MouseEvent) => {
    e.stopPropagation();
    track("whatsapp_click", { product_id: product.id, from: "home_card" });
  };

  return (
    <div
      className="snap-start shrink-0 basis-[45%] sm:basis-[30%] md:basis-[24%] lg:basis-[19%] border overflow-hidden hover:shadow-md transition bg-background flex flex-col"
      style={{ borderRadius: radius }}
    >
      <a href={`/produto/${product.slug}`} className="block">
        <div className="aspect-square bg-muted relative">
          {product.cover_image_url && (
            <img
              src={product.cover_image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
          {product.is_new && (
            <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black text-white px-2 py-0.5 rounded">
              NOVO
            </span>
          )}
          {product.is_promotion && (
            <span className="absolute top-2 right-2 text-[10px] font-semibold bg-red-600 text-white px-2 py-0.5 rounded">
              OFERTA
            </span>
          )}
        </div>
        <div className="p-3">
          <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{product.name}</div>
          {appearance?.show_product_price !== false && (
            <>
              <div className="mt-2 flex items-baseline gap-2">
                {product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents && (
                  <span className="text-xs line-through text-muted-foreground">
                    {fmt(product.compare_at_price_cents)}
                  </span>
                )}
                <span className="font-semibold" style={{ color: "var(--brand-primary)" }}>
                  {priceText}
                </span>
              </div>
              {product.pix_price_cents && (
                <div className="text-[11px] text-green-700 mt-0.5">PIX {fmt(product.pix_price_cents)}</div>
              )}
              {product.installment_text && (
                <div className="text-[11px] text-muted-foreground">{product.installment_text}</div>
              )}
            </>
          )}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-2 flex items-center gap-1">
              {product.colors.slice(0, 5).map((c: any, i: number) => (
                <span
                  key={i}
                  title={c.name}
                  className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-sm"
                  style={{ background: c.hex }}
                />
              ))}
              {product.colors.length > 5 && (
                <span className="text-[10px] text-muted-foreground ml-1">+{product.colors.length - 5}</span>
              )}
            </div>
          )}
        </div>
      </a>

      {(buyEnabled || (waEnabled && waLink)) && (
        <div className="p-3 pt-0 mt-auto flex gap-2">
          {buyEnabled && (
            <button
              type="button"
              onClick={handleBuy}
              className="flex-1 h-10 rounded-lg text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
              style={{ background: buyColor }}
            >
              <ShoppingCart className="h-4 w-4" /> {buyLabel}
            </button>
          )}
          {waEnabled && waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              onClick={handleWa}
              aria-label="Comprar pelo WhatsApp"
              className={`${buyEnabled ? "w-11 shrink-0" : "flex-1"} h-10 rounded-lg text-white inline-flex items-center justify-center gap-2 active:scale-[0.98] transition`}
              style={{ background: waColor }}
            >
              <WhatsAppIcon className="h-5 w-5" />
              {!buyEnabled && <span className="text-xs font-semibold">WhatsApp</span>}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
