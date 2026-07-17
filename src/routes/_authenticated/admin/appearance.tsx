import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getStoreSettings,
  updateStoreSettings,
  getAppearance,
  updateAppearance,
  getPromoBar,
  updatePromoBar,
} from "@/lib/admin.functions";
import { ExternalLink, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/appearance")({
  component: AppearancePage,
});

const FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "Merriweather",
  "Lora",
  "Nunito",
  "Open Sans",
  "Raleway",
  "System UI",
];

const CARD_STYLES: Array<{ value: string; label: string; hint: string }> = [
  { value: "modern", label: "Moderno", hint: "Sombras suaves, imagem grande" },
  { value: "compact", label: "Compacto", hint: "Grid denso, foco no preço" },
  { value: "premium", label: "Premium", hint: "Espaçamento amplo, tipografia elegante" },
];

const BORDER_STYLES: Array<{ value: string; label: string; radius: number }> = [
  { value: "rounded", label: "Arredondadas", radius: 16 },
  { value: "medium", label: "Médias", radius: 8 },
  { value: "square", label: "Quadradas", radius: 0 },
];

const PAYMENT_OPTIONS = [
  "pix",
  "visa",
  "mastercard",
  "amex",
  "elo",
  "hipercard",
  "boleto",
  "google-pay",
  "apple-pay",
];
const BADGE_OPTIONS = ["ssl", "lgpd", "secure-checkout", "verified-store", "buyer-protection"];

function AppearancePage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aparência</h1>
          <p className="text-sm text-muted-foreground">
            Toda alteração é salva no banco e refletida imediatamente no catálogo público.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" /> Ver catálogo público
          </a>
        </Button>
      </div>
      <Tabs defaultValue="themes" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="themes">Temas da Loja</TabsTrigger>
          <TabsTrigger value="identity">Identidade</TabsTrigger>
          <TabsTrigger value="colors">Cores</TabsTrigger>
          <TabsTrigger value="typography">Tipografia</TabsTrigger>
          <TabsTrigger value="catalog">Catálogo</TabsTrigger>
          <TabsTrigger value="buttons">Botões</TabsTrigger>
          <TabsTrigger value="toggles">Componentes</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="footer">Rodapé</TabsTrigger>
        </TabsList>
        <TabsContent value="themes"><ThemesBlock /></TabsContent>
        <TabsContent value="identity"><IdentityBlock /></TabsContent>
        <TabsContent value="colors"><ColorsBlock /></TabsContent>
        <TabsContent value="typography"><TypographyBlock /></TabsContent>
        <TabsContent value="catalog"><CatalogLayoutBlock /></TabsContent>
        <TabsContent value="buttons"><ProductButtonsBlock /></TabsContent>
        <TabsContent value="toggles"><TogglesBlock /></TabsContent>
        <TabsContent value="header"><HeaderBlock /></TabsContent>
        <TabsContent value="footer"><FooterBlock /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function useAppearance() {
  const fn = useServerFn(getAppearance);
  return useQuery(queryOptions({ queryKey: ["admin", "appearance"], queryFn: () => fn() }));
}

function useAppearanceMutation() {
  const qc = useQueryClient();
  const fn = useServerFn(updateAppearance);
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "appearance"] });
      qc.invalidateQueries({ queryKey: ["public-settings"] });
      toast.success("Aparência atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 rounded border cursor-pointer bg-transparent"
        />
        <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="#000000" />
      </div>
    </div>
  );
}

/* ---------------- 1. Identidade visual ---------------- */

function IdentityBlock() {
  const storeFn = useServerFn(getStoreSettings);
  const storeUp = useServerFn(updateStoreSettings);
  const promoFn = useServerFn(getPromoBar);
  const promoUp = useServerFn(updatePromoBar);
  const qc = useQueryClient();
  const store = useQuery(queryOptions({ queryKey: ["admin", "store"], queryFn: () => storeFn() }));
  const promo = useQuery(queryOptions({ queryKey: ["admin", "promo"], queryFn: () => promoFn() }));

  const [name, setName] = useState("");
  const [promoText, setPromoText] = useState("");
  const [promoActive, setPromoActive] = useState(false);
  const [promoBg, setPromoBg] = useState("#111111");
  const [promoTextColor, setPromoTextColor] = useState("#ffffff");

  useEffect(() => {
    if (store.data) setName(store.data.name ?? "");
  }, [store.data]);
  useEffect(() => {
    if (promo.data) {
      setPromoText(promo.data.text ?? "");
      setPromoActive(promo.data.is_active ?? false);
      setPromoBg(promo.data.bg_color ?? "#111111");
      setPromoTextColor(promo.data.text_color ?? "#ffffff");
    }
  }, [promo.data]);

  const saveAll = useMutation({
    mutationFn: async () => {
      await storeUp({ data: { name } });
      await promoUp({
        data: {
          text: promoText.trim() || null,
          is_active: promoActive,
          bg_color: promoBg,
          text_color: promoTextColor,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "store"] });
      qc.invalidateQueries({ queryKey: ["admin", "promo"] });
      qc.invalidateQueries({ queryKey: ["public-settings"] });
      toast.success("Identidade salva");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadImage = async (kind: "logo" | "favicon", file: File) => {
    const bucket = kind === "logo" ? "logos" : "favicons";
    const field = kind === "logo" ? "logo_url" : "favicon_url";
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    await storeUp({ data: { [field]: pub.publicUrl } });
    qc.invalidateQueries({ queryKey: ["admin", "store"] });
    qc.invalidateQueries({ queryKey: ["public-settings"] });
    toast.success(`${kind === "logo" ? "Logo" : "Favicon"} atualizado`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Identidade visual</CardTitle>
          <CardDescription>Logo, favicon, nome público e barra superior.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUpload
              label="Logo"
              current={store.data?.logo_url ?? null}
              onFile={(f) => uploadImage("logo", f)}
              onClear={async () => {
                await storeUp({ data: { logo_url: null } });
                qc.invalidateQueries({ queryKey: ["admin", "store"] });
                qc.invalidateQueries({ queryKey: ["public-settings"] });
              }}
            />
            <ImageUpload
              label="Favicon"
              current={store.data?.favicon_url ?? null}
              square
              onFile={(f) => uploadImage("favicon", f)}
              onClear={async () => {
                await storeUp({ data: { favicon_url: null } });
                qc.invalidateQueries({ queryKey: ["admin", "store"] });
                qc.invalidateQueries({ queryKey: ["public-settings"] });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Nome da loja</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Barra superior (tagline)</div>
                <div className="text-xs text-muted-foreground">
                  Faixa fina no topo do site com um anúncio ou frase.
                </div>
              </div>
              <Switch checked={promoActive} onCheckedChange={setPromoActive} />
            </div>
            <div className="space-y-2">
              <Label>Texto</Label>
              <Input
                value={promoText}
                onChange={(e) => setPromoText(e.target.value)}
                placeholder="Frete grátis em compras acima de R$ 199"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Fundo" value={promoBg} onChange={setPromoBg} />
              <ColorField label="Texto" value={promoTextColor} onChange={setPromoTextColor} />
            </div>
          </div>
          <Button onClick={() => saveAll.mutate()} disabled={saveAll.isPending}>
            <Save className="h-4 w-4 mr-1" /> {saveAll.isPending ? "Salvando..." : "Salvar identidade"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ImageUpload({
  label,
  current,
  onFile,
  onClear,
  square,
}: {
  label: string;
  current: string | null;
  onFile: (f: File) => void;
  onClear: () => void;
  square?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border rounded-lg p-3 flex items-center gap-3">
        {current ? (
          <img
            src={current}
            alt={label}
            className={square ? "h-12 w-12 object-contain" : "h-12 w-auto object-contain"}
          />
        ) : (
          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
            —
          </div>
        )}
        <div className="flex gap-2 ml-auto">
          <input
            ref={ref}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
          <Button size="sm" variant="outline" onClick={() => ref.current?.click()}>
            Enviar
          </Button>
          {current && (
            <Button size="sm" variant="ghost" onClick={onClear}>
              Remover
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 2. Cores ---------------- */

function ColorsBlock() {
  const { data } = useAppearance();
  const mut = useAppearanceMutation();
  const [f, setF] = useState<Record<string, string>>({});
  useEffect(() => {
    if (data) {
      setF({
        primary_color: data.primary_color ?? "#111111",
        secondary_color: data.secondary_color ?? "#666666",
        accent_color: data.accent_color ?? "#22c55e",
        bg_color: data.bg_color ?? "#ffffff",
        text_color: data.text_color ?? "#111111",
        button_color: (data as any).button_color ?? data.primary_color ?? "#111111",
        button_text_color: (data as any).button_text_color ?? "#ffffff",
        whatsapp_color: (data as any).whatsapp_color ?? "#25d366",
      });
    }
  }, [data]);
  const set = (k: string) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cores</CardTitle>
        <CardDescription>Paleta usada em todo o site.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Primária" value={f.primary_color ?? ""} onChange={set("primary_color")} />
          <ColorField label="Secundária" value={f.secondary_color ?? ""} onChange={set("secondary_color")} />
          <ColorField label="Destaque" value={f.accent_color ?? ""} onChange={set("accent_color")} />
          <ColorField label="Fundo" value={f.bg_color ?? ""} onChange={set("bg_color")} />
          <ColorField label="Texto" value={f.text_color ?? ""} onChange={set("text_color")} />
          <ColorField label="Botão (fundo)" value={f.button_color ?? ""} onChange={set("button_color")} />
          <ColorField label="Botão (texto)" value={f.button_text_color ?? ""} onChange={set("button_text_color")} />
          <ColorField label="WhatsApp" value={f.whatsapp_color ?? ""} onChange={set("whatsapp_color")} />
        </div>
        <Button onClick={() => mut.mutate(f)} disabled={mut.isPending}>
          <Save className="h-4 w-4 mr-1" /> {mut.isPending ? "Salvando..." : "Salvar cores"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------------- 3. Tipografia ---------------- */

function TypographyBlock() {
  const { data } = useAppearance();
  const mut = useAppearanceMutation();
  const [heading, setHeading] = useState("Inter");
  const [body, setBody] = useState("Inter");
  useEffect(() => {
    if (data) {
      setHeading((data as any).font_heading ?? data.font_family ?? "Inter");
      setBody(data.font_family ?? "Inter");
    }
  }, [data]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipografia</CardTitle>
        <CardDescription>Fontes usadas em títulos e textos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Fonte dos títulos</Label>
            <Select value={heading} onValueChange={setHeading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-lg font-semibold" style={{ fontFamily: heading }}>Preview do título</div>
          </div>
          <div className="space-y-2">
            <Label>Fonte dos textos</Label>
            <Select value={body} onValueChange={setBody}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-sm" style={{ fontFamily: body }}>Preview do corpo do texto na loja.</div>
          </div>
        </div>
        <Button onClick={() => mut.mutate({ font_family: body, font_heading: heading })} disabled={mut.isPending}>
          <Save className="h-4 w-4 mr-1" /> {mut.isPending ? "Salvando..." : "Salvar tipografia"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------------- 4. Layout do catálogo ---------------- */

function CatalogLayoutBlock() {
  const { data } = useAppearance();
  const mut = useAppearanceMutation();
  const [cardStyle, setCardStyle] = useState("modern");
  const [borderStyle, setBorderStyle] = useState("rounded");
  useEffect(() => {
    if (data) {
      setCardStyle(data.product_card_style ?? "modern");
      const r = data.border_radius ?? 16;
      setBorderStyle(r >= 12 ? "rounded" : r > 0 ? "medium" : "square");
    }
  }, [data]);
  const save = () => {
    const radius = BORDER_STYLES.find((b) => b.value === borderStyle)?.radius ?? 8;
    mut.mutate({ product_card_style: cardStyle, border_radius: radius });
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Layout do catálogo</CardTitle>
        <CardDescription>Estilo dos cards de produto e das bordas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Estilo dos cards</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {CARD_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setCardStyle(s.value)}
                className={`rounded-lg border p-3 text-left transition ${
                  cardStyle === s.value ? "border-primary ring-1 ring-primary" : "hover:bg-muted"
                }`}
              >
                <div className="font-medium text-sm">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.hint}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Bordas</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {BORDER_STYLES.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => setBorderStyle(b.value)}
                className={`border p-3 text-center transition ${
                  borderStyle === b.value ? "border-primary ring-1 ring-primary" : "hover:bg-muted"
                }`}
                style={{ borderRadius: b.radius }}
              >
                <div className="text-sm font-medium">{b.label}</div>
                <div className="text-xs text-muted-foreground">radius {b.radius}px</div>
              </button>
            ))}
          </div>
        </div>
        <Button onClick={save} disabled={mut.isPending}>
          <Save className="h-4 w-4 mr-1" /> {mut.isPending ? "Salvando..." : "Salvar layout"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------------- 4b. Botões dos produtos ---------------- */

function ProductButtonsBlock() {
  const { data } = useAppearance();
  const mut = useAppearanceMutation();
  const [buyEnabled, setBuyEnabled] = useState(true);
  const [waEnabled, setWaEnabled] = useState(true);
  const [label, setLabel] = useState("COMPRAR");
  const [color, setColor] = useState("#111827");

  useEffect(() => {
    if (!data) return;
    setBuyEnabled((data as any).home_card_buy_button_enabled !== false);
    setWaEnabled((data as any).home_card_whatsapp_button_enabled !== false);
    setLabel((data as any).home_card_buy_button_label ?? "COMPRAR");
    setColor((data as any).home_card_buy_button_color ?? "#111827");
  }, [data]);

  const save = () =>
    mut.mutate({
      home_card_buy_button_enabled: buyEnabled,
      home_card_whatsapp_button_enabled: waEnabled,
      home_card_buy_button_label: label.trim() || "COMPRAR",
      home_card_buy_button_color: color,
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Botões dos produtos</CardTitle>
        <CardDescription>
          Controle os botões que aparecem nos cards da home e na página do produto.
          Quando só o WhatsApp está ativo, ele ocupa toda a largura.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="text-sm font-medium">Botão Comprar (adicionar à sacola)</div>
            <div className="text-xs text-muted-foreground">Adiciona o produto ao carrinho.</div>
          </div>
          <Switch checked={buyEnabled} onCheckedChange={setBuyEnabled} />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="text-sm font-medium">Botão WhatsApp</div>
            <div className="text-xs text-muted-foreground">
              Abre o WhatsApp com o nome e valor do produto na mensagem.
            </div>
          </div>
          <Switch checked={waEnabled} onCheckedChange={setWaEnabled} />
        </div>

        <div className="space-y-2">
          <Label>Texto do botão Comprar</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="COMPRAR" />
        </div>

        <ColorField label="Cor do botão Comprar" value={color} onChange={setColor} />

        <Button onClick={save} disabled={mut.isPending}>
          <Save className="h-4 w-4 mr-1" /> {mut.isPending ? "Salvando..." : "Salvar botões"}
        </Button>
      </CardContent>
    </Card>
  );
}



/* ---------------- 5. Componentes visíveis ---------------- */

const TOGGLES: Array<[string, string]> = [
  ["show_product_price", "Mostrar preço"],
  ["show_product_stock", "Mostrar estoque"],
  ["show_search", "Mostrar busca"],
  ["show_categories_menu", "Mostrar categorias"],
  ["show_product_reviews", "Mostrar avaliações"],
  ["show_whatsapp_button", "Mostrar botão WhatsApp"],
  ["show_share_button", "Mostrar botão compartilhar"],
];

function TogglesBlock() {
  const { data } = useAppearance();
  const mut = useAppearanceMutation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Componentes visíveis</CardTitle>
        <CardDescription>Ligue ou desligue elementos do catálogo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {TOGGLES.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between rounded-lg border p-3">
            <div className="text-sm font-medium">{label}</div>
            <Switch
              checked={Boolean((data as any)?.[key] ?? true)}
              onCheckedChange={(v) => mut.mutate({ [key]: v })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ---------------- 6. Header ---------------- */

function HeaderBlock() {
  const { data } = useAppearance();
  const mut = useAppearanceMutation();
  const [pos, setPos] = useState("left");
  useEffect(() => {
    if (data) setPos((data as any).logo_position ?? "left");
  }, [data]);
  const flags: Array<[string, string]> = [
    ["header_show_menu", "Mostrar menu"],
    ["header_show_social", "Mostrar redes sociais"],
    ["header_show_whatsapp", "Mostrar WhatsApp"],
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Header</CardTitle>
        <CardDescription>Configuração da barra de topo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Posição da logo</Label>
          <Select value={pos} onValueChange={(v) => { setPos(v); mut.mutate({ logo_position: v }); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Esquerda</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Direita</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {flags.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between rounded-lg border p-3">
            <div className="text-sm font-medium">{label}</div>
            <Switch
              checked={Boolean((data as any)?.[key] ?? true)}
              onCheckedChange={(v) => mut.mutate({ [key]: v })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ---------------- 7. Rodapé ---------------- */

function FooterBlock() {
  const { data } = useAppearance();
  const mut = useAppearanceMutation();
  const [text, setText] = useState("");
  const [institutional, setInstitutional] = useState("");
  const [payments, setPayments] = useState<string[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  useEffect(() => {
    if (data) {
      setText(data.footer_text ?? "");
      setInstitutional((data as any).footer_institutional_text ?? "");
      const p = (data as any).payment_methods;
      setPayments(Array.isArray(p) ? p : []);
      const b = (data as any).security_badges;
      setBadges(Array.isArray(b) ? b : []);
    }
  }, [data]);
  const flags: Array<[string, string]> = [
    ["footer_show_contact", "Mostrar informações de contato"],
    ["footer_show_social", "Mostrar redes sociais"],
    ["footer_show_payments", "Mostrar formas de pagamento"],
    ["footer_show_security_badges", "Mostrar selos de segurança"],
  ];
  const toggleItem = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rodapé</CardTitle>
        <CardDescription>Textos e blocos visíveis no rodapé.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Texto institucional</Label>
          <Textarea
            rows={3}
            value={institutional}
            onChange={(e) => setInstitutional(e.target.value)}
            placeholder="Ex: Loja oficial da marca, entrega para todo o Brasil."
          />
        </div>
        <div className="space-y-2">
          <Label>Copyright / rodapé final</Label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="© 2025 Minha Loja. Todos os direitos reservados."
          />
        </div>
        <Button
          size="sm"
          onClick={() =>
            mut.mutate({
              footer_text: text || null,
              footer_institutional_text: institutional || null,
            })
          }
        >
          Salvar textos
        </Button>

        <div className="space-y-2 pt-2">
          <Label>Formas de pagamento exibidas</Label>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_OPTIONS.map((p) => {
              const on = payments.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const next = toggleItem(payments, p);
                    setPayments(next);
                    mut.mutate({ payment_methods: next });
                  }}
                  className={`px-3 py-1.5 rounded-md border text-xs uppercase tracking-wide ${
                    on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Selos de segurança</Label>
          <div className="flex flex-wrap gap-2">
            {BADGE_OPTIONS.map((p) => {
              const on = badges.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const next = toggleItem(badges, p);
                    setBadges(next);
                    mut.mutate({ security_badges: next });
                  }}
                  className={`px-3 py-1.5 rounded-md border text-xs uppercase tracking-wide ${
                    on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {flags.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between rounded-lg border p-3">
            <div className="text-sm font-medium">{label}</div>
            <Switch
              checked={Boolean((data as any)?.[key] ?? true)}
              onCheckedChange={(v) => mut.mutate({ [key]: v })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------- Themes Block ----------------
import { PALETTES, CATALOG_FONTS, paletteToAppearanceFields, type Palette } from "@/lib/theme-palettes";

function ThemesBlock() {
  const qc = useQueryClient();
  const get = useServerFn(getAppearance);
  const upd = useServerFn(updateAppearance);
  const { data } = useQuery(queryOptions({ queryKey: ["admin-appearance"], queryFn: () => get() }));
  const current = (data as any) ?? {};

  const [previewId, setPreviewId] = useState<string | null>(null);
  useEffect(() => {
    if (!previewId && current.selected_palette) setPreviewId(current.selected_palette);
  }, [current.selected_palette, previewId]);

  const activePalette: Palette | undefined =
    PALETTES.find((p) => p.id === previewId) ?? PALETTES.find((p) => p.id === current.selected_palette);

  const [font, setFont] = useState<string>(current.font_family || "Inter");
  useEffect(() => {
    if (current.font_family) setFont(current.font_family);
  }, [current.font_family]);

  const mut = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => upd({ data: patch }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-appearance"] });
      qc.invalidateQueries({ queryKey: ["public-settings-theme"] });
      qc.invalidateQueries({ queryKey: ["public-home"] });
      toast.success("Tema aplicado ao catálogo");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const applyPalette = (p: Palette) => {
    mut.mutate({ ...paletteToAppearanceFields(p), font_family: font });
  };

  const applyFont = (f: string) => {
    setFont(f);
    mut.mutate({ font_family: f });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Temas da Loja</CardTitle>
          <CardDescription>
            Escolha uma paleta pronta — as cores são aplicadas apenas no catálogo público.
            O painel administrativo mantém sua identidade visual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PALETTES.map((p) => {
              const isActive = current.selected_palette === p.id;
              const isPreview = previewId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreviewId(p.id)}
                  className={`text-left rounded-xl border-2 p-4 transition ${
                    isPreview ? "border-primary shadow-md" : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.style}</div>
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-bold uppercase text-primary">Ativa</span>
                    )}
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[p.primary_color, p.secondary_color, p.accent_color, p.bg_color, p.text_color].map(
                      (c, i) => (
                        <span
                          key={i}
                          className="h-8 flex-1 rounded border"
                          style={{ background: c }}
                        />
                      ),
                    )}
                  </div>
                  <MiniPreview p={p} />
                  <Button
                    className="mt-3 w-full"
                    size="sm"
                    disabled={mut.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      applyPalette(p);
                    }}
                  >
                    {isActive ? "Reaplicar tema" : "Aplicar tema"}
                  </Button>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fonte do Catálogo</CardTitle>
          <CardDescription>
            Aplicada apenas nas páginas públicas (home, produto, carrinho). O admin não é afetado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {CATALOG_FONTS.map((f) => {
            const isActive = font === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => applyFont(f.id)}
                className={`rounded-lg border-2 p-4 text-left transition ${
                  isActive ? "border-primary" : "border-border hover:border-muted-foreground/40"
                }`}
                style={{ fontFamily: f.css }}
              >
                <div className="text-lg font-semibold">{f.name}</div>
                <div className="text-xs text-muted-foreground" style={{ fontFamily: "system-ui" }}>
                  {f.style}
                </div>
                <div className="mt-2 text-sm">Ag 123</div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {activePalette && (
        <Card>
          <CardHeader>
            <CardTitle>Preview do catálogo</CardTitle>
            <CardDescription>Como o catálogo público ficará com o tema selecionado.</CardDescription>
          </CardHeader>
          <CardContent>
            <FullPreview p={activePalette} font={font} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MiniPreview({ p }: { p: Palette }) {
  return (
    <div
      className="rounded-md border overflow-hidden text-xs"
      style={{ background: p.bg_color, color: p.text_color }}
    >
      <div
        className="px-2 py-1.5 font-semibold"
        style={{ background: p.header_bg_color, color: p.header_text_color }}
      >
        Loja
      </div>
      <div className="p-2 flex gap-2 items-center">
        <div className="h-8 w-8 rounded" style={{ background: p.secondary_color }} />
        <div className="flex-1">
          <div className="h-1.5 rounded w-3/4 mb-1" style={{ background: p.text_color, opacity: 0.6 }} />
          <div className="font-bold" style={{ color: p.primary_color }}>R$ 99,90</div>
        </div>
        <div
          className="px-2 py-1 rounded text-[10px] font-semibold"
          style={{ background: p.button_color, color: p.button_text_color }}
        >
          Comprar
        </div>
      </div>
    </div>
  );
}

function FullPreview({ p, font }: { p: Palette; font: string }) {
  const fontCss = CATALOG_FONTS.find((f) => f.id === font)?.css ?? `'${font}', sans-serif`;
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: p.bg_color, color: p.text_color, fontFamily: fontCss }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: p.header_bg_color, color: p.header_text_color }}
      >
        <div className="font-bold text-lg">Minha Loja</div>
        <div className="flex gap-2">
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: p.accent_color, color: p.button_text_color }}
          >
            WhatsApp
          </span>
        </div>
      </div>
      <div
        className="px-4 py-2 text-xs flex gap-4 border-b"
        style={{ color: p.secondary_color }}
      >
        <span>Home</span><span>Categorias</span><span>Ofertas</span><span>Contato</span>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg overflow-hidden" style={{ background: p.card_color }}>
            <div className="aspect-square" style={{ background: p.secondary_color, opacity: 0.3 }} />
            <div className="p-3">
              <div className="text-sm font-medium mb-1" style={{ color: p.text_color }}>
                Produto {i}
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-bold" style={{ color: p.primary_color }}>R$ 99,90</span>
                <span className="text-[10px] line-through" style={{ color: p.secondary_color }}>
                  R$ 129,90
                </span>
              </div>
              <button
                className="w-full py-1.5 rounded text-xs font-semibold"
                style={{ background: p.button_color, color: p.button_text_color }}
              >
                Adicionar
              </button>
            </div>
          </div>
        ))}
      </div>
      <div
        className="px-4 py-3 text-xs"
        style={{ background: p.footer_bg_color, color: p.footer_text_color }}
      >
        © Minha Loja — Todos os direitos reservados
      </div>
    </div>
  );
}
