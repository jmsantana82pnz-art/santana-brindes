# Instalação White Label

Fluxo para instalar o catálogo em um Supabase novo do cliente.

## 1. Criar projeto Supabase

Crie um projeto novo em https://supabase.com. Anote:

- `Project URL`
- `Publishable key` (anon)
- `Service role key` (secret)

## 2. Rodar o schema

No SQL Editor do Supabase, cole e execute o conteúdo de `supabase/schema.sql`.

O schema cria:

- Todas as tabelas do catálogo, com RLS ativa e policies.
- Roles (`admin`, `editor`, `viewer`) e função `has_role()`.
- Triggers de auditoria, estoque, rating e numeração de pedidos.
- **Storage buckets públicos**: `logos`, `favicons`, `banners`, `product-images`, `pages`.
- Policies de storage:
  - **SELECT público** — qualquer visitante lê as imagens.
  - **INSERT/UPDATE/DELETE** — apenas usuários autenticados com role `admin` ou `editor`.

## 3. Configurar variáveis do app

No `.env` do projeto:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 4. Criar o primeiro admin

- Acesse `/auth` da loja.
- Cadastre uma conta com email/senha.
- O trigger `handle_new_user` promove o **primeiro** usuário cadastrado a `admin` automaticamente.
- Logins posteriores entram como usuário comum até serem promovidos pelo admin.

## 5. Testar upload

1. Entre em `/admin/loja`.
2. Envie logo/favicon/banner.
3. A imagem aparece imediatamente na loja pública.

Se a imagem **não** aparecer publicamente, ver seção **Troubleshooting** abaixo.

---

## Troubleshooting

### "Imagem quebrada" após upload

Sintoma: upload funciona, mas a imagem exibida na loja pública aparece como ícone quebrado.

Causa: bucket ficou como `public = false`.

Diagnóstico:

```sql
SELECT id, public FROM storage.buckets
WHERE id IN ('logos','favicons','banners','product-images','pages');
```

Correção (roda idempotente no SQL Editor):

```sql
UPDATE storage.buckets SET public = true
WHERE id IN ('logos','favicons','banners','product-images','pages');
```

### Bloqueio "public_buckets_blocked"

Sintoma: comandos de storage falham com `public_buckets_blocked`.

Causa: workspace gerenciado (ex.: Lovable Cloud) bloqueia buckets públicos por política de plataforma. **Não acontece em Supabase próprio do cliente.**

Correção (apenas no ambiente gerenciado):

- Workspace Settings → Privacy & Security → habilitar "Allow public buckets" (requer admin/owner do workspace).

Em instalação white label num Supabase novo, esse bloqueio não existe e o `schema.sql` cria os buckets públicos direto.

### Upload retorna "new row violates row-level security"

Causa: usuário não tem role `admin` nem `editor`.

Correção: um admin existente precisa promover o usuário:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<uuid-do-usuario>', 'editor');
```

---

## O que NÃO é automatizado pelo SQL

O `schema.sql` cobre 100% da estrutura e das policies. Restam apenas passos externos ao banco:

- Preencher `.env` do app com URL e chaves do projeto Supabase.
- (Opcional) Configurar provedores OAuth no painel Supabase (Auth → Providers).
- (Opcional) Configurar SMTP/email templates no painel Supabase se quiser emails de auth customizados.

Nenhum ajuste manual de **storage** é necessário em instalação limpa.
