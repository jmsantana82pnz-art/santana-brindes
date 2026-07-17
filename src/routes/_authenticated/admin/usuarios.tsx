import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listStaff, updateUserRole } from "@/lib/admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: UsersPage,
});

const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Somente leitura" },
  { value: "none", label: "Sem permissão" },
] as const;

function UsersPage() {
  const qc = useQueryClient();
  const list = useServerFn(listStaff);
  const setRole = useServerFn(updateUserRole);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: () => list(),
  });

  const [saving, setSaving] = useState<string | null>(null);

  const onChange = async (userId: string, role: "admin" | "editor" | "viewer" | "none") => {
    setSaving(userId);
    try {
      await setRole({ data: { user_id: userId, role } });
      toast.success("Permissão atualizada");
      qc.invalidateQueries({ queryKey: ["admin", "staff"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários da equipe</h1>
        <p className="text-sm text-muted-foreground">
          Defina quem pode administrar a loja. Novas contas começam sem permissão.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : (data as any[]).length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum usuário cadastrado ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(data as any[]).map((u: any) => (
            <Card key={u.id}>
              <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{u.full_name || u.email}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </div>
                {u.role && (
                  <Badge variant="secondary" className="text-[10px]">{u.role}</Badge>
                )}
                <Select
                  value={u.role ?? "none"}
                  onValueChange={(v) => onChange(u.id, v as "admin" | "editor" | "viewer" | "none")}
                  disabled={saving === u.id}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
