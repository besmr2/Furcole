-- =========================================================
-- 003_ruteo.sql  —  Sistema de Ruteo guiado
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

-- ─── 1. Tabla: ruta_alumnos ───────────────────────────────
-- Relación ordenada entre rutas y alumnos.
-- "orden" define el orden de parada (1, 2, 3…).

create table if not exists ruta_alumnos (
  id                uuid primary key default gen_random_uuid(),
  ruta_id           uuid not null references rutas(id) on delete cascade,
  alumno_id         uuid not null references alumnos(id) on delete cascade,
  orden             integer not null default 1,           -- posición en la ruta
  direccion_parada  text,                                 -- dirección específica de recogida
  referencia        text,                                 -- punto de referencia (ej: "frente al kiosko")
  activo            boolean not null default true,
  created_at        timestamptz default now(),
  constraint ruta_alumnos_unique unique (ruta_id, alumno_id)
);

-- Índices
create index if not exists idx_ruta_alumnos_ruta   on ruta_alumnos(ruta_id, orden);
create index if not exists idx_ruta_alumnos_alumno on ruta_alumnos(alumno_id);

-- ─── 2. Tabla: viajes ─────────────────────────────────────
-- Representa un viaje (trip) en curso o completado.
-- El transportista inicia el viaje, va avanzando, y lo cierra.

create table if not exists viajes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id),
  ruta_id        uuid not null references rutas(id),
  tipo           text not null check (tipo in ('ida', 'vuelta')) default 'ida',
  estado         text not null check (estado in ('en_curso', 'completado', 'cancelado')) default 'en_curso',
  iniciado_at    timestamptz default now(),
  cerrado_at     timestamptz,
  nota           text,
  created_at     timestamptz default now()
);

-- Índices
create index if not exists idx_viajes_user_id  on viajes(user_id);
create index if not exists idx_viajes_ruta_id  on viajes(ruta_id);
create index if not exists idx_viajes_estado   on viajes(estado);
create index if not exists idx_viajes_fecha    on viajes(iniciado_at desc);

-- ─── 3. Ampliar eventos_viaje con viaje_id y tipo 'proximo'/'entregado' ─────
-- Agregar columna viaje_id (opcional, para ligar eventos a un viaje guiado)
alter table eventos_viaje
  add column if not exists viaje_id uuid references viajes(id) on delete set null;

-- Agregar tipo 'proximo' (alerta al apoderado de que el bus se aproxima)
-- y 'entregado' (fin del viaje, alumno dejado en destino).
-- Necesitamos ampliar el check constraint.
-- Primero eliminamos el constraint viejo y ponemos uno nuevo:
alter table eventos_viaje drop constraint if exists eventos_viaje_tipo_check;
alter table eventos_viaje
  add constraint eventos_viaje_tipo_check
    check (tipo in ('subida', 'bajada', 'proximo', 'entregado', 'saltado'));

-- Índice para viaje_id
create index if not exists idx_eventos_viaje_id on eventos_viaje(viaje_id);

-- ─── 4. RLS en ruta_alumnos ──────────────────────────────
alter table ruta_alumnos enable row level security;

-- Transportista puede ver y gestionar alumnos de sus rutas
create policy "transportista gestiona ruta_alumnos"
  on ruta_alumnos for all
  using (
    exists (
      select 1 from rutas
      where rutas.id = ruta_alumnos.ruta_id
        and rutas.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from rutas
      where rutas.id = ruta_alumnos.ruta_id
        and rutas.user_id = auth.uid()
    )
  );

-- Apoderado puede ver en qué ruta está su alumno
create policy "apoderado ve ruta de su alumno"
  on ruta_alumnos for select
  using (
    exists (
      select 1 from alumno_apoderado aa
      where aa.alumno_id  = ruta_alumnos.alumno_id
        and aa.apoderado_user_id = auth.uid()
        and aa.activo = true
    )
  );

-- ─── 5. RLS en viajes ────────────────────────────────────
alter table viajes enable row level security;

-- Transportista ve y gestiona sus propios viajes
create policy "transportista gestiona sus viajes"
  on viajes for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Apoderado ve viajes de las rutas donde tiene alumnos
create policy "apoderado ve viajes de sus rutas"
  on viajes for select
  using (
    exists (
      select 1
      from ruta_alumnos ra
      join alumno_apoderado aa on aa.alumno_id = ra.alumno_id
      where ra.ruta_id = viajes.ruta_id
        and aa.apoderado_user_id = auth.uid()
        and aa.activo = true
    )
  );

-- ─── 6. Realtime ─────────────────────────────────────────
-- Habilitar Realtime para viajes y ruta_alumnos
alter publication supabase_realtime add table viajes;
-- eventos_viaje ya fue agregado en 002_eventos_viaje.sql
-- Si falla por duplicado, ignorar:
-- alter publication supabase_realtime add table eventos_viaje;

-- ─── 7. Verificación final ───────────────────────────────
-- Ejecutar para confirmar que todo quedó bien:
-- select tablename, rowsecurity from pg_tables
-- where tablename in ('ruta_alumnos','viajes')
-- and schemaname = 'public';
