-- Diapositivas de Seguridad · guardado en la nube (edición libre, sin login)
-- Crea SOLO: tablas diapo_cambios, diapo_imagenes y diapo_historial. No toca nada más del proyecto.

create table if not exists public.diapo_cambios (
  deck_id text primary key, data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), updated_by text);
alter table public.diapo_cambios enable row level security;
create policy "diapo_ver" on public.diapo_cambios for select to anon, authenticated using (true);
create policy "diapo_insertar" on public.diapo_cambios for insert to anon, authenticated with check (true);
create policy "diapo_actualizar" on public.diapo_cambios for update to anon, authenticated using (true) with check (true);

-- Imágenes en tabla propia (el storage del proyecto tiene políticas de otra app que bloquean a usuarios anónimos)
create table if not exists public.diapo_imagenes (id text primary key, deck_id text not null, data text not null, creado timestamptz not null default now(),
  constraint diapo_img_tamano check (length(data) < 3000000 and data like 'data:image/%'));
alter table public.diapo_imagenes enable row level security;
create policy "diapo_imagenes_ver" on public.diapo_imagenes for select to anon, authenticated using (true);
create policy "diapo_imagenes_subir" on public.diapo_imagenes for insert to anon, authenticated with check (true);

-- Historial: cada guardado deja la versión anterior (se conservan las últimas 300 por presentación)
create table if not exists public.diapo_historial (id bigserial primary key, deck_id text not null, data jsonb not null, guardado timestamptz not null default now());
alter table public.diapo_historial enable row level security;
create policy "diapo_historial_ver" on public.diapo_historial for select to anon, authenticated using (true);
create or replace function public.diapo_guardar_historial() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then insert into public.diapo_historial(deck_id, data) values (old.deck_id, old.data); end if;
  delete from public.diapo_historial where deck_id = new.deck_id and id not in (select id from public.diapo_historial where deck_id = new.deck_id order by id desc limit 300);
  return new;
end $$;
revoke all on function public.diapo_guardar_historial() from public, anon, authenticated;
create trigger diapo_historial_trg before update on public.diapo_cambios for each row execute function public.diapo_guardar_historial();
