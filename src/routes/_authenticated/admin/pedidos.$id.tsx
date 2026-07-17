import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getOrder, updateOrderStatus, deleteOrder } from "@/lib/orders.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ChevronLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/pedidos/$id")({
  component: OrderDetail,
});

const STATUS = [
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

function OrderDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getFn = useServerFn(getOrder);
  const updFn = useServerFn(updateOrderStatus);
  const delFn = useServerFn(deleteOrder);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => getFn({ data: { id } }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!data?.order) return <p>Pedido não encontrado.</p>;

  const { order, items, events } = data as any;
  const phone = order.customer?.phone ? String(order.customer.phone).replace(/\D/g, "") : null;
  const waLink = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(order.whatsapp_message || `Olá ${order.customer?.name ?? ""}, sobre o pedido #${order.number}...`)}`
    : null;

  async function change(s: string) {
    try {
      await updFn({ data: { id, status: s } });
      toast.success("Status atualizado");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function remove() {
    if (!confirm("Excluir pedido?")) return;
    await delFn({ data: { id } });
    toast.success("Pedido excluído");
    navigate({ to: "/admin/pedidos" });
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <Link to="/admin/pedidos" className="text-sm text-muted-foreground flex items-center gap-1">
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Pedido #{order.number}</h1>
          <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString("pt-BR")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={order.status} onValueChange={change}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {waLink && (
            <Button asChild variant="outline">
              <a href={waLink} target="_blank" rel="noreferrer">
                <WhatsAppIcon className="h-4 w-4 mr-1" /> WhatsApp
              </a>
            </Button>
          )}
          <Button variant="ghost" onClick={remove}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><span className="text-muted-foreground">Nome:</span> {order.customer?.name ?? "—"}</div>
            <div><span className="text-muted-foreground">Telefone:</span> {order.customer?.phone ?? "—"}</div>
            <div><span className="text-muted-foreground">E-mail:</span> {order.customer?.email ?? "—"}</div>
            {order.customer?.address?.city && (
              <div><span className="text-muted-foreground">Cidade:</span> {order.customer.address.city}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Canal</span><span>{order.channel ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(order.subtotal_cents)}</span></div>
            <div className="flex justify-between font-semibold pt-1 border-t"><span>Total</span><span>{fmt(order.total_cents)}</span></div>
            {order.notes && <div className="pt-2"><span className="text-muted-foreground">Obs.:</span> {order.notes}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Itens</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="pb-2">Produto</th><th className="pb-2">Qtd</th><th className="pb-2 text-right">Valor</th></tr>
            </thead>
            <tbody>
              {items.map((i: any) => (
                <tr key={i.id} className="border-t">
                  <td className="py-2">{i.name_snapshot}</td>
                  <td className="py-2">{i.qty}</td>
                  <td className="py-2 text-right">{fmt(i.unit_price_cents * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem eventos.</p>
          ) : (
            <ul className="text-sm divide-y">
              {events.map((e: any) => (
                <li key={e.id} className="py-2">
                  <div className="font-medium">{e.event}</div>
                  <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</div>
                  {e.payload?.status && <div className="text-xs">Status: {e.payload.status}</div>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
