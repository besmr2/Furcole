-- =========================================================
-- 001_columnas_faltantes.sql
-- Ejecutar en Supabase → SQL Editor (en orden)
-- =========================================================

-- ─── 1. Columnas en tablas existentes ────────────────────

-- alumno_key: token único para link de registro de apoderados
alter table alumnos
  add column if not exists alumno_key text unique;

-- cobros: estado texto + token Flow + fecha de pago
alter table cobros
  add column if not exists flow_token  text,
  add column if not exists estado      text not null default 'pendiente'
    check (estado in ('pendiente','pagado','anulado','error')),
  add column if not exists pagado_at   timestamptz;

-- Si la columna "pagado" (boolean antigua) existe, migrar datos antes de eliminar
-- Solo ejecutar si la columna existe:
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'cobros' and column_name = 'pagado'
  ) then
    update cobros set estado = 'pagado', pagado_at = updated_at
    where pagado = true and estado = 'pendiente';
    alter table cobros drop column pagado;
  end if;
end $$;


-- ─── 2. Tabla: apoderado_perfil ───────────────────────────

create table if not exists apoderado_perfil (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nombre      text not null,
  email       text not null,
  telefono    text,
  parentesco  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint apoderado_perfil_user_id_key unique (user_id)
);

-- Actualizar updated_at automáticamente
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_apoderado_perfil_updated_at on apoderado_perfil;
create trigger trg_apoderado_perfil_updated_at
  before update on apoderado_perfil
  for each row execute function set_updated_at();


-- ─── 3. Tabla: alumno_apoderado (N:M) ────────────────────

create table if not exists alumno_apoderado (
  id                  uuid primary key default gen_random_uuid(),
  alumno_id           uuid not null references alumnos(id) on delete cascade,
  apoderado_user_id   uuid not null references auth.users(id) on delete cascade,
  parentesco          text,
  activo              boolean not null default true,
  created_at          timestamptz default now(),
  constraint alumno_apoderado_unique unique (alumno_id, apoderado_user_id)
);


-- ─── 4. Tabla: deudas_pendientes ─────────────────────────

create table if not exists deudas_pendientes (
  id                    uuid primary key default gen_random_uuid(),
  alumno_id             uuid not null references alumnos(id) on delete cascade,
  alumno_nombre         text not null,
  -- transportista acreedor (al que se le debe)
  acreedor_user_id      uuid not null references auth.users(id),
  monto_original        numeric(10,2) not null,
  monto_pendiente       numeric(10,2) not null,
  cuota_mensual         numeric(10,2) not null,  -- 20% del monto mensual del nuevo servicio
  saldada               boolean not null default false,
  flow_token            text,                    -- último token Flow para cuota
  ultimo_pago           timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

drop trigger if exists trg_deudas_updated_at on deudas_pendientes;
create trigger trg_deudas_updated_at
  before update on deudas_pendientes
  for each row execute function set_updated_at();


-- ─── 5. RLS en todas las tablas nuevas ───────────────────

-- apoderado_perfil
alter table apoderado_perfil enable row level security;

create policy "apoderado ve su propio perfil"
  on apoderado_perfil for select
  using (auth.uid() = user_id);

create policy "apoderado edita su propio perfil"
  on apoderado_perfil for all
  using (auth.uid() = user_id);

-- alumno_apoderado
alter table alumno_apoderado enable row level security;

create policy "apoderado ve sus vínculos"
  on alumno_apoderado for select
  using (auth.uid() = apoderado_user_id);

-- El transportista (dueño del alumno) puede ver quién es apoderado de sus alumnos
create policy "transportista ve apoderados de sus alumnos"
  on alumno_apoderado for select
  using (
    exists (
      select 1 from alumnos
      where alumnos.id = alumno_apoderado.alumno_id
        and alumnos.user_id = auth.uid()
    )
  );

-- Solo service_role puede insertar (vía registro del portal)
-- El apoderado se inserta a sí mismo durante el registro
create policy "apoderado se auto-vincula"
  on alumno_apoderado for insert
  with check (auth.uid() = apoderado_user_id);

-- deudas_pendientes
alter table deudas_pendientes enable row level security;

-- Apoderado ve deudas de sus alumnos vinculados
create policy "apoderado ve deudas de sus alumnos"
  on deudas_pendientes for select
  using (
    exists (
      select 1 from alumno_apoderado aa
      where aa.alumno_id = deudas_pendientes.alumno_id
        and aa.apoderado_user_id = auth.uid()
        and aa.activo = true
    )
  );

-- Transportista acreedor ve sus deudas por cobrar
create policy "transportista acreedor ve sus deudas"
  on deudas_pendientes for select
  using (acreedor_user_id = auth.uid());

-- Transportista que tiene al alumno puede crear deuda (al cambiar de transportista)
create policy "transportista registra deuda"
  on deudas_pendientes for insert
  with check (acreedor_user_id = auth.uid());

-- Service role puede actualizar (via webhook al recibir pago de cuota)
-- Los updates de saldo los hace el service_role desde el webhook, no el cliente


-- ─── 6. RLS adicional en cobros (apoderados) ─────────────

-- Apoderado puede ver cobros de sus alumnos vinculados
drop policy if exists "apoderado ve cobros de sus alumnos" on cobros;
create policy "apoderado ve cobros de sus alumnos"
  on cobros for select
  using (
    exists (
      select 1 from alumno_apoderado aa
      where aa.alumno_id = cobros.alumno_id
        and aa.apoderado_user_id = auth.uid()
        and aa.activo = true
    )
  );


-- ─── 7. Índices de rendimiento ────────────────────────────

create index if not exists idx_alumnos_alumno_key        on alumnos(alumno_key);
create index if not exists idx_cobros_flow_token         on cobros(flow_token);
create index if not exists idx_cobros_alumno_id          on cobros(alumno_id);
create index if not exists idx_alumno_apoderado_alumno   on alumno_apoderado(alumno_id);
create index if not exists idx_alumno_apoderado_apoderado on alumno_apoderado(apoderado_user_id);
create index if not exists idx_deudas_alumno_id          on deudas_pendientes(alumno_id);
create index if not exists idx_deudas_pendientes_token   on deudas_pendientes(flow_token);


-- ─── 8. Tabla perfil_transportista (si no existe) ────────
-- (probablemente ya la creaste, incluida por completitud)

create table if not exists perfil_transportista (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  nombre              text,
  nombre_transportista text,
  telefono            text,
  email               text,
  foto_url            text,
  -- Vehículo
  marca               text,
  modelo              text,
  año                 integer,
  patente             text,
  color               text,
  capacidad           integer,
  -- MTT
  mtt_verificado      boolean default false,
  mtt_fecha           date,
  -- Meta
  experiencia_años    integer,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  constraint perfil_transportista_user_id_key unique (user_id)
);

alter table perfil_transportista enable row level security;

create policy "transportista ve su propio perfil"
  on perfil_transportista for select
  using (auth.uid() = user_id);

create policy "transportista edita su propio perfil"
  on perfil_transportista for all
  using (auth.uid() = user_id);

-- Apoderados pueden ver el perfil del transportista de sus alumnos
create policy "apoderado ve perfil de su transportista"
  on perfil_transportista for select
  using (
    exists (
      select 1
      from alumno_apoderado aa
      join alumnos al on al.id = aa.alumno_id
      where aa.apoderado_user_id = auth.uid()
        and al.user_id = perfil_transportista.user_id
        and aa.activo = true
    )
  );

drop trigger if exists trg_perfil_transportista_updated_at on perfil_transportista;
create trigger trg_perfil_transportista_updated_at
  before update on perfil_transportista
  for each row execute function set_updated_at();
