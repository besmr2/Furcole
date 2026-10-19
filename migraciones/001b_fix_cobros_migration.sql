-- =========================================================
-- 001b_fix_cobros_migration.sql
-- Solo ejecutar este bloque (reemplaza el "do $$" que falló)
-- =========================================================

-- Migrar pagado=true → estado='pagado' usando created_at como fecha referencia
update cobros
  set estado    = 'pagado',
      pagado_at = created_at
where pagado = true
  and estado = 'pendiente';

-- Ahora sí eliminar la columna antigua
alter table cobros drop column if exists pagado;
