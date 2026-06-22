-- ============================================================
-- TODOS PROTEGIDOS — Manual do Consultor (orientações editáveis)
-- Leitura: todos do tenant. Escrita (criar/editar/excluir): só admin/presidente.
-- Rode no SQL Editor após o schema.sql. Seguro rodar mais de uma vez.
-- ============================================================
create table if not exists public.manual (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  titulo     text not null,
  conteudo   text not null default '',
  ordem      bigint not null default 0,
  created_at timestamptz not null default now()
);
alter table public.manual enable row level security;

-- preenche tenant_id automaticamente no insert (reaproveita a função do schema)
drop trigger if exists set_tenant_manual on public.manual;
create trigger set_tenant_manual before insert on public.manual
  for each row execute function public.set_tenant_id();

-- leitura: só o próprio tenant (superadmin vê todos)
drop policy if exists "manual_read" on public.manual;
create policy "manual_read" on public.manual
  for select using (tenant_id = public.current_tenant_id() or public.is_superadmin());

-- escrita: só admin/presidente do tenant
drop policy if exists "manual_write" on public.manual;
create policy "manual_write" on public.manual
  for all using (public.is_admin() and tenant_id = public.current_tenant_id())
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

-- Conteúdo inicial: Diretriz de Atendimento aos Associados (tenant 'matriz')
do $$
declare t uuid;
begin
  select id into t from public.tenants where slug = 'matriz';
  if t is null then return; end if;
  if not exists (select 1 from public.manual where tenant_id = t and titulo = 'Diretriz de Atendimento aos Associados') then
    insert into public.manual (tenant_id, titulo, conteudo, ordem) values (t,
      'Diretriz de Atendimento aos Associados',
'Sempre que um associado entrar em contato com o consultor solicitando informações, suporte ou acionamento relacionado à assistência 24 horas ou sinistro, o consultor deverá orientá-lo a entrar em contato diretamente com a Central de Atendimento da Todos Protegidos, por meio do telefone 0800. É importante informar ao associado que a equipe especializada fornecerá todas as orientações necessárias, garantindo maior agilidade, precisão e qualidade no atendimento.

Nos casos em que o associado buscar informações sobre eventos já registrados, tais como sinistros, colisões, roubos, furtos ou demais ocorrências em análise, o consultor deverá direcioná-lo para o canal específico do Setor de Eventos. Dessa forma, as informações serão prestadas pela área responsável, assegurando maior fidelidade, atualização e detalhamento sobre o andamento e as particularidades de cada caso.

O direcionamento correto dos atendimentos contribui para a eficiência dos processos, reduz retrabalhos e garante uma experiência mais segura e satisfatória ao associado.

Orientação resumida:
• Assistência 24h e abertura de sinistros: encaminhar para o 0800 da Todos Protegidos.
• Informações sobre processos já existentes (colisão, roubo, furto, indenização e demais eventos): encaminhar para o Setor de Eventos.
• Evitar repassar informações sem validação da área responsável, garantindo a precisão das informações fornecidas ao associado.',
      1);
  end if;
end $$;
