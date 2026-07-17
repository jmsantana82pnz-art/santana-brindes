import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listAutoMessages, saveAutoMessage, deleteAutoMessage } from "@/lib/orders.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/mensagens")({
  component: MensagensPage,
});

const TRIGGERS = [
  { key: "new_order", label: "Novo pedido" },
  { key: "order_followup", label: "Acompanhamento" },
  { key: "order_completed", label: "Finalização" },
  { key: "abandoned_cart", label: "Carrinho abandonado" },
];

function MensagensPage() {
  const listFn = useServerFn(listAutoMessages);
  const saveFn = useServerFn(saveAutoMessage);
  const delFn = useServerFn(deleteAutoMessage);
  const { data, refetch, isLoading } = useQuery({ queryKey: ["auto-messages"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<any | null>(null);

  async function save() {
    try {
      await saveFn({ data: editing });
      toast.success("Salvo");
      setEditing(null);
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir mensagem?")) return;
    await delFn({ data: { id } });
    refetch();
  }

  const list = (data ?? []) as any[];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mensagens automáticas</h1>
          <p className="text-sm text-muted-foreground">
            Modelos usados no envio de WhatsApp. Variáveis: <code>{"{{customer_name}}"}</code>, <code>{"{{order_number}}"}</code>, <code>{"{{total}}"}</code>, <code>{"{{product_name}}"}</code>.
          </p>
        </div>
        <Button onClick={() => setEditing({ trigger: "new_order", template: "", is_active: true })}>
          <Plus className="h-4 w-4 mr-1" /> Nova mensagem
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2" />
            Nenhum modelo criado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((m) => (
            <Card key={m.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">
                  {TRIGGERS.find((t) => t.key === m.trigger)?.label ?? m.trigger}
                </CardTitle>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing({ ...m })}>Editar</Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(m.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line text-muted-foreground">{m.template}</p>
                <p className="text-xs mt-2">{m.is_active ? "Ativa" : "Desativada"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editing.id ? "Editar" : "Nova"} mensagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Gatilho</label>
              <Select value={editing.trigger} onValueChange={(v) => setEditing({ ...editing, trigger: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Mensagem</label>
              <Textarea
                rows={6}
                value={editing.template}
                onChange={(e) => setEditing({ ...editing, template: e.target.value })}
                placeholder="Olá {{customer_name}}, seu pedido #{{order_number}}..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editing.is_active}
                onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
              />
              <span className="text-sm">Ativa</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={save}>Salvar</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
