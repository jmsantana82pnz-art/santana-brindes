import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  listCategoriesAdmin,
  upsertCategory,
  deleteCategory,
} from "@/lib/catalog.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const categoriesFn = useServerFn(listCategoriesAdmin);
  const upsertFn = useServerFn(upsertCategory);
  const deleteFn = useServerFn(deleteCategory);
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => categoriesFn(),
  });

  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<any | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    qc.invalidateQueries({ queryKey: ["public-catalog"] });
    qc.invalidateQueries({ queryKey: ["public-home"] });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteFn({ data: { id: deleting.id } });
      toast.success("Categoria removida");
      setDeleting(null);
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Organize seus produtos em categorias e subcategorias.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova categoria
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma categoria criada. Elas ajudam a organizar seu catálogo.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map((c: any) => (
            <Card key={c.id} className={c.is_active ? "" : "opacity-60"}>
              <CardContent className="py-3 flex items-center gap-4">
                <div className="h-12 w-12 rounded bg-muted overflow-hidden shrink-0">
                  {c.image_url && <img src={c.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">/{c.slug}{!c.is_active && " · inativa"}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                  <Edit className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setDeleting(c)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CategoryDialog
          categories={categories}
          category={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); invalidate(); }}
          upsertFn={upsertFn}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Produtos vinculados não serão apagados — ficarão sem categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryDialog({ categories, category, onClose, onSaved, upsertFn }: any) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? "");
  const [parentId, setParentId] = useState<string | null>(category?.parent_id ?? null);
  const [active, setActive] = useState(category?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("Informe o nome");
    setSaving(true);
    try {
      await upsertFn({
        data: {
          id: category?.id,
          name,
          slug: slug || undefined,
          description: description || null,
          image_url: imageUrl || null,
          parent_id: parentId,
          is_active: active,
        },
      });
      toast.success("Categoria salva");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>Organize seus produtos em categorias e subcategorias.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto flex-1 -mx-6 px-6">
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Vestidos" />
          </div>
          <div className="grid gap-2">
            <Label>Endereço (opcional)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="gerado automaticamente" />
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid gap-2">
            <Label>Imagem</Label>
            <ImageUpload
              value={imageUrl}
              onChange={(url: string | null) => setImageUrl(url ?? "")}
              bucket="banners"
              prefix="categories"
              label="imagem"
              aspect="wide"
            />
          </div>
          <div className="grid gap-2">
            <Label>Categoria pai (opcional)</Label>
            <select
              value={parentId ?? ""}
              onChange={(e) => setParentId(e.target.value || null)}
              className="border rounded-md h-9 px-3 text-sm bg-background"
            >
              <option value="">— nenhuma —</option>
              {categories.filter((c: any) => c.id !== category?.id).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <span className="text-sm">Categoria ativa</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
