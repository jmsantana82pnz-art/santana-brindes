import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { exportBackup } from "@/lib/pwa.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Database } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/manutencao")({
  component: Page,
});

function download(name: string, content: string, mime = "application/json") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: any[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

function Page() {
  const exp = useServerFn(exportBackup);
  const mut = useMutation({
    mutationFn: () => exp({}),
    onError: (e: any) => toast.error(e.message || "Erro"),
  });

  const doExport = async (kind: "all" | "products" | "categories" | "settings") => {
    const data: any = await mut.mutateAsync();
    const ts = new Date().toISOString().slice(0, 10);
    if (kind === "all") {
      download(`backup-${ts}.json`, JSON.stringify(data, null, 2));
    } else if (kind === "products") {
      download(`produtos-${ts}.csv`, toCsv(data.products ?? []), "text/csv");
    } else if (kind === "categories") {
      download(`categorias-${ts}.csv`, toCsv(data.categories ?? []), "text/csv");
    } else {
      const settings = {
        appearance: data.appearance,
        store_settings: data.store_settings,
        contact_settings: data.contact_settings,
        whatsapp_settings: data.whatsapp_settings,
        promo_bar: data.promo_bar,
        payment_settings: data.payment_settings,
        tracking_settings: data.tracking_settings,
        seo: data.seo,
        pwa_settings: data.pwa_settings,
      };
      download(`configuracoes-${ts}.json`, JSON.stringify(settings, null, 2));
    }
    toast.success("Exportação concluída");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Database className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Manutenção</h1>
          <p className="text-sm text-muted-foreground">Backup e exportação de dados da sua loja</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Backup completo</CardTitle>
            <CardDescription>Todos os dados (JSON) para migração</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => doExport("all")} disabled={mut.isPending} className="w-full">
              <Download className="mr-2 h-4 w-4" /> Exportar tudo
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtos</CardTitle>
            <CardDescription>Planilha CSV com todos os produtos</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => doExport("products")} disabled={mut.isPending} className="w-full" variant="outline">
              <Download className="mr-2 h-4 w-4" /> Exportar produtos
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorias</CardTitle>
            <CardDescription>Planilha CSV de categorias</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => doExport("categories")} disabled={mut.isPending} className="w-full" variant="outline">
              <Download className="mr-2 h-4 w-4" /> Exportar categorias
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configurações</CardTitle>
            <CardDescription>Aparência, marketing, SEO, WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => doExport("settings")} disabled={mut.isPending} className="w-full" variant="outline">
              <Download className="mr-2 h-4 w-4" /> Exportar configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
