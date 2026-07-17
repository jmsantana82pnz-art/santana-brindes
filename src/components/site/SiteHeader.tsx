import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { CartButton } from "@/components/site/CartButton";

export function SiteHeader({
  storeName,
  logoUrl,
  waLink,
}: {
  storeName?: string | null;
  logoUrl?: string | null;
  waLink?: string | null;
}) {
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    window.location.href = t ? `/?q=${encodeURIComponent(t)}` : "/";
  };

  return (
    <header className="border-b bg-background sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:gap-6">
        <Link to="/" className="flex min-w-0 items-center gap-2 shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName ?? "Logo"} className="h-14 w-14 rounded-full object-cover border bg-background" />
          ) : (
            <span className="font-bold text-lg tracking-tight">{storeName ?? "Minha Loja"}</span>
          )}
        </Link>

        <form onSubmit={submit} className="min-w-0 flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="O que você procura hoje?"
              className="w-full h-10 pl-10 pr-4 rounded-full border bg-muted/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)] text-sm"
              aria-label="Buscar produtos"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 px-3 sm:px-4 text-white text-xs font-medium rounded-full leading-none"
              style={{ background: "var(--brand-whatsapp)" }}
            >
              <WhatsAppIcon className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}

          <CartButton />
        </div>
      </div>
    </header>
  );
}
