import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  listBanners,
  upsertBanner,
  deleteBanner,
  reorderBanners,
} from "@/lib/banners.functions";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil, Eye, EyeOff } from "lucide-react";

type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  cta_label: string | null;
  link_url: string | null;
  image_url: string | null;
  image_mobile_url: string | null;
  position: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export const Route = createFileRoute("/_authenticated/admin/home/banners")({
  component: BannersPage,
});

function BannersPage() {
  const qc = useQueryClient();
  const list = useServerFn(listBanners);
  const upsert = useServerFn(upsertBanner);
  const remove = useServerFn(deleteBanner);
  const reorder = useServerFn(reorderBanners);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: () => list() as Promise<Banner[]>,
  });

  const [editing, setEditing] = useState<Partial<Banner> | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    qc.invalidateQueries({ queryKey: ["public-home"] });
  };

  const toggleActive = async (b: Banner) => {
    try {
      await upsert({ data: { id: b.id, is_active: !b.is_active, position: b.position } });
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const next = [...banners];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    await reorder({ data: { ids: next.map((b) => b.id) } });
    invalidate();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Banners</h1>
          <p className="text-sm text-muted-foreground">
            Faixas de imagem clicáveis que aparecem na home. Envie do computador — sem
            precisar colar links.
          </p>
        </div>
        <Button onClick={() => setEditing({ is_active: true, position: banners.length })}>
          <Plus className="h-4 w-4 mr-2" /> Novo banner
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="font-medium">Nenhum banner cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Crie o primeiro banner com uma imagem, texto e link.
            </p>
            <Button onClick={() => setEditing({ is_active: true, position: 0 })}>
              <Plus className="h-4 w-4 mr-2" /> Criar banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((b, idx) => (
            <Card key={b.id}>
              <CardContent className="p-3 flex gap-3 items-center">
                <div className="h-16 w-28 rounded-md overflow-hidden bg-muted shrink-0">
                  {b.image_url ? (
                    <img src={b.image_url} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                      sem imagem
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{b.title || "(sem título)"}</div>
                    {b.is_active ? (
                      <Badge variant="secondary" className="text-[10px]">Ativo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Oculto</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {b.subtitle || b.link_url || "—"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => move(idx, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={idx === banners.length - 1} onClick={() => move(idx, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => toggleActive(b)}>
                    {b.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleting(b)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <BannerEditor
          banner={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
          save={upsert}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover banner?</AlertDialogTitle>
            <AlertDialogDescription>
              A imagem enviada permanece no armazenamento, mas o banner some da loja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleting) return;
                try {
                  await remove({ data: { id: deleting.id } });
                  toast.success("Banner removido");
                  setDeleting(null);
                  invalidate();
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BannerEditor({
  banner,
  onClose,
  onSaved,
  save,
}: {
  banner: Partial<Banner>;
  onClose: () => void;
  onSaved: () => void;
  save: (args: { data: any }) => Promise<any>;
}) {
  const [title, setTitle] = useState(banner.title ?? "");
  const [subtitle, setSubtitle] = useState(banner.subtitle ?? "");
  const [cta, setCta] = useState(banner.cta_label ?? "");
  const [link, setLink] = useState(banner.link_url ?? "");
  const [image, setImage] = useState<string | null>(banner.image_url ?? null);
  const [imageMobile, setImageMobile] = useState<string | null>(banner.image_mobile_url ?? null);
  const [active, setActive] = useState(banner.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!image) {
      toast.error("Envie a imagem do banner");
      return;
    }
    setSaving(true);
    try {
      await save({
        data: {
          id: banner.id,
          title: title || null,
          subtitle: subtitle || null,
          cta_label: cta || null,
          link_url: link || null,
          image_url: image,
          image_mobile_url: imageMobile,
          is_active: active,
          position: banner.position ?? 0,
        },
      });
      toast.success("Banner salvo");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{banner.id ? "Editar banner" : "Novo banner"}</DialogTitle>
          <DialogDescription>
            Envie uma imagem do seu computador. Recomendado: 1920×640 (desktop) e 800×800 (celular).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <div className="text-sm font-medium">Banner ativo</div>
              <div className="text-xs text-muted-foreground">Desative para esconder sem apagar.</div>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <div className="grid gap-2">
            <Label>Imagem do banner</Label>
            <ImageUpload
              value={image}
              onChange={setImage}
              bucket="banners"
              prefix="banner"
              label="banner"
              aspect="banner"
            />
            <p className="text-xs text-muted-foreground">
              A mesma imagem é exibida no desktop e no celular sem cortes. Recomendado: 1600×600px.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Título (opcional)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Coleção verão" />
            </div>
            <div className="grid gap-2">
              <Label>Subtítulo (opcional)</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Texto do botão (opcional)</Label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Ver ofertas" />
            </div>
            <div className="grid gap-2">
              <Label>Link ao clicar</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/ ou https://…" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando…" : "Salvar banner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
