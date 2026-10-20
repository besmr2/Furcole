-- ============================================================
-- Migración: Triggers automáticos para historial_cambios
-- Fecha: 2026-10-20
-- Mueve la responsabilidad del log desde el frontend a Postgres,
-- garantizando que todo cambio quede registrado independientemente
-- de la capa de presentación.
-- ============================================================

-- ── 1. Función genérica de auditoría ────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_auditoria_historial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  col_id      TEXT;
  entidad_val TEXT;
  actor       TEXT;
  campo_key   TEXT;
  v_ant       TEXT;
  v_nuevo     TEXT;
BEGIN
  col_id := TG_ARGV[1];

  EXECUTE 'SELECT ($1).' || quote_ident(col_id) || '::text'
    INTO entidad_val USING NEW;

  BEGIN
    EXECUTE 'SELECT ($1).user_id::text' INTO actor USING NEW;
  EXCEPTION WHEN undefined_column THEN
    actor := entidad_val;
  END;

  FOR campo_key IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name   = TG_TABLE_NAME
      AND column_name NOT IN ('created_at', 'updated_at', 'id')
  LOOP
    BEGIN
      EXECUTE 'SELECT ($1).' || quote_ident(campo_key) || '::text' INTO v_ant   USING OLD;
      EXECUTE 'SELECT ($1).' || quote_ident(campo_key) || '::text' INTO v_nuevo USING NEW;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;

    IF v_ant IS DISTINCT FROM v_nuevo THEN
      INSERT INTO public.historial_cambios
        (entidad, entidad_id, campo, valor_anterior, valor_nuevo, realizado_por)
      VALUES
        (TG_ARGV[0], entidad_val, campo_key,
         CASE WHEN v_ant IS NOT NULL THEN to_json(v_ant)::jsonb ELSE NULL END,
         to_json(v_nuevo)::jsonb,
         actor);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- ── 2. Función para INSERT (registro inicial) ────────────────────────────────
CREATE OR REPLACE FUNCTION fn_auditoria_registro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  col_id      TEXT;
  entidad_val TEXT;
  actor       TEXT;
BEGIN
  col_id := TG_ARGV[1];

  EXECUTE 'SELECT ($1).' || quote_ident(col_id) || '::text'
    INTO entidad_val USING NEW;

  BEGIN
    EXECUTE 'SELECT ($1).user_id::text' INTO actor USING NEW;
  EXCEPTION WHEN undefined_column THEN
    actor := entidad_val;
  END;

  INSERT INTO public.historial_cambios
    (entidad, entidad_id, campo, valor_anterior, valor_nuevo, realizado_por)
  VALUES
    (TG_ARGV[0], entidad_val, 'registro', NULL, '"inicial"'::jsonb, actor);

  RETURN NEW;
END;
$$;

-- ── 3. Triggers en perfil_transportista ─────────────────────────────────────
DROP TRIGGER IF EXISTS trg_perfil_tp_insert ON perfil_transportista;
CREATE TRIGGER trg_perfil_tp_insert
  AFTER INSERT ON perfil_transportista
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditoria_registro('perfil_transportista', 'user_id');

DROP TRIGGER IF EXISTS trg_perfil_tp_update ON perfil_transportista;
CREATE TRIGGER trg_perfil_tp_update
  AFTER UPDATE ON perfil_transportista
  FOR EACH ROW
  WHEN (OLD IS DISTINCT FROM NEW)
  EXECUTE FUNCTION fn_auditoria_historial('perfil_transportista', 'user_id');

-- ── 4. Triggers en transportista_perfil (marketplace) ───────────────────────
DROP TRIGGER IF EXISTS trg_tp_perfil_insert ON transportista_perfil;
CREATE TRIGGER trg_tp_perfil_insert
  AFTER INSERT ON transportista_perfil
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditoria_registro('transportista_perfil', 'user_id');

DROP TRIGGER IF EXISTS trg_tp_perfil_update ON transportista_perfil;
CREATE TRIGGER trg_tp_perfil_update
  AFTER UPDATE ON transportista_perfil
  FOR EACH ROW
  WHEN (OLD IS DISTINCT FROM NEW)
  EXECUTE FUNCTION fn_auditoria_historial('transportista_perfil', 'user_id');

-- ── 5. Triggers en apoderado_perfil ─────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_apoderado_insert ON apoderado_perfil;
CREATE TRIGGER trg_apoderado_insert
  AFTER INSERT ON apoderado_perfil
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditoria_registro('apoderado_perfil', 'user_id');

DROP TRIGGER IF EXISTS trg_apoderado_update ON apoderado_perfil;
CREATE TRIGGER trg_apoderado_update
  AFTER UPDATE ON apoderado_perfil
  FOR EACH ROW
  WHEN (OLD IS DISTINCT FROM NEW)
  EXECUTE FUNCTION fn_auditoria_historial('apoderado_perfil', 'user_id');

-- ── 6. Triggers en alumnos ──────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_alumnos_insert ON alumnos;
CREATE TRIGGER trg_alumnos_insert
  AFTER INSERT ON alumnos
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditoria_registro('alumno', 'id');

DROP TRIGGER IF EXISTS trg_alumnos_update ON alumnos;
CREATE TRIGGER trg_alumnos_update
  AFTER UPDATE ON alumnos
  FOR EACH ROW
  WHEN (OLD IS DISTINCT FROM NEW)
  EXECUTE FUNCTION fn_auditoria_historial('alumno', 'id');

-- ── 7. Triggers en solicitudes_cupo ─────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_solicitudes_update ON solicitudes_cupo;
CREATE TRIGGER trg_solicitudes_update
  AFTER UPDATE ON solicitudes_cupo
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION fn_auditoria_historial('solicitud_cupo', 'id');

-- ── 8. Triggers en cobros ───────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_cobros_update ON cobros;
CREATE TRIGGER trg_cobros_update
  AFTER UPDATE ON cobros
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION fn_auditoria_historial('cobro', 'id');

COMMENT ON FUNCTION fn_auditoria_historial() IS
  'Trigger genérico AFTER UPDATE: registra columnas modificadas en historial_cambios.';
COMMENT ON FUNCTION fn_auditoria_registro() IS
  'Trigger genérico AFTER INSERT: registra el evento de creación en historial_cambios.';
