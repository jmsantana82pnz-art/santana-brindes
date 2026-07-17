import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  listProductsAdmin,
  listCategoriesAdmin,
  toggleProductField,
  deleteProduct,
  bulkUpdateProducts,
  bulkDeleteProducts,
} from "@/lib/catalog.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2, Edit, Eye, EyeOff, Star, Sparkles, Tag, ChevronDown } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/admin/catalogo/")({
  component: CatalogPage,
});

function fmt(cents?: number | null) {
  if (!cents) return "R$ 0,00";
  return "R$ " + (cents / 100).toFixed(2).replace(".", ",");
}

function CatalogPage() {
  const [search, setSearch] = useState("");
  const productsFn = useServerFn(listProductsAdmin);
  const categoriesFn = useServerFn(listCategoriesAdmin);
  const toggleFn = useServerFn(toggleProductField);
  const deleteFn = useServerFn(deleteProduct);
  const bulkUpdateFn = useServerFn(bulkUpdateProducts);
  const bulkDeleteFn = useServerFn(bulkDeleteProducts);
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin", "products", search],
    queryFn: () => productsFn({ data: { search: search || undefined } }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => categoriesFn(),
  });

  const [deleting, setDeleting] = useState<any | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [pricePercent, setPricePercent] = useState("");
  const [bulkCategory, setBulkCategory] = useState<string>("__none__");
  const [bulkStock, setBulkStock] = useState("");

  const allSelected = useMemo(
    () => products.length > 0 && products.every((p: any) => selected.has(p.id)),
    [products, selected],
  );
  const someSelected = selected.size > 0 && !allSelected;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["public-catalog"] });
    qc.invalidateQueries({ queryKey: ["public-home"] });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(products.map((p: any) => p.id)));
  };
  const clearSelection = () => setSelected(new Set());

  const handleToggle = async (p: any, field: any) => {
    try {
      await toggleFn({ data: { id: p.id, field, value: !p[field] } });
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteFn({ data: { id: deleting.id } });
      toast.success("Produto excluído");
      setDeleting(null);
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const runBulkPatch = async (patch: any, successMsg = "Produtos atualizados") => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    try {
      await bulkUpdateFn({ data: { ids, patch } });
      toast.success(`${successMsg} (${ids.length})`);
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    try {
      await bulkDeleteFn({ data: { ids } });
      toast.success(`${ids.length} produto(s) excluídos`);
      setBulkDeleteOpen(false);
      clearSelection();
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const applyPricePercent = async () => {
    const n = Number(pricePercent.replace(",", "."));
    if (!Number.isFinite(n) || n === 0) {
      toast.error("Informe uma porcentagem válida (ex: -10 ou 15)");
      return;
    }
    await runBulkPatch({ price_adjust_percent: n }, "Preços ajustados");
    setPriceDialogOpen(false);
    setPricePercent("");
  };

  const applyCategory = async () => {
    await runBulkPatch(
      { category_id: bulkCategory === "__none__" ? null : bulkCategory },
      "Categoria alterada",
    );
    setCategoryDialogOpen(false);
  };

  const applyStock = async () => {
    const n = parseInt(bulkStock, 10);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Informe um estoque válido");
      return;
    }
    await runBulkPatch({ stock: n }, "Estoque atualizado");
    setStockDialogOpen(false);
    setBulkStock("");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie produtos, preços e imagens da sua loja.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/catalogo/novo"><Plus className="h-4 w-4 mr-2" /> Novo produto</Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {products.length > 0 && (
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={toggleAll}
            />
            Selecionar todos
          </label>
        )}
      </div>

      {selected.size > 0 && (
        <div className="sticky top-0 z-10 -mx-2 px-2 py-2 bg-background/95 backdrop-blur border rounded-md flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{selected.size} selecionado(s)</span>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  Ações em massa <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => runBulkPatch({ is_active: true })}>Ativar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => runBulkPatch({ is_active: false })}>Desativar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Destaques</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => runBulkPatch({ is_featured: true })}>Marcar como destaque</DropdownMenuItem>
                <DropdownMenuItem onClick={() => runBulkPatch({ is_featured: false })}>Remover destaque</DropdownMenuItem>
                <DropdownMenuItem onClick={() => runBulkPatch({ is_new: true })}>Marcar como novo</DropdownMenuItem>
                <DropdownMenuItem onClick={() => runBulkPatch({ is_new: false })}>Remover “novo”</DropdownMenuItem>
                <DropdownMenuItem onClick={() => runBulkPatch({ is_promotion: true })}>Marcar em oferta</DropdownMenuItem>
                <DropdownMenuItem onClick={() => runBulkPatch({ is_promotion: false })}>Remover oferta</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCategoryDialogOpen(true)}>Alterar categoria…</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriceDialogOpen(true)}>Ajustar preço (%)…</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStockDialogOpen(true)}>Definir estoque…</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setBulkDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  Excluir selecionados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="ghost" onClick={clearSelection}>Limpar</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Nenhum produto cadastrado</p>
            <p className="text-sm text-muted-foreground">Comece cadastrando seu primeiro produto.</p>
            <Button asChild>
              <Link to="/admin/catalogo/novo"><Plus className="h-4 w-4 mr-2" /> Cadastrar produto</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {products.map((p: any) => {
            const isSel = selected.has(p.id);
            return (
              <Card key={p.id} className={`${p.is_active ? "" : "opacity-60"} ${isSel ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="py-3 flex items-center gap-4">
                  <Checkbox checked={isSel} onCheckedChange={() => toggleOne(p.id)} />
                  <div className="h-14 w-14 rounded bg-muted overflow-hidden shrink-0">
                    {p.cover_image_url && <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{p.name}</span>
                      {p.is_new && <Badge variant="secondary" className="text-[10px]">Novo</Badge>}
                      {p.is_featured && <Badge variant="secondary" className="text-[10px]">Destaque</Badge>}
                      {p.is_promotion && <Badge variant="secondary" className="text-[10px]">Oferta</Badge>}
                      {!p.is_active && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
                      <span>{fmt(p.price_cents)}</span>
                      <span>Estoque: {p.stock}</span>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-1">
                    <IconToggle title="Ativo" on={p.is_active} onIcon={Eye} offIcon={EyeOff} onClick={() => handleToggle(p, "is_active")} />
                    <IconToggle title="Destaque" on={p.is_featured} onIcon={Star} offIcon={Star} onClick={() => handleToggle(p, "is_featured")} />
                    <IconToggle title="Novo" on={p.is_new} onIcon={Sparkles} offIcon={Sparkles} onClick={() => handleToggle(p, "is_new")} />
                    <IconToggle title="Oferta" on={p.is_promotion} onIcon={Tag} offIcon={Tag} onClick={() => handleToggle(p, "is_promotion")} />
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/catalogo/$id" params={{ id: p.id }}>
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Link>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleting(p)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Todas as imagens, variações e ficha técnica também serão apagadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} produto(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Todos os dados relacionados também serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar preço em massa</DialogTitle>
            <DialogDescription>
              Aplica uma porcentagem sobre o preço e o PIX de {selected.size} produto(s). Use negativos para desconto (ex: -10) ou positivos para aumento (ex: 15).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Porcentagem (%)</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Ex: -10"
              value={pricePercent}
              onChange={(e) => setPricePercent(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>Cancelar</Button>
            <Button onClick={applyPricePercent}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar categoria</DialogTitle>
            <DialogDescription>
              Move {selected.size} produto(s) para a categoria selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={bulkCategory} onValueChange={setBulkCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sem categoria</SelectItem>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancelar</Button>
            <Button onClick={applyCategory}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir estoque</DialogTitle>
            <DialogDescription>
              Define o mesmo estoque para {selected.size} produto(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Estoque</Label>
            <Input
              type="number"
              min={0}
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockDialogOpen(false)}>Cancelar</Button>
            <Button onClick={applyStock}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IconToggle({ title, on, onIcon: OnIcon, offIcon: OffIcon, onClick }: any) {
  const Icon = on ? OnIcon : OffIcon;
  return (
    <Button size="icon" variant="ghost" onClick={onClick} title={title} className={on ? "text-foreground" : "text-muted-foreground/50"}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}
