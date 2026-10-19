-- =========================================================
-- 005_precios_publicos.sql
-- Agrega columna precios_publicos a transportista_perfil
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

alter table transportista_perfil
  add column if not exists precios_publicos boolean not null default false;

-- Verificación:
-- select user_id, visible, precios_publicos from transportista_perfil;
