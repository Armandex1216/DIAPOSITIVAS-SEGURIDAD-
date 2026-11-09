-- Diapositivas de Seguridad · guardado en la nube
-- Crea SOLO una tabla nueva (diapo_cambios) y un bucket nuevo (diapositivas).
-- No modifica ni borra nada existente del proyecto.

-- 1) Tabla: una fila por presentación con todos sus cambios
create table if not exists public.diapo_cambios (
  deck_id    text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.diapo_cambios enable row level security;

-- Ver: cualquiera (para presentar sin iniciar sesión)
drop policy if exists "diapo_ver" on public.diapo_cambios;
create policy "diapo_ver" on public.diapo_cambios
  for select to anon, authenticated using (true);

-- Guardar: solo usuarios con sesión
drop policy if exists "diapo_insertar" on public.diapo_cambios;
create policy "diapo_insertar" on public.diapo_cambios
  for insert to authenticated with check (true);

drop policy if exists "diapo_actualizar" on public.diapo_cambios;
create policy "diapo_actualizar" on public.diapo_cambios
  for update to authenticated using (true) with check (true);

-- 2) Bucket público para las imágenes pegadas en las presentaciones (máx. 5 MB, solo imágenes)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diapositivas', 'diapositivas', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "diapo_img_ver" on storage.objects;
create policy "diapo_img_ver" on storage.objects
  for select to anon, authenticated using (bucket_id = 'diapositivas');

drop policy if exists "diapo_img_subir" on storage.objects;
create policy "diapo_img_subir" on storage.objects
  for insert to authenticated with check (bucket_id = 'diapositivas');

drop policy if exists "diapo_img_cambiar" on storage.objects;
create policy "diapo_img_cambiar" on storage.objects
  for update to authenticated using (bucket_id = 'diapositivas') with check (bucket_id = 'diapositivas');
