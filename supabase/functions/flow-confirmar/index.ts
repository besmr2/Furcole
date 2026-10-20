// supabase/functions/flow-confirmar/index.ts
// Webhook que Flow.cl llama (POST) para confirmar o rechazar un pago.
//
// Flow envía: { token, commerceOrder, flowOrder, amount, status, subject, ... }
// status: 1 = PAGADO, 2 = RECHAZADO, 3 = PENDIENTE, 4 = ANULADO
//
// Esta función verifica la firma HMAC-SHA256 de Flow, actualiza cobros.estado
// y registra el evento en pagos_flow.
//
// Deploy: supabase functions deploy flow-confirmar --no-verify-jwt
//
// ⚠️  NO requiere JWT porque el caller es Flow.cl, no el browser del apoderado.
//     La autenticidad se verifica por HMAC.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

// Flow status codes
const FLOW_STATUS: Record<number, string> = {
  1: 'pagado',
  2: 'rechazado',
  3: 'pendiente_pago',
  4: 'anulado',
}

// ── Firma HMAC-SHA256: misma lógica que flow-crear-pago ────────────────────────
function flowSign(params: Record<string, string>, secretKey: string): string {
  const sorted = Object.keys(params).sort()
  const toSign = sorted.map(k => `${k}${params[k]}`).join('')
  return createHmac('sha256', secretKey).update(toSign).digest('hex')
}

serve(async (req) => {
  // Flow solo usa POST para confirmaciones
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const flowSecret   = Deno.env.get('FLOW_SECRET_KEY')!
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // ── Parsear body (application/x-www-form-urlencoded) ──────────────────────
    const contentType = req.headers.get('content-type') || ''
    let params: Record<string, string> = {}

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text()
      new URLSearchParams(text).forEach((v, k) => { params[k] = v })
    } else {
      // Algunos integradores usan JSON; lo toleramos
      params = await req.json()
    }

    // ── Verificar firma de Flow ────────────────────────────────────────────────
    // Flow incluye el parámetro 's' con la firma; lo extraemos para verificar
    const receivedSig = params['s']
    if (!receivedSig) {
      console.error('flow-confirmar: falta parámetro s (firma)')
      return new Response('Firma requerida', { status: 400 })
    }

    // Construir los params SIN la firma para recalcular
    const paramsToSign: Record<string, string> = {}
    for (const [k, v] of Object.entries(params)) {
      if (k !== 's') paramsToSign[k] = v
    }

    const expectedSig = flowSign(paramsToSign, flowSecret)
    if (expectedSig !== receivedSig) {
      console.error('flow-confirmar: firma inválida', { receivedSig, expectedSig })
      return new Response('Firma inválida', { status: 401 })
    }

    // ── Extraer datos de Flow ─────────────────────────────────────────────────
    const token         = params['token']
    const commerceOrder = params['commerceOrder']  // "FURCOLE-<cobro_id>-<ts>"
    const flowOrder     = params['flowOrder']
    const amount        = params['amount'] ? Number(params['amount']) : null
    const status        = params['status'] ? Number(params['status']) : null

    if (!token || !commerceOrder) {
      return new Response('Parámetros incompletos', { status: 400 })
    }

    // Extraer cobro_id del commerceOrder: formato FURCOLE-<uuid>-<timestamp>
    // El uuid tiene 36 chars; todo lo que hay entre el primer y último guion de timestamp
    const orderParts = commerceOrder.split('-')
    // commerceOrder = "FURCOLE-<uuid_part1>-<uuid_part2>-...-<timestamp>"
    // Reconstruir uuid: partes [1..5] (uuid v4 = 5 grupos separados por guion)
    // FURCOLE(0) - uuid[1-5: 8+4+4+4+12] - timestamp(6)
    // Ejemplo: FURCOLE-550e8400-e29b-41d4-a716-446655440000-1700000000000
    const cobro_id = orderParts.length >= 6
      ? orderParts.slice(1, 6).join('-')
      : null

    if (!cobro_id) {
      console.error('flow-confirmar: no se pudo extraer cobro_id de', commerceOrder)
      return new Response('commerceOrder inválido', { status: 400 })
    }

    const serviceClient = createClient(supabaseUrl, serviceKey)

    // ── Determinar nuevo estado ───────────────────────────────────────────────
    const nuevoEstado = FLOW_STATUS[status ?? 0] ?? 'pendiente_pago'

    // ── Actualizar cobro ──────────────────────────────────────────────────────
    const { error: updateErr } = await serviceClient
      .from('cobros')
      .update({ estado: nuevoEstado, flow_order: commerceOrder })
      .eq('id', cobro_id)
      .eq('flow_token', token)  // seguridad: token debe coincidir

    if (updateErr) {
      console.error('flow-confirmar: error actualizando cobro', updateErr)
      // No retornamos 500 porque Flow reintentará; mejor loguear e ignorar
    }

    // ── Registrar en pagos_flow ───────────────────────────────────────────────
    const estadoFlow: Record<number, string> = { 1: 'ACCEPTED', 2: 'REJECTED', 3: 'PENDING', 4: 'ANULLED' }

    const { error: insertErr } = await serviceClient
      .from('pagos_flow')
      .insert({
        cobro_id,
        flow_token:     token,
        commerce_order: commerceOrder,
        monto:          amount,
        estado_flow:    estadoFlow[status ?? 0] ?? 'PENDING',
        flow_raw:       params,
      })

    if (insertErr) {
      console.error('flow-confirmar: error insertando pagos_flow', insertErr)
    }

    // Flow espera que el servidor responda con status 200 y cuerpo cualquiera
    // Si no recibe 200 en < 30s, reintentará la llamada
    console.log(`flow-confirmar: cobro ${cobro_id} → ${nuevoEstado} (flowOrder: ${flowOrder})`)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('flow-confirmar error:', err)
    return new Response('Error interno', { status: 500 })
  }
})
