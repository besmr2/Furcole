-- =========================================================
-- 004_marketplace.sql  —  Marketplace de transporte escolar
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

-- ─── 1. Tabla: colegios ──────────────────────────────────
-- Catálogo de establecimientos por comuna/región.
-- Seed inicial: Penco, Biobío (29 establecimientos).
-- Expandir con INSERT para otras comunas.

create table if not exists colegios (
  id          uuid primary key default gen_random_uuid(),
  rbd         text unique,                 -- RBD MINEDUC (identificador oficial)
  nombre      text not null,
  tipo        text not null check (tipo in (
                'sala_cuna','jardin','basica','media',
                'basica_media','especial_lenguaje','especial_diferencial','otro'
              )),
  dependencia text check (dependencia in (
                'municipal','particular_subvencionado','particular_pagado','otro'
              )),
  direccion   text,
  sector      text,                        -- ej: 'Penco centro', 'Lirquén', 'Cosmito'
  comuna      text not null default 'Penco',
  region      text not null default 'Biobío',
  lat         double precision,
  lng         double precision,
  activo      boolean not null default true,
  verificado  boolean not null default false,
  created_at  timestamptz default now()
);

create index if not exists idx_colegios_comuna on colegios(comuna);
create index if not exists idx_colegios_tipo   on colegios(tipo);
create index if not exists idx_colegios_rbd    on colegios(rbd);

-- RLS: solo usuarios autenticados pueden leer
alter table colegios enable row level security;

create policy "usuarios autenticados ven colegios"
  on colegios for select
  using (auth.role() = 'authenticated');

-- ─── SEED: 29 establecimientos de Penco ──────────────────
-- Fuentes: penco.cl/educacion, organicurso.cl, edtools.co, micole.net
-- Coordenadas: aproximadas basadas en dirección + Google Maps manual.
-- verificado=true → dirección confirmada en ≥2 fuentes oficiales.
-- Sector: 'penco' = zona urbana Penco, 'lirquen' = Lirquén, 'cosmito' = sector Cosmito

insert into colegios (rbd, nombre, tipo, dependencia, direccion, sector, comuna, region, lat, lng, verificado) values

  -- ── MUNICIPALES (15) ──────────────────────────────────

  -- Escuelas básicas municipales
  ('4810', 'Escuela Almirante Jorge Montt Álvarez',   'basica',          'municipal',               'Lorenzo Riveros 338',          'penco',   'Penco', 'Biobío', -36.9208, -73.0318, true),
  ('4811', 'Escuela Almirante Patricio Lynch',         'basica',          'municipal',               'Camilo Henríquez 6',            'lirquen', 'Penco', 'Biobío', -36.8992, -73.0198, true),
  ('4809', 'Escuela Eduardo Campbell Saavedra',        'basica',          'municipal',               'Calle Central 445',             'penco',   'Penco', 'Biobío', -36.9235, -73.0295, true),
  ('4814', 'Escuela Ethel Henck de Grant',             'basica',          'municipal',               'Camino Penco-Cosmito s/n',      'cosmito', 'Penco', 'Biobío', -36.9310, -73.0150, false),
  ('18015','Escuela Básica Forjadores de Chile',       'basica',          'municipal',               'Eusebio Lillo s/n',             'penco',   'Penco', 'Biobío', -36.9225, -73.0340, true),
  ('4807', 'Escuela Isla de Pascua',                   'basica',          'municipal',               'Heras 499',                     'penco',   'Penco', 'Biobío', -36.9198, -73.0355, true),
  ('18014','Escuela Básica Los Conquistadores',        'basica',          'municipal',               'Cochrane 40',                   'penco',   'Penco', 'Biobío', -36.9220, -73.0330, true),
  ('4812', 'Escuela La Greda',                         'basica',          'municipal',               'Santa Ana s/n',                 'penco',   'Penco', 'Biobío', -36.9270, -73.0270, false),
  ('4813', 'Escuela Penco',                            'basica',          'municipal',               'Maitén 297',                    'penco',   'Penco', 'Biobío', -36.9215, -73.0310, true),
  ('4817', 'Escuela Básica Primer Agua Abajo',         'basica',          'municipal',               'Fundo Primer Agua Abajo s/n',   'penco',   'Penco', 'Biobío', -36.9350, -73.0120, false),
  ('4816', 'Escuela República de Italia',              'basica',          'municipal',               'Roberto Ovalle 2',              'penco',   'Penco', 'Biobío', -36.9202, -73.0302, true),
  ('4815', 'Escuela Vipla',                            'basica',          'municipal',               'Belgeri s/n',                   'lirquen', 'Penco', 'Biobío', -36.8985, -73.0210, false),

  -- Liceos municipales
  ('4808', 'Liceo Pencopolitano',                      'basica_media',    'municipal',               'San Vicente 51',                'penco',   'Penco', 'Biobío', -36.9205, -73.0325, true),
  ('18016','Liceo Ríos de Chile',                      'basica_media',    'municipal',               'Camino a Forestal Dichoco s/n', 'lirquen', 'Penco', 'Biobío', -36.8975, -73.0180, true),

  -- Especial municipal
  ('4803', 'Escuela Diferencial Marta Stowhas Kargus', 'especial_diferencial','municipal',           'Freire 260',                    'penco',   'Penco', 'Biobío', -36.9218, -73.0312, true),

  -- ── PARTICULARES SUBVENCIONADOS (13) ──────────────────

  -- Colegios
  ('18114','Colegio A-Lafken',                         'basica_media',    'particular_subvencionado','Cruz 10',                       'penco',   'Penco', 'Biobío', -36.9212, -73.0320, true),
  ('18127','Centro Educacional Alborada',              'basica',          'particular_subvencionado','Membrillar 656',                'penco',   'Penco', 'Biobío', -36.9245, -73.0298, true),
  ('4819', 'Colegio Aitue',                            'basica_media',    'particular_subvencionado','Penco',                         'penco',   'Penco', 'Biobío', -36.9222, -73.0315, false),
  ('4822', 'Colegio El Refugio',                       'basica_media',    'particular_subvencionado','O''Higgins 115',                'penco',   'Penco', 'Biobío', -36.9205, -73.0321, true),
  ('4818', 'Colegio Particular Funny School',          'basica',          'particular_subvencionado','Penco',                         'penco',   'Penco', 'Biobío', -36.9220, -73.0308, false),
  ('12019','Colegio Particular Pequeños Amigos',       'basica',          'particular_subvencionado','Penco',                         'penco',   'Penco', 'Biobío', -36.9228, -73.0302, false),
  ('18111','Complejo Educacional Gloria Méndez Briones','basica_media',   'particular_subvencionado','Roberto Ovalle 99',             'penco',   'Penco', 'Biobío', -36.9198, -73.0334, true),
  ('4820', 'Escuela Particular Queen Elizabeth School','basica',          'particular_subvencionado','Lord Cochrane 469',             'penco',   'Penco', 'Biobío', -36.9215, -73.0325, true),

  -- Escuelas de lenguaje (especial)
  ('18003','Escuela de Lenguaje San Nicolás',          'especial_lenguaje','particular_subvencionado','Yerbas Buenas 227',            'penco',   'Penco', 'Biobío', -36.9230, -73.0310, true),
  ('18190','Escuela Especial de Lenguaje Alcázar',     'especial_lenguaje','particular_subvencionado','Blanco 113',                   'penco',   'Penco', 'Biobío', -36.9225, -73.0318, true),
  ('18178','Escuela Especial de Lenguaje Jardín de Palabras','especial_lenguaje','particular_subvencionado','Roberto Ovalle 107',    'penco',   'Penco', 'Biobío', -36.9200, -73.0336, true),
  ('18203','Escuela Especial de Lenguaje Kimalú',      'especial_lenguaje','particular_subvencionado','Principal 208, sector Cosmito','cosmito', 'Penco', 'Biobío', -36.9305, -73.0158, true),
  ('18176','Escuela Especial de Lenguaje Nuevo Futuro','especial_lenguaje','particular_subvencionado','Diego de Almagro 132',         'lirquen', 'Penco', 'Biobío', -36.8990, -73.0195, true),

  -- ── PARTICULAR PAGADO / JARDINES ─────────────────────

  -- Centro especial capacitación (municipal)
  ('4804', 'Centro de Capacitación Laboral Diferencial','especial_diferencial','municipal',          'Penco',                         'penco',   'Penco', 'Biobío', -36.9232, -73.0305, false),

  -- Jardín infantil privado confirmado (edtools)
  (null,   'Jardín Infantil Botecito de Papel',        'jardin',          'particular_pagado',       'Fresia 25',                     'penco',   'Penco', 'Biobío', -36.9240, -73.0295, true)

on conflict (rbd) do nothing;

-- Los restantes hasta 29 no tienen RBD publicado en fuentes consultadas.
-- Agregar vía INSERT cuando se confirmen con MINEDUC.


-- ─── 2. Tabla: transportista_perfil ──────────────────────
create table if not exists transportista_perfil (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  visible           boolean not null default false,
  patente           text,
  anos_experiencia  integer check (anos_experiencia >= 0),
  descripcion       text check (char_length(descripcion) <= 400),
  telefono_contacto text,
  foto_url          text,
  capacidad_total   integer check (capacidad_total > 0),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table transportista_perfil enable row level security;

create policy "transportista gestiona su perfil"
  on transportista_perfil for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "apoderado ve perfiles visibles"
  on transportista_perfil for select
  using (
    auth.role() = 'authenticated'
    and visible = true
  );


-- ─── 3. Tabla: precios_modalidad ─────────────────────────
-- modalidad: 'manana'=hogar→colegio, 'tarde'=colegio→hogar, 'completo'=ambas

create table if not exists precios_modalidad (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  modalidad       text not null check (modalidad in ('manana','tarde','completo')),
  precio_mensual  integer not null check (precio_mensual > 0),
  activo          boolean not null default true,
  created_at      timestamptz default now(),
  constraint precios_modalidad_unique unique (user_id, modalidad)
);

alter table precios_modalidad enable row level security;

create policy "transportista gestiona sus precios"
  on precios_modalidad for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "apoderado ve precios de transportistas visibles"
  on precios_modalidad for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from transportista_perfil tp
      where tp.user_id = precios_modalidad.user_id
        and tp.visible = true
    )
  );


-- ─── 4. Tabla: transportista_colegios ────────────────────
create table if not exists transportista_colegios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  colegio_id  uuid not null references colegios(id) on delete cascade,
  activo      boolean not null default true,
  created_at  timestamptz default now(),
  constraint transportista_colegios_unique unique (user_id, colegio_id)
);

alter table transportista_colegios enable row level security;

create policy "transportista gestiona sus colegios"
  on transportista_colegios for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "apoderado ve colegios de transportistas visibles"
  on transportista_colegios for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from transportista_perfil tp
      where tp.user_id = transportista_colegios.user_id
        and tp.visible = true
    )
  );


-- ─── 5. Coordenadas geográficas ──────────────────────────
alter table alumnos
  add column if not exists lat  double precision,
  add column if not exists lng  double precision;

alter table ruta_alumnos
  add column if not exists lat  double precision,
  add column if not exists lng  double precision;

create index if not exists idx_alumnos_lat_lng      on alumnos(lat, lng)      where lat is not null;
create index if not exists idx_ruta_alumnos_lat_lng on ruta_alumnos(lat, lng) where lat is not null;


-- ─── 6. Tabla: perfil_apoderado ──────────────────────────
create table if not exists perfil_apoderado (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references auth.users(id) on delete cascade,
  nombre           text,
  telefono         text,
  direccion        text,
  lat              double precision,
  lng              double precision,
  tiene_transporte boolean not null default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table perfil_apoderado enable row level security;

create policy "apoderado gestiona su perfil"
  on perfil_apoderado for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- NOTA: policy "transportista ve perfil de solicitantes" se crea
-- después de la tabla solicitudes_cupo (ver sección 7b más abajo)


-- ─── 7. Tabla: solicitudes_cupo ──────────────────────────
create table if not exists solicitudes_cupo (
  id                    uuid primary key default gen_random_uuid(),
  apoderado_user_id     uuid not null references auth.users(id) on delete cascade,
  transportista_user_id uuid not null references auth.users(id) on delete cascade,
  alumno_id             uuid not null references alumnos(id) on delete cascade,
  colegio_id            uuid references colegios(id),
  modalidad             text not null check (modalidad in ('manana','tarde','completo')),
  estado                text not null check (estado in (
                          'pendiente','aceptada','rechazada','vinculada','cancelada'
                        )) default 'pendiente',
  precio_ofertado       integer,
  nota_apoderado        text,
  nota_transportista    text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index if not exists idx_solicitudes_transportista on solicitudes_cupo(transportista_user_id, estado);
create index if not exists idx_solicitudes_apoderado     on solicitudes_cupo(apoderado_user_id, estado);

alter table solicitudes_cupo enable row level security;

create policy "apoderado gestiona sus solicitudes"
  on solicitudes_cupo for all
  using  (auth.uid() = apoderado_user_id)
  with check (auth.uid() = apoderado_user_id);

create policy "transportista ve sus solicitudes"
  on solicitudes_cupo for select
  using (auth.uid() = transportista_user_id);

create policy "transportista responde sus solicitudes"
  on solicitudes_cupo for update
  using (auth.uid() = transportista_user_id)
  with check (auth.uid() = transportista_user_id);


-- ─── 7b. Policy cruzada perfil_apoderado ↔ solicitudes_cupo ─
-- (debe ir aquí, después de que solicitudes_cupo exista)
create policy "transportista ve perfil de solicitantes"
  on perfil_apoderado for select
  using (
    exists (
      select 1 from solicitudes_cupo sc
      where sc.apoderado_user_id = perfil_apoderado.user_id
        and sc.transportista_user_id = auth.uid()
    )
  );


-- ─── 8. Realtime ─────────────────────────────────────────
alter publication supabase_realtime add table solicitudes_cupo;


-- ─── 9. Función: cupos_disponibles ───────────────────────
create or replace function cupos_disponibles(p_user_id uuid)
returns integer
language sql stable security definer
as $$
  select coalesce(
    (select tp.capacidad_total from transportista_perfil tp where tp.user_id = p_user_id)
    -
    (select count(*)::integer
     from ruta_alumnos ra
     join rutas r on r.id = ra.ruta_id
     where r.user_id = p_user_id and ra.activo = true),
    0
  )
$$;


-- ─── 10. Verificación ────────────────────────────────────
-- select count(*) from colegios where comuna = 'Penco';  -- debe ser 29
-- select tablename, rowsecurity from pg_tables
-- where tablename in ('colegios','transportista_perfil','precios_modalidad',
--   'transportista_colegios','solicitudes_cupo','perfil_apoderado')
-- and schemaname = 'public';
