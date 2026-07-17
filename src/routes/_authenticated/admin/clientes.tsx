import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listCustomers, updateCustomer } from "@/lib/orders.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  component: ClientesPage,
});

function fmt(c: number) {
  return "R$ " + ((c ?? 0) / 100).toFixed(2).replace(".", ",");
}
function fmtDate(s?: string) {
  return s ? new Date(s).toLocaleDateString("pt-BR") : "—";
}

function ClientesPage() {
  const listFn = useServerFn(listCustomers);
  const updFn = useServerFn(updateCustomer);
  const { data, refetch, isLoading } = useQuery({ queryKey: ["admin-customers"], queryFn: () => listFn() });
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<any>(null);

  const rows = ((data ?? []) as any[]).filter((c) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (c.name ?? "").toLowerCase().includes(s) || (c.phone ?? "").includes(s);
  });

  async function save() {
    try {
      await updFn({ data: { id: editing.id, name: editing.name, phone: editing.phone, email: editing.email } });
      toast.success("Cliente atualizado");
      setEditing(null);
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">Base de contatos e histórico de pedidos.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> {rows.length} clientes
          </CardTitle>
          <Input placeholder="Buscar por nome ou telefone" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando…</p>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2" />
              Ainda não há clientes cadastrados.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">Nome</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3">Pedidos</th>
                  <th className="p-3">Total gasto</th>
                  <th className="p-3">Último pedido</th>
                  <th className="p-3 w-40">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const wa = c.phone ? `https://wa.me/${String(c.phone).replace(/\D/g, "")}` : null;
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="p-3 font-medium">{c.name ?? "—"}</td>
                      <td className="p-3">{c.phone ?? "—"}</td>
                      <td className="p-3">{c.orders_count}</td>
                      <td className="p-3 font-semibold">{fmt(c.total_spent_cents)}</td>
                      <td className="p-3 text-xs text-muted-foreground">{fmtDate(c.last_order_at)}</td>
                      <td className="p-3 flex gap-1">
                        {wa && (
                          <Button asChild size="sm" variant="outline">
                            <a href={wa} target="_blank" rel="noreferrer">
                              <WhatsAppIcon className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setEditing({ ...c })}>
                          Editar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Telefone</label>
                <Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">E-mail</label>
                <Input value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
