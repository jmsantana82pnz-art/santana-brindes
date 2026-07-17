import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listPages, upsertPage, deletePage } from "@/lib/pages.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";

type Page = {
  id: string;
  slug: string;
  title: string;
  content_html: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
};

export const Route = createFileRoute("/_authenticated/admin/paginas")({
  component: PagesPage,
});

function PagesPage() {
  const qc = useQueryClient();
  const list = useServerFn(listPages);
  const upsert = useServerFn(upsertPage);
  const remove = useServerFn(deletePage);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["admin", "pages"],
    queryFn: () => list() as Promise<Page[]>,
  });

  const [editing, setEditing] = useState<Partial<Page> | null>(null);
  const [deleting, setDeleting] = useState<Page | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "pages"] });

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Páginas</h1>
          <p className="text-sm text-muted-foreground">
            Crie páginas institucionais (Sobre, Trocas, Política de Privacidade, etc.).
          </p>
        </div>
        <Button onClick={() => setEditing({ is_active: true })}>
          <Plus className="h-4 w-4 mr-2" /> Nova página
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : pages.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="font-medium">Nenhuma página cadastrada</p>
            <p className="text-sm text-muted-foreground">Crie sua primeira página institucional.</p>
            <Button onClick={() => setEditing({ is_active: true })}>
              <Plus className="h-4 w-4 mr-2" /> Criar página
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pages.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{p.title}</div>
                    {p.is_active ? (
                      <Badge variant="secondary" className="text-[10px]">Publicada</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Rascunho</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">/p/{p.slug}</div>
                </div>
                {p.is_active && (
                  <Button asChild size="icon" variant="ghost">
                    <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setDeleting(p)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <PageEditor
          page={editing}
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
            <AlertDialogTitle>Excluir página?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é permanente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleting) return;
                try {
                  await remove({ data: { id: deleting.id } });
                  toast.success("Página excluída");
                  setDeleting(null);
                  invalidate();
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PageEditor({
  page,
  onClose,
  onSaved,
  save,
}: {
  page: Partial<Page>;
  onClose: () => void;
  onSaved: () => void;
  save: (args: { data: any }) => Promise<any>;
}) {
  const [title, setTitle] = useState(page.title ?? "");
  const [slug, setSlug] = useState(page.slug ?? "");
  const [content, setContent] = useState(page.content_html ?? "");
  const [seoTitle, setSeoTitle] = useState(page.meta_title ?? "");
  const [seoDesc, setSeoDesc] = useState(page.meta_description ?? "");
  const [active, setActive] = useState(page.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) return toast.error("Informe o título");
    setSaving(true);
    try {
      await save({
        data: {
          id: page.id,
          title: title.trim(),
          slug: slug.trim() || undefined,
          content_html: content || null,
          meta_title: seoTitle || null,
          meta_description: seoDesc || null,
          is_active: active,
        },
      });
      toast.success("Página salva");
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
          <DialogTitle>{page.id ? "Editar página" : "Nova página"}</DialogTitle>
          <DialogDescription>
            O conteúdo aceita HTML simples (parágrafos, títulos, listas, links).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <div className="text-sm font-medium">Publicada</div>
              <div className="text-xs text-muted-foreground">
                Desative para trabalhar em rascunho.
              </div>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sobre nós" />
            </div>
            <div className="grid gap-2">
              <Label>Endereço (slug)</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="sobre-nos" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Conteúdo (HTML)</Label>
            <Textarea rows={10} value={content} onChange={(e) => setContent(e.target.value)} placeholder="<h2>Sobre a loja</h2><p>Texto…</p>" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Título SEO (opcional)</Label>
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Descrição SEO (opcional)</Label>
              <Input value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando…" : "Salvar página"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
