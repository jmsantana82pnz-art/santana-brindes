import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Store, Package, Palette, Share2, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "admin-onboarding-dismissed";

const steps = [
  { icon: Package, title: "Adicione produtos", desc: "Crie seu primeiro produto no catálogo", to: "/admin/catalogo" },
  { icon: Palette, title: "Personalize a aparência", desc: "Cores, logo e identidade visual", to: "/admin/appearance" },
  { icon: Share2, title: "Compartilhe seu catálogo", desc: "Divulgue o link para seus clientes", to: "/admin" },
] as const;

export function OnboardingWizard({ enabled }: { enabled?: boolean }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (enabled === false) return;
    setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, [enabled]);

  if (dismissed || enabled === false) return null;

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
      <button
        onClick={dismiss}
        aria-label="Fechar assistente"
        className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Bem-vindo! Vamos configurar sua loja</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <Link
            key={i}
            to={s.to}
            className="group rounded-xl border bg-background p-4 transition-all hover:border-primary hover:shadow-md"
          >
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <s.icon className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold text-muted-foreground">Passo {i + 1}</div>
            <div className="mt-1 text-sm font-semibold">{s.title}</div>
            <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
          </Link>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={dismiss}>Pular assistente</Button>
      </div>
    </Card>
  );
}
