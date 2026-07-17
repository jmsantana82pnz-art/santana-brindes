import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function InstallAppButton({ label }: { label?: string | null }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const text = label?.trim() || "Instalar aplicativo";

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    if (isIOS()) setShowIOS(true);
  };

  // Show only if we can install (Android/desktop Chrome) or iOS
  if (!deferred && !isIOS()) return null;

  return (
    <>
      <Button onClick={handleClick} size="sm" className="gap-2">
        <Download className="h-4 w-4" />
        {text}
      </Button>

      {showIOS && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">Instalar no iPhone</h3>
              <button onClick={() => setShowIOS(false)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>1. Toque no botão <b>Compartilhar</b> na barra inferior do Safari.</li>
              <li>2. Escolha <b>Adicionar à Tela de Início</b>.</li>
              <li>3. Confirme em <b>Adicionar</b>.</li>
            </ol>
            <Button className="mt-4 w-full" onClick={() => setShowIOS(false)}>
              Entendi
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
