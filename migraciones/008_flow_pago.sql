-- migraciones/008_flow_pago.sql
-- Agrega columnas para tracking de órdenes Flow en la tabla cobros
-- y crea la tabla pagos_flow para registro de confirmaciones webhook.

-- ── Columnas en cobros ────────────────────────────────────────────────────────
ALTER TABLE cobros
  ADD COLUMN IF NOT EXISTS flow_order      TEXT,
  ADD COLUMN IF NOT EXISTS flow_token      TEXT,
  ADD COLUMN IF NOT EXISTS estado          TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','pendiente_pago','pagado','vencido','anulado'));

-- Índice para buscar por token Flow en el webhook de confirmación
CREATE INDEX IF NOT EXISTS cobros_flow_token_idx ON cobros (flow_token);

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
CREATE POLICY "apoderado ve sus pagos" ON pagos_flow
  FOR SELECT
  USING (
    cobro_id IN (
      SELECT c.id FROM cobros c
      JOIN apoderados a ON a.id = c.apoderado_id
      WHERE a.user_id = auth.uid()
    )
  );
