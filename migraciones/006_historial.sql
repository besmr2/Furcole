-- =========================================================
-- 006_historial.sql
-- Tabla de auditoría de cambios para transportistas,
-- apoderados y alumnos
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

-- ── 1. Tabla historial_cambios ───────────────────────────
create table if not exists historial_cambios (
  id            bigint generated always as identity primary key,
  entidad       text        not null, -- 'transportista' | 'apoderado' | 'alumno'
  entidad_id    uuid        not null, -- user_id del transportista/apoderado, o id del alumno
  campo         text        not null, -- qué cambió: 'colegio', 'patente', 'visible', etc.
  valor_anterior text,
  valor_nuevo    text,
  realizado_por  uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- ── 2. Índices ───────────────────────────────────────────
create index if not exists historial_entidad_idx
  on historial_cambios (entidad, entidad_id, created_at desc);

-- ── 3. RLS ───────────────────────────────────────────────
alter table historial_cambios enable row level security;

-- El propio usuario ve su historial
create policy "usuario ve su historial"
  on historial_cambios for select
  using (realizado_por = auth.uid() or entidad_id = auth.uid());

-- Solo el sistema (service_role) puede insertar
-- Las inserciones se hacen desde Edge Functions o triggers
create policy "service inserta historial"
  on historial_cambios for insert
  with check (true); -- se refina con service_role en producción

-- ── 4. Tabla transportista_verificacion ──────────────────
-- Estado de verificación RNTP por patente
create table if not exists transportista_verificacion (
  id            bigint generated always as identity primary key,
  user_id       uuid references auth.users(id) on delete cascade unique,
  patente       text        not null,
  estado        text        not null default 'pendiente',
  -- 'pendiente' | 'verificado' | 'no_encontrado' | 'error'
  datos_rntp    jsonb,      -- respuesta cruda del MTT (si disponible)
  verificado_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table transportista_verificacion enable row level security;

create policy "transportista ve su verificacion"
  on transportista_verificacion for select
  using (user_id = auth.uid());

create policy "transportista inserta su verificacion"
  on transportista_verificacion for insert
  with check (user_id = auth.uid());

create policy "transportista actualiza su verificacion"
  on transportista_verificacion for update
  using (user_id = auth.uid());

-- ── 5. Publicación realtime ──────────────────────────────
alter publication supabase_realtime add table historial_cambios;
alter publication supabase_realtime add table transportista_verificacion;

-- Verificación:
-- select * from historial_cambios order by created_at desc limit 10;
-- select * from transportista_verificacion;
