-- ============================================================
-- Storage para vídeos/materiais
-- Rode no SQL Editor DEPOIS do schema.sql.
-- Cria um bucket público "midia" e as permissões:
--   • leitura pública (para o vídeo tocar no navegador)
--   • envio/edição/remoção apenas para administradores
-- ============================================================

-- 1) Bucket público
insert into storage.buckets (id, name, public)
values ('midia', 'midia', true)
on conflict (id) do nothing;

-- 2) Políticas (na tabela storage.objects)
drop policy if exists "midia_public_read" on storage.objects;
create policy "midia_public_read" on storage.objects
  for select using (bucket_id = 'midia');

drop policy if exists "midia_admin_insert" on storage.objects;
create policy "midia_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'midia' and public.is_admin());

drop policy if exists "midia_admin_update" on storage.objects;
create policy "midia_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'midia' and public.is_admin());

drop policy if exists "midia_admin_delete" on storage.objects;
create policy "midia_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'midia' and public.is_admin());

-- ============================================================
-- Observações:
-- • Os arquivos vão para a pasta "videoaulas/" dentro do bucket.
-- • O limite de tamanho/segundo padrão do projeto se aplica; para vídeos
--   grandes, ajuste em Storage > Settings (file size limit) no painel.
-- ============================================================
