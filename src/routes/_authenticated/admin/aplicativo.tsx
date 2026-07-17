import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getPwaSettingsAdmin, savePwaSettings } from "@/lib/pwa.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { Smartphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/aplicativo")({
  component: Page,
});

function Page() {
  const getFn = useServerFn(getPwaSettingsAdmin);
  const saveFn = useServerFn(savePwaSettings);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["pwa-settings"], queryFn: () => getFn({}) });
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (payload: any) => saveFn({ data: payload }),
    onSuccess: () => {
      toast.success("Configurações do aplicativo salvas");
      qc.invalidateQueries({ queryKey: ["pwa-settings"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Smartphone className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Aplicativo (PWA)</h1>
          <p className="text-sm text-muted-foreground">
            Configure como seu catálogo aparece quando instalado no celular
          </p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Identidade do aplicativo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome do aplicativo</Label>
            <Input value={form.app_name ?? ""} onChange={(e) => set("app_name", e.target.value)} maxLength={100} />
          </div>
          <div>
            <Label>Nome curto (ícone)</Label>
            <Input value={form.short_name ?? ""} onChange={(e) => set("short_name", e.target.value)} maxLength={30} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} maxLength={300} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Aparência</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Cor principal (tema)</Label>
            <Input type="color" value={form.theme_color ?? "#000000"} onChange={(e) => set("theme_color", e.target.value)} />
          </div>
          <div>
            <Label>Cor de fundo</Label>
            <Input type="color" value={form.background_color ?? "#ffffff"} onChange={(e) => set("background_color", e.target.value)} />
          </div>
          <div>
            <Label>Cor da splash</Label>
            <Input type="color" value={form.splash_color ?? "#ffffff"} onChange={(e) => set("splash_color", e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <Label>Ícone do aplicativo (512x512 recomendado)</Label>
            <div className="mt-2 max-w-[200px]">
              <ImageUpload
                value={form.icon_url}
                onChange={(url) => set("icon_url", url)}
                bucket="favicons"
                prefix="pwa-icon"
                label="ícone do app"
                aspect="square"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Instalação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Mensagem de instalação</Label>
            <Input value={form.install_message ?? ""} onChange={(e) => set("install_message", e.target.value)} maxLength={140} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Ativar PWA</Label>
              <p className="text-xs text-muted-foreground">Permite instalar a loja como aplicativo no celular</p>
            </div>
            <Switch checked={!!form.active} onCheckedChange={(v) => set("active", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Assistente de boas-vindas</Label>
              <p className="text-xs text-muted-foreground">Mostrar tutorial ao entrar no admin pela primeira vez</p>
            </div>
            <Switch checked={!!form.onboarding_enabled} onCheckedChange={(v) => set("onboarding_enabled", v)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
          {save.isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
