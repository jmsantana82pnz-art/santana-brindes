import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

type Props = {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  bucket?: string;
  prefix?: string;
  label?: string;
  aspect?: "square" | "wide" | "banner";
};

export function ImageUpload({
  value,
  onChange,
  bucket = "banners",
  prefix = "img",
  label = "Imagem",
  aspect = "banner",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
      const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(pub.publicUrl);
      toast.success("Imagem enviada");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar");
    } finally {
      setUploading(false);
    }
  };

  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "wide" ? "aspect-[16/9]" : "aspect-[21/9]";

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          if (e.target) e.target.value = "";
        }}
      />
      {value ? (
        <div className={`relative group border rounded-md overflow-hidden bg-muted ${aspectClass}`}>
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-1" />
              {uploading ? "Enviando…" : "Trocar"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onChange(null)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Remover
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`w-full ${aspectClass} border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted transition disabled:opacity-50`}
        >
          {uploading ? (
            <>Enviando…</>
          ) : (
            <>
              <ImageIcon className="h-8 w-8" />
              <span>Clique para enviar {label.toLowerCase()}</span>
              <span className="text-xs">PNG, JPG ou WEBP</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
