-- migraciones/008_flow_pago.sql
-- Agrega columnas para tracking de órdenes Flow en la tabla cobros
-- y crea la tabla pagos_flow para registro de confirmaciones webhook.
--
-- NOTA: cobros.flow_token y cobros.estado ya existen desde 001_columnas_faltantes.sql
--       Este script amplía el CHECK de estado y agrega flow_order.

-- ── Ampliar CHECK de estado en cobros ────────────────────────────────────────
-- El CHECK existente solo incluía ('pendiente','pagado','anulado','error').
-- Necesitamos 'pendiente_pago' y 'vencido' para el flujo de Flow.

-- Eliminar constraint viejo y crear uno nuevo con todos los valores
ALTER TABLE cobros DROP CONSTRAINT IF EXISTS cobros_estado_check;
ALTER TABLE cobros
  ADD CONSTRAINT cobros_estado_check
    CHECK (estado IN ('pendiente','pendiente_pago','pagado','vencido','anulado','error'));

-- Agregar flow_order (flow_token ya existe desde 001)
ALTER TABLE cobros
  ADD COLUMN IF NOT EXISTS flow_order TEXT;

-- Índice para buscar por token Flow en el webhook de confirmación
-- (flow_token ya tiene índice desde 001, pero por si acaso)
CREATE INDEX IF NOT EXISTS cobros_flow_token_idx ON cobros (flow_token);
CREATE INDEX IF NOT EXISTS cobros_flow_order_idx ON cobros (flow_order);

-- ── Tabla de confirmaciones Flow (webhook) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS pagos_flow (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cobro_id         UUID REFERENCES cobros(id) ON DELETE SET NULL,
  flow_token       TEXT NOT NULL,
  commerce_order   TEXT NOT NULL,
  monto            NUMERIC(12,2),
  estado_flow      TEXT,      -- ACCEPTED | REJECTED | PENDING | ANULLED
  flow_raw         JSONB,     -- payload completo de Flow para auditoría
  confirmado_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pagos_flow ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede insertar/leer (webhook lo llama con service key)
CREATE POLICY "service_role full access" ON pagos_flow
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- El apoderado dueño del cobro puede ver sus pagos
-- Relación: pagos_flow → cobros.alumno_id → alumno_apoderado → apoderado_user_id
CREATE POLICY "apoderado ve sus pagos" ON pagos_flow
  FOR SELECT
  USING (
    cobro_id IN (
      SELECT c.id FROM cobros c
      JOIN alumno_apoderado aa ON aa.alumno_id = c.alumno_id
      WHERE aa.apoderado_user_id = auth.uid()
        AND aa.activo = true
    )
  );
