-- =========================================================
-- 002_eventos_viaje.sql
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

-- ─── Tabla: eventos_viaje ─────────────────────────────────
-- Registra subida y bajada de cada alumno en tiempo real.
-- El transportista inserta, el apoderado lee vía Realtime.

create table if not exists eventos_viaje (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id),   -- transportista
  alumno_id     uuid not null references alumnos(id) on delete cascade,
  tipo          text not null check (tipo in ('subida', 'bajada')),
  ruta_id       uuid references rutas(id),                  -- opcional
  nota          text,                                        -- observación libre
  created_at    timestamptz default now()
);

-- ─── RLS ──────────────────────────────────────────────────
alter table eventos_viaje enable row level security;

-- Transportista puede insertar y ver sus propios eventos
create policy "transportista gestiona sus eventos"
  on eventos_viaje for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Apoderado ve eventos de sus alumnos vinculados
create policy "apoderado ve eventos de sus alumnos"
  on eventos_viaje for select
  using (
    exists (
      select 1 from alumno_apoderado aa
      where aa.alumno_id  = eventos_viaje.alumno_id
        and aa.apoderado_user_id = auth.uid()
        and aa.activo     = true
    )
  );

-- ─── Índices ──────────────────────────────────────────────
create index if not exists idx_eventos_alumno_id  on eventos_viaje(alumno_id);
create index if not exists idx_eventos_created_at on eventos_viaje(created_at desc);
create index if not exists idx_eventos_user_id    on eventos_viaje(user_id);

-- ─── Realtime: habilitar para la tabla ───────────────────
-- Supabase requiere que la tabla esté en la publication "supabase_realtime"
-- para que los clientes puedan suscribirse con .on('postgres_changes',...).
-- Ejecutar solo si no está ya incluida:
alter publication supabase_realtime add table eventos_viaje;
