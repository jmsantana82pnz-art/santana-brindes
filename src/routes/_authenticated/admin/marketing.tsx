import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  listCampaignsAdmin, upsertCampaign, deleteCampaign,
  listCouponsAdmin, upsertCoupon, deleteCoupon,
  getCountdown, updateCountdown,
  getTracking, updateTracking,
  getAnalyticsSummary,
} from "@/lib/marketing.functions";
import { getPromoBar, updatePromoBar, getWhatsappSettings, updateWhatsappSettings } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Megaphone, Ticket, Timer, BarChart3, Sparkles, Trash2, Plus, Edit } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/marketing")({
  component: MarketingPage,
});

function MarketingPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing</h1>
        <p className="text-sm text-muted-foreground">
          Promoções, campanhas, cupons, rastreamento e conversão pelo WhatsApp.
        </p>
      </div>
      <Tabs defaultValue="barra" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="barra"><Sparkles className="mr-2 h-4 w-4"/>Barra promocional</TabsTrigger>
          <TabsTrigger value="campanhas"><Megaphone className="mr-2 h-4 w-4"/>Campanhas</TabsTrigger>
          <TabsTrigger value="cupons"><Ticket className="mr-2 h-4 w-4"/>Cupons</TabsTrigger>
          <TabsTrigger value="contador"><Timer className="mr-2 h-4 w-4"/>Contador</TabsTrigger>
          <TabsTrigger value="rastreamento"><BarChart3 className="mr-2 h-4 w-4"/>Rastreamento</TabsTrigger>
          <TabsTrigger value="whatsapp"><WhatsAppIcon className="mr-2 h-4 w-4"/>WhatsApp</TabsTrigger>
        </TabsList>
        <TabsContent value="barra"><PromoBarTab/></TabsContent>
        <TabsContent value="campanhas"><CampaignsTab/></TabsContent>
        <TabsContent value="cupons"><CouponsTab/></TabsContent>
        <TabsContent value="contador"><CountdownTab/></TabsContent>
        <TabsContent value="rastreamento"><TrackingTab/></TabsContent>
        <TabsContent value="whatsapp"><WhatsappTab/></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- PROMO BAR ----------
function PromoBarTab() {
  const get = useServerFn(getPromoBar);
  const upd = useServerFn(updatePromoBar);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin","promo_bar"], queryFn: () => get() });
  const [form, setForm] = useState<any>(null);
  const row = form ?? data ?? {};
  const set = (patch: any) => setForm({ ...row, ...patch });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Barra promocional</CardTitle>
        <CardDescription>Texto fixo no topo do site com data de exibição opcional.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch checked={!!row.is_active} onCheckedChange={(v)=>set({is_active:v})}/>
          <Label>Barra ativa</Label>
        </div>
        <div className="grid gap-2">
          <Label>Texto exibido</Label>
          <Input value={row.text ?? ""} onChange={(e)=>set({text:e.target.value})} placeholder="10% OFF pagando no PIX"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Cor do fundo</Label>
            <Input type="color" value={row.bg_color ?? "#111111"} onChange={(e)=>set({bg_color:e.target.value})}/>
          </div>
          <div className="grid gap-2">
            <Label>Cor do texto</Label>
            <Input type="color" value={row.text_color ?? "#ffffff"} onChange={(e)=>set({text_color:e.target.value})}/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Link (opcional)</Label>
            <Input value={row.link_url ?? ""} onChange={(e)=>set({link_url:e.target.value})} placeholder="https://..."/>
          </div>
          <div className="grid gap-2">
            <Label>Texto do botão</Label>
            <Input value={row.link_label ?? ""} onChange={(e)=>set({link_label:e.target.value})} placeholder="Ver ofertas"/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Início</Label>
            <Input type="datetime-local" value={row.starts_at?.slice(0,16) ?? ""} onChange={(e)=>set({starts_at:e.target.value ? new Date(e.target.value).toISOString() : null})}/>
          </div>
          <div className="grid gap-2">
            <Label>Fim</Label>
            <Input type="datetime-local" value={row.ends_at?.slice(0,16) ?? ""} onChange={(e)=>set({ends_at:e.target.value ? new Date(e.target.value).toISOString() : null})}/>
          </div>
        </div>
        <Button onClick={async () => {
          const payload = { ...row }; delete payload.id; delete payload.created_at; delete payload.updated_at;
          await upd({ data: payload }); await qc.invalidateQueries({queryKey:["admin","promo_bar"]});
          toast.success("Barra atualizada");
        }}>Salvar</Button>
      </CardContent>
    </Card>
  );
}

// ---------- CAMPAIGNS ----------
function CampaignsTab() {
  const list = useServerFn(listCampaignsAdmin);
  const save = useServerFn(upsertCampaign);
  const del = useServerFn(deleteCampaign);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey:["admin","campaigns"], queryFn: () => list() });
  const [editing, setEditing] = useState<any | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Campanhas</h2>
        <Button onClick={()=>setEditing({ active:true, position:0 })}><Plus className="h-4 w-4 mr-2"/>Nova campanha</Button>
      </div>
      {(data ?? []).length === 0 && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          Nenhuma campanha cadastrada. Crie campanhas como "Semana do Cliente" ou "Black Friday".
        </CardContent></Card>
      )}
      <div className="grid gap-3">
        {(data ?? []).map((c: any) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center gap-4">
              {c.image_url && <img src={c.image_url} alt="" className="w-16 h-16 object-cover rounded"/>}
              <div className="flex-1">
                <div className="font-medium">{c.title || c.name}</div>
                <div className="text-xs text-muted-foreground">{c.name}</div>
                <div className="text-xs mt-1">
                  {c.start_date && <>De {new Date(c.start_date).toLocaleDateString()} </>}
                  {c.end_date && <>até {new Date(c.end_date).toLocaleDateString()}</>}
                </div>
              </div>
              <Badge variant={c.active ? "default":"secondary"}>{c.active ? "Ativa":"Inativa"}</Badge>
              <Button size="sm" variant="outline" onClick={()=>setEditing(c)}><Edit className="h-4 w-4"/></Button>
              <Button size="sm" variant="destructive" onClick={async ()=>{
                if(!confirm("Excluir campanha?")) return;
                await del({data:{id:c.id}}); await qc.invalidateQueries({queryKey:["admin","campaigns"]});
                toast.success("Excluída");
              }}><Trash2 className="h-4 w-4"/></Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(v)=>!v && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar":"Nova"} campanha</DialogTitle>
            <DialogDescription>Configure imagem, texto e período de exibição.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid gap-2"><Label>Nome interno</Label>
                <Input value={editing.name ?? ""} onChange={(e)=>setEditing({...editing,name:e.target.value})}/></div>
              <div className="grid gap-2"><Label>Título</Label>
                <Input value={editing.title ?? ""} onChange={(e)=>setEditing({...editing,title:e.target.value})}/></div>
              <div className="grid gap-2"><Label>Descrição</Label>
                <Textarea value={editing.description ?? ""} onChange={(e)=>setEditing({...editing,description:e.target.value})}/></div>
              <div className="grid gap-2"><Label>URL da imagem</Label>
                <Input value={editing.image_url ?? ""} onChange={(e)=>setEditing({...editing,image_url:e.target.value})}/></div>
              <div className="grid gap-2"><Label>Link (opcional)</Label>
                <Input value={editing.link_url ?? ""} onChange={(e)=>setEditing({...editing,link_url:e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2"><Label>Início</Label>
                  <Input type="datetime-local" value={editing.start_date?.slice(0,16) ?? ""} onChange={(e)=>setEditing({...editing,start_date:e.target.value ? new Date(e.target.value).toISOString():null})}/></div>
                <div className="grid gap-2"><Label>Fim</Label>
                  <Input type="datetime-local" value={editing.end_date?.slice(0,16) ?? ""} onChange={(e)=>setEditing({...editing,end_date:e.target.value ? new Date(e.target.value).toISOString():null})}/></div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={!!editing.active} onCheckedChange={(v)=>setEditing({...editing,active:v})}/>
                <Label>Ativa</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setEditing(null)}>Cancelar</Button>
            <Button onClick={async ()=>{
              if(!editing?.name){ toast.error("Nome é obrigatório"); return; }
              const { id, created_at, updated_at, ...payload } = editing;
              await save({ data: { id: id ?? null, ...payload } });
              await qc.invalidateQueries({queryKey:["admin","campaigns"]});
              setEditing(null); toast.success("Salvo");
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- COUPONS ----------
function CouponsTab() {
  const list = useServerFn(listCouponsAdmin);
  const save = useServerFn(upsertCoupon);
  const del = useServerFn(deleteCoupon);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey:["admin","coupons"], queryFn: () => list() });
  const [editing, setEditing] = useState<any | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Cupons de desconto</h2>
        <Button onClick={()=>setEditing({ discount_type:"percent", discount_value:10, is_active:true })}>
          <Plus className="h-4 w-4 mr-2"/>Novo cupom
        </Button>
      </div>
      {(data ?? []).length === 0 && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          Nenhum cupom cadastrado.
        </CardContent></Card>
      )}
      <div className="grid gap-3">
        {(data ?? []).map((c: any) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-mono text-lg font-semibold">{c.code}</div>
                <div className="text-xs text-muted-foreground">
                  {c.discount_type === "percent" ? `${c.discount_value}% de desconto` : `R$ ${c.discount_value} de desconto`}
                  {c.expires_at && ` · até ${new Date(c.expires_at).toLocaleDateString()}`}
                </div>
              </div>
              <Badge variant={c.is_active ? "default":"secondary"}>{c.is_active?"Ativo":"Inativo"}</Badge>
              <Button size="sm" variant="outline" onClick={()=>setEditing(c)}><Edit className="h-4 w-4"/></Button>
              <Button size="sm" variant="destructive" onClick={async ()=>{
                if(!confirm("Excluir cupom?")) return;
                await del({data:{id:c.id}}); await qc.invalidateQueries({queryKey:["admin","coupons"]});
                toast.success("Excluído");
              }}><Trash2 className="h-4 w-4"/></Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={!!editing} onOpenChange={(v)=>!v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar":"Novo"} cupom</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid gap-2"><Label>Código</Label>
                <Input value={editing.code ?? ""} onChange={(e)=>setEditing({...editing,code:e.target.value.toUpperCase()})} placeholder="DESCONTO10"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2"><Label>Tipo</Label>
                  <Select value={editing.discount_type} onValueChange={(v)=>setEditing({...editing,discount_type:v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Valor</Label>
                  <Input type="number" value={editing.discount_value ?? 0} onChange={(e)=>setEditing({...editing,discount_value:Number(e.target.value)})}/></div>
              </div>
              <div className="grid gap-2"><Label>Data limite (opcional)</Label>
                <Input type="datetime-local" value={editing.expires_at?.slice(0,16) ?? ""} onChange={(e)=>setEditing({...editing,expires_at:e.target.value ? new Date(e.target.value).toISOString():null})}/></div>
              <div className="grid gap-2"><Label>Limite de uso</Label>
                <Input type="number" value={editing.usage_limit ?? ""} onChange={(e)=>setEditing({...editing,usage_limit: e.target.value ? Number(e.target.value):null})}/></div>
              <div className="flex items-center gap-3">
                <Switch checked={!!editing.is_active} onCheckedChange={(v)=>setEditing({...editing,is_active:v})}/>
                <Label>Ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setEditing(null)}>Cancelar</Button>
            <Button onClick={async ()=>{
              if(!editing?.code){ toast.error("Código obrigatório"); return; }
              const { id, created_at, updated_at, used_count, ...payload } = editing;
              await save({ data: { id: id ?? null, ...payload } });
              await qc.invalidateQueries({queryKey:["admin","coupons"]});
              setEditing(null); toast.success("Salvo");
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- COUNTDOWN ----------
function CountdownTab() {
  const get = useServerFn(getCountdown);
  const upd = useServerFn(updateCountdown);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey:["admin","countdown"], queryFn: () => get() });
  const [form, setForm] = useState<any>(null);
  const row = form ?? data ?? {};
  const set = (p:any) => setForm({...row, ...p});
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contagem regressiva</CardTitle>
        <CardDescription>Exibe um contador no topo da loja até uma data limite.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch checked={!!row.is_active} onCheckedChange={(v)=>set({is_active:v})}/>
          <Label>Contador ativo</Label>
        </div>
        <div className="grid gap-2"><Label>Texto</Label>
          <Input value={row.title ?? ""} onChange={(e)=>set({title:e.target.value})} placeholder="Oferta termina em:"/></div>
        <div className="grid gap-2"><Label>Data final</Label>
          <Input type="datetime-local" value={row.ends_at?.slice(0,16) ?? ""} onChange={(e)=>set({ends_at:e.target.value ? new Date(e.target.value).toISOString():null})}/></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2"><Label>Cor de fundo</Label>
            <Input type="color" value={row.bg_color ?? "#111111"} onChange={(e)=>set({bg_color:e.target.value})}/></div>
          <div className="grid gap-2"><Label>Cor do texto</Label>
            <Input type="color" value={row.text_color ?? "#ffffff"} onChange={(e)=>set({text_color:e.target.value})}/></div>
        </div>
        <Button onClick={async ()=>{
          const payload = { ...row }; delete payload.id; delete payload.created_at; delete payload.updated_at;
          await upd({ data: payload }); await qc.invalidateQueries({queryKey:["admin","countdown"]});
          toast.success("Contador atualizado");
        }}>Salvar</Button>
      </CardContent>
    </Card>
  );
}

// ---------- TRACKING ----------
function TrackingTab() {
  const get = useServerFn(getTracking);
  const upd = useServerFn(updateTracking);
  const stats = useServerFn(getAnalyticsSummary);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey:["admin","tracking"], queryFn: () => get() });
  const { data: statsData } = useQuery({ queryKey:["admin","analytics-summary"], queryFn: () => stats() });
  const [form, setForm] = useState<any>(null);
  const row = form ?? data ?? {};
  const set = (p:any) => setForm({...row, ...p});
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statsData && Object.entries({
          page_view:"Visitas", product_view:"Visualizações produto",
          whatsapp_click:"Cliques WhatsApp", share_click:"Compartilhamentos",
          category_click:"Cliques categoria",
        }).map(([k,label])=>(
          <Card key={k}><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-2xl font-bold">{statsData.counts[k] ?? 0}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Códigos de rastreamento</CardTitle>
          <CardDescription>Cole aqui os IDs dos serviços de análise. Serão injetados automaticamente na loja.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2"><Label>Código do Facebook Pixel</Label>
            <Input value={row.meta_pixel_id ?? ""} onChange={(e)=>set({meta_pixel_id:e.target.value})} placeholder="1234567890"/></div>
          <div className="grid gap-2"><Label>Google Analytics (GA4)</Label>
            <Input value={row.ga_id ?? ""} onChange={(e)=>set({ga_id:e.target.value})} placeholder="G-XXXXXXXXXX"/></div>
          <div className="grid gap-2"><Label>Google Tag Manager</Label>
            <Input value={row.gtm_id ?? ""} onChange={(e)=>set({gtm_id:e.target.value})} placeholder="GTM-XXXXXX"/></div>
          <div className="grid gap-2"><Label>TikTok Pixel</Label>
            <Input value={row.tiktok_pixel_id ?? ""} onChange={(e)=>set({tiktok_pixel_id:e.target.value})}/></div>
          <div className="grid gap-2"><Label>Google Ads ID</Label>
            <Input value={row.google_ads_id ?? ""} onChange={(e)=>set({google_ads_id:e.target.value})} placeholder="AW-XXXXXXXX"/></div>
          <Button onClick={async ()=>{
            const payload = { ...row }; delete payload.id; delete payload.created_at; delete payload.updated_at;
            await upd({ data: payload }); await qc.invalidateQueries({queryKey:["admin","tracking"]});
            toast.success("Códigos atualizados");
          }}>Salvar</Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- WHATSAPP ----------
function WhatsappTab() {
  const get = useServerFn(getWhatsappSettings);
  const upd = useServerFn(updateWhatsappSettings);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey:["admin","whatsapp"], queryFn: () => get() });
  const [form, setForm] = useState<any>(null);
  const row = form ?? data ?? {};
  const set = (p:any) => setForm({...row, ...p});
  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp</CardTitle>
        <CardDescription>Configure o botão flutuante e as mensagens automáticas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch checked={!!row.floating_button_enabled} onCheckedChange={(v)=>set({floating_button_enabled:v})}/>
          <Label>Botão flutuante ativo</Label>
        </div>
        <div className="grid gap-2"><Label>Número WhatsApp</Label>
          <Input value={row.phone_number ?? ""} onChange={(e)=>set({phone_number:e.target.value})} placeholder="5511999999999"/></div>
        <div className="grid gap-2"><Label>Texto do botão</Label>
          <Input value={row.floating_button_label ?? ""} onChange={(e)=>set({floating_button_label:e.target.value})} placeholder="Fale conosco"/></div>
        <div className="grid gap-2">
          <Label>Mensagem padrão</Label>
          <Textarea value={row.default_message ?? ""} onChange={(e)=>set({default_message:e.target.value})} placeholder="Olá, gostaria de informações."/>
        </div>
        <div className="grid gap-2">
          <Label>Mensagem de produto</Label>
          <Textarea value={row.product_message_template ?? ""} onChange={(e)=>set({product_message_template:e.target.value})} placeholder="Olá, tenho interesse no produto {{product_name}} {{product_url}}"/>
          <p className="text-xs text-muted-foreground">Você pode usar {"{{product_name}}"} e {"{{product_url}}"}</p>
        </div>
        <div className="grid gap-2">
          <Label>Posição do botão</Label>
          <Select value={row.floating_button_position ?? "bottom-right"} onValueChange={(v)=>set({floating_button_position:v})}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-right">Inferior direito</SelectItem>
              <SelectItem value="bottom-left">Inferior esquerdo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={async ()=>{
          const payload = { ...row }; delete payload.id; delete payload.created_at; delete payload.updated_at;
          await upd({ data: payload }); await qc.invalidateQueries({queryKey:["admin","whatsapp"]});
          toast.success("WhatsApp atualizado");
        }}>Salvar</Button>
      </CardContent>
    </Card>
  );
}
