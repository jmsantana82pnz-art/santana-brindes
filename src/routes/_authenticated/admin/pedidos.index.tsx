import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listOrders, updateOrderStatus } from "@/lib/orders.functions";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/pedidos/")({
  component: PedidosPage,
});

const STATUS: { key: string; label: string }[] = [
  { key: "pending", label: "Novo" },
  { key: "confirmed", label: "Em atendimento" },
  { key: "processing", label: "Aguardando pagamento" },
  { key: "shipped", label: "Separando pedido" },
  { key: "completed", label: "Finalizado" },
  { key: "cancelled", label: "Cancelado" },
];

function fmt(c: number) {
  return "R$ " + ((c ?? 0) / 100).toFixed(2).replace(".", ",");
}
function fmtDate(s: string) {
  return new Date(s).toLocaleString("pt-BR");
}

function PedidosPage() {
  const listFn = useServerFn(listOrders);
  const updFn = useServerFn(updateOrderStatus);

  const { data: orders, refetch, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => listFn(),
  });

  async function changeStatus(id: string, status: string) {
    try {
      await updFn({ data: { id, status } });
      toast.success("Status atualizado");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const list = (orders ?? []) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seus pedidos e clientes.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="border rounded-lg overflow-hidden bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3">Número</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Data</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Status</th>
                <th className="p-3 w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">#{o.number}</td>
                  <td className="p-3">
                    <div className="font-medium">{o.customer?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{o.customer?.phone ?? ""}</div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{fmtDate(o.created_at)}</td>
                  <td className="p-3 font-semibold">{fmt(o.total_cents)}</td>
                  <td className="p-3">
                    <Select value={o.status} onValueChange={(v) => changeStatus(o.id, v)}>
                      <SelectTrigger className="h-8 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS.map((s) => (
                          <SelectItem key={s.key} value={s.key}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/pedidos/$id" params={{ id: o.id }}>
                        Ver
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border rounded-lg p-10 text-center bg-background">
      <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
      <h3 className="font-semibold">Nenhum pedido ainda</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Quando um cliente finalizar o carrinho pelo WhatsApp, o pedido aparecerá aqui.
      </p>
    </div>
  );
}
