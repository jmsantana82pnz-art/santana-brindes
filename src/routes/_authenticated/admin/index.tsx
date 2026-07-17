import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { getDashboardExtended } from "@/lib/home.functions";
import { getPwaSettingsAdmin } from "@/lib/pwa.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Home as HomeIcon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingWizard } from "@/components/admin/OnboardingWizard";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(getDashboardExtended);
  const pwaFn = useServerFn(getPwaSettingsAdmin);
  const { data } = useQuery(
    queryOptions({
      queryKey: ["admin", "dashboard-ext"],
      queryFn: () => fn(),
    }),
  );
  const { data: pwa } = useQuery({ queryKey: ["pwa-settings"], queryFn: () => pwaFn({}) });

  return (
    <div className="space-y-6">
      <OnboardingWizard enabled={pwa?.onboarding_enabled ?? true} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da sua loja.</p>
      </div>


      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtos mais vistos</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.topProducts ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não há dados suficientes.</p>
            ) : (
              <ul className="divide-y">
                {(data?.topProducts ?? []).map((p: any) => (
                  <li key={p.id} className="py-2 flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0">
                      {p.cover_image_url && <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{p.rating_count ?? 0} avaliações</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atalhos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link to="/admin/home">
                <HomeIcon className="h-4 w-4 mr-2" />
                <span className="text-left">
                  <span className="block text-sm font-medium">Editar Home</span>
                  <span className="block text-xs text-muted-foreground">Blocos da página inicial</span>
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link to="/admin/appearance">
                <Palette className="h-4 w-4 mr-2" />
                <span className="text-left">
                  <span className="block text-sm font-medium">Aparência</span>
                  <span className="block text-xs text-muted-foreground">Cores, fontes, logo</span>
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link to="/admin/catalogo">
                <Package className="h-4 w-4 mr-2" />
                <span className="text-left">
                  <span className="block text-sm font-medium">Catálogo</span>
                  <span className="block text-xs text-muted-foreground">Produtos e categorias</span>
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link to="/admin/configuracao">
                <WhatsAppIcon className="h-4 w-4 mr-2" />
                <span className="text-left">
                  <span className="block text-sm font-medium">Empresa e contatos</span>
                  <span className="block text-xs text-muted-foreground">White label e WhatsApp</span>
                </span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
