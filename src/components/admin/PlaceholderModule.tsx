import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Circle } from "lucide-react";

export function PlaceholderModule({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
          <CardDescription>
            Este módulo será construído na próxima etapa. Estrutura prevista:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it} className="flex items-center gap-2 text-sm">
                <Circle className="h-3 w-3 text-muted-foreground" />
                {it}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
