-- ============================================================
-- Migración: Row Level Security completo
-- Fecha: 2026-10-20
-- Ninguna tabla pública. Cada fila solo accesible por su dueño
-- o por la Edge Function con service_role key.
-- ============================================================

-- ── HELPERS ─────────────────────────────────────────────────────────────────
-- Verifica si el JWT pertenece a un transportista registrado
CREATE OR REPLACE FUNCTION is_transportista(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfil_transportista WHERE user_id = uid
  );
$$;

-- ── colegios (lectura pública autenticada, escritura solo admin) ─────────────
ALTER TABLE colegios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "colegios_select" ON colegios;
CREATE POLICY "colegios_select" ON colegios
  FOR SELECT TO authenticated USING (true);
-- INSERT/UPDATE/DELETE solo via service_role (panel admin)

-- ── apoderado_perfil ────────────────────────────────────────────────────────
ALTER TABLE apoderado_perfil ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "apoderado_perfil_own" ON apoderado_perfil;
CREATE POLICY "apoderado_perfil_own" ON apoderado_perfil
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── perfil_transportista ────────────────────────────────────────────────────
ALTER TABLE perfil_transportista ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "perfil_tp_own"    ON perfil_transportista;
DROP POLICY IF EXISTS "perfil_tp_select" ON perfil_transportista;
-- El transportista gestiona su propio perfil operativo
CREATE POLICY "perfil_tp_own" ON perfil_transportista
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- Los apoderados pueden leer el perfil operativo de su transportista asignado
CREATE POLICY "perfil_tp_select" ON perfil_transportista
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM solicitudes_cupo sc
      WHERE sc.transportista_user_id = perfil_transportista.user_id
        AND sc.apoderado_user_id = auth.uid()
        AND sc.estado = 'aceptado'
    )
  );

-- ── transportista_perfil (marketplace) ─────────────────────────────────────
ALTER TABLE transportista_perfil ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tp_perfil_own"     ON transportista_perfil;
DROP POLICY IF EXISTS "tp_perfil_visible" ON transportista_perfil;
CREATE POLICY "tp_perfil_own" ON transportista_perfil
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- Solo perfiles visibles son buscables por apoderados
CREATE POLICY "tp_perfil_visible" ON transportista_perfil
  FOR SELECT TO authenticated
  USING (visible = true OR user_id = auth.uid());

-- ── transportista_colegios ───────────────────────────────────────────────────
ALTER TABLE transportista_colegios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tp_colegios_own"    ON transportista_colegios;
DROP POLICY IF EXISTS "tp_colegios_select" ON transportista_colegios;
CREATE POLICY "tp_colegios_own" ON transportista_colegios
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "tp_colegios_select" ON transportista_colegios
  FOR SELECT TO authenticated
  USING (activo = true OR user_id = auth.uid());

-- ── transportista_verificacion ───────────────────────────────────────────────
ALTER TABLE transportista_verificacion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tp_verif_own" ON transportista_verificacion;
CREATE POLICY "tp_verif_own" ON transportista_verificacion
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── alumnos ──────────────────────────────────────────────────────────────────
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alumnos_tp_own"    ON alumnos;
DROP POLICY IF EXISTS "alumnos_apoderado" ON alumnos;
-- Transportista ve y gestiona sus propios alumnos
CREATE POLICY "alumnos_tp_own" ON alumnos
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- Apoderado lee alumnos de su hijo (vía alumno_apoderado)
CREATE POLICY "alumnos_apoderado" ON alumnos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumno_apoderado aa
      WHERE aa.alumno_id = alumnos.id
        AND aa.apoderado_user_id = auth.uid()
    )
  );

-- ── alumno_apoderado ─────────────────────────────────────────────────────────
ALTER TABLE alumno_apoderado ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alumno_apoderado_own" ON alumno_apoderado;
DROP POLICY IF EXISTS "alumno_apoderado_tp"  ON alumno_apoderado;
CREATE POLICY "alumno_apoderado_own" ON alumno_apoderado
  FOR SELECT TO authenticated
  USING (apoderado_user_id = auth.uid());
-- Transportista ve los vínculos de sus alumnos
CREATE POLICY "alumno_apoderado_tp" ON alumno_apoderado
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumnos a
      WHERE a.id = alumno_apoderado.alumno_id
        AND a.user_id = auth.uid()
    )
  );
-- INSERT solo por el transportista (él vincula apoderados a sus alumnos)
CREATE POLICY "alumno_apoderado_insert_tp" ON alumno_apoderado
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM alumnos a
      WHERE a.id = alumno_apoderado.alumno_id
        AND a.user_id = auth.uid()
    )
  );

-- ── solicitudes_cupo ─────────────────────────────────────────────────────────
ALTER TABLE solicitudes_cupo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sol_apoderado" ON solicitudes_cupo;
DROP POLICY IF EXISTS "sol_tp"        ON solicitudes_cupo;
-- Apoderado crea y lee sus propias solicitudes
CREATE POLICY "sol_apoderado" ON solicitudes_cupo
  FOR ALL TO authenticated
  USING  (apoderado_user_id = auth.uid())
  WITH CHECK (apoderado_user_id = auth.uid());
-- Transportista lee y actualiza solicitudes que le llegan
CREATE POLICY "sol_tp" ON solicitudes_cupo
  FOR ALL TO authenticated
  USING (transportista_user_id = auth.uid())
  WITH CHECK (transportista_user_id = auth.uid());

-- ── cobros ────────────────────────────────────────────────────────────────────
ALTER TABLE cobros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cobros_tp"       ON cobros;
DROP POLICY IF EXISTS "cobros_apoderado" ON cobros;
-- Transportista crea y gestiona cobros
CREATE POLICY "cobros_tp" ON cobros
  FOR ALL TO authenticated
  USING  (transportista_user_id = auth.uid())
  WITH CHECK (transportista_user_id = auth.uid());
-- Apoderado lee sus propios cobros
CREATE POLICY "cobros_apoderado" ON cobros
  FOR SELECT TO authenticated
  USING (apoderado_user_id = auth.uid());

-- ── pagos_flow ────────────────────────────────────────────────────────────────
ALTER TABLE pagos_flow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pagos_tp"        ON pagos_flow;
DROP POLICY IF EXISTS "pagos_apoderado" ON pagos_flow;
CREATE POLICY "pagos_tp" ON pagos_flow
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cobros c
      WHERE c.id = pagos_flow.cobro_id
        AND c.transportista_user_id = auth.uid()
    )
  );
CREATE POLICY "pagos_apoderado" ON pagos_flow
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cobros c
      WHERE c.id = pagos_flow.cobro_id
        AND c.apoderado_user_id = auth.uid()
    )
  );

-- ── rutas ─────────────────────────────────────────────────────────────────────
ALTER TABLE rutas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rutas_tp_own"    ON rutas;
DROP POLICY IF EXISTS "rutas_apoderado" ON rutas;
CREATE POLICY "rutas_tp_own" ON rutas
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "rutas_apoderado" ON rutas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ruta_alumnos ra
        JOIN alumnos a ON a.id = ra.alumno_id
        JOIN alumno_apoderado aa ON aa.alumno_id = a.id
      WHERE ra.ruta_id = rutas.id
        AND aa.apoderado_user_id = auth.uid()
    )
  );

-- ── ruta_alumnos ──────────────────────────────────────────────────────────────
ALTER TABLE ruta_alumnos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ra_tp_own" ON ruta_alumnos;
CREATE POLICY "ra_tp_own" ON ruta_alumnos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rutas r WHERE r.id = ruta_alumnos.ruta_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rutas r WHERE r.id = ruta_alumnos.ruta_id AND r.user_id = auth.uid()
    )
  );

-- ── viajes ────────────────────────────────────────────────────────────────────
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "viajes_tp_own"    ON viajes;
DROP POLICY IF EXISTS "viajes_apoderado" ON viajes;
CREATE POLICY "viajes_tp_own" ON viajes
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM rutas r WHERE r.id = viajes.ruta_id AND r.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM rutas r WHERE r.id = viajes.ruta_id AND r.user_id = auth.uid())
  );
CREATE POLICY "viajes_apoderado" ON viajes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ruta_alumnos ra
        JOIN alumno_apoderado aa ON aa.alumno_id = ra.alumno_id
      WHERE ra.ruta_id = viajes.ruta_id
        AND aa.apoderado_user_id = auth.uid()
    )
  );

-- ── eventos_viaje ─────────────────────────────────────────────────────────────
ALTER TABLE eventos_viaje ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ev_tp_own"    ON eventos_viaje;
DROP POLICY IF EXISTS "ev_apoderado" ON eventos_viaje;
CREATE POLICY "ev_tp_own" ON eventos_viaje
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM viajes v JOIN rutas r ON r.id = v.ruta_id
      WHERE v.id = eventos_viaje.viaje_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM viajes v JOIN rutas r ON r.id = v.ruta_id
      WHERE v.id = eventos_viaje.viaje_id AND r.user_id = auth.uid()
    )
  );
CREATE POLICY "ev_apoderado" ON eventos_viaje
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM viajes v
        JOIN ruta_alumnos ra ON ra.ruta_id = v.ruta_id
        JOIN alumno_apoderado aa ON aa.alumno_id = ra.alumno_id
      WHERE v.id = eventos_viaje.viaje_id
        AND aa.apoderado_user_id = auth.uid()
    )
  );

-- ── asistencia ────────────────────────────────────────────────────────────────
ALTER TABLE asistencia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "asist_tp_own"    ON asistencia;
DROP POLICY IF EXISTS "asist_apoderado" ON asistencia;
CREATE POLICY "asist_tp_own" ON asistencia
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumnos a WHERE a.id = asistencia.alumno_id AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM alumnos a WHERE a.id = asistencia.alumno_id AND a.user_id = auth.uid()
    )
  );
CREATE POLICY "asist_apoderado" ON asistencia
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumno_apoderado aa
      WHERE aa.alumno_id = asistencia.alumno_id
        AND aa.apoderado_user_id = auth.uid()
    )
  );

-- ── invitaciones ──────────────────────────────────────────────────────────────
ALTER TABLE invitaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inv_tp_own"      ON invitaciones;
DROP POLICY IF EXISTS "inv_token_valid" ON invitaciones;
-- Transportista crea y gestiona sus invitaciones
CREATE POLICY "inv_tp_own" ON invitaciones
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- Cualquier usuario autenticado puede validar un token de invitación (solo lectura)
CREATE POLICY "inv_token_valid" ON invitaciones
  FOR SELECT TO authenticated
  USING (activo = true);

-- ── historial_cambios ─────────────────────────────────────────────────────────
ALTER TABLE historial_cambios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hist_own" ON historial_cambios;
-- Solo el actor que generó el cambio puede leer su historial
CREATE POLICY "hist_own" ON historial_cambios
  FOR SELECT TO authenticated
  USING (realizado_por = auth.uid());
-- INSERT solo via service_role (triggers usan SECURITY DEFINER)

-- ── avisos ────────────────────────────────────────────────────────────────────
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "avisos_tp_own"    ON avisos;
DROP POLICY IF EXISTS "avisos_apoderado" ON avisos;
CREATE POLICY "avisos_tp_own" ON avisos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumnos a WHERE a.id = avisos.alumno_id AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM alumnos a WHERE a.id = avisos.alumno_id AND a.user_id = auth.uid()
    )
  );
CREATE POLICY "avisos_apoderado" ON avisos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumno_apoderado aa
      WHERE aa.alumno_id = avisos.alumno_id
        AND aa.apoderado_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM alumno_apoderado aa
      WHERE aa.alumno_id = avisos.alumno_id
        AND aa.apoderado_user_id = auth.uid()
    )
  );

-- ── precios_modalidad ─────────────────────────────────────────────────────────
ALTER TABLE precios_modalidad ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "precios_tp_own"    ON precios_modalidad;
DROP POLICY IF EXISTS "precios_apoderado" ON precios_modalidad;
CREATE POLICY "precios_tp_own" ON precios_modalidad
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- Apoderados pueden ver precios de su transportista asignado
CREATE POLICY "precios_apoderado" ON precios_modalidad
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM solicitudes_cupo sc
      WHERE sc.transportista_user_id = precios_modalidad.user_id
        AND sc.apoderado_user_id = auth.uid()
        AND sc.estado = 'aceptado'
    )
    OR
    -- Precios visibles en marketplace
    EXISTS (
      SELECT 1 FROM transportista_perfil tp
      WHERE tp.user_id = precios_modalidad.user_id
        AND tp.visible = true
        AND tp.precios_publicos = true
    )
  );
