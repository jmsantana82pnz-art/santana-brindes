import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Palette,
  Search,
  Smartphone,
  Users,
  MessageCircle,
  Database,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/configuracao")({
  component: Page,
});

const sections = [
  {
    title: "Dados da loja",
    description: "Nome, logo, contato, redes sociais e informações da empresa",
    url: "/admin/appearance",
    icon: Building2,
  },
  {
    title: "Aparência",
    description: "Cores, tema, tipografia e identidade visual da loja",
    url: "/admin/appearance",
    icon: Palette,
  },
  {
    title: "SEO",
    description: "Meta tags, título, descrição e imagens de compartilhamento",
    url: "/admin/seo",
    icon: Search,
  },
  {
    title: "Aplicativo (PWA)",
    description: "Ícone, cor tema e instalação como app",
    url: "/admin/aplicativo",
    icon: Smartphone,
  },
  {
    title: "Mensagens WhatsApp",
    description: "Número, saudação e mensagens automáticas",
    url: "/admin/mensagens",
    icon: MessageCircle,
  },
  {
    title: "Usuários e permissões",
    description: "Convide equipe, defina papéis e permissões",
    url: "/admin/usuarios",
    icon: Users,
  },
  {
    title: "Backup e manutenção",
    description: "Exportar dados, importar e limpeza",
    url: "/admin/manutencao",
    icon: Database,
  },
];

function Page() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Tudo o que configura sua loja em um só lugar
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.title} to={s.url}>
            <Card className="hover:border-primary transition group">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.description}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
