import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { useTrackEvent } from "@/components/site/Tracking";

export function ShareButtons({ url, title, productId }: {
  url: string; title: string; productId?: string;
}) {
  const [copied, setCopied] = useState(false);
  const track = useTrackEvent();

  const shareWhatsapp = () => {
    track("share_click", { channel: "whatsapp", product_id: productId });
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`, "_blank");
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
      track("share_click", { channel: "copy", product_id: productId });
      toast.success("Link copiado!");
    } catch { toast.error("Não foi possível copiar."); }
  };
  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, url });
        track("share_click", { channel: "native", product_id: productId });
      } catch {}
    } else {
      copyLink();
    }
  };
  return (
    <div className="flex gap-2 flex-wrap">
      <Button size="sm" variant="outline" onClick={shareWhatsapp}>
        <WhatsAppIcon className="h-4 w-4 mr-1"/>WhatsApp
      </Button>
      <Button size="sm" variant="outline" onClick={copyLink}>
        {copied ? <Check className="h-4 w-4 mr-1"/> : <LinkIcon className="h-4 w-4 mr-1"/>}
        {copied ? "Copiado" : "Copiar link"}
      </Button>
      <Button size="sm" variant="outline" onClick={nativeShare}>
        <Share2 className="h-4 w-4 mr-1"/>Compartilhar
      </Button>
    </div>
  );
}
