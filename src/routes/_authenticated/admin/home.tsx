import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  LayoutGrid,
  Package,
  Sparkles,
  Info,
  Instagram,
  Code,
  Tag,
} from "lucide-react";
import {
  listHomeSections,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
  reorderHomeSections,
} from "@/lib/home.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/_authenticated/admin/home")({
  component: HomeBuilder,
});

type Section = {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  config: any;
  position: number;
  is_active: boolean;
};

const SECTION_TYPES: {
  type: string;
  label: string;
  description: string;
  icon: any;
}[] = [
  { type: "hero", label: "Banner principal (Hero)", description: "Grande banner no topo com título, imagem e botão.", icon: Sparkles },
  { type: "banner", label: "Banner promocional", description: "Faixa de imagem clicável para promoções.", icon: ImageIcon },
  { type: "categories", label: "Categorias", description: "Grade com suas categorias cadastradas.", icon: LayoutGrid },
  { type: "products_grid", label: "Produtos em destaque", description: "Vitrine com produtos selecionados.", icon: Package },
  { type: "benefits", label: "Benefícios", description: "Ícones com vantagens da sua loja.", icon: Tag },
  { type: "about", label: "Sobre a loja", description: "Bloco institucional com texto e imagem.", icon: Info },
  { type: "instagram", label: "Instagram", description: "Galeria de fotos e link para o Instagram.", icon: Instagram },
  { type: "custom", label: "HTML personalizado", description: "Bloco livre com HTML.", icon: Code },
];

function typeMeta(type: string) {
  return SECTION_TYPES.find((s) => s.type === type) ?? { label: type, icon: Code, description: "" };
}

function HomeBuilder() {
  const list = useServerFn(listHomeSections);
  const create = useServerFn(createHomeSection);
  const update = useServerFn(updateHomeSection);
  const remove = useServerFn(deleteHomeSection);
  const reorder = useServerFn(reorderHomeSections);
  const qc = useQueryClient();

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["admin", "home-sections"],
    queryFn: () => list() as Promise<Section[]>,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [deleting, setDeleting] = useState<Section | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "home-sections"] });
    qc.invalidateQueries({ queryKey: ["public-home"] });
    qc.invalidateQueries({ queryKey: ["public-settings"] });
  };

  const handleAdd = async (type: string) => {
    try {
      await create({ data: { type, config: defaultConfig(type) } });
      toast.success("Seção adicionada");
      setAddOpen(false);
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggle = async (s: Section) => {
    try {
      await update({ data: { id: s.id, is_active: !s.is_active } });
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    try {
      await reorder({ data: { ids: next.map((s) => s.id) } });
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await remove({ data: { id: deleting.id } });
      toast.success("Seção removida");
      setDeleting(null);
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Página inicial</h1>
          <p className="text-sm text-muted-foreground">
            Monte a Home da sua loja arrastando ou reordenando as seções. Tudo que você configurar aqui
            aparece imediatamente no site.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar seção
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <LayoutGrid className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Sua Home ainda está vazia</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Comece adicionando um banner principal, uma vitrine de produtos ou uma faixa de benefícios.
            </p>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar primeira seção
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sections.map((s, idx) => {
            const meta = typeMeta(s.type);
            const Icon = meta.icon;
            return (
              <Card key={s.id} className={s.is_active ? "" : "opacity-60"}>
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMove(idx, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{s.title || meta.label}</span>
                      <Badge variant="secondary" className="text-[10px]">{meta.label}</Badge>
                      {!s.is_active && <Badge variant="outline" className="text-[10px]">Oculta</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.subtitle || meta.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleToggle(s)} title={s.is_active ? "Ocultar" : "Mostrar"}>
                      {s.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditing(s)}>
                      Editar
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleting(s)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add section modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Escolha um tipo de seção</DialogTitle>
            <DialogDescription>
              Cada seção é um bloco visual da sua página inicial.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2 max-h-[60vh] overflow-auto pr-1">
            {SECTION_TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => handleAdd(t.type)}
                className="text-left border rounded-lg p-4 hover:bg-muted/50 transition flex gap-3 items-start"
              >
                <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <t.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-sm">{t.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit section modal */}
      {editing && (
        <SectionEditor
          section={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover esta seção?</AlertDialogTitle>
            <AlertDialogDescription>
              Ela será apagada da sua página inicial. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function defaultConfig(type: string): Record<string, unknown> {
  switch (type) {
    case "hero":
      return {
        slides: [
          { image_desktop: "", image_mobile: "", button_text: "Ver produtos", button_link: "/", show_button: true },
        ],
      };

    case "banner":
      return { image_desktop: "", image_mobile: "", link: "", button_text: "" };
    case "categories":
      return { limit: 8 };
    case "products_grid":
      return { source: "newest", limit: 8 };
    case "benefits":
      return {
        items: [
          { icon: "🚚", title: "Entrega rápida", description: "Para todo o Brasil" },
          { icon: "🔒", title: "Compra segura", description: "Ambiente protegido" },
          { icon: "💳", title: "Pagamento facilitado", description: "Diversas formas" },
        ],
      };
    case "about":
      return { image: "", body: "Fale um pouco sobre a sua loja aqui." };
    case "instagram":
      return { instagram_url: "", images: [] };
    case "custom":
      return { html: "" };
    default:
      return {};
  }
}

function SectionEditor({
  section,
  onClose,
  onSaved,
}: {
  section: Section;
  onClose: () => void;
  onSaved: () => void;
}) {
  const update = useServerFn(updateHomeSection);
  const [title, setTitle] = useState(section.title ?? "");
  const [subtitle, setSubtitle] = useState(section.subtitle ?? "");
  const [config, setConfig] = useState<any>(section.config ?? {});
  const [active, setActive] = useState(section.is_active);
  const [saving, setSaving] = useState(false);
  const meta = typeMeta(section.type);

  const set = (k: string, v: any) => setConfig((c: any) => ({ ...c, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await update({
        data: {
          id: section.id,
          title: title || null,
          subtitle: subtitle || null,
          config,
          is_active: active,
        },
      });
      toast.success("Seção salva");
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
          <DialogTitle>{meta.label}</DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <div className="font-medium text-sm">Seção visível na loja</div>
              <div className="text-xs text-muted-foreground">Desative para esconder sem apagar.</div>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <div className="grid gap-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Mais vendidos" />
          </div>
          <div className="grid gap-2">
            <Label>Subtítulo</Label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Texto de apoio" />
          </div>

          {/* Type-specific fields */}
          {section.type === "hero" && (
            <HeroSlidesEditor
              slides={
                Array.isArray(config.slides) && config.slides.length > 0
                  ? config.slides
                  : config.image_desktop || config.image_mobile
                  ? [
                      {
                        image_desktop: config.image_desktop ?? "",
                        image_mobile: config.image_mobile ?? "",
                        button_text: config.button_text ?? "",
                        button_link: config.button_link ?? "",
                        show_button: config.show_button ?? true,
                      },
                    ]
                  : []
              }
              onChange={(v) => set("slides", v)}
            />
          )}


          {section.type === "banner" && (
            <>
              <div className="grid gap-2">
                <Label>Imagem do banner</Label>
                <ImageUpload
                  value={config.image_desktop ?? null}
                  onChange={(v) => set("image_desktop", v ?? "")}
                  prefix="banner"
                  label="banner"
                  aspect="banner"
                />
                <p className="text-xs text-muted-foreground">
                  A mesma imagem é exibida no desktop e no celular sem cortes. Recomendado: 1600×600px.
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Link ao clicar</Label>
                <Input value={config.link ?? ""} onChange={(e) => set("link", e.target.value)} placeholder="/ ou https://…" />
              </div>
            </>
          )}

          {section.type === "categories" && (
            <div className="grid gap-2">
              <Label>Quantidade de categorias</Label>
              <Input type="number" value={config.limit ?? 8} onChange={(e) => set("limit", Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Cadastre categorias em Catálogo → Categorias.</p>
            </div>
          )}

          {section.type === "products_grid" && (
            <>
              <div className="grid gap-2">
                <Label>Como escolher os produtos</Label>
                <select
                  className="border rounded-md h-9 px-3 text-sm bg-background"
                  value={config.source ?? "newest"}
                  onChange={(e) => set("source", e.target.value)}
                >
                  <option value="newest">Novidades (mais recentes)</option>
                  <option value="featured">Mais avaliados</option>
                  <option value="sale">Em promoção</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Quantidade</Label>
                <Input type="number" value={config.limit ?? 8} onChange={(e) => set("limit", Number(e.target.value))} />
              </div>
            </>
          )}

          {section.type === "benefits" && (
            <BenefitsEditor items={config.items ?? []} onChange={(v) => set("items", v)} />
          )}

          {section.type === "about" && (
            <>
              <div className="grid gap-2">
                <Label>Imagem — URL</Label>
                <Input value={config.image ?? ""} onChange={(e) => set("image", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Texto</Label>
                <Textarea rows={5} value={config.body ?? ""} onChange={(e) => set("body", e.target.value)} />
              </div>
            </>
          )}

          {section.type === "instagram" && (
            <>
              <div className="grid gap-2">
                <Label>Link do Instagram</Label>
                <Input value={config.instagram_url ?? ""} onChange={(e) => set("instagram_url", e.target.value)} placeholder="https://instagram.com/…" />
              </div>
              <div className="grid gap-2">
                <Label>Imagens (uma URL por linha)</Label>
                <Textarea
                  rows={5}
                  value={(config.images ?? []).join("\n")}
                  onChange={(e) => set("images", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
                  placeholder="https://…"
                />
              </div>
            </>
          )}

          {section.type === "custom" && (
            <div className="grid gap-2">
              <Label>HTML personalizado</Label>
              <Textarea rows={8} value={config.html ?? ""} onChange={(e) => set("html", e.target.value)} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BenefitsEditor({
  items,
  onChange,
}: {
  items: { icon?: string; title?: string; description?: string }[];
  onChange: (v: any) => void;
}) {
  const set = (i: number, k: string, v: string) => {
    const next = [...items];
    next[i] = { ...next[i], [k]: v };
    onChange(next);
  };
  const add = () => onChange([...items, { icon: "✨", title: "", description: "" }]);
  const del = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <Label>Benefícios</Label>
      {items.map((it, i) => (
        <div key={i} className="grid gap-2 border rounded-md p-3">
          <div className="grid gap-2 sm:grid-cols-[80px_1fr]">
            <Input value={it.icon ?? ""} onChange={(e) => set(i, "icon", e.target.value)} placeholder="🚚" />
            <Input value={it.title ?? ""} onChange={(e) => set(i, "title", e.target.value)} placeholder="Título" />
          </div>
          <Input value={it.description ?? ""} onChange={(e) => set(i, "description", e.target.value)} placeholder="Descrição curta" />
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => del(i)}>
              <Trash2 className="h-4 w-4 mr-1" /> Remover
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4 mr-2" /> Adicionar benefício
      </Button>
    </div>
  );
}

type HeroSlide = {
  image_desktop?: string;
  image_mobile?: string;
  button_text?: string;
  button_link?: string;
  show_button?: boolean;
};

function HeroSlidesEditor({
  slides,
  onChange,
}: {
  slides: HeroSlide[];
  onChange: (v: HeroSlide[]) => void;
}) {
  const set = (i: number, k: keyof HeroSlide, v: any) => {
    const next = [...slides];
    next[i] = { ...next[i], [k]: v };
    onChange(next);
  };
  const add = () =>
    onChange([...slides, { image_desktop: "", image_mobile: "", button_text: "", button_link: "/", show_button: true }]);
  const del = (i: number) => onChange(slides.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Banners do hero</Label>
        <span className="text-xs text-muted-foreground">
          {slides.length} {slides.length === 1 ? "banner" : "banners"}
        </span>
      </div>
      {slides.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhum banner ainda. Adicione o primeiro abaixo.</p>
      )}
      {slides.map((s, i) => (
        <div key={i} className="border rounded-md p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Banner {i + 1}</div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" disabled={i === slides.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => del(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <ImageUpload
            value={s.image_desktop ?? null}
            onChange={(v) => set(i, "image_desktop", v ?? "")}
            prefix="hero"
            label="imagem do hero"
            aspect="banner"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-xs">Texto do botão</Label>
              <Input value={s.button_text ?? ""} onChange={(e) => set(i, "button_text", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Link do botão</Label>
              <Input value={s.button_link ?? ""} onChange={(e) => set(i, "button_link", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={s.show_button !== false} onCheckedChange={(v) => set(i, "show_button", v)} />
            <span className="text-sm">Mostrar botão</span>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4 mr-2" /> Adicionar banner
      </Button>
      <p className="text-xs text-muted-foreground">
        Recomendado: 1600×600px. Se houver mais de um, eles alternam em carrossel.
      </p>
    </div>
  );
}


