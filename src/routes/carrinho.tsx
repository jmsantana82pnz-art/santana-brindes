import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";
import { checkoutWhatsapp } from "@/lib/orders.functions";
import { getPublicSettings } from "@/lib/public.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Minus, ShoppingBag, ChevronLeft } from "lucide-react";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { toast } from "sonner";

export const Route = createFileRoute("/carrinho")({
  component: CartPage,
  head: () => ({
    meta: [
      { title: "Meu carrinho — Minha Loja" },
      { name: "description", content: "Revise seus produtos e finalize o pedido pelo WhatsApp." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  errorComponent: () => <div className="p-10 text-center">Erro ao carregar o carrinho.</div>,
  notFoundComponent: () => <div className="p-10 text-center">Página não encontrada.</div>,
});

function fmt(c: number) {
  return "R$ " + (c / 100).toFixed(2).replace(".", ",");
}

function CartPage() {
  const { items, total, isLoading, sessionId, update, remove } = useCart();
  const settingsFn = useServerFn(getPublicSettings);
  const { data: settings } = useQuery({ queryKey: ["public-settings"], queryFn: () => settingsFn() });
  const checkout = useServerFn(checkoutWhatsapp);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const store = (settings as any)?.store;
  const appearance = (settings as any)?.appearance ?? {};
  const styleVars = {
    "--brand-primary": appearance.primary_color ?? "#111827",
    "--brand-whatsapp": appearance.whatsapp_color ?? "#25D366",
    "--brand-radius": (appearance.border_radius ?? "8") + "px",
  } as React.CSSProperties;

  async function handleCheckout() {
    if (!name.trim() || !phone.trim()) {
      toast.error("Informe seu nome e telefone");
      return;
    }
    if (items.length === 0) {
      toast.error("Seu carrinho está vazio");
      return;
    }
    setSubmitting(true);
    try {
      const res = await checkout({
        data: { sessionId, customer: { name, phone, email, city, notes } },
      });
      toast.success(`Pedido #${res.number} criado`);
      const waPhone = (settings as any)?.whatsapp?.phone_number
        ? String((settings as any).whatsapp.phone_number).replace(/\D/g, "")
        : null;
      const waUrl = waPhone && res.message
        ? `https://wa.me/${waPhone}?text=${encodeURIComponent(res.message)}`
        : res.whatsappUrl;
      if (waUrl) {
        window.location.href = waUrl;
      } else {
        toast.error("Configure o número do WhatsApp em Admin › Configuração");
        navigate({ to: "/" });
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styleVars} className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Continuar comprando
          </Link>
          <h1 className="ml-auto font-semibold">{store?.name ?? "Meu carrinho"}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 grid gap-6 md:grid-cols-[1fr,360px]">
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Seus produtos
          </h2>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : items.length === 0 ? (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              <p>Seu carrinho está vazio.</p>
              <Button asChild variant="link">
                <Link to="/">Ver produtos</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y border rounded-lg">
              {items.map((i: any) => (
                <li key={i.id} className="p-3 flex gap-3 items-center">
                  <div className="h-16 w-16 bg-muted overflow-hidden rounded shrink-0">
                    {i.products?.cover_image_url && (
                      <img src={i.products.cover_image_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-2">{i.products?.name ?? "Produto"}</div>
                    <div className="text-sm text-muted-foreground">{fmt(i.unit_price_cents)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => update(i.id, i.qty - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{i.qty}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => update(i.id, i.qty + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="w-20 text-right text-sm font-semibold">{fmt(i.qty * i.unit_price_cents)}</div>
                  <Button size="icon" variant="ghost" onClick={() => remove(i.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Resumo</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{fmt(total)}</span>
            </div>
            <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
              <span>Total</span>
              <span style={{ color: "var(--brand-primary)" }}>{fmt(total)}</span>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold">Seus dados</h3>
            <div>
              <Label>Nome*</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <div>
              <Label>Telefone (WhatsApp)*</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" maxLength={20} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" maxLength={120} />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500} />
            </div>
            <Button
              onClick={handleCheckout}
              disabled={submitting || items.length === 0}
              className="w-full h-11 text-white"
              style={{ background: "var(--brand-whatsapp)" }}
            >
              <WhatsAppIcon className="h-4 w-4 mr-2" />
              {submitting ? "Enviando…" : "Enviar pedido pelo WhatsApp"}
            </Button>
          </div>
        </aside>
      </main>
      <MobileBottomNav whatsappNumber={settings?.whatsapp?.phone_number as any} />
    </div>
  );
}
