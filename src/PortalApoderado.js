import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { HistorialCambios, FlujoCambioEstablecimiento } from './App'
// ─── Fonts ───────────────────────────────────────────────────────────────────
;(function injectFonts() {
  if (typeof document === 'undefined') return
  if (document.getElementById('furcole-fonts')) return
  const link = document.createElement('link')
  link.id = 'furcole-fonts'
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700&display=swap'
  document.head.appendChild(link)
})()

// ─── Icons ───────────────────────────────────────────────────────────────────
const IC = {
  bus: <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden="true"><rect x="3" y="8" width="30" height="20" rx="3" fill="#F5C400"/><rect x="5" y="10" width="8" height="6" rx="1" fill="#0F2044"/><rect x="15" y="10" width="8" height="6" rx="1" fill="#0F2044"/><rect x="25" y="10" width="6" height="6" rx="1" fill="#0F2044"/><rect x="3" y="24" width="30" height="4" rx="1" fill="#D4A800"/><circle cx="9" cy="29" r="3" fill="#0F2044" stroke="#F5C400" strokeWidth="1.5"/><circle cx="27" cy="29" r="3" fill="#0F2044" stroke="#F5C400" strokeWidth="1.5"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 8l4 4 6-7"/></svg>,
  coin:  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v6M6 7h3a1 1 0 010 2H6"/></svg>,
  user:  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="8" cy="5" r="2.5"/><path d="M3 14c0-2.76 2.24-4 5-4s5 1.24 5 4"/></svg>,
  kid:   <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="8" cy="5" r="2.5"/><path d="M4 14l1.5-4h5L12 14"/></svg>,
  warn:  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M8 2L1.5 13.5h13L8 2z"/><path d="M8 7v3M8 11.5v.5"/></svg>,
  logout:<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M6 2.5H3a1 1 0 00-1 1v9a1 1 0 001 1h3"/><path d="M11 11l3-3-3-3M14 8H6"/></svg>,
  link:  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M5.25 7.583a3.5 3.5 0 005.25.584l1.167-1.167a3.5 3.5 0 00-4.95-4.95L5.54 3.237"/><path d="M8.75 6.417a3.5 3.5 0 00-5.25-.584L2.333 6.999a3.5 3.5 0 004.95 4.95l1.172-1.167"/></svg>,
  hist:  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const p = {
  fondo:     { minHeight: '100vh', background: '#F2F5FA', fontFamily: "'Inter',system-ui,sans-serif", color: '#1e293b' },
  topbar:    { background: '#0F2044', borderBottom: '3px solid #F5C400', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
  topNombre: { color: '#fff', fontFamily: "'Sora',system-ui,sans-serif", fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 10 },
  main:      { maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px' },
  card:      { background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16, overflow: 'hidden' },
  cardHead:  { padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: '#0F2044' },
  cardBody:  { padding: '16px 20px' },
  badge:     { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btn:       { background: '#0F2044', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif", display: 'inline-flex', alignItems: 'center', gap: 6 },
  btnAmarillo:{ background: '#F5C400', color: '#0F2044', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" },
  btnOut:    { background: 'transparent', color: '#0F2044', border: '1.5px solid #dde4ef', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif" },
  input:     { width: '100%', border: '1.5px solid #dde4ef', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: "'Inter',system-ui,sans-serif", outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#1e293b' },
  label:     { fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' },
  error:     { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b', marginBottom: 12 },
  tabRow:    { display: 'grid', gridTemplateColumns: '1fr 100px 90px', gap: 12, padding: '11px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center', fontSize: 14 },
  tabHead:   { display: 'grid', gridTemplateColumns: '1fr 100px 90px', gap: 12, padding: '8px 0 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' },
  chip:      { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Sk({ w = '100%', h = 16, r = 6 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

// ─── Utilis ───────────────────────────────────────────────────────────────────
function formatCLP(n) { return '$' + Number(n).toLocaleString('es-CL') }
function formatFecha(d) { return d ? new Date(d).toLocaleDateString('es-CL') : '—' } // eslint-disable-line no-unused-vars

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRO (apoderado llega con ?key=XXX)
// ═══════════════════════════════════════════════════════════════════════════════
function Registro({ alumnoKey, onRegistrado }) {
  const [paso, setPaso]       = useState('datos') // 'datos' | 'verificar' | 'listo'
  const [form, setForm]       = useState({ email: '', password: '', nombre: '', parentesco: '' })
  const [alumno, setAlumno]   = useState(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError]     = useState('')

  const PARENTESCOS = ['Madre','Padre','Abuelo/a','Tío/a','Hermano/a mayor','Tutor/a legal','Otro']

  useEffect(() => {
    async function verificarKey() {
      const { data } = await supabase.from('alumnos')
        .select('id, nombre, user_id, monto').eq('alumno_key', alumnoKey).maybeSingle()
      if (!data) { setError('Link de registro inválido o expirado.'); setCargando(false); return }
      setAlumno(data); setCargando(false)
    }
    verificarKey()
  }, [alumnoKey])

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function registrar(e) {
    e.preventDefault()
    if (!form.nombre.trim())      { setError('Ingresa tu nombre completo'); return }
    if (!form.parentesco)         { setError('Selecciona tu parentesco'); return }
    if (!form.email.trim())       { setError('Ingresa tu email'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setEnviando(true); setError('')
    try {
      // 1. Crear cuenta en Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: { data: { nombre: form.nombre.trim(), rol: 'apoderado' } }
      })
      if (authErr) throw authErr

      // 2. Crear perfil apoderado
      const uid = authData.user.id
      await supabase.from('apoderado_perfil').upsert({
        user_id: uid,
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        parentesco: form.parentesco,
      }, { onConflict: 'user_id' })

      // 3. Vincular apoderado ↔ alumno
      await supabase.from('alumno_apoderado').insert({
        alumno_id: alumno.id,
        apoderado_user_id: uid,
        parentesco: form.parentesco,
        activo: true,
      })

      setPaso('verificar')
    } catch(err) {
      setError(err.message || 'Error al registrarse')
    } finally { setEnviando(false) }
  }

  if (cargando) return (
    <div style={{ ...p.fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>Cargando…</div>
    </div>
  )

  if (paso === 'verificar') return (
    <div style={{ ...p.fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 400, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 style={{ color: '#0F2044', fontFamily: "'Sora',system-ui,sans-serif", marginBottom: 8 }}>Revisa tu email</h2>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
          Te enviamos un link de confirmación a <strong>{form.email}</strong>.<br />
          Una vez confirmado, podrás acceder al portal.
        </p>
        <button style={{ ...p.btn, marginTop: 20, width: '100%', justifyContent: 'center' }} onClick={onRegistrado}>
          Ya confirmé — Ir al portal
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ ...p.fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          {IC.bus}
          <div>
            <div style={{ fontFamily: "'Sora',system-ui,sans-serif", fontWeight: 700, color: '#0F2044', fontSize: 18 }}>Furcole</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Portal Apoderado</div>
          </div>
        </div>

        {alumno && (
          <div style={{ background: '#F2F5FA', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#0F2044' }}>
            Registrándote como apoderado de <strong>{alumno.nombre}</strong>
          </div>
        )}

        <h2 style={{ color: '#0F2044', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Crear cuenta</h2>

        {error && <div style={p.error}>{error}</div>}

        <form onSubmit={registrar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={p.label}>Tu nombre completo</label>
            <input style={p.input} value={form.nombre} onChange={e=>f('nombre',e.target.value)} placeholder="Nombre Apellido" autoComplete="name" />
          </div>
          <div>
            <label style={p.label}>Parentesco con el alumno</label>
            <select style={p.input} value={form.parentesco} onChange={e=>f('parentesco',e.target.value)}>
              <option value="">Seleccionar…</option>
              {PARENTESCOS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={p.label}>Email</label>
            <input style={p.input} type="email" value={form.email} onChange={e=>f('email',e.target.value)} placeholder="tu@email.com" autoComplete="email" />
          </div>
          <div>
            <label style={p.label}>Contraseña</label>
            <input style={p.input} type="password" value={form.password} onChange={e=>f('password',e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          </div>
          <button type="submit" style={{ ...p.btnAmarillo, width: '100%', padding: 12, fontSize: 15 }} disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
function Login({ onLogin }) {
  const [form, setForm]     = useState({ email: '', password: '' })
  const [enviando, setEnviando] = useState(false)
  const [error, setError]   = useState('')
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function login(e) {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Completa todos los campos'); return }
    setEnviando(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    })
    if (err) { setError('Email o contraseña incorrectos'); setEnviando(false); return }
    onLogin()
  }

  return (
    <div style={{ ...p.fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 380, boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          {IC.bus}
          <div>
            <div style={{ fontFamily: "'Sora',system-ui,sans-serif", fontWeight: 700, color: '#0F2044', fontSize: 18 }}>Furcole</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Portal Apoderado</div>
          </div>
        </div>

        <h2 style={{ color: '#0F2044', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Iniciar sesión</h2>

        {error && <div style={p.error}>{error}</div>}

        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={p.label}>Email</label>
            <input style={p.input} type="email" value={form.email} onChange={e=>f('email',e.target.value)} placeholder="tu@email.com" autoComplete="email" />
          </div>
          <div>
            <label style={p.label}>Contraseña</label>
            <input style={p.input} type="password" value={form.password} onChange={e=>f('password',e.target.value)} autoComplete="current-password" />
          </div>
          <button type="submit" style={{ ...p.btnAmarillo, width: '100%', padding: 12, fontSize: 15 }} disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PORTAL PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
function Portal({ user, onLogout, pagoOk = false, cobroIdPago = null }) {
  const [datos, setDatos]         = useState(null)
  const [cargando, setCargando]   = useState(true)
  const [seccion, setSeccion]     = useState('cobros')
  const [pagando, setPagando]     = useState(null)  // cobro siendo pagado
  const [errorPago, setErrorPago] = useState('')    // mensaje de error pago Flow
  const [exitoPago, setExitoPago] = useState(pagoOk) // banner verde tras retorno de Flow
  const [cambiarTp, setCambiarTp] = useState(false) // modal cambio transportista

  // Limpiar ?pago=ok de la URL para evitar que recarga vuelva a mostrar el banner
  useEffect(() => {
    if (!pagoOk) return
    const url = new URL(window.location.href)
    url.searchParams.delete('pago')
    url.searchParams.delete('cobro')
    window.history.replaceState({}, '', url.toString())
  }, [pagoOk])
  // Realtime: último evento de subida/bajada recibido
  const [eventoRealtime, setEventoRealtime] = useState(null) // { tipo, nombre, hora }

  const cargar = useCallback(async () => {
    setCargando(true)
    // Alumnos vinculados a este apoderado
    const { data: vinculos } = await supabase.from('alumno_apoderado')
      .select('alumno_id, parentesco, alumnos(id, nombre, monto, activo, user_id)')
      .eq('apoderado_user_id', user.id).eq('activo', true)

    const alumnosIds = (vinculos || []).map(v => v.alumno_id)

    let cobros = [], deudas = [], perfiles = []
    if (alumnosIds.length > 0) {
      const [{ data: c }, { data: d }] = await Promise.all([
        supabase.from('cobros').select('*, alumnos(nombre)').in('alumno_id', alumnosIds).order('mes', { ascending: false }),
        supabase.from('deudas_pendientes').select('*, transportista:user_id(nombre_transportista)').in('alumno_id', alumnosIds).eq('saldada', false),
      ])
      cobros  = c || []
      deudas  = d || []

      // Perfil del transportista (primer alumno activo)
      const transportistaId = vinculos?.[0]?.alumnos?.user_id
      if (transportistaId) {
        const { data: perf } = await supabase.from('perfil_transportista').select('*').eq('user_id', transportistaId).maybeSingle()
        if (perf) perfiles = [perf]
      }
    }

    // Perfil apoderado + perfil_apoderado (tiene_transporte)
    const [{ data: perfilAp }, { data: perfilMkt }] = await Promise.all([
      supabase.from('apoderado_perfil').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('perfil_apoderado').select('tiene_transporte').eq('user_id', user.id).maybeSingle(),
    ])

    setDatos({ vinculos: vinculos || [], cobros, deudas, perfiles, perfilAp, tieneTransporte: perfilMkt?.tiene_transporte ?? true })
    setCargando(false)
  }, [user.id])

  useEffect(() => { cargar() }, [cargar])

  // ── Realtime: escuchar eventos_viaje de los alumnos vinculados ──────────────
  // Tipos de evento:
  //  'proximo'   → el bus se acerca, prepararse en la parada
  //  'subida'    → el alumno subió al bus
  //  'saltado'   → el alumno no estaba, fue saltado
  //  'entregado' → el alumno fue dejado en destino
  //  'bajada'    → bajada libre (flujo anterior, sin ruta guiada)
  useEffect(() => {
    let channel
    if (!datos || datos.vinculos.length === 0) return

    const alumnosIds = datos.vinculos.map(v => v.alumno_id)

    channel = supabase
      .channel(`portal-eventos-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'eventos_viaje' },
        async (payload) => {
          const ev = payload.new
          if (!alumnosIds.includes(ev.alumno_id)) return

          const vinculo = datos.vinculos.find(v => v.alumno_id === ev.alumno_id)
          const nombre  = vinculo?.alumnos?.nombre || 'Tu alumno/a'
          const hora    = new Date(ev.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

          // Ignorar tipos que no producen notificación visual
          if (!['proximo','subida','bajada','entregado','saltado'].includes(ev.tipo)) return

          setEventoRealtime({ tipo: ev.tipo, nombre, hora })
          // Banner más largo para 'proximo' (necesita tiempo para prepararse)
          const duracion = ev.tipo === 'proximo' ? 20000 : 12000
          setTimeout(() => setEventoRealtime(null), duracion)
        }
      )
      .subscribe()

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [datos, user.id])

  async function pagarConFlow(cobro) {
    setPagando(cobro.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || supabase.supabaseUrl
      const res = await fetch(`${SUPABASE_URL}/functions/v1/flow-crear-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          cobro_id: cobro.id,
          monto: cobro.monto,
          concepto: `Transporte escolar ${cobro.mes} — ${cobro.alumnos?.nombre}`,
          origen: 'portal',
        }),
      })
      const json = await res.json()
      if (json.url) {
        // Redirige al portal de pago Flow — no llamar setPagando(null) para que
        // el botón quede en "Redirigiendo…" hasta que la página cambie
        window.location.href = json.url
        return
      }
      setPagando(null)
      setErrorPago(json.error || 'No se pudo iniciar el pago. Intenta más tarde.')
    } catch(e) {
      setPagando(null)
      setErrorPago('Error de conexión. Verifica tu internet e intenta nuevamente.')
    }
  }

  if (cargando) return (
    <div style={p.fondo}>
      <div style={p.topbar}><span style={p.topNombre}>{IC.bus} Furcole</span></div>
      <div style={{ ...p.main, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Sk h={80} r={14} /><Sk h={120} r={14} /><Sk h={200} r={14} />
      </div>
    </div>
  )

  const { vinculos, cobros, deudas, perfiles, tieneTransporte } = datos
  const transportista = perfiles[0]
  const cobrosPendientes = cobros.filter(c => c.estado === 'pendiente')
  const cobrosHistorial  = cobros.filter(c => c.estado !== 'pendiente')
  const mttOk = transportista?.mtt_verificado && (new Date() - new Date(transportista?.mtt_fecha)) < 365*24*3600*1000

  const NAV = [
    { id: 'cobros',         label: 'Cobros',        badge: cobrosPendientes.length },
    { id: 'deudas',         label: 'Deudas',        badge: deudas.length },
    { id: 'historial',      label: 'Historial',     badge: 0 },
    { id: 'transportista',  label: 'Mi tío',        badge: 0 },
    ...(!tieneTransporte ? [{ id: 'buscar', label: 'Buscar tío', badge: 0 }] : []),
  ]

  return (
    <div style={p.fondo}>
      {/* Topbar */}
      <div style={p.topbar}>
        <span style={p.topNombre}>{IC.bus} Furcole</span>
        <button onClick={onLogout} style={{ background: '#c0392b', border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '6px 14px' }}>
          {IC.logout} Salir
        </button>
      </div>

      {/* Banner Realtime ─ cubre todos los tipos de evento_viaje */}
      {eventoRealtime && (() => {
        // Tabla de estilos y textos por tipo
        const cfg = {
          proximo:   { bg: '#F5C400', fg: '#0F2044', titulo: '¡Prepárate!',        sub: `El furgón viene a buscar a ${eventoRealtime.nombre}` },
          subida:    { bg: '#0F2044', fg: '#ffffff',  titulo: '¡Subió al furgón!', sub: `${eventoRealtime.nombre} · ${eventoRealtime.hora}` },
          bajada:    { bg: '#F5C400', fg: '#0F2044', titulo: '¡Bajó del furgón!',  sub: `${eventoRealtime.nombre} · ${eventoRealtime.hora}` },
          entregado: { bg: '#16a34a', fg: '#ffffff',  titulo: '¡Entregado!',        sub: `${eventoRealtime.nombre} llegó a destino · ${eventoRealtime.hora}` },
          saltado:   { bg: '#64748b', fg: '#ffffff',  titulo: 'No subió hoy',       sub: `${eventoRealtime.nombre} fue marcado ausente` },
        }
        const c = cfg[eventoRealtime.tipo] || cfg.subida

        // Icono SVG por tipo
        const icono = {
          proximo: (
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="9" r="7.5"/>
              <path d="M9 5v4l3 2"/>
            </svg>
          ),
          subida: (
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="1.5" y="6" width="15" height="9" rx="1.5"/>
              <path d="M5 6V4.5A1.5 1.5 0 016.5 3h5A1.5 1.5 0 0113 4.5V6"/>
              <circle cx="5" cy="13" r="1"/><circle cx="13" cy="13" r="1"/>
              <path d="M9 3V1M7 3l2-2 2 2"/>
            </svg>
          ),
          bajada: (
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="1.5" y="6" width="15" height="9" rx="1.5"/>
              <path d="M5 6V4.5A1.5 1.5 0 016.5 3h5A1.5 1.5 0 0113 4.5V6"/>
              <circle cx="5" cy="13" r="1"/><circle cx="13" cy="13" r="1"/>
              <path d="M9 7v2M7 9l2 2 2-2"/>
            </svg>
          ),
          entregado: (
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3.5 9.5l4 4 7-8"/>
            </svg>
          ),
          saltado: (
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="9" r="7.5"/>
              <path d="M6 9h6M12 9l-2-2m2 2l-2 2"/>
            </svg>
          ),
        }

        return (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
              background: c.bg,
              color: c.fg,
              padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,.18)',
              animation: 'slideDown .25s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {icono[eventoRealtime.tipo] || icono.subida}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{c.titulo}</div>
                <div style={{ fontSize: 13, opacity: 0.88 }}>{c.sub}</div>
              </div>
            </div>
            <button
              onClick={() => setEventoRealtime(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: 'inherit', padding: '0 4px', opacity: 0.7 }}
              aria-label="Cerrar notificación"
            >×</button>
          </div>
        )
      })()}

      <div style={p.main}>
        {/* Saludo */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Sora',system-ui,sans-serif", fontWeight: 700, color: '#0F2044', fontSize: 20 }}>
            Hola, {datos?.perfilAp?.nombre?.split(' ')[0] || 'apoderado'}
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            {vinculos.map(v => v.alumnos?.nombre).join(', ')}
          </div>
        </div>

        {/* Resumen rápido */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ background: cobrosPendientes.length > 0 ? '#fef9c3' : '#dcfce7', border: `1.5px solid ${cobrosPendientes.length > 0 ? '#fde68a' : '#86efac'}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: cobrosPendientes.length > 0 ? '#92400e' : '#166534', marginBottom: 4 }}>Pendientes</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: cobrosPendientes.length > 0 ? '#b45309' : '#16a34a' }}>
              {formatCLP(cobrosPendientes.reduce((s, c) => s + c.monto, 0))}
            </div>
          </div>
          <div style={{ background: '#fff', border: '1.5px solid #dde4ef', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#64748b', marginBottom: 4 }}>Pagado este año</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0F2044' }}>
              {formatCLP(cobrosHistorial.filter(c=>c.estado==='pagado').reduce((s,c)=>s+c.monto,0))}
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', borderRadius: 10, padding: 4, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setSeccion(n.id)} style={{
              flex: 1, border: 'none', borderRadius: 7, padding: '8px 4px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',system-ui,sans-serif",
              background: seccion === n.id ? '#0F2044' : 'transparent',
              color: seccion === n.id ? '#fff' : '#64748b',
              position: 'relative',
            }}>
              {n.label}
              {n.badge > 0 && <span style={{ position: 'absolute', top: 4, right: 6, background: '#F5C400', color: '#0F2044', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 5px' }}>{n.badge}</span>}
            </button>
          ))}
        </div>

        {/* ── Cobros pendientes ── */}
        {seccion === 'cobros' && (
          <>
          {exitoPago && (
            <div role="status" style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>✅ ¡Pago procesado correctamente!{cobroIdPago ? ' Tu cobro ha sido enviado a confirmación.' : ''}</span>
              <button onClick={() => setExitoPago(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: 16, lineHeight: 1 }} aria-label="Cerrar confirmación">×</button>
            </div>
          )}
          {errorPago && (
            <div role="alert" style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#991b1b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⚠️ {errorPago}</span>
              <button onClick={() => setErrorPago('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: 16, lineHeight: 1 }} aria-label="Cerrar error">×</button>
            </div>
          )}
          <div style={p.card}>
            <div style={p.cardHead}>{IC.coin} Cobros pendientes</div>
            <div style={p.cardBody}>
              {cobrosPendientes.length === 0
                ? <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>✅ No tienes cobros pendientes</p>
                : cobrosPendientes.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#0F2044' }}>{c.alumnos?.nombre}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Mes {c.mes}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontWeight: 700, color: '#0F2044', fontSize: 15 }}>{formatCLP(c.monto)}</span>
                        <button
                          style={{ ...p.btnAmarillo, padding: '7px 14px', fontSize: 13 }}
                          onClick={() => pagarConFlow(c)}
                          disabled={pagando === c.id}
                        >
                          {pagando === c.id ? 'Redirigiendo…' : 'Pagar'}
                        </button>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        )}

        {/* ── Deudas anteriores ── */}
        {seccion === 'deudas' && (
          <div style={p.card}>
            <div style={p.cardHead}>{IC.warn} Deudas con servicios anteriores</div>
            <div style={p.cardBody}>
              {deudas.length === 0
                ? <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>✅ Sin deudas con otros transportistas</p>
                : deudas.map(d => (
                    <div key={d.id} style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>Deuda con {d.transportista?.nombre_transportista || 'transportista anterior'}</div>
                          <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Alumno: {d.alumno_nombre}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: '#b45309', fontSize: 15 }}>{formatCLP(d.monto_pendiente)}</div>
                          <div style={{ fontSize: 11, color: '#92400e' }}>de {formatCLP(d.monto_original)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 12, color: '#92400e' }}>Cuota mensual: {formatCLP(d.cuota_mensual)}</div>
                        <button
                          style={{ ...p.btn, fontSize: 12, padding: '6px 12px', background: '#92400e' }}
                          onClick={() => pagarConFlow({ id: d.id, monto: d.cuota_mensual, alumnos: { nombre: d.alumno_nombre }, mes: 'Cuota deuda' })}
                        >
                          Pagar cuota
                        </button>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
          </>
        )}

        {/* ── Historial ── */}
        {seccion === 'historial' && (
          <>
            <div style={p.card}>
              <div style={p.cardHead}>{IC.hist} Historial de pagos</div>
              <div style={p.cardBody}>
                {cobrosHistorial.length === 0
                  ? <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>Aún no hay pagos registrados</p>
                  : <>
                      <div style={p.tabHead}><span>Alumno / Mes</span><span>Monto</span><span>Estado</span></div>
                      {cobrosHistorial.map(c => (
                        <div key={c.id} style={p.tabRow}>
                          <div>
                            <div style={{ fontWeight: 500, color: '#0F2044' }}>{c.alumnos?.nombre}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.mes}</div>
                          </div>
                          <span style={{ fontWeight: 600, color: '#0F2044' }}>{formatCLP(c.monto)}</span>
                          <span style={{
                            ...p.chip,
                            background: c.estado === 'pagado' ? '#dcfce7' : '#fee2e2',
                            color: c.estado === 'pagado' ? '#166534' : '#991b1b',
                          }}>
                            {c.estado === 'pagado' ? '✓ Pagado' : c.estado}
                          </span>
                        </div>
                      ))}
                    </>
                }
              </div>
            </div>

            {/* Actividad de cuenta */}
            <HistorialCambios propietario_id={user.id} entidad="apoderado" />
          </>
        )}

        {/* ── Buscar transporte (solo si !tieneTransporte) ── */}
        {seccion === 'buscar' && !tieneTransporte && (
          <BuscarTransporte userId={user.id} onVinculado={cargar} />
        )}

        {/* ── Transportista ── */}
        {seccion === 'transportista' && (
          <>
          <div style={p.card}>
            <div style={p.cardHead}>{IC.user} Tu transportista</div>
            {transportista ? (
              <>
                <div style={{ background: '#0F2044', padding: '20px 20px 16px', display: 'flex', gap: 14, alignItems: 'center' }}>
                  {transportista.foto_url
                    ? <img src={transportista.foto_url} alt="Foto" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #F5C400', flexShrink: 0 }} />
                    : <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1A3A6B', border: '2px solid #F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>👤</div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, fontFamily: "'Sora',system-ui,sans-serif" }}>
                      {transportista.nombre || 'Transportista'}
                    </div>
                    {transportista.experiencia_años && <div style={{ color: '#a8c0dd', fontSize: 13 }}>{transportista.experiencia_años} años de experiencia</div>}
                  </div>
                  {/* Badge MTT */}
                  {mttOk
                    ? <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 14 }}>✓</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#166534', lineHeight: 1.2 }}>CERTIFICADO<br/>MTT</div>
                      </div>
                    : <div style={{ background: '#fee2e2', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#991b1b', lineHeight: 1.2 }}>SIN CERT.<br/>MTT</div>
                      </div>
                  }
                </div>
                <div style={p.cardBody}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { label: 'Vehículo', val: [transportista.marca, transportista.modelo, transportista.año].filter(Boolean).join(' ') || null },
                      { label: 'Patente',  val: transportista.patente },
                      { label: 'Color',    val: transportista.color },
                      { label: 'Capacidad',val: transportista.capacidad ? `${transportista.capacidad} pasajeros` : null },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: val ? '#0F2044' : '#cbd5e1', fontStyle: val ? 'normal' : 'italic' }}>{val || '—'}</div>
                      </div>
                    ))}
                  </div>
                  {transportista.telefono && (
                    <a href={`https://wa.me/${transportista.telefono.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                      style={{ ...p.btn, marginTop: 16, textDecoration: 'none', background: '#25D366', justifyContent: 'center', width: '100%', boxSizing: 'border-box' }}>
                      💬 Contactar por WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => setCambiarTp(true)}
                    style={{ ...p.btnOut, marginTop: 12, width: '100%', boxSizing: 'border-box', textAlign: 'center', justifyContent: 'center' }}
                    aria-expanded={cambiarTp}
                  >
                    🔄 Cambiar establecimiento / transportista
                  </button>
                </div>
              </>
            ) : (
              <div style={{ ...p.cardBody, color: '#64748b', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
                El transportista aún no ha completado su perfil.
              </div>
            )}
          </div>

          {/* Flujo cambio establecimiento — se expande inline bajo la tarjeta */}
          {cambiarTp && vinculos[0] && (
            <FlujoCambioEstablecimiento
              alumnoId={vinculos[0].alumno_id}
              alumnoNombre={vinculos[0].alumnos?.nombre}
              userId={user.id}
              onCerrar={() => { setCambiarTp(false); cargar() }}
            />
          )}
          </>
        )}
      </div>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes slideDown { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSCAR TRANSPORTE — marketplace apoderado sin tío asignado
// ═══════════════════════════════════════════════════════════════════════════════
function BuscarTransporte({ userId, onVinculado }) {
  // Filtros
  const [colegios, setColegios]         = useState([])
  const [colegioSel, setColegioSel]     = useState('')
  const [modalidadSel, setModalidadSel] = useState('')
  const [sectorSel, setSectorSel]       = useState('')
  // Resultados
  const [resultados, setResultados]     = useState(null) // null = no buscado
  const [buscando, setBuscando]         = useState(false)
  // Alumnos del apoderado (para elegir a quién vincular)
  const [alumnos, setAlumnos]           = useState([])
  const [alumnoSel, setAlumnoSel]       = useState('')
  // Estado solicitud
  const [solicitando, setSolicitando]   = useState(null)   // transportista_user_id
  const [notaAp, setNotaAp]             = useState('')
  const [modalSol, setModalSol]         = useState(null)   // transportista row para confirmar
  const [msgSol, setMsgSol]             = useState(null)   // { texto, ok }
  // Solicitudes ya enviadas (para no duplicar)
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState([])

  const LABEL_MODALIDAD = { manana: 'Solo mañana', tarde: 'Solo tarde', completo: 'Servicio completo' }

  useEffect(() => {
    // Cargar catálogo de colegios y alumnos del apoderado
    Promise.all([
      supabase.from('colegios').select('id,nombre,tipo,sector').eq('activo', true).order('nombre'),
      supabase.from('alumno_apoderado')
        .select('alumno_id, alumnos(id, nombre)')
        .eq('apoderado_user_id', userId).eq('activo', true),
      supabase.from('solicitudes_cupo')
        .select('transportista_user_id, estado')
        .eq('apoderado_user_id', userId)
        .in('estado', ['pendiente','aceptada']),
    ]).then(([{ data: cols }, { data: vins }, { data: sols }]) => {
      setColegios(cols || [])
      const alms = (vins || []).map(v => v.alumnos).filter(Boolean)
      setAlumnos(alms)
      if (alms.length === 1) setAlumnoSel(alms[0].id)
      setSolicitudesEnviadas((sols || []).map(s => s.transportista_user_id))
    })
  }, [userId])

  async function buscar() {
    if (!colegioSel || !modalidadSel) return
    setBuscando(true); setResultados(null)
    // Paso 1: transportistas que atienden ese colegio y tienen precios activos para esa modalidad
    const { data: tcRows } = await supabase
      .from('transportista_colegios')
      .select('user_id')
      .eq('colegio_id', colegioSel)
      .eq('activo', true)

    const tids = (tcRows || []).map(r => r.user_id)
    if (tids.length === 0) { setResultados([]); setBuscando(false); return }

    // Paso 2: perfil público visible + precio para esa modalidad
    const [{ data: perfiles }, { data: precios }] = await Promise.all([
      supabase.from('transportista_perfil')
        .select('user_id, patente, anos_experiencia, descripcion, capacidad_total, precios_publicos')
        .eq('visible', true)
        .in('user_id', tids),
      supabase.from('precios_modalidad')
        .select('user_id, precio_mensual')
        .eq('modalidad', modalidadSel)
        .eq('activo', true)
        .in('user_id', tids),
    ])

    // Paso 3: cupos disponibles (llamada por transportista)
    const resultadosFinal = []
    for (const tp of (perfiles || [])) {
      const precio = precios?.find(pr => pr.user_id === tp.user_id)
      // Si tiene precios_publicos=true, debe tener precio para esa modalidad para aparecer
      if (tp.precios_publicos && !precio) continue
      const { data: cuposData } = await supabase.rpc('cupos_disponibles', { p_user_id: tp.user_id })
      const cupos = cuposData ?? 0
      resultadosFinal.push({
        ...tp,
        precio_mensual: tp.precios_publicos ? precio?.precio_mensual : null,
        cupos_disponibles: cupos,
      })
    }
    // Ordenar: primero los que tienen cupos
    resultadosFinal.sort((a, b) => b.cupos_disponibles - a.cupos_disponibles)
    setResultados(resultadosFinal)
    setBuscando(false)
  }

  async function enviarSolicitud() {
    if (!modalSol || !alumnoSel) return
    setSolicitando(modalSol.user_id); setMsgSol(null)
    const { error } = await supabase.from('solicitudes_cupo').insert({
      apoderado_user_id:      userId,
      transportista_user_id:  modalSol.user_id,
      alumno_id:              alumnoSel,
      colegio_id:             colegioSel,
      modalidad:              modalidadSel,
      nota_apoderado:         notaAp.trim() || null,
      estado:                 'pendiente',
    })
    if (error) {
      setMsgSol({ texto: 'Error al enviar. Intenta nuevamente.', ok: false })
    } else {
      setMsgSol({ texto: '¡Solicitud enviada! El transportista recibirá tu petición.', ok: true })
      setSolicitudesEnviadas(prev => [...prev, modalSol.user_id])
      setTimeout(() => setModalSol(null), 2000)
    }
    setSolicitando(null)
  }

  const colNombre = colegios.find(c => c.id === colegioSel)?.nombre

  return (
    <div>
      {/* Encabezado */}
      <div style={p.card}>
        <div style={p.cardHead}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M12 12l2.5 2.5"/></svg>
          Buscar transportista escolar
        </div>
        <div style={p.cardBody}>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b' }}>
            Filtra por el colegio de tu hijo/a y la modalidad que necesitas. Solo verás transportistas con cupos disponibles.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Sector */}
            {colegios.length > 0 && (() => {
              const sectores = [...new Set(colegios.map(c => c.sector).filter(Boolean))].sort()
              const LABEL_SECTOR = { penco: 'Penco centro', lirquen: 'Lirquén', cosmito: 'Cosmito' }
              return (
                <div>
                  <label style={p.label}>Sector</label>
                  <select style={p.input} value={sectorSel} onChange={e => { setSectorSel(e.target.value); setColegioSel('') }}>
                    <option value="">Todos los sectores</option>
                    {sectores.map(sec => (
                      <option key={sec} value={sec}>{LABEL_SECTOR[sec] || sec}</option>
                    ))}
                  </select>
                </div>
              )
            })()}
            {/* Colegio */}
            <div>
              <label style={p.label}>Colegio</label>
              <select style={p.input} value={colegioSel} onChange={e => setColegioSel(e.target.value)}>
                <option value="">Selecciona el colegio…</option>
                {(sectorSel ? colegios.filter(c => c.sector === sectorSel) : colegios).map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            {/* Modalidad */}
            <div>
              <label style={p.label}>Modalidad</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { key: 'manana',   label: 'Solo mañana',   sub: 'Hogar → Colegio' },
                  { key: 'tarde',    label: 'Solo tarde',    sub: 'Colegio → Hogar' },
                  { key: 'completo', label: 'Completo',      sub: 'Ida y vuelta' },
                ].map(({ key, label, sub }) => (
                  <button key={key} onClick={() => setModalidadSel(key)}
                    style={{ border: `1.5px solid ${modalidadSel === key ? '#0F2044' : '#e2e8f0'}`, background: modalidadSel === key ? '#0F2044' : '#fff', color: modalidadSel === key ? '#F5C400' : '#64748b', borderRadius: 8, padding: '8px 4px', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 10, opacity: .7, marginTop: 2 }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={buscar}
              disabled={!colegioSel || !modalidadSel || buscando}
              style={{ ...p.btnAmarillo, padding: '11px 0', fontSize: 14, opacity: (!colegioSel || !modalidadSel) ? 0.5 : 1, cursor: (!colegioSel || !modalidadSel) ? 'not-allowed' : 'pointer' }}>
              {buscando ? 'Buscando…' : 'Buscar transportistas'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {resultados !== null && (() => {
        if (resultados.length === 0) return (
          <div style={{ ...p.card }}>
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
              No hay transportistas disponibles para ese colegio y modalidad en este momento.<br/>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Prueba con otra modalidad o vuelve a intentar pronto.</span>
            </div>
          </div>
        )
        return (
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, fontWeight: 500 }}>
              {resultados.length} resultado{resultados.length > 1 ? 's' : ''} para {LABEL_MODALIDAD[modalidadSel]} · {colNombre}
            </div>
            {resultados.map(tp => {
              const yaSolicitado = solicitudesEnviadas.includes(tp.user_id)
              const sinCupos     = tp.cupos_disponibles <= 0
              return (
                <div key={tp.user_id} style={{ ...p.card, border: sinCupos ? '1.5px solid #e2e8f0' : '1.5px solid #bfdbfe', opacity: sinCupos ? 0.65 : 1 }}>
                  <div style={{ padding: '16px 20px' }}>
                    {/* Encabezado tarjeta */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#0F2044', marginBottom: 2 }}>
                          Patente: {tp.patente || 'No indicada'}
                        </div>
                        {tp.anos_experiencia > 0 && (
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {tp.anos_experiencia} año{tp.anos_experiencia > 1 ? 's' : ''} de experiencia
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {tp.precio_mensual != null ? (<>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#0F2044' }}>
                            ${tp.precio_mensual.toLocaleString('es-CL')}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>mensual</div>
                        </>) : (
                          <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right', maxWidth: 80 }}>Precio a convenir</div>
                        )}
                      </div>
                    </div>
                    {/* Descripción */}
                    {tp.descripcion && (
                      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', lineHeight: 1.5, background: '#F8FAFC', borderRadius: 8, padding: '8px 12px' }}>
                        {tp.descripcion}
                      </p>
                    )}
                    {/* Métricas */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                      <span style={{ background: sinCupos ? '#fee2e2' : '#dcfce7', color: sinCupos ? '#991b1b' : '#166534', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                        {sinCupos ? 'Sin cupos' : `${tp.cupos_disponibles} cupo${tp.cupos_disponibles > 1 ? 's' : ''} disponible${tp.cupos_disponibles > 1 ? 's' : ''}`}
                      </span>
                      {tp.capacidad_total && (
                        <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                          {tp.capacidad_total} plazas totales
                        </span>
                      )}
                    </div>
                    {/* Botón solicitar */}
                    {yaSolicitado ? (
                      <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 13, color: '#16a34a', fontWeight: 600, background: '#f0fdf4', borderRadius: 8 }}>
                        ✓ Solicitud enviada — esperando respuesta
                      </div>
                    ) : (
                      <button
                        onClick={() => { setModalSol(tp); setNotaAp(''); setMsgSol(null) }}
                        disabled={sinCupos}
                        style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: sinCupos ? '#e2e8f0' : '#0F2044', color: sinCupos ? '#94a3b8' : '#F5C400', fontWeight: 700, fontSize: 14, cursor: sinCupos ? 'not-allowed' : 'pointer' }}>
                        {sinCupos ? 'Sin cupos disponibles' : 'Solicitar cupo'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Modal confirmación solicitud */}
      {modalSol && (
        <div role="dialog" aria-modal="true" aria-label="Confirmar solicitud"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget && !solicitando) setModalSol(null) }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520, padding: '24px 20px 36px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 20px' }} />
            <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: '#0F2044' }}>Confirmar solicitud de cupo</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
              Patente {modalSol.patente} · {LABEL_MODALIDAD[modalidadSel]}{modalSol.precio_mensual != null ? ` · $${modalSol.precio_mensual.toLocaleString('es-CL')}/mes` : ' · Precio a convenir'}
            </p>

            {/* Selector de alumno (si hay más de uno) */}
            {alumnos.length > 1 && (
              <div style={{ marginBottom: 14 }}>
                <label style={p.label}>¿Para qué alumno/a?</label>
                <select style={p.input} value={alumnoSel} onChange={e => setAlumnoSel(e.target.value)}>
                  <option value="">Selecciona…</option>
                  {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
            )}
            {alumnos.length === 1 && (
              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#475569', background: '#F8FAFC', borderRadius: 8, padding: '8px 12px' }}>
                Para: <strong>{alumnos[0].nombre}</strong>
              </p>
            )}

            {/* Nota */}
            <div style={{ marginBottom: 16 }}>
              <label style={p.label}>Mensaje al transportista (opcional)</label>
              <textarea
                value={notaAp}
                onChange={e => setNotaAp(e.target.value)}
                maxLength={300}
                placeholder="Ej: Vivo en Calle Los Pinos 123, cerca del semáforo…"
                style={{ ...p.input, minHeight: 72, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {msgSol && (
              <div style={{ fontSize: 13, fontWeight: 500, color: msgSol.ok ? '#16a34a' : '#dc2626', marginBottom: 12, padding: '8px 12px', background: msgSol.ok ? '#f0fdf4' : '#fef2f2', borderRadius: 8 }}>
                {msgSol.texto}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalSol(null)} disabled={!!solicitando}
                style={{ flex: 1, padding: '11px 0', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={enviarSolicitud}
                disabled={!!solicitando || !alumnoSel}
                style={{ flex: 2, padding: '11px 0', borderRadius: 8, border: 'none', background: alumnoSel ? '#0F2044' : '#94a3b8', color: alumnoSel ? '#F5C400' : '#fff', fontWeight: 700, fontSize: 14, cursor: alumnoSel && !solicitando ? 'pointer' : 'not-allowed' }}>
                {solicitando ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT — detecta ruta y sesión
// ═══════════════════════════════════════════════════════════════════════════════
export default function PortalApoderado() {
  const [sesion, setSesion]   = useState(undefined) // undefined = cargando
  const params                = new URLSearchParams(window.location.search)
  const alumnoKey             = params.get('key')
  const modo                  = params.get('modo') // 'registro'
  const pagoOk                = params.get('pago') === 'ok'
  const cobroIdParam          = params.get('cobro') || null

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSesion(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  if (sesion === undefined) return (
    <div style={{ minHeight: '100vh', background: '#F2F5FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#64748b' }}>Cargando…</div>
    </div>
  )

  // Link de registro con key de alumno
  if (alumnoKey && (!sesion || modo === 'registro')) {
    return <Registro alumnoKey={alumnoKey} onRegistrado={() => window.location.href = '/portal'} />
  }

  // Sin sesión → login
  if (!sesion) return <Login onLogin={() => window.location.reload()} />

  // Con sesión → portal
  return <Portal user={sesion.user} onLogout={logout} pagoOk={pagoOk} cobroIdPago={cobroIdParam} />
}
