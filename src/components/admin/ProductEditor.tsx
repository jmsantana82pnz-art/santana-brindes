import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  upsertProduct,
  getProductAdmin,
  listCategoriesAdmin,
  addProductImage,
  setMainImage,
  deleteProductImage,
  reorderProductImages,
  saveProductVariants,
  saveFeatures,
} from "@/lib/catalog.functions";
import {
  PRESET_COLORS,
  PRESET_SIZES_LETTER,
  PRESET_SIZES_NUMERIC,
  PRESET_SIZES_SHOES,
  PRESET_SIZES_KIDS,
} from "@/lib/product-colors";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Star, ArrowUp, ArrowDown, Eye, Upload, ImagePlus } from "lucide-react";

type PendingImage = { id: string; file: File; preview: string };

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeInstallment(priceCents: number, n: number, monthlyRate: number): string {
  if (!priceCents || n < 1) return "";
  let perInstallmentCents: number;
  if (monthlyRate > 0) {
    const i = monthlyRate / 100;
    const p = priceCents / 100;
    const pmt = (p * i) / (1 - Math.pow(1 + i, -n));
    perInstallmentCents = Math.round(pmt * 100);
  } else {
    perInstallmentCents = Math.round(priceCents / n);
  }
  return `${n}x de R$ ${formatBRL(perInstallmentCents)}`;
}

type Combo = {
  key: string;
  size: string | null;
  color: { name: string; hex: string } | null;
  label: string;
};

function buildCombos(sizes: string[], colors: { name: string; hex: string }[]): Combo[] {
  const out: Combo[] = [];
  if (sizes.length && colors.length) {
    for (const s of sizes) {
      for (const c of colors) {
        out.push({
          key: `${s.toLowerCase()}|${c.name.toLowerCase()}`,
          size: s,
          color: c,
          label: `${s} · ${c.name}`,
        });
      }
    }
  } else if (sizes.length) {
    for (const s of sizes) out.push({ key: `${s.toLowerCase()}|`, size: s, color: null, label: s });
  } else if (colors.length) {
    for (const c of colors) out.push({ key: `|${c.name.toLowerCase()}`, size: null, color: c, label: c.name });
  }
  return out;
}


export function ProductEditor({ productId }: { productId?: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const upsert = useServerFn(upsertProduct);
  const getProduct = useServerFn(getProductAdmin);
  const listCategories = useServerFn(listCategoriesAdmin);
  const addImage = useServerFn(addProductImage);
  const setMain = useServerFn(setMainImage);
  const delImage = useServerFn(deleteProductImage);
  const reorderImages = useServerFn(reorderProductImages);
  const saveVariantsFn = useServerFn(saveProductVariants);
  const saveFeats = useServerFn(saveFeatures);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => listCategories(),
  });

  const { data: loaded } = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () => (productId ? getProduct({ data: { id: productId } }) : Promise.resolve(null)),
    enabled: !!productId,
  });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [shortDesc, setShortDesc] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [pixPrice, setPixPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [installmentEnabled, setInstallmentEnabled] = useState(true);
  const [installmentCount, setInstallmentCount] = useState("10");
  const [hasInterest, setHasInterest] = useState(false);
  const [monthlyRate, setMonthlyRate] = useState("1.99");
  const [stock, setStock] = useState("0");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [waMsg, setWaMsg] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [isPromo, setIsPromo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [features, setFeatures] = useState<{ id?: string; label: string; value: string }[]>([]);

  // Pending images (before product exists) + cover selection
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [pendingCoverId, setPendingCoverId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Variants (sizes × colors combos with price, stock, image)
  type VData = { price_cents: number | null; stock: number; image_url: string | null; hidden?: boolean };
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
  const [variantData, setVariantData] = useState<Record<string, VData>>({});
  const [uploadingVariantKey, setUploadingVariantKey] = useState<string | null>(null);
  const [customSize, setCustomSize] = useState("");
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#000000");

  useEffect(() => {
    if (!loaded) return;
    const p: any = loaded.product;
    setName(p.name ?? "");
    setSlug(p.slug ?? "");
    setCategoryId(p.category_id ?? null);
    setShortDesc(p.short_description ?? "");
    setDesc(p.description ?? "");
    setPrice(p.price_cents ? (p.price_cents / 100).toFixed(2) : "");
    setPixPrice(p.pix_price_cents ? (p.pix_price_cents / 100).toFixed(2) : "");
    setComparePrice(p.compare_at_price_cents ? (p.compare_at_price_cents / 100).toFixed(2) : "");
    // Try to parse existing installment_text like "10x de R$ 45,90"
    const txt: string = p.installment_text ?? "";
    const m = txt.match(/^(\d+)x/);
    if (m) {
      setInstallmentEnabled(true);
      setInstallmentCount(m[1]);
    } else if (!txt) {
      setInstallmentEnabled(false);
    }
    setStock(String(p.stock ?? 0));
    setSku(p.sku ?? "");
    setBarcode(p.barcode ?? "");
    setWaMsg(p.whatsapp_message ?? "");
    setIsActive(!!p.is_active);
    setIsFeatured(!!p.is_featured);
    setIsNew(!!p.is_new);
    setIsPromo(!!p.is_promotion);
    setFeatures(((loaded as any).features ?? []).map((f: any) => ({ id: f.id, label: f.label, value: f.value })));
    // Load variants into sizes/colors/stock map
    const loadedVariants = ((loaded as any).variants ?? []) as any[];
    const nextSizes: string[] = [];
    const nextColors: { name: string; hex: string }[] = [];
    const nextData: Record<string, VData> = {};
    for (const v of loadedVariants) {
      const attrs = v.attributes ?? {};
      let size: string | null = attrs.size ?? null;
      let color: { name: string; hex: string } | null = attrs.color ?? null;
      if (!size && !color) {
        if (attrs.kind === "size") size = attrs.value ?? v.name;
        else if (attrs.kind === "color" && attrs.hex) color = { name: attrs.value ?? v.name, hex: attrs.hex };
      }
      if (size && !nextSizes.includes(size)) nextSizes.push(size);
      if (color?.hex && !nextColors.some((c) => c.hex.toLowerCase() === color!.hex.toLowerCase())) {
        nextColors.push(color);
      }
      const k = `${(size ?? "").toLowerCase()}|${(color?.name ?? "").toLowerCase()}`;
      nextData[k] = {
        price_cents: v.price_cents ?? null,
        stock: v.stock ?? 0,
        image_url: v.image_url ?? null,
      };
    }
    setSizes(nextSizes);
    setColors(nextColors);
    setVariantData(nextData);
  }, [loaded]);

  const toCents = (v: string) => {
    const n = Number(v.replace(",", "."));
    if (!isFinite(n)) return null;
    return Math.round(n * 100);
  };

  const priceCentsPreview = toCents(price) ?? 0;
  const installmentPreview = installmentEnabled
    ? computeInstallment(priceCentsPreview, Number(installmentCount) || 0, hasInterest ? Number(monthlyRate.replace(",", ".")) || 0 : 0)
    : "";

  const uploadFileToStorage = async (file: File, pid: string): Promise<string> => {
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const path = `${pid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
    if (error) throw error;
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    return pub.publicUrl;
  };

  const save = async () => {
    if (!name.trim()) return toast.error("Informe o nome do produto");
    const priceCents = toCents(price);
    if (priceCents == null || priceCents < 0) return toast.error("Preço inválido");
    setSaving(true);
    try {
      const installmentText = installmentEnabled
        ? computeInstallment(priceCents, Number(installmentCount) || 0, hasInterest ? Number(monthlyRate.replace(",", ".")) || 0 : 0)
        : null;

      const res = await upsert({
        data: {
          id: productId,
          name,
          slug: slug || undefined,
          category_id: categoryId,
          short_description: shortDesc || null,
          description: desc || null,
          price_cents: priceCents,
          compare_at_price_cents: comparePrice ? toCents(comparePrice) : null,
          pix_price_cents: pixPrice ? toCents(pixPrice) : null,
          installment_text: installmentText,
          stock: Number(stock) || 0,
          sku: sku || null,
          barcode: barcode || null,
          is_active: isActive,
          is_featured: isFeatured,
          is_new: isNew,
          is_promotion: isPromo,
          whatsapp_message: waMsg || null,
        },
      });
      const id = (res as any).id;

      // Upload pending images (new product flow)
      if (pending.length > 0) {
        const uploaded: { pendingId: string; imageId: string }[] = [];
        for (const p of pending) {
          try {
            const url = await uploadFileToStorage(p.file, id);
            const row: any = await addImage({ data: { product_id: id, url } });
            uploaded.push({ pendingId: p.id, imageId: row.id });
          } catch (e: any) {
            toast.error(`Falha ao enviar ${p.file.name}: ${e.message}`);
          }
        }
        // Set chosen cover
        const chosen = uploaded.find((u) => u.pendingId === pendingCoverId);
        if (chosen) {
          await setMain({ data: { product_id: id, image_id: chosen.imageId } });
        }
        pending.forEach((p) => URL.revokeObjectURL(p.preview));
        setPending([]);
        setPendingCoverId(null);
      }

      await saveFeats({ data: { product_id: id, features: features.filter((f) => f.label && f.value) } });

      // Save variants (matrix of size × color combos), excluding hidden ones
      const combos = buildCombos(sizes, colors);
      const variantsPayload = combos
        .filter((cb) => !(variantData[cb.key]?.hidden))
        .map((cb) => {
          const d = variantData[cb.key] ?? { price_cents: null, stock: 0, image_url: null };
          return {
            name: cb.label,
            price_cents: d.price_cents,
            stock: d.stock,
            image_url: d.image_url,
            attributes: {
              size: cb.size,
              color: cb.color,
            },
          };
        });
      await saveVariantsFn({ data: { product_id: id, variants: variantsPayload } });
      toast.success("Produto salvo");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["admin", "product", id] });
      qc.invalidateQueries({ queryKey: ["public-catalog"] });
      qc.invalidateQueries({ queryKey: ["public-home"] });
      if (!productId) navigate({ to: "/admin/catalogo/$id", params: { id } });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    if (productId) {
      // Upload immediately for existing product
      setUploadingImg(true);
      try {
        for (const file of arr) {
          const url = await uploadFileToStorage(file, productId);
          await addImage({ data: { product_id: productId, url } });
        }
        qc.invalidateQueries({ queryKey: ["admin", "product", productId] });
        toast.success(`${arr.length} imagem(ns) enviada(s)`);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setUploadingImg(false);
      }
    } else {
      // Queue for later
      const newItems: PendingImage[] = arr.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }));
      setPending((v) => {
        const combined = [...v, ...newItems];
        if (!pendingCoverId && combined.length > 0) {
          setPendingCoverId(combined[0].id);
        }
        return combined;
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const images = (loaded as any)?.images ?? [];
  const variants = (loaded as any)?.variants ?? [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/catalogo" })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{productId ? "Editar produto" : "Novo produto"}</h1>
          <p className="text-sm text-muted-foreground">Preencha as informações abaixo. Você pode editar tudo depois.</p>
        </div>
        {productId && slug && (
          <Button asChild variant="outline" size="sm">
            <a href={`/produto/${slug}`} target="_blank" rel="noreferrer">
              <Eye className="h-4 w-4 mr-1" /> Ver na loja
            </a>
          </Button>
        )}
        <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar produto"}</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Informações principais</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Nome do produto</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Camiseta básica preta" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Endereço na loja (opcional)</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="gerado automaticamente" />
            </div>
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <select
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="border rounded-md h-9 px-3 text-sm bg-background"
              >
                <option value="">— sem categoria —</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Descrição curta</Label>
            <Input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="Uma frase que aparece nos cards" />
          </div>
          <div className="grid gap-2">
            <Label>Descrição completa</Label>
            <Textarea rows={6} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Preços e parcelamento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Preço normal (R$)</Label>
              <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="199,90" />
            </div>
            <div className="grid gap-2">
              <Label>Preço promocional / “de” (R$)</Label>
              <Input inputMode="decimal" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} placeholder="249,90" />
            </div>
            <div className="grid gap-2">
              <Label>Preço no PIX (R$)</Label>
              <Input inputMode="decimal" value={pixPrice} onChange={(e) => setPixPrice(e.target.value)} placeholder="189,90" />
            </div>
          </div>

          <div className="border rounded-md p-3 space-y-3 bg-muted/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Mostrar parcelamento</div>
                <div className="text-xs text-muted-foreground">Calculado automaticamente a partir do preço.</div>
              </div>
              <Switch checked={installmentEnabled} onCheckedChange={setInstallmentEnabled} />
            </div>
            {installmentEnabled && (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Qtd. de parcelas</Label>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Com juros?</Label>
                  <div className="flex items-center gap-2 h-9">
                    <Switch checked={hasInterest} onCheckedChange={setHasInterest} />
                    <span className="text-sm text-muted-foreground">{hasInterest ? "Sim" : "Sem juros"}</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Juros ao mês (%)</Label>
                  <Input
                    inputMode="decimal"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(e.target.value)}
                    disabled={!hasInterest}
                    placeholder="1,99"
                  />
                </div>
                <div className="sm:col-span-3">
                  <div className="text-xs text-muted-foreground">Prévia na loja:</div>
                  <div className="text-sm font-medium">{installmentPreview || "—"}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Estoque</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label>Quantidade</Label>
            <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>SKU</Label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Código de barras</Label>
            <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Fotos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImg}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              {uploadingImg ? "Enviando…" : "Selecionar fotos"}
            </Button>
            <p className="text-xs text-muted-foreground self-center">
              Você pode escolher várias de uma vez e definir qual será a capa.
            </p>
          </div>

          {/* Pending (new product) images */}
          {!productId && pending.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {pending.map((p) => {
                const isCover = pendingCoverId === p.id;
                return (
                  <div key={p.id} className={`relative group border-2 rounded-md overflow-hidden ${isCover ? "border-primary" : "border-transparent"}`}>
                    <img src={p.preview} alt="" className="w-full aspect-square object-cover" />
                    {isCover && <Badge className="absolute top-1 left-1 text-[10px]">Capa</Badge>}
                    <div className="absolute inset-x-0 bottom-0 bg-background/95 flex justify-between p-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setPendingCoverId(p.id)}
                        disabled={isCover}
                      >
                        <Star className="h-3.5 w-3.5 mr-1" /> {isCover ? "Capa" : "Definir capa"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          URL.revokeObjectURL(p.preview);
                          setPending((v) => v.filter((x) => x.id !== p.id));
                          if (pendingCoverId === p.id) {
                            setPendingCoverId((prev) => {
                              const remaining = pending.filter((x) => x.id !== p.id);
                              return remaining[0]?.id ?? null;
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!productId && pending.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma foto adicionada ainda. As fotos serão enviadas ao salvar o produto.
            </p>
          )}

          {/* Saved images (existing product) */}
          {productId && (
            <>
              {images.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma foto adicionada ainda.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img: any, idx: number) => (
                    <div key={img.id} className="relative group border rounded-md overflow-hidden">
                      <img src={img.url} alt="" className="w-full aspect-square object-cover" />
                      {img.is_main && (
                        <Badge className="absolute top-1 left-1 text-[10px]">Capa</Badge>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-background/95 flex justify-between p-1">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0} onClick={async () => {
                            const ids = images.map((i: any) => i.id);
                            [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
                            await reorderImages({ data: { ids } });
                            qc.invalidateQueries({ queryKey: ["admin", "product", productId] });
                          }}><ArrowUp className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === images.length - 1} onClick={async () => {
                            const ids = images.map((i: any) => i.id);
                            [ids[idx + 1], ids[idx]] = [ids[idx], ids[idx + 1]];
                            await reorderImages({ data: { ids } });
                            qc.invalidateQueries({ queryKey: ["admin", "product", productId] });
                          }}><ArrowDown className="h-3.5 w-3.5" /></Button>
                        </div>
                        <div className="flex gap-1">
                          {!img.is_main && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Definir como capa" onClick={async () => {
                              await setMain({ data: { product_id: productId, image_id: img.id } });
                              qc.invalidateQueries({ queryKey: ["admin", "product", productId] });
                              qc.invalidateQueries({ queryKey: ["admin", "products"] });
                            }}><Star className="h-3.5 w-3.5" /></Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                            await delImage({ data: { id: img.id } });
                            qc.invalidateQueries({ queryKey: ["admin", "product", productId] });
                          }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Organização</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <ToggleRow label="Produto ativo" hint="Aparece no catálogo" value={isActive} onChange={setIsActive} />
          <ToggleRow label="Destaque" hint="Aparece em vitrines de destaque" value={isFeatured} onChange={setIsFeatured} />
          <ToggleRow label="Novidade" hint="Recebe selo 'Novo'" value={isNew} onChange={setIsNew} />
          <ToggleRow label="Em promoção" hint="Recebe selo 'Oferta'" value={isPromo} onChange={setIsPromo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">WhatsApp</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label>Mensagem enviada ao clicar no botão</Label>
          <Textarea rows={3} value={waMsg} onChange={(e) => setWaMsg(e.target.value)} placeholder={`Olá, tenho interesse no produto ${name || "…"}`} />
          <p className="text-xs text-muted-foreground">
            Se deixar em branco, será usado “Olá, tenho interesse no produto {name || "…"}”.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ficha técnica</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {features.map((f, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-end">
              <div className="grid gap-1">
                <Label className="text-xs">Campo</Label>
                <Input value={f.label} onChange={(e) => setFeatures((v) => v.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Marca" />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Valor</Label>
                <Input value={f.value} onChange={(e) => setFeatures((v) => v.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="Nike" />
              </div>
              <Button size="icon" variant="ghost" onClick={() => setFeatures((v) => v.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setFeatures((v) => [...v, { label: "", value: "" }])}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar linha
          </Button>
          <p className="text-xs text-muted-foreground">A ficha é salva junto com o produto ao clicar em “Salvar produto”.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variações (tamanhos e cores)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tamanhos */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Tamanhos</div>
            <div className="text-xs text-muted-foreground">Escolha um kit pronto ou adicione tamanhos personalizados.</div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setSizes((s) => Array.from(new Set([...s, ...PRESET_SIZES_LETTER])))}>Letra (PP–XXG)</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setSizes((s) => Array.from(new Set([...s, ...PRESET_SIZES_NUMERIC])))}>Numérico (34–48)</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setSizes((s) => Array.from(new Set([...s, ...PRESET_SIZES_SHOES])))}>Calçado (33–44)</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setSizes((s) => Array.from(new Set([...s, ...PRESET_SIZES_KIDS])))}>Infantil (2–14)</Button>
              {sizes.length > 0 && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setSizes([])}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpar
                </Button>
              )}
            </div>
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 border rounded-md px-2 py-1 text-xs">
                    {s}
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setSizes((v) => v.filter((x) => x !== s))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 max-w-sm">
              <Input
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="Ex.: Único, 46, XL…"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const v = customSize.trim();
                  if (!v) return;
                  setSizes((s) => (s.includes(v) ? s : [...s, v]));
                  setCustomSize("");
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
          </div>

          {/* Cores */}
          <div className="space-y-3 border-t pt-6">
            <div className="text-sm font-medium">Cores</div>
            <div className="text-xs text-muted-foreground">Clique nas cores para incluir ou remover. Você também pode criar uma cor personalizada.</div>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {PRESET_COLORS.map((c) => {
                const active = colors.some((x) => x.hex.toLowerCase() === c.hex.toLowerCase());
                return (
                  <button
                    type="button"
                    key={c.hex}
                    title={c.name}
                    onClick={() =>
                      setColors((v) =>
                        active
                          ? v.filter((x) => x.hex.toLowerCase() !== c.hex.toLowerCase())
                          : [...v, c]
                      )
                    }
                    className={`flex flex-col items-center gap-1 p-1 rounded-md border transition ${active ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"}`}
                  >
                    <span
                      className="h-8 w-8 rounded-full border border-black/10"
                      style={{ background: c.hex }}
                    />
                    <span className="text-[10px] leading-tight text-center line-clamp-1">{c.name}</span>
                  </button>
                );
              })}
            </div>
            {colors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <span key={c.hex + c.name} className="inline-flex items-center gap-2 border rounded-full pl-1 pr-2 py-1 text-xs">
                    <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: c.hex }} />
                    {c.name}
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive ml-1"
                      onClick={() => setColors((v) => v.filter((x) => !(x.hex === c.hex && x.name === c.name)))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto] items-end max-w-lg">
              <div className="grid gap-1">
                <Label className="text-xs">Nome da cor</Label>
                <Input value={customColorName} onChange={(e) => setCustomColorName(e.target.value)} placeholder="Ex.: Verde militar" />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Cor</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    className="h-9 w-12 rounded border cursor-pointer"
                  />
                  <Input
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const nm = customColorName.trim();
                  const hx = customColorHex.trim();
                  if (!nm || !/^#[0-9a-fA-F]{6}$/.test(hx)) {
                    toast.error("Informe nome e cor válida");
                    return;
                  }
                  setColors((v) => (v.some((x) => x.hex.toLowerCase() === hx.toLowerCase()) ? v : [...v, { name: nm, hex: hx }]));
                  setCustomColorName("");
                  setCustomColorHex("#000000");
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar cor
              </Button>
            </div>
          </div>

          {/* Combinações (matriz tamanho × cor) */}
          {(() => {
            const combos = buildCombos(sizes, colors);
            if (combos.length === 0) return null;
            const headerText = sizes.length && colors.length
              ? "Combine tamanho + cor. Preço vazio usa o preço do produto."
              : "Preço vazio usa o preço do produto. Estoque 0 = sem controle separado.";
            return (
              <div className="space-y-3 border-t pt-6">
                <div className="text-sm font-medium">Variações do produto</div>
                <p className="text-xs text-muted-foreground">{headerText}</p>
                <div className="space-y-2">
                  {combos.filter((cb) => !(variantData[cb.key]?.hidden)).map((cb) => {
                    const d = variantData[cb.key] ?? { price_cents: null, stock: 0, image_url: null };
                    const setD = (patch: Partial<VData>) =>
                      setVariantData((v) => ({ ...v, [cb.key]: { ...(v[cb.key] ?? { price_cents: null, stock: 0, image_url: null }), ...patch } }));
                    const priceStr =
                      d.price_cents != null ? (d.price_cents / 100).toFixed(2).replace(".", ",") : "";
                    const uploadingThis = uploadingVariantKey === cb.key;
                    return (
                      <div key={cb.key} className="grid gap-2 sm:grid-cols-[minmax(160px,1fr)_120px_100px_auto] items-center border rounded-md p-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {cb.color && (
                            <span
                              className="h-5 w-5 rounded-full border border-black/10 shrink-0"
                              style={{ background: cb.color.hex }}
                            />
                          )}
                          {cb.size && (
                            <span className="text-xs px-2 py-0.5 rounded bg-muted min-w-[2rem] text-center shrink-0">{cb.size}</span>
                          )}
                          <span className="text-sm truncate">{cb.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">R$</span>
                          <Input
                            inputMode="decimal"
                            className="h-8"
                            placeholder="—"
                            value={priceStr}
                            onChange={(e) => {
                              const raw = e.target.value.trim();
                              if (!raw) return setD({ price_cents: null });
                              const n = Number(raw.replace(",", "."));
                              setD({ price_cents: isFinite(n) ? Math.round(n * 100) : null });
                            }}
                          />
                        </div>
                        <Input
                          type="number"
                          className="h-8"
                          placeholder="Estoque"
                          value={d.stock}
                          onChange={(e) => setD({ stock: Number(e.target.value) || 0 })}
                        />
                        <div className="flex items-center gap-2 justify-end">
                          {d.image_url ? (
                            <div className="relative">
                              <img src={d.image_url} alt="" className="h-10 w-10 object-cover rounded border" />
                              <button
                                type="button"
                                className="absolute -top-1 -right-1 bg-background border rounded-full h-4 w-4 text-[10px] leading-none"
                                onClick={() => setD({ image_url: null })}
                                title="Remover foto"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <label className={`inline-flex items-center gap-1 text-xs px-2 py-1 border rounded cursor-pointer ${uploadingThis ? "opacity-50 pointer-events-none" : "hover:bg-muted"}`}>
                              <Upload className="h-3.5 w-3.5" />
                              {uploadingThis ? "Enviando…" : "Foto"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploadingVariantKey(cb.key);
                                  try {
                                    const url = await uploadFileToStorage(file, productId ?? "variants-staging");
                                    setD({ image_url: url });
                                  } catch (err: any) {
                                    toast.error(err.message);
                                  } finally {
                                    setUploadingVariantKey(null);
                                    if (e.target) e.target.value = "";
                                  }
                                }}
                              />
                            </label>
                          )}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            title="Excluir variação"
                            onClick={() => {
                              if (!confirm(`Excluir variação "${cb.label}"?`)) return;
                              setD({ hidden: true });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          <p className="text-xs text-muted-foreground">
            As variações são salvas ao clicar em <strong>Salvar produto</strong>.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate({ to: "/admin/catalogo" })}>Cancelar</Button>
        <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar produto"}</Button>
      </div>
    </div>
  );
}

function ToggleRow({ label, hint, value, onChange }: any) {
  return (
    <div className="flex items-start justify-between border rounded-md p-3 gap-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
