import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { Link } from "@tanstack/react-router";
import { Home, Grid3x3, Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export function MobileBottomNav({ whatsappNumber }: { whatsappNumber?: string | null }) {
  const { items } = useCart();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const wa = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
    : null;

  const item = "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors";
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegação inferior"
    >
      <div className="flex items-stretch">
        <Link to="/" className={item}>
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>
        <Link to="/" className={item}>
          <Grid3x3 className="h-5 w-5" />
          <span>Catálogo</span>
        </Link>
        <Link to="/carrinho" className={`${item} relative`}>
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute right-3 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
          <span>Carrinho</span>
        </Link>
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" className={item}>
            <WhatsAppIcon className="h-5 w-5" />
            <span>WhatsApp</span>
          </a>
        )}
      </div>
    </nav>
  );
}
