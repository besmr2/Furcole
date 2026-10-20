// supabase/functions/flow-crear-pago/index.ts
// Crea una orden de pago en Flow.cl (API v3) y devuelve la URL de redirección.
//
// Secrets requeridos en Supabase (supabase secrets set):
//   FLOW_API_KEY      → API Key de Flow.cl
//   FLOW_SECRET_KEY   → Secret Key de Flow.cl
//   FLOW_SANDBOX      → "true" para sandbox, "false" para producción
//
// Deploy:
//   supabase functions deploy flow-crear-pago
//
// POST body: { cobro_id, monto, concepto, origen }
// Response: { url } | { error }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const CORS = {
  'Access-Control-Allow-Origin': 'https://furcole.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Firma HMAC-SHA256 requerida por Flow API v3 ──────────────────────────────
// Flow firma todos los parámetros en orden alfabético concatenados como
// "param1value1param2value2..." y firma el string con HMAC-SHA256.
function flowSign(params: Record<string, string>, secretKey: string): string {
  const sorted = Object.keys(params).sort()
  const toSign = sorted.map(k => `${k}${params[k]}`).join('')
  return createHmac('sha256', secretKey).update(toSign).digest('hex')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // ── Auth: verificar JWT de Supabase ──────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey      = Deno.env.get('SUPABASE_ANON_KEY')!
    const flowApiKey   = Deno.env.get('FLOW_API_KEY')!
    const flowSecret   = Deno.env.get('FLOW_SECRET_KEY')!
    const isSandbox    = Deno.env.get('FLOW_SANDBOX') !== 'false'
    const appUrl       = Deno.env.get('APP_URL') || 'https://cheery-starlight-3289c4.netlify.app'

    // Verificar JWT del usuario
    const token = authHeader.split(' ')[1]
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authErr } = await anonClient.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // ── Body ─────────────────────────────────────────────────────────────────
    const { cobro_id, monto, concepto, origen = 'portal' } = await req.json()
    if (!cobro_id || !monto) {
      return new Response(JSON.stringify({ error: 'cobro_id y monto son requeridos' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // ── Verificar que el cobro pertenece a este usuario ───────────────────────
    // cobros → alumno_id → alumno_apoderado.apoderado_user_id = user.id
    const serviceClient = createClient(supabaseUrl, serviceKey)
    const { data: cobro, error: cobroErr } = await serviceClient
      .from('cobros')
      .select('id, monto, estado, alumno_id')
      .eq('id', cobro_id)
      .maybeSingle()

    if (cobroErr || !cobro) {
      return new Response(JSON.stringify({ error: 'Cobro no encontrado' }), {
        status: 404, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Verificar que el apoderado autenticado está vinculado al alumno de este cobro
    const { data: vinculo } = await serviceClient
      .from('alumno_apoderado')
      .select('id')
      .eq('alumno_id', cobro.alumno_id)
      .eq('apoderado_user_id', user.id)
      .eq('activo', true)
      .maybeSingle()

    if (!vinculo) {
      return new Response(JSON.stringify({ error: 'No autorizado para este cobro' }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    if (cobro.estado === 'pagado') {
      return new Response(JSON.stringify({ error: 'Este cobro ya fue pagado' }), {
        status: 409, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // ── Crear orden en Flow ───────────────────────────────────────────────────
    const FLOW_API = isSandbox
      ? 'https://sandbox.flow.cl/api'
      : 'https://www.flow.cl/api'

    // commerceOrder: único por cobro (prefijo para distinguir sandbox vs prod)
    const commerceOrder = `FURCOLE-${cobro_id}-${Date.now()}`

    const params: Record<string, string> = {
      apiKey:          flowApiKey,
      commerceOrder:   commerceOrder,
      subject:         (concepto || `Transporte escolar — cobro ${cobro_id}`).substring(0, 254),
      currency:        'CLP',
      amount:          String(Math.round(Number(monto))),
      email:           user.email || '',
      paymentMethod:   '9', // 9 = todos los medios disponibles
      urlConfirmation: `${appUrl}/api/flow-confirmar`,
      urlReturn:       `${appUrl}/portal?pago=ok&cobro=${cobro_id}`,
      optional:        JSON.stringify({ cobro_id, alumno_id: cobro.alumno_id, origen }),
    }

    // Agregar firma
    params.s = flowSign(params, flowSecret)

    // Llamada a Flow API
    const formBody = new URLSearchParams(params).toString()
    const flowRes = await fetch(`${FLOW_API}/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    })

    const flowJson = await flowRes.json()

    if (!flowRes.ok || flowJson.code) {
      console.error('Flow error:', flowJson)
      return new Response(JSON.stringify({
        error: `Flow rechazó la orden: ${flowJson.message || flowJson.code || 'error desconocido'}`,
      }), { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    // flowJson.url + '?token=' + flowJson.token = URL de pago
    const paymentUrl = `${flowJson.url}?token=${flowJson.token}`

    // ── Registrar intent de pago en DB ────────────────────────────────────────
    await serviceClient.from('cobros').update({
      flow_order:  commerceOrder,
      flow_token:  flowJson.token,
      estado:      'pendiente_pago',
    }).eq('id', cobro_id)

    return new Response(JSON.stringify({ url: paymentUrl, token: flowJson.token }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('flow-crear-pago error:', err)
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
