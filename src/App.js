import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { QRCodeCanvas as QRCode } from 'qrcode.react'
import PortalApoderado from './PortalApoderado'

// Inyecta Google Fonts (Inter + Sora) en el <head> si no está presente
;(function injectFonts() {
  if (typeof document === 'undefined') return
  if (document.getElementById('furcole-fonts')) return
  const link = document.createElement('link')
  link.id = 'furcole-fonts'
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700&display=swap'
  document.head.appendChild(link)
})()

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const IC = {
  home:       <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><path d="M3 7.5L9 2.25L15 7.5V15.75H11.25V11.25H6.75V15.75H3V7.5Z"/></svg>,
  apoderados: <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="3"/><path d="M3 15.75c0-3.31 2.69-6 6-6s6 2.69 6 6" strokeWidth=".5"/></svg>,
  alumnos:    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><rect x="3" y="2.5" width="12" height="13" rx="1.5"/><path d="M6 6h6M6 9h6M6 12h4"/></svg>,
  cobros:     <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><rect x="1.5" y="4.5" width="15" height="10.5" rx="1.5"/><path d="M1.5 7.5h15M5.25 11.25h1.5"/></svg>,
  rutas:      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><path d="M9 1.5l1.5 4.5H15l-3.75 2.75 1.5 4.5L9 10.5l-3.75 2.75 1.5-4.5L3 6h4.5z"/></svg>,
  asistencia: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><rect x="2.25" y="3" width="13.5" height="13.5" rx="1.5"/><path d="M12 1.5v3M6 1.5v3M2.25 7.5h13.5M5.25 10.5h2.25M5.25 13.5h2.25"/></svg>,
  avisos:     <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15.75 12a1.5 1.5 0 01-1.5 1.5H4.5L1.5 16.5V3a1.5 1.5 0 011.5-1.5h11.25a1.5 1.5 0 011.5 1.5v9z"/></svg>,
  edit:       <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M10.5 2.5l3 3-7.5 7.5H3.5v-3l7-7z"/></svg>,
  trash:      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M2 4h12M5 4V2.5h6V4M13 4l-1 9.5H4L3 4"/><path d="M6.5 7v4M9.5 7v4"/></svg>,
  logout:     <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M6 2.5H3a1 1 0 00-1 1v9a1 1 0 001 1h3"/><path d="M11 11l3-3-3-3M14 8H6"/></svg>,
  email:      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#0F2044" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="4" y="10" width="36" height="24" rx="3"/><path d="M4 13l18 13L40 13"/></svg>,
  check:      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#1A8A4A" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="22" cy="22" r="18"/><path d="M13 22l7 7 11-14"/></svg>,
  bus:        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true"><rect x="3" y="8" width="30" height="20" rx="3" fill="#F5C400"/><rect x="5" y="10" width="8" height="6" rx="1" fill="#0F2044"/><rect x="15" y="10" width="8" height="6" rx="1" fill="#0F2044"/><rect x="25" y="10" width="6" height="6" rx="1" fill="#0F2044"/><rect x="3" y="24" width="30" height="4" rx="1" fill="#D4A800"/><circle cx="9" cy="29" r="3" fill="#0F2044" stroke="#F5C400" strokeWidth="1.5"/><circle cx="27" cy="29" r="3" fill="#0F2044" stroke="#F5C400" strokeWidth="1.5"/><rect x="5" y="19" width="26" height="3" rx="1" fill="#0F2044" opacity=".2"/></svg>,
  busLarge:   <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="4" y="10" width="40" height="26" rx="4" fill="#0F2044"/><rect x="6" y="13" width="10" height="8" rx="1.5" fill="#F5C400"/><rect x="19" y="13" width="10" height="8" rx="1.5" fill="#F5C400"/><rect x="32" y="13" width="10" height="8" rx="1.5" fill="#F5C400"/><rect x="4" y="32" width="40" height="4" rx="1" fill="#0F2044"/><circle cx="12" cy="38" r="4" fill="#263F6B" stroke="#F5C400" strokeWidth="2"/><circle cx="36" cy="38" r="4" fill="#263F6B" stroke="#F5C400" strokeWidth="2"/><rect x="6" y="24" width="36" height="4" rx="1" fill="#F5C400" opacity=".25"/><path d="M4 22h40" stroke="#F5C400" strokeWidth="1" opacity=".4"/></svg>,
  lock:       <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#0F2044" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="8" y="20" width="28" height="18" rx="3"/><path d="M14 20v-6a8 8 0 0116 0v6"/><circle cx="22" cy="30" r="2" fill="#0F2044"/></svg>,
  warn:       <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 4L38 34H2L20 4z" fill="#FEF3C7" stroke="#B45309" strokeWidth="2"/><path d="M20 16v8" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round"/><circle cx="20" cy="28" r="1.5" fill="#B45309"/></svg>,
  inbox:      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#8A96AA" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="3" y="6" width="30" height="24" rx="2"/><path d="M3 22h8l3 4h8l3-4h8"/></svg>,
  megaphone:  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M3 6v4h2l5 3V3L5 6H3z"/><path d="M12 5.5c.8.6 1.3 1.5 1.3 2.5s-.5 1.9-1.3 2.5"/></svg>,
  link:       <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M6.5 4H4a3 3 0 000 6h2.5M9.5 12H12a3 3 0 000-6H9.5M5 8h6"/></svg>,
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 18, r = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg,#EBF0F8 25%,#F5F8FD 50%,#EBF0F8 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
    }} aria-hidden="true" />
  )
}

// ─── T8: Log automático de historial_cambios ─────────────────────────────────
// Función utilitaria reutilizable en toda la app.
// Llámala después de cualquier mutación importante sin await si no necesitas
// el resultado (fire-and-forget), o con await si debes serializar.
async function logCambio({ entidad, entidad_id, campo, valor_anterior = null, valor_nuevo, realizado_por }) {
  try {
    await supabase.from('historial_cambios').insert({
      entidad,
      entidad_id,
      campo,
      valor_anterior: valor_anterior !== null ? JSON.stringify(valor_anterior) : null,
      valor_nuevo:    JSON.stringify(valor_nuevo),
      realizado_por,
    })
  } catch (_) {
    // historial es best-effort: nunca interrumpir el flujo principal
  }
}

// ─── T4 / T5: Componente reutilizable HistorialCambios ───────────────────────
// Se usa en Perfil del transportista (T4) y en PortalApoderado (T5).
// entidad: string — filtra historial_cambios.entidad
// entidad_id: string | null — null = todos los del user_id propietario
// propietario_id: string — user_id del que realizó los cambios (columna realizado_por)
export function HistorialCambios({ propietario_id, entidad, entidad_id = null }) {
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando]   = useState(true)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      let q = supabase
        .from('historial_cambios')
        .select('id, entidad, entidad_id, campo, valor_anterior, valor_nuevo, created_at')
        .eq('realizado_por', propietario_id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (entidad)    q = q.eq('entidad', entidad)
      if (entidad_id) q = q.eq('entidad_id', entidad_id)
      const { data } = await q
      setHistorial(data || [])
      setCargando(false)
    }
    if (propietario_id) cargar()
  }, [propietario_id, entidad, entidad_id])

  const labelCampo = {
    registro: 'Registro inicial',
    colegio_id: 'Cambio de establecimiento',
    nombre: 'Nombre actualizado',
    telefono: 'Teléfono actualizado',
    visible: 'Visibilidad marketplace',
    precios_publicos: 'Precios públicos',
    solicitud_enviada: 'Solicitud de cupo enviada',
    solicitud_aceptada: 'Solicitud aceptada',
    solicitud_rechazada: 'Solicitud rechazada',
    creacion: 'Creación de registro',
  }

  function parsearValor(v) {
    if (v === null || v === undefined) return '—'
    try {
      const parsed = JSON.parse(v)
      if (typeof parsed === 'object') return Object.entries(parsed).map(([k, val]) => `${k}: ${val}`).join(', ')
      return String(parsed)
    } catch { return String(v) }
  }

  if (cargando) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-busy="true">
      {[1,2,3].map(i => <Skeleton key={i} w="100%" h={44} r={8} />)}
    </div>
  )

  if (historial.length === 0) return (
    <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: 13 }}>
      Aún no hay registros de actividad.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {historial.map(h => (
        <div key={h.id} style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F2044' }}>
              {labelCampo[h.campo] || h.campo}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
              {new Date(h.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          </div>
          {(h.valor_anterior !== null || h.valor_nuevo !== null) && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {h.valor_anterior !== null && (
                <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 4, padding: '1px 6px' }}>
                  Antes: {parsearValor(h.valor_anterior)}
                </span>
              )}
              {h.valor_nuevo !== null && (
                <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 4, padding: '1px 6px' }}>
                  Ahora: {parsearValor(h.valor_nuevo)}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Apoderados ───────────────────────────────────────────────────────────────
function Apoderados() {
  const [lista, setLista]         = useState([])
  const [cargando, setCargando]   = useState(true)
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState({ nombre: '', telefono: '', email: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data } = await supabase.from('apoderados').select('*').order('nombre')
    setLista(data || [])
    setCargando(false)
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const abrirNuevo  = () => { setForm({ nombre: '', telefono: '', email: '' }); setError(''); setModal('nuevo') }
  const abrirEditar = (ap) => { setForm({ nombre: ap.nombre, telefono: ap.telefono || '', email: ap.email || '' }); setError(''); setModal(ap) }
  const cerrar      = () => { setModal(false); setError('') }

  const guardar = async (e) => {
    e.preventDefault()
    const nombre = form.nombre.trim()
    if (!nombre) { setError('El nombre es obligatorio'); return }
    setGuardando(true); setError('')
    if (modal === 'nuevo') {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: err } = await supabase.from('apoderados').insert({ ...form, nombre, user_id: user.id })
      if (err) { setError('Error al guardar'); setGuardando(false); return }
    } else {
      const { error: err } = await supabase.from('apoderados').update({ ...form, nombre }).eq('id', modal.id)
      if (err) { setError('Error al actualizar'); setGuardando(false); return }
    }
    setGuardando(false); cerrar(); cargar()
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este apoderado?')) return
    await supabase.from('apoderados').delete().eq('id', id)
    cargar()
  }

  return (
    <div style={s.vista}>
      <style>{`@keyframes shimmer{to{background-position:-200% 0}}.btn-icon:hover{opacity:.65}.fila:hover{background:#F2F5FA}`}</style>
      <div style={s.vistaHeader}>
        <h2 style={s.vtitulo}>Apoderados</h2>
        <button style={s.btnPrimario} onClick={abrirNuevo} aria-label="Agregar apoderado">+ Agregar</button>
      </div>

      {cargando ? (
        <div style={s.skeletonWrap} aria-busy="true">
          {[1, 2, 3].map(i => (
            <div key={i} style={s.skeletonFila}>
              <Skeleton w={140} h={16} />
              <Skeleton w={100} h={14} />
              <Skeleton w={160} h={14} />
            </div>
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div style={s.vacio} role="status">
          <span style={{ display: 'inline-flex', marginBottom: 12, color: '#8A96AA' }}>{IC.apoderados}</span>
          <p>Aún no hay apoderados.<br />Agrega el primero.</p>
        </div>
      ) : (
        <div style={s.tabla} role="table" aria-label="Lista de apoderados">
          <div style={s.tablaHead} role="row">
            <span role="columnheader">Nombre</span>
            <span role="columnheader">Teléfono</span>
            <span role="columnheader">Email</span>
            <span role="columnheader" aria-label="Acciones" />
          </div>
          {lista.map(ap => (
            <div key={ap.id} className="fila" style={s.tablaFila} role="row">
              <span style={s.celNombre} role="cell">{ap.nombre}</span>
              <span style={s.cel} role="cell">{ap.telefono || '—'}</span>
              <span style={s.cel} role="cell">{ap.email || '—'}</span>
              <span style={s.celAcciones} role="cell">
                <button className="btn-icon" style={s.btnIcono} onClick={() => abrirEditar(ap)} aria-label={`Editar ${ap.nombre}`}>{IC.edit}</button>
                <button className="btn-icon" style={{ ...s.btnIcono, color: '#C0202F' }} onClick={() => eliminar(ap.id)} aria-label={`Eliminar ${ap.nombre}`}>{IC.trash}</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={s.modalFondo} role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) cerrar() }}>
          <div style={s.modalCard}>
            <h3 style={s.modalTitulo}>{modal === 'nuevo' ? 'Nuevo apoderado' : 'Editar apoderado'}</h3>
            <form onSubmit={guardar} style={s.form} noValidate>
              <label style={s.label} htmlFor="ap-nombre">Nombre <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span></label>
              <input id="ap-nombre" style={s.input} type="text" placeholder="Nombre completo" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required autoFocus maxLength={120} />
              <label style={s.label} htmlFor="ap-tel">Teléfono</label>
              <input id="ap-tel" style={s.input} type="tel" placeholder="+56 9 1234 5678" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} maxLength={20} />
              <label style={s.label} htmlFor="ap-email">Email</label>
              <input id="ap-email" style={s.input} type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} maxLength={120} />
              {error && <p style={s.errorMsg} role="alert">{error}</p>}
              <div style={s.modalBtns}>
                <button type="button" style={s.btnSecundario} onClick={cerrar}>Cancelar</button>
                <button type="submit" style={s.btnPrimario} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Alumnos ──────────────────────────────────────────────────────────────────
function Alumnos() {
  const [lista, setLista]           = useState([])
  const [apoderados, setApoderados] = useState([])
  const [colegios, setColegios]     = useState([])   // T6: catálogo de colegios
  const [cargando, setCargando]     = useState(true)
  const [modal, setModal]           = useState(false)
  const [form, setForm]             = useState({ nombre: '', apoderado_id: '', colegio_id: '', monto: '', activo: true })
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    const [{ data: alumnos }, { data: apods }, { data: cols }] = await Promise.all([
      supabase.from('alumnos').select('*, apoderados(nombre), colegios(nombre)').order('nombre'),
      supabase.from('apoderados').select('id, nombre').order('nombre'),
      supabase.from('colegios').select('id, nombre').eq('activo', true).order('nombre'),
    ])
    setLista(alumnos || [])
    setApoderados(apods || [])
    setColegios(cols || [])
    setCargando(false)
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const abrirNuevo  = () => { setForm({ nombre: '', apoderado_id: apoderados[0]?.id || '', colegio_id: '', monto: '', activo: true }); setError(''); setModal('nuevo') }
  const abrirEditar = (al) => { setForm({ nombre: al.nombre, apoderado_id: al.apoderado_id, colegio_id: al.colegio_id || '', monto: String(al.monto), activo: al.activo }); setError(''); setModal(al) }
  const cerrar      = () => { setModal(false); setError('') }

  const guardar = async (e) => {
    e.preventDefault()
    const nombre = form.nombre.trim()
    const monto  = parseFloat(form.monto)
    if (!nombre)                   { setError('El nombre es obligatorio'); return }
    if (!form.apoderado_id)        { setError('Selecciona un apoderado'); return }
    if (isNaN(monto) || monto < 0) { setError('Ingresa un monto válido'); return }
    setGuardando(true); setError('')
    const payload = { nombre, apoderado_id: form.apoderado_id, colegio_id: form.colegio_id || null, monto, activo: form.activo }
    const { data: { user } } = await supabase.auth.getUser()
    if (modal === 'nuevo') {
      const { error: err } = await supabase.from('alumnos').insert({ ...payload, user_id: user.id })
      if (err) { setError('Error al guardar'); setGuardando(false); return }
      // T8: log creación alumno
      logCambio({ entidad: 'alumno', entidad_id: user.id, campo: 'creacion', valor_nuevo: { nombre, colegio_id: payload.colegio_id }, realizado_por: user.id })
    } else {
      const colegioAnterior = modal.colegio_id
      const { error: err } = await supabase.from('alumnos').update(payload).eq('id', modal.id)
      if (err) { setError('Error al actualizar'); setGuardando(false); return }
      // T8: log cambio de establecimiento si cambió
      if (colegioAnterior !== payload.colegio_id) {
        logCambio({ entidad: 'alumno', entidad_id: modal.id, campo: 'colegio_id', valor_anterior: colegioAnterior, valor_nuevo: payload.colegio_id, realizado_por: user.id })
      }
    }
    setGuardando(false); cerrar(); cargar()
  }

  const eliminar     = async (id) => { if (!window.confirm('¿Eliminar este alumno?')) return; await supabase.from('alumnos').delete().eq('id', id); cargar() }
  const toggleActivo = async (al)  => { await supabase.from('alumnos').update({ activo: !al.activo }).eq('id', al.id); cargar() }

  const copiarLinkInvitacion = async (al) => {
    // Genera key si no tiene
    let key = al.alumno_key
    if (!key) {
      key = crypto.randomUUID().replace(/-/g,'').substring(0,16)
      await supabase.from('alumnos').update({ alumno_key: key }).eq('id', al.id)
    }
    const base = process.env.REACT_APP_PORTAL_URL || `${window.location.origin}/portal`
    const link = `${base}?key=${key}&modo=registro`
    try {
      await navigator.clipboard.writeText(link)
      alert('✅ Link copiado al portapapeles')
    } catch {
      prompt('Copia este link:', link)
    }
  }

  return (
    <div style={s.vista}>
      <div style={s.vistaHeader}>
        <h2 style={s.vtitulo}>Alumnos</h2>
        <button style={s.btnPrimario} onClick={abrirNuevo} aria-label="Agregar alumno">+ Agregar</button>
      </div>

      {cargando ? (
        <div style={s.skeletonWrap} aria-busy="true">
          {[1, 2, 3].map(i => (
            <div key={i} style={s.skeletonFila}>
              <Skeleton w={140} h={16} />
              <Skeleton w={120} h={14} />
              <Skeleton w={70} h={14} />
              <Skeleton w={60} h={22} r={20} />
            </div>
          ))}
        </div>
      ) : apoderados.length === 0 ? (
        <div style={s.vacio} role="status">
          <span style={{ display: 'inline-flex', marginBottom: 12 }}>{IC.warn}</span>
          <p>Primero debes agregar al menos un <strong>apoderado</strong>.</p>
        </div>
      ) : lista.length === 0 ? (
        <div style={s.vacio} role="status">
          <span style={{ display: 'inline-flex', marginBottom: 12, color: '#8A96AA' }}>{IC.alumnos}</span>
          <p>Aún no hay alumnos.<br />Agrega el primero.</p>
        </div>
      ) : (
        <div style={s.tabla} role="table" aria-label="Lista de alumnos">
          <div style={{ ...s.tablaHead, gridTemplateColumns: '1fr 1fr 1fr 100px 90px 110px' }} role="row">
            <span role="columnheader">Nombre</span>
            <span role="columnheader">Apoderado</span>
            <span role="columnheader">Establecimiento</span>
            <span role="columnheader">Monto</span>
            <span role="columnheader">Estado</span>
            <span role="columnheader" aria-label="Acciones" />
          </div>
          {lista.map(al => (
            <div key={al.id} className="fila" style={{ ...s.tablaFila, gridTemplateColumns: '1fr 1fr 1fr 100px 90px 110px', opacity: al.activo ? 1 : 0.55 }} role="row">
              <span style={s.celNombre} role="cell">{al.nombre}</span>
              <span style={s.cel} role="cell">{al.apoderados?.nombre || '—'}</span>
              <span style={s.cel} role="cell">{al.colegios?.nombre || <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: 12 }}>Sin asignar</span>}</span>
              <span style={s.cel} role="cell">${Number(al.monto).toLocaleString('es-CL')}</span>
              <span role="cell">
                <button
                  onClick={() => toggleActivo(al)}
                  style={{ ...s.badge, background: al.activo ? '#dcfce7' : '#f1f5f9', color: al.activo ? '#16a34a' : '#94a3b8', cursor: 'pointer', border: 'none' }}
                  aria-label={al.activo ? `Desactivar ${al.nombre}` : `Activar ${al.nombre}`}
                  aria-pressed={al.activo}
                >
                  {al.activo ? 'Activo' : 'Inactivo'}
                </button>
              </span>
              <span style={s.celAcciones} role="cell">
                <button className="btn-icon" style={{ ...s.btnIcono, color: '#0F2044' }} onClick={() => copiarLinkInvitacion(al)} aria-label={`Copiar link invitación ${al.nombre}`} title="Copiar link portal apoderado">{IC.link}</button>
                <button className="btn-icon" style={s.btnIcono} onClick={() => abrirEditar(al)} aria-label={`Editar ${al.nombre}`}>{IC.edit}</button>
                <button className="btn-icon" style={{ ...s.btnIcono, color: '#C0202F' }} onClick={() => eliminar(al.id)} aria-label={`Eliminar ${al.nombre}`}>{IC.trash}</button>
              </span>

            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={s.modalFondo} role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) cerrar() }}>
          <div style={s.modalCard}>
            <h3 style={s.modalTitulo}>{modal === 'nuevo' ? 'Nuevo alumno' : 'Editar alumno'}</h3>
            <form onSubmit={guardar} style={s.form} noValidate>
              <label style={s.label} htmlFor="al-nombre">Nombre <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span></label>
              <input id="al-nombre" style={s.input} type="text" placeholder="Nombre completo" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required autoFocus maxLength={120} />
              <label style={s.label} htmlFor="al-apoderado">Apoderado <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span></label>
              <select id="al-apoderado" style={s.input} value={form.apoderado_id} onChange={e => setForm(f => ({ ...f, apoderado_id: e.target.value }))} required>
                <option value="">Seleccionar apoderado…</option>
                {apoderados.map(ap => <option key={ap.id} value={ap.id}>{ap.nombre}</option>)}
              </select>
              {/* T6: Campo establecimiento / colegio */}
              <label style={s.label} htmlFor="al-colegio">Establecimiento</label>
              <select id="al-colegio" style={s.input} value={form.colegio_id} onChange={e => setForm(f => ({ ...f, colegio_id: e.target.value }))}>
                <option value="">Sin asignar</option>
                {colegios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <label style={s.label} htmlFor="al-monto">Monto mensual (CLP) <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span></label>
              <input id="al-monto" style={s.input} type="number" placeholder="50000" min="0" step="1000" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} required />
              <label style={s.label} htmlFor="al-activo">Estado</label>
              <select id="al-activo" style={s.input} value={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.value === 'true' }))}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
              {error && <p style={s.errorMsg} role="alert">{error}</p>}
              <div style={s.modalBtns}>
                <button type="button" style={s.btnSecundario} onClick={cerrar}>Cancelar</button>
                <button type="submit" style={s.btnPrimario} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Cobros ───────────────────────────────────────────────────────────────────
function mesLabel(mesStr) {
  const [y, m] = mesStr.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
}

// Genera lista de meses entre dos YYYY-MM (inclusive)
function mesesEntre(desde, hasta) {
  const meses = []
  let [y, m] = desde.split('-').map(Number)
  const [yh, mh] = hasta.split('-').map(Number)
  while (y < yh || (y === yh && m <= mh)) {
    meses.push(`${y}-${String(m).padStart(2, '0')}`)
    m++; if (m > 12) { m = 1; y++ }
  }
  return meses
}

function Cobros() {
  const ahora  = new Date()
  const mesHoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`

  const [mes, setMes]             = useState(mesHoy)
  const [lista, setLista]         = useState([])
  const [cargando, setCargando]   = useState(true)
  const [generando, setGenerando] = useState(false)
  const [msg, setMsg]             = useState('')
  const [editando, setEditando]   = useState(null)
  const [montoEdit, setMontoEdit] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [pagandoFlow, setPagandoFlow] = useState(new Set())
  // Multi-mes
  const [modoMulti, setModoMulti] = useState(false)
  const [mesDesde, setMesDesde]   = useState(mesHoy)
  const [mesHasta, setMesHasta]   = useState(mesHoy)

  const cargar = useCallback(async () => {
    setCargando(true)
    const desde = `${mes}-01`
    const hasta = `${mes}-31`
    const { data } = await supabase
      .from('cobros')
      .select('*, alumnos(nombre, monto, apoderados(nombre))')
      .gte('mes', desde)
      .lte('mes', hasta)
      .order('estado')
      .order('created_at')
    setLista(data || [])
    setCargando(false)
  }, [mes])

  useEffect(() => { cargar() }, [cargar])

  const generar = async () => {
    setGenerando(true); setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data: alumnos } = await supabase.from('alumnos').select('id, monto').eq('activo', true)
    if (!alumnos || alumnos.length === 0) {
      setMsg('No hay alumnos activos.')
      setGenerando(false)
      return
    }

    // Determinar qué meses generar
    const meses = modoMulti ? mesesEntre(mesDesde, mesHasta) : [mes]
    if (meses.length === 0) { setMsg('Rango de meses inválido.'); setGenerando(false); return }

    let totalGenerados = 0
    let totalExistentes = 0

    for (const m of meses) {
      const mesDate = `${m}-01`
      const { data: existentes } = await supabase.from('cobros').select('alumno_id').eq('mes', mesDate)
      const yaExisten = new Set((existentes || []).map(c => c.alumno_id))
      const nuevos = alumnos
        .filter(a => !yaExisten.has(a.id))
        .map(a => ({ user_id: user.id, alumno_id: a.id, mes: mesDate, monto: a.monto, estado: 'pendiente' }))
      if (nuevos.length > 0) {
        await supabase.from('cobros').insert(nuevos)
        totalGenerados += nuevos.length
      } else {
        totalExistentes++
      }
    }

    if (totalGenerados === 0) {
      setMsg(`Los cobros de ${meses.length === 1 ? 'este mes' : 'esos meses'} ya fueron generados.`)
    } else {
      const extra = totalExistentes > 0 ? ` (${totalExistentes} mes${totalExistentes > 1 ? 'es' : ''} ya existía)` : ''
      setMsg(`✅ ${totalGenerados} cobro(s) generado(s) en ${meses.length} mes(es).${extra}`)
    }
    setGenerando(false)
    cargar()
  }

  const togglePagado = async (cobro) => {
    const nuevo = cobro.estado === 'pagado' ? 'pendiente' : 'pagado'
    await supabase.from('cobros').update({
      estado:    nuevo,
      pagado_at: nuevo === 'pagado' ? new Date().toISOString() : null,
    }).eq('id', cobro.id)
    cargar()
  }

  const abrirEditar = (cobro) => {
    setEditando(cobro)
    setMontoEdit(String(cobro.monto))
  }

  const guardarMonto = async () => {
    const nuevo = parseInt(montoEdit.replace(/\D/g, ''), 10)
    if (!nuevo || nuevo <= 0) return
    setGuardando(true)
    await supabase.from('cobros').update({ monto: nuevo }).eq('id', editando.id)
    setGuardando(false)
    setEditando(null)
    cargar()
  }

  const cobrarFlow = async (cobro) => {
    setPagandoFlow(prev => new Set([...prev, cobro.id]))
    setMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setMsg('Error: sesión no válida'); return }

      const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || supabase.supabaseUrl
      const res = await fetch(`${SUPABASE_URL}/functions/v1/flow-crear-pago`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cobro_id: cobro.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setMsg(`Error Flow: ${data.error || 'sin respuesta'}`)
        return
      }
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setMsg(`Error: ${e.message}`)
    } finally {
      setPagandoFlow(prev => { const s = new Set(prev); s.delete(cobro.id); return s })
    }
  }

  const totalMes       = lista.reduce((acc, c) => acc + Number(c.monto), 0)
  const totalPagado    = lista.filter(c => c.estado === 'pagado').reduce((acc, c) => acc + Number(c.monto), 0)
  const totalPendiente = totalMes - totalPagado

  return (
    <div style={s.vista}>

      {/* Modal editar monto */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          role="dialog" aria-modal="true" aria-label="Editar monto">
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 320, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, color: '#0F2044' }}>Editar monto</h3>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748b' }}>{editando.alumnos?.nombre}</p>
            <label htmlFor="monto-edit" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Monto ($)</label>
            <input
              id="monto-edit"
              type="number"
              min="1"
              style={{ ...s.input, width: '100%', boxSizing: 'border-box', fontSize: 16, marginBottom: 18 }}
              value={montoEdit}
              onChange={e => setMontoEdit(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') guardarMonto() }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={s.btnSecundario} onClick={() => setEditando(null)} disabled={guardando}>Cancelar</button>
              <button style={s.btnPrimario} onClick={guardarMonto} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={s.vistaHeader}>
        <h2 style={s.vtitulo}>Cobros</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Selector de mes para visualizar */}
          <label htmlFor="sel-mes" style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Ver mes:</label>
          <input
            id="sel-mes"
            type="month"
            style={{ ...s.input, padding: '7px 10px', fontSize: 13 }}
            value={mes}
            onChange={e => setMes(e.target.value)}
            aria-label="Seleccionar mes a visualizar"
          />
          {/* Toggle modo multi-mes */}
          <button
            onClick={() => setModoMulti(v => !v)}
            style={{ ...s.btnSecundario, fontSize: 12, padding: '6px 12px', background: modoMulti ? '#EBF2FF' : undefined, color: modoMulti ? '#0F2044' : undefined, fontWeight: modoMulti ? 700 : 500 }}
            aria-pressed={modoMulti}
            aria-label="Generar múltiples meses"
          >
            {modoMulti ? '▲ Un mes' : '▼ Varios meses'}
          </button>
        </div>

        {/* Panel generar — se expande al activar multi-mes */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          {modoMulti ? (
            <>
              <label htmlFor="gen-desde" style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Desde:</label>
              <input
                id="gen-desde"
                type="month"
                style={{ ...s.input, padding: '7px 10px', fontSize: 13 }}
                value={mesDesde}
                onChange={e => setMesDesde(e.target.value)}
                aria-label="Mes inicial para generación"
              />
              <label htmlFor="gen-hasta" style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Hasta:</label>
              <input
                id="gen-hasta"
                type="month"
                style={{ ...s.input, padding: '7px 10px', fontSize: 13 }}
                value={mesHasta}
                min={mesDesde}
                onChange={e => setMesHasta(e.target.value)}
                aria-label="Mes final para generación"
              />
              <button style={s.btnPrimario} onClick={generar} disabled={generando || mesHasta < mesDesde} aria-label="Generar cobros del rango de meses">
                {generando ? 'Generando…' : `Generar ${mesesEntre(mesDesde, mesHasta).length} mes(es)`}
              </button>
            </>
          ) : (
            <button style={s.btnPrimario} onClick={generar} disabled={generando} aria-label="Generar cobros del mes">
              {generando ? 'Generando…' : 'Generar mes'}
            </button>
          )}
        </div>
      </div>

      {msg && (
        <p style={{ ...s.errorMsg, color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', marginBottom: 12 }} role="status">
          {msg}
        </p>
      )}

      {!cargando && lista.length > 0 && (
        <div style={s.resumenRow}>
          <div style={{ ...s.resumenCard, background: '#0F2044', minWidth: 160 }}>
            <span style={{ ...s.resumenLabel, color: '#a8c0dd' }}>Total mes</span>
            <span style={{ ...s.resumenValor, color: '#fff' }}>${totalMes.toLocaleString('es-CL')}</span>
          </div>
          <div style={{ ...s.resumenCard, background: '#dcfce7', border: '1px solid #bbf7d0' }}>
            <span style={{ ...s.resumenLabel, color: '#166534' }}>Pagado</span>
            <span style={{ ...s.resumenValor, color: '#16a34a' }}>${totalPagado.toLocaleString('es-CL')}</span>
          </div>
          <div style={{ ...s.resumenCard, background: '#fef9c3', border: '1px solid #fde68a' }}>
            <span style={{ ...s.resumenLabel, color: '#92400e' }}>Pendiente</span>
            <span style={{ ...s.resumenValor, color: '#b45309' }}>${totalPendiente.toLocaleString('es-CL')}</span>
          </div>
        </div>
      )}

      {cargando ? (
        <div style={s.skeletonWrap} aria-busy="true">
          {[1, 2, 3].map(i => (
            <div key={i} style={s.skeletonFila}>
              <Skeleton w={140} h={16} />
              <Skeleton w={100} h={14} />
              <Skeleton w={80} h={14} />
              <Skeleton w={70} h={24} r={20} />
            </div>
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div style={s.vacio} role="status">
          <span style={{ display: 'inline-flex', marginBottom: 12, color: '#8A96AA' }}>{IC.cobros}</span>
          <p>
            No hay cobros para <strong>{mesLabel(mes)}</strong>.<br />
            Presiona <em>{modoMulti ? 'Generar mes(es)' : 'Generar mes'}</em> para crearlos.
          </p>
        </div>
      ) : (
        <div style={s.tabla} role="table" aria-label="Cobros del mes">
          <div style={{ ...s.tablaHead, gridTemplateColumns: '1fr 1fr 130px 110px 90px 110px' }} role="row">
            <span role="columnheader">Alumno</span>
            <span role="columnheader">Apoderado</span>
            <span role="columnheader">Monto</span>
            <span role="columnheader">Estado</span>
            <span role="columnheader">Editar</span>
            <span role="columnheader">Cobrar</span>
          </div>
          {lista.map(c => (
            <div key={c.id} className="fila" style={{ ...s.tablaFila, gridTemplateColumns: '1fr 1fr 130px 110px 90px 110px', opacity: c.estado === 'pagado' ? 0.85 : 1 }} role="row">
              <span style={s.celNombre} role="cell">{c.alumnos?.nombre || '—'}</span>
              <span style={s.cel} role="cell">{c.alumnos?.apoderados?.nombre || '—'}</span>
              <span style={{ ...s.cel, fontWeight: 600 }} role="cell">${Number(c.monto).toLocaleString('es-CL')}</span>
              <span role="cell">
                <button
                  onClick={() => togglePagado(c)}
                  style={{
                    ...s.badge, cursor: 'pointer', border: 'none',
                    background: c.estado === 'pagado' ? '#dcfce7' : c.estado === 'anulado' ? '#fee2e2' : '#fef9c3',
                    color:      c.estado === 'pagado' ? '#16a34a' : c.estado === 'anulado' ? '#dc2626' : '#b45309',
                  }}
                  aria-label={c.estado === 'pagado' ? `Marcar pendiente ${c.alumnos?.nombre}` : `Marcar pagado ${c.alumnos?.nombre}`}
                  aria-pressed={c.estado === 'pagado'}
                  disabled={c.estado === 'anulado'}
                >
                  {c.estado === 'pagado' ? '✓ Pagado' : c.estado === 'anulado' ? 'Anulado' : 'Pendiente'}
                </button>
              </span>
              <span role="cell">
                <button
                  onClick={() => abrirEditar(c)}
                  style={{ background: '#f1f5f9', border: '1px solid #dde4ef', cursor: 'pointer', fontSize: 13, padding: '5px 10px', borderRadius: 6, color: '#374151', fontWeight: 500 }}
                  aria-label={`Editar monto de ${c.alumnos?.nombre}`}
                >Editar</button>
              </span>
              <span role="cell">
                {c.estado !== 'pagado' && c.estado !== 'anulado' ? (
                  <button
                    onClick={() => cobrarFlow(c)}
                    disabled={pagandoFlow.has(c.id)}
                    style={{ background: pagandoFlow.has(c.id) ? '#7A9CC8' : '#0F2044', border: 'none', cursor: pagandoFlow.has(c.id) ? 'wait' : 'pointer', fontSize: 13, padding: '5px 10px', borderRadius: 6, color: '#fff', fontWeight: 600, opacity: pagandoFlow.has(c.id) ? 0.7 : 1 }}
                    aria-label={`Cobrar por Flow a ${c.alumnos?.nombre}`}
                  >{pagandoFlow.has(c.id) ? 'Enviando…' : 'Cobrar'}</button>
                ) : (
                  <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>—</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Rutas ────────────────────────────────────────────────────────────────────
function Rutas() {
  const [lista, setLista]                 = useState([])
  const [cargando, setCargando]           = useState(true)
  const [modal, setModal]                 = useState(false)
  const [form, setForm]                   = useState({})
  const [editId, setEditId]               = useState(null)
  const [token, setToken]                 = useState(null)
  const [copiado, setCopiado]             = useState(false)
  // Estado para panel de alumnos por ruta
  const [rutaExpandida, setRutaExpandida] = useState(null)
  const [rutaAlumnos, setRutaAlumnos]     = useState({})    // { rutaId: [{id,nombre,orden,direccion_parada,ruta_alumno_id}] }
  const [cargandoAlumnos, setCargandoAl]  = useState({})
  // Modal agregar alumno a ruta
  const [modalAlumno, setModalAlumno]     = useState(null)  // rutaId activo
  const [alumnosDisponibles, setAlumnosD] = useState([])
  const [formAlumno, setFormAlumno]       = useState({ alumno_id: '', direccion_parada: '', referencia: '' })
  const [guardandoAlumno, setGuardandoAl] = useState(false)
  const [errorAlumno, setErrorAlumno]     = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: rutas }, { data: inv }] = await Promise.all([
      supabase.from('rutas').select('*').eq('user_id', user.id).order('nombre'),
      supabase.from('invitaciones').select('token').eq('user_id', user.id).eq('activo', true).limit(1)
    ])
    setLista(rutas || [])
    setToken(inv && inv.length > 0 ? inv[0].token : null)
    setCargando(false)
  }, [])

  // Cargar alumnos de una ruta específica
  const cargarAlumnosDeRuta = useCallback(async (rutaId) => {
    setCargandoAl(prev => ({ ...prev, [rutaId]: true }))
    const { data } = await supabase
      .from('ruta_alumnos')
      .select('id, orden, direccion_parada, referencia, alumnos(id, nombre)')
      .eq('ruta_id', rutaId)
      .eq('activo', true)
      .order('orden')
    const mapped = (data || []).map(ra => ({
      ruta_alumno_id: ra.id,
      id:              ra.alumnos.id,
      nombre:          ra.alumnos.nombre,
      orden:           ra.orden,
      direccion_parada: ra.direccion_parada || '',
    }))
    setRutaAlumnos(prev => ({ ...prev, [rutaId]: mapped }))
    setCargandoAl(prev => ({ ...prev, [rutaId]: false }))
    return mapped
  }, [])

  const toggleExpandida = async (rutaId) => {
    if (rutaExpandida === rutaId) {
      setRutaExpandida(null)
    } else {
      setRutaExpandida(rutaId)
      if (!rutaAlumnos[rutaId]) await cargarAlumnosDeRuta(rutaId)
    }
  }

  // Abrir modal para agregar alumno
  const abrirModalAlumno = async (rutaId) => {
    const { data: { user } } = await supabase.auth.getUser()
    // Traer alumnos que aún no están en esta ruta
    const yaEnRuta = (rutaAlumnos[rutaId] || []).map(a => a.id)
    const { data } = await supabase.from('alumnos').select('id, nombre').eq('user_id', user.id).eq('activo', true).order('nombre')
    setAlumnosD((data || []).filter(a => !yaEnRuta.includes(a.id)))
    setFormAlumno({ alumno_id: '', direccion_parada: '', referencia: '' })
    setErrorAlumno('')
    setModalAlumno(rutaId)
  }

  const agregarAlumnoARuta = async (e) => {
    e.preventDefault()
    if (!formAlumno.alumno_id) { setErrorAlumno('Selecciona un alumno'); return }
    setGuardandoAl(true); setErrorAlumno('')
    const ordenActual = (rutaAlumnos[modalAlumno] || []).length + 1
    const { error } = await supabase.from('ruta_alumnos').insert({
      ruta_id:          modalAlumno,
      alumno_id:        formAlumno.alumno_id,
      orden:            ordenActual,
      direccion_parada: formAlumno.direccion_parada || null,
      referencia:       formAlumno.referencia || null,
    })
    if (error) {
      setErrorAlumno(error.code === '23505' ? 'Este alumno ya está en la ruta' : 'Error al agregar')
      setGuardandoAl(false)
      return
    }
    await cargarAlumnosDeRuta(modalAlumno)
    setGuardandoAl(false)
    setModalAlumno(null)
  }

  const quitarAlumnoDeRuta = async (rutaAlumnoId) => {
    if (!window.confirm('¿Quitar este alumno de la ruta?')) return
    await supabase.from('ruta_alumnos').update({ activo: false }).eq('id', rutaAlumnoId)
    // Refrescar la ruta expandida
    if (rutaExpandida) await cargarAlumnosDeRuta(rutaExpandida)
  }

  const moverAlumno = async (rutaId, idx, dir) => {
    const arr = [...(rutaAlumnos[rutaId] || [])]
    const nuevo = idx + dir
    if (nuevo < 0 || nuevo >= arr.length) return
    // Intercambiar órdenes
    const [a, b] = [arr[idx], arr[nuevo]]
    await Promise.all([
      supabase.from('ruta_alumnos').update({ orden: b.orden }).eq('id', a.ruta_alumno_id),
      supabase.from('ruta_alumnos').update({ orden: a.orden }).eq('id', b.ruta_alumno_id),
    ])
    await cargarAlumnosDeRuta(rutaId)
  }

  useEffect(() => { cargar() }, [cargar])

  const generarToken = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('invitaciones')
      .insert({ user_id: user.id })
      .select('token')
      .single()
    if (data) setToken(data.token)
  }

  const linkRegistro = token
    ? `${process.env.REACT_APP_URL || window.location.origin}/registro/${token}`
    : null

  const copiarLink = () => {
    if (!linkRegistro) return
    navigator.clipboard.writeText(linkRegistro).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  const abrirNuevo = () => {
    setForm({ nombre: '', direccion: '', horario_ida: '', horario_vuelta: '', capacidad: 10 })
    setEditId(null)
    setModal(true)
  }

  const abrirEditar = (r) => {
    setForm({ nombre: r.nombre, direccion: r.direccion || '', horario_ida: r.horario_ida || '', horario_vuelta: r.horario_vuelta || '', capacidad: r.capacidad })
    setEditId(r.id)
    setModal(true)
  }

  const cerrar = () => setModal(false)

  const guardar = async (e) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { ...form, user_id: user.id, capacidad: Number(form.capacidad) }
    if (editId) {
      await supabase.from('rutas').update(payload).eq('id', editId)
    } else {
      await supabase.from('rutas').insert(payload)
    }
    cerrar()
    cargar()
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta ruta?')) return
    await supabase.from('rutas').delete().eq('id', id)
    cargar()
  }

  return (
    <div style={s.vista}>
      <div style={s.vistaHeader}>
        <h2 style={s.vtitulo}>Mis Rutas</h2>
        <button style={s.btnPrimario} onClick={abrirNuevo}>+ Nueva ruta</button>
      </div>

      <div style={{ background: '#F2F5FA', border: '1px solid #C5D2E8', borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <p style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#0F2044' }}><span style={{ color: '#0F2044' }}>{IC.link}</span> Link de registro para apoderados</p>
        {token ? (
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                readOnly
                value={linkRegistro}
                style={{ ...s.input, flex: 1, minWidth: 200, fontSize: 12, color: '#374151', background: '#fff' }}
                aria-label="Link de registro"
              />
              <button style={s.btnSecundario} onClick={copiarLink}>
                {copiado ? '✓ Copiado' : 'Copiar link'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: '#fff', padding: 12, borderRadius: 8, display: 'inline-block' }}>
                <QRCode value={linkRegistro} size={160} level="M" />
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 8 }}>
              Comparte este QR o link con los apoderados para que se inscriban
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
              Genera tu link único para que los apoderados puedan inscribirse.
            </p>
            <button style={s.btnPrimario} onClick={generarToken}>Generar mi link y QR</button>
          </div>
        )}
      </div>

      {cargando ? (
        <div style={s.skeletonWrap} aria-busy="true">
          {[1, 2].map(i => (
            <div key={i} style={s.skeletonFila}>
              <Skeleton w={160} h={16} />
              <Skeleton w={120} h={14} />
            </div>
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div style={s.vacio} role="status">
          <span style={{ display: 'inline-flex', marginBottom: 12, color: '#8A96AA' }}>{IC.rutas}</span>
          <p>Aún no tienes rutas registradas.<br />Agrega los colegios a los que haces transporte.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lista.map(r => {
            const expandida = rutaExpandida === r.id
            const ralumnos  = rutaAlumnos[r.id] || []
            return (
              <div key={r.id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
                {/* Fila principal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0F2044' }}>{r.nombre}</div>
                    {r.direccion && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{r.direccion}</div>}
                    {(r.horario_ida || r.horario_vuelta) && (
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                        {r.horario_ida && `Ida ${r.horario_ida}`}{r.horario_ida && r.horario_vuelta && ' · '}{r.horario_vuelta && `Vuelta ${r.horario_vuelta}`}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <button
                      onClick={() => toggleExpandida(r.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: expandida ? '#EDF1F9' : '#fff', color: '#0F2044', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                      aria-expanded={expandida}
                      aria-label={`${expandida ? 'Ocultar' : 'Ver'} alumnos de ${r.nombre}`}
                    >
                      {IC.alumnos}
                      <span>{ralumnos.length > 0 ? `${ralumnos.length} alumno${ralumnos.length !== 1 ? 's' : ''}` : 'Alumnos'}</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transform: expandida ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} aria-hidden="true"><path d="M2 4l4 4 4-4"/></svg>
                    </button>
                    <button className="btn-icon" style={s.btnIcono} onClick={() => abrirEditar(r)} aria-label={`Editar ruta ${r.nombre}`}>{IC.edit}</button>
                    <button className="btn-icon" style={{ ...s.btnIcono, color: '#C0202F' }} onClick={() => eliminar(r.id)} aria-label={`Eliminar ruta ${r.nombre}`}>{IC.trash}</button>
                  </div>
                </div>

                {/* Panel de alumnos (expandible) */}
                {expandida && (
                  <div style={{ borderTop: '1px solid #F1F5F9', padding: '14px 16px', background: '#FAFBFE' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: .5 }}>
                        Orden de paradas
                      </p>
                      <button
                        onClick={() => abrirModalAlumno(r.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7, border: '1.5px solid #0F2044', background: 'transparent', color: '#0F2044', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                        aria-label={`Agregar alumno a ${r.nombre}`}
                      >
                        + Agregar alumno
                      </button>
                    </div>

                    {cargandoAlumnos[r.id] ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[1,2].map(i => <Skeleton key={i} w="100%" h={40} r={8} />)}
                      </div>
                    ) : ralumnos.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
                        Sin alumnos asignados. Agrega uno para poder usar el Ruteo.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {ralumnos.map((ra, idx) => (
                          <div key={ra.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#fff', borderRadius: 9, border: '1px solid #E8EDF5' }}>
                            {/* Controles de orden */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                              <button
                                onClick={() => moverAlumno(r.id, idx, -1)}
                                disabled={idx === 0}
                                style={{ padding: '2px 5px', border: '1px solid #e2e8f0', borderRadius: 4, background: idx === 0 ? '#f8fafc' : '#fff', color: idx === 0 ? '#cbd5e1' : '#475569', cursor: idx === 0 ? 'default' : 'pointer', lineHeight: 1 }}
                                aria-label="Subir en el orden"
                              >▲</button>
                              <button
                                onClick={() => moverAlumno(r.id, idx, 1)}
                                disabled={idx === ralumnos.length - 1}
                                style={{ padding: '2px 5px', border: '1px solid #e2e8f0', borderRadius: 4, background: idx === ralumnos.length - 1 ? '#f8fafc' : '#fff', color: idx === ralumnos.length - 1 ? '#cbd5e1' : '#475569', cursor: idx === ralumnos.length - 1 ? 'default' : 'pointer', lineHeight: 1 }}
                                aria-label="Bajar en el orden"
                              >▼</button>
                            </div>
                            {/* Número de parada */}
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0F2044', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                              {ra.orden}
                            </div>
                            {/* Info alumno */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#0F2044', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ra.nombre}</div>
                              {ra.direccion_parada && <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ra.direccion_parada}</div>}
                            </div>
                            {/* Quitar */}
                            <button
                              onClick={() => quitarAlumnoDeRuta(ra.ruta_alumno_id)}
                              style={{ padding: '4px 8px', border: 'none', borderRadius: 6, background: '#FFF1F2', color: '#C0202F', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}
                              aria-label={`Quitar ${ra.nombre} de la ruta`}
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal ruta */}
      {modal && (
        <div style={s.modalFondo} role="dialog" aria-modal="true" aria-label={editId ? 'Editar ruta' : 'Nueva ruta'} onClick={e => { if (e.target === e.currentTarget) cerrar() }}>
          <div style={s.modalCard}>
            <h3 style={s.modalTitulo}>{editId ? 'Editar ruta' : 'Nueva ruta'}</h3>
            <form onSubmit={guardar} style={s.form} noValidate>
              <label style={s.label} htmlFor="r-nombre">Nombre del colegio <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span></label>
              <input id="r-nombre" style={s.input} required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Colegio San Ignacio" autoFocus />
              <label style={s.label} htmlFor="r-dir">Dirección</label>
              <input id="r-dir" style={s.input} value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Ej: Av. España 123, Concepción" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={s.label} htmlFor="r-ida">Horario ida</label>
                  <input id="r-ida" type="time" style={{ ...s.input, marginTop: 4 }} value={form.horario_ida} onChange={e => setForm(f => ({ ...f, horario_ida: e.target.value }))} />
                </div>
                <div>
                  <label style={s.label} htmlFor="r-vuelta">Horario vuelta</label>
                  <input id="r-vuelta" type="time" style={{ ...s.input, marginTop: 4 }} value={form.horario_vuelta} onChange={e => setForm(f => ({ ...f, horario_vuelta: e.target.value }))} />
                </div>
              </div>
              <label style={s.label} htmlFor="r-cap">Capacidad (n° alumnos)</label>
              <input id="r-cap" type="number" min="1" max="50" style={s.input} value={form.capacidad} onChange={e => setForm(f => ({ ...f, capacidad: e.target.value }))} />
              <div style={s.modalBtns}>
                <button type="button" style={s.btnSecundario} onClick={cerrar}>Cancelar</button>
                <button type="submit" style={s.btnPrimario}>{editId ? 'Guardar cambios' : 'Agregar ruta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal agregar alumno a ruta */}
      {modalAlumno && (
        <div style={s.modalFondo} role="dialog" aria-modal="true" aria-label="Agregar alumno a ruta" onClick={e => { if (e.target === e.currentTarget) setModalAlumno(null) }}>
          <div style={s.modalCard}>
            <h3 style={s.modalTitulo}>Agregar alumno a ruta</h3>
            <form onSubmit={agregarAlumnoARuta} style={s.form} noValidate>
              <label style={s.label} htmlFor="ma-alumno">Alumno <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span></label>
              <select
                id="ma-alumno"
                style={s.input}
                value={formAlumno.alumno_id}
                onChange={e => setFormAlumno(f => ({ ...f, alumno_id: e.target.value }))}
                required
                autoFocus
              >
                <option value="">— Seleccionar alumno —</option>
                {alumnosDisponibles.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
              <label style={s.label} htmlFor="ma-dir">Dirección de parada</label>
              <input
                id="ma-dir"
                style={s.input}
                placeholder="Ej: Calle Los Robles 45"
                value={formAlumno.direccion_parada}
                onChange={e => setFormAlumno(f => ({ ...f, direccion_parada: e.target.value }))}
                maxLength={200}
              />
              <label style={s.label} htmlFor="ma-ref">Referencia (opcional)</label>
              <input
                id="ma-ref"
                style={s.input}
                placeholder="Ej: Frente al kiosko azul"
                value={formAlumno.referencia}
                onChange={e => setFormAlumno(f => ({ ...f, referencia: e.target.value }))}
                maxLength={200}
              />
              {errorAlumno && <p style={s.errorMsg} role="alert">{errorAlumno}</p>}
              <div style={s.modalBtns}>
                <button type="button" style={s.btnSecundario} onClick={() => setModalAlumno(null)}>Cancelar</button>
                <button type="submit" style={s.btnPrimario} disabled={guardandoAlumno}>{guardandoAlumno ? 'Agregando…' : 'Agregar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Asistencia ───────────────────────────────────────────────────────────────
function Asistencia() {
  const hoy = new Date().toISOString().split('T')[0]
  const [fecha, setFecha]         = useState(hoy)
  const [tipo, setTipo]           = useState('ida')
  const [alumnos, setAlumnos]     = useState([])
  const [asistencia, setAsist]    = useState({})
  const [cargando, setCargando]   = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg]             = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: als }, { data: asist }] = await Promise.all([
      supabase.from('alumnos').select('id, nombre, apoderados(nombre)').eq('user_id', user.id).eq('activo', true).order('nombre'),
      supabase.from('asistencia').select('alumno_id, presente').eq('fecha', fecha).eq('tipo', tipo).eq('user_id', user.id),
    ])
    setAlumnos(als || [])
    const map = {}
    ;(asist || []).forEach(a => { map[a.alumno_id] = a.presente })
    setAsist(map)
    setCargando(false)
  }, [fecha, tipo])

  useEffect(() => { cargar() }, [cargar])

  const toggle = (id) => setAsist(prev => ({ ...prev, [id]: prev[id] === false ? true : false }))

  const guardarAsistencia = async () => {
    setGuardando(true); setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    const registros = alumnos.map(al => ({
      user_id: user.id,
      alumno_id: al.id,
      fecha,
      tipo,
      presente: asistencia[al.id] !== false,
    }))
    const { error } = await supabase.from('asistencia').upsert(registros, { onConflict: 'alumno_id,fecha,tipo' })
    if (error) { setMsg('Error al guardar') } else { setMsg('✅ Asistencia guardada') }
    setGuardando(false)
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div style={s.vista}>
      <div style={s.vistaHeader}>
        <h2 style={s.vtitulo}>Asistencia</h2>
        <button style={s.btnPrimario} onClick={guardarAsistencia} disabled={guardando || alumnos.length === 0}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="date"
          value={fecha}
          max={hoy}
          onChange={e => setFecha(e.target.value)}
          style={{ ...s.input, padding: '8px 12px', fontSize: 13 }}
          aria-label="Fecha de asistencia"
        />
        <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1.5px solid #dde4ef' }}>
          {['ida', 'vuelta'].map(t => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              style={{ padding: '8px 18px', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: tipo === t ? '#0F2044' : '#fff',
                color: tipo === t ? '#fff' : '#4B5A75' }}
              aria-pressed={tipo === t}
            >
              {t === 'ida' ? 'Ida' : 'Vuelta'}
            </button>
          ))}
        </div>
      </div>

      {msg && <p style={{ ...s.errorMsg, color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', marginBottom: 12 }} role="status">{msg}</p>}

      {cargando ? (
        <div style={s.skeletonWrap} aria-busy="true">
          {[1,2,3].map(i => <div key={i} style={s.skeletonFila}><Skeleton w={160} h={16} /><Skeleton w={60} h={28} r={8} /></div>)}
        </div>
      ) : alumnos.length === 0 ? (
        <div style={s.vacio} role="status">
          <span style={{ display: 'inline-flex', marginBottom: 12, color: '#8A96AA' }}>{IC.alumnos}</span>
          <p>No hay alumnos activos registrados.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          {alumnos.map((al, i) => {
            const presente = asistencia[al.id] !== false
            return (
              <div key={al.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < alumnos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0F2044' }}>{al.nombre}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{al.apoderados?.nombre || '—'}</div>
                </div>
                <button
                  onClick={() => toggle(al.id)}
                  style={{ padding: '7px 18px', borderRadius: 20, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    background: presente ? '#dcfce7' : '#fee2e2',
                    color: presente ? '#16a34a' : '#dc2626' }}
                  aria-pressed={presente}
                  aria-label={presente ? `${al.nombre} presente` : `${al.nombre} ausente`}
                >
                  {presente ? '✓ Presente' : '✗ Ausente'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Avisos ───────────────────────────────────────────────────────────────────
const AVISOS_RAPIDOS = [
  { texto: 'En camino, llegaré pronto.' },
  { texto: 'Llegaré con retraso de aprox. 15 min.' },
  { texto: 'Hay tráfico. Aviso cuando salga.' },
  { texto: 'Ya salí, voy en camino.' },
]

function Avisos() {
  const [rutas, setRutas]         = useState([])
  const [lista, setLista]         = useState([])
  const [cargando, setCargando]   = useState(true)
  const [rutaId, setRutaId]       = useState('')
  const [mensaje, setMensaje]     = useState('')
  const [enviando, setEnviando]   = useState(false)
  const [msg, setMsg]             = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: rs }, { data: av }] = await Promise.all([
      supabase.from('rutas').select('id, nombre').eq('user_id', user.id).eq('activo', true).order('nombre'),
      supabase.from('avisos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ])
    setRutas(rs || [])
    setLista(av || [])
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const enviar = async () => {
    if (!mensaje.trim()) return
    setEnviando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('avisos').insert({
      user_id: user.id,
      ruta_id: rutaId || null,
      mensaje: mensaje.trim(),
    })
    if (error) { setMsg('Error al enviar aviso') } else { setMsg('✅ Aviso enviado'); setMensaje('') }
    setEnviando(false)
    setTimeout(() => setMsg(''), 3000)
    cargar()
  }

  const eliminar = async (id) => {
    await supabase.from('avisos').delete().eq('id', id)
    cargar()
  }

  const formatFecha = (iso) => new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div style={s.vista}>
      <h2 style={{ ...s.vtitulo, marginBottom: 20 }}>Avisos</h2>

      <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Avisos rápidos</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {AVISOS_RAPIDOS.map((a, i) => (
            <button
              key={i}
              onClick={() => setMensaje(a.texto)}
              style={{ padding: '8px 14px', borderRadius: 20, border: '1.5px solid #dde4ef',
                background: mensaje === a.texto ? '#eff6ff' : '#f8fafc',
                color: '#374151', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
            >
              {a.texto}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ ...s.label, marginBottom: 6, display: 'block' }} htmlFor="aviso-ruta">Ruta (opcional)</label>
          <select id="aviso-ruta" style={{ ...s.input, marginBottom: 12 }} value={rutaId} onChange={e => setRutaId(e.target.value)}>
            <option value="">Todas las rutas</option>
            {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
          <label style={{ ...s.label, marginBottom: 6, display: 'block' }} htmlFor="aviso-msg">Mensaje</label>
          <textarea
            id="aviso-msg"
            style={{ ...s.input, width: '100%', minHeight: 80, resize: 'vertical', boxSizing: 'border-box' }}
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            placeholder="Escribe un aviso para los apoderados…"
            maxLength={300}
          />
        </div>

        {msg && <p style={{ ...s.errorMsg, color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', marginBottom: 8 }} role="status">{msg}</p>}

        <button style={s.btnPrimario} onClick={enviar} disabled={enviando || !mensaje.trim()}>
          {enviando ? 'Enviando…' : 'Enviar aviso'}
        </button>
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Historial de avisos</p>
      {cargando ? (
        <div style={s.skeletonWrap}>{[1,2].map(i => <div key={i} style={s.skeletonFila}><Skeleton w="80%" h={14} /></div>)}</div>
      ) : lista.length === 0 ? (
        <div style={s.vacio}><span style={{ display: 'inline-flex', marginBottom: 12 }}>{IC.inbox}</span><p>No hay avisos enviados aún.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lista.map(av => (
            <div key={av.id} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <p style={{ fontSize: 14, color: '#0F2044', margin: '0 0 4px', fontWeight: 500 }}>{av.mensaje}</p>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{formatFecha(av.created_at)}</span>
              </div>
              <button onClick={() => eliminar(av.id)} style={{ ...s.btnIcono, color: '#C0202F' }} aria-label="Eliminar aviso">{IC.trash}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Home / Resumen general ───────────────────────────────────────────────────
// ─── Banner de perfil incompleto ─────────────────────────────────────────────
// Muestra un checklist con los pasos pendientes para que el transportista
// aparezca en el marketplace. Se oculta cuando todo está completo.
function BannerPerfilIncompleto({ pasos, onNavegar }) {
  const [cerrado, setCerrado] = useState(false)
  if (cerrado || pasos.length === 0) return null
  const totalPasos  = pasos.length + pasos.filter(p => p.listo).length  // aprox total
  const listos      = pasos.filter(p => p.listo).length
  const pendientes  = pasos.filter(p => !p.listo)

  return (
    <div
      role="region"
      aria-label="Pasos pendientes para activar tu perfil"
      style={{
        background: 'linear-gradient(135deg, #FFF7D6 0%, #FFFBEA 100%)',
        border: '1.5px solid #F5C400',
        borderRadius: 14,
        padding: '16px 18px',
        marginBottom: 24,
        position: 'relative',
      }}
    >
      {/* Botón cerrar */}
      <button
        onClick={() => setCerrado(true)}
        aria-label="Descartar aviso"
        style={{
          position: 'absolute', top: 12, right: 12,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#92400E', fontSize: 18, lineHeight: 1, padding: 4,
        }}
      >×</button>

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="10" fill="#F5C400" stroke="#D4A800" strokeWidth="1.5"/>
          <path d="M11 6v5.5l3 2" stroke="#0F2044" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#0F2044' }}>
            Activa tu perfil en el marketplace
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>
            {pendientes.length} {pendientes.length === 1 ? 'paso pendiente' : 'pasos pendientes'} para aparecer en búsquedas
          </p>
        </div>
      </div>

      {/* Lista de pasos */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pasos.map((paso) => (
          <li key={paso.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Indicador listo/pendiente */}
            {paso.listo
              ? <span aria-label="Completado" style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#D1FAE5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
              : <span aria-label="Pendiente" style={{
                  width: 20, height: 20, borderRadius: '50%', border: '2px solid #F5C400',
                  background: '#fff', flexShrink: 0,
                }} />
            }
            <span style={{ fontSize: 13, color: paso.listo ? '#6B7280' : '#0F2044', flex: 1,
              textDecoration: paso.listo ? 'line-through' : 'none' }}>
              {paso.texto}
            </span>
            {/* Acción directa si está pendiente */}
            {!paso.listo && paso.accion && (
              <button
                onClick={() => onNavegar(paso.accion)}
                style={{
                  background: '#0F2044', color: '#F5C400', border: 'none',
                  borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                Ir →
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Home({ onNavegar }) {
  const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const meses      = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const hoyLabel   = new Date()
  const fechaLabel = `${diasSemana[hoyLabel.getDay()]} ${hoyLabel.getDate()} de ${meses[hoyLabel.getMonth()]} ${hoyLabel.getFullYear()}`

  const [datos, setDatos]     = useState(null)
  const [cargando, setCarg]   = useState(true)
  const [pasosPerfil, setPasosPerfil] = useState([])

  useEffect(() => {
    const cargar = async () => {
      const hoy      = new Date()
      const fechaHoy = hoy.toISOString().split('T')[0]
      const mesHoy   = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user.id
      const [
        { count: nApoderados },
        { count: nAlumnos },
        { data: cobros },
        { count: nRutas },
        { data: asistHoy },
        { count: nAlumnosActivos },
        { data: ultimoAviso },
        { data: perfil },
      ] = await Promise.all([
        supabase.from('apoderados').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('alumnos').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('activo', true),
        supabase.from('cobros').select('monto, pagado').eq('user_id', uid).gte('mes', mesHoy).lte('mes', `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-31`),
        supabase.from('rutas').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('asistencia').select('presente').eq('user_id', uid).eq('fecha', fechaHoy).eq('tipo', 'ida'),
        supabase.from('alumnos').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('activo', true),
        supabase.from('avisos').select('mensaje, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(1),
        supabase.from('transportista_perfil').select('visible, telefono, nombre, colegios').eq('user_id', uid).maybeSingle(),
      ])
      const pendiente = (cobros || []).filter(c => !c.pagado).reduce((a, c) => a + Number(c.monto), 0)
      const presentes = (asistHoy || []).filter(a => a.presente).length
      const aviso     = ultimoAviso && ultimoAviso.length > 0 ? ultimoAviso[0] : null
      const tiempoAviso = aviso ? tiempoRelativo(aviso.created_at) : null
      setDatos({ nApoderados, nAlumnos, pendiente, nRutas, presentes, nAlumnosActivos, aviso, tiempoAviso })

      // Evaluar pasos del banner
      const emailConf = user.email_confirmed_at != null
      const tieneNombre = !!(perfil?.nombre?.trim())
      const tieneTelefono = !!(perfil?.telefono?.trim())
      const tieneColegios = Array.isArray(perfil?.colegios) ? perfil.colegios.length > 0 : !!(perfil?.colegios)
      const tieneRutas = (nRutas ?? 0) > 0
      const estaVisible = perfil?.visible === true

      const pasos = [
        { id: 'email',    texto: 'Confirma tu correo electrónico',        listo: emailConf,      accion: null },
        { id: 'nombre',   texto: 'Completa tu nombre en el perfil',       listo: tieneNombre,    accion: 'perfil' },
        { id: 'telefono', texto: 'Agrega tu número de teléfono',          listo: tieneTelefono,  accion: 'perfil' },
        { id: 'colegios', texto: 'Indica los colegios que atiendes',      listo: tieneColegios,  accion: 'perfil' },
        { id: 'rutas',    texto: 'Crea al menos una ruta',                listo: tieneRutas,     accion: 'rutas'  },
        { id: 'visible',  texto: 'Activa tu perfil para aparecer en búsquedas', listo: estaVisible, accion: 'perfil' },
      ]
      // Solo mostrar el banner si hay al menos un paso pendiente
      const hayPendientes = pasos.some(p => !p.listo)
      setPasosPerfil(hayPendientes ? pasos : [])

      setCarg(false)
    }
    cargar()
  }, [])

  const tiempoRelativo = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000)
    if (diff < 1)  return 'ahora mismo'
    if (diff < 60) return `hace ${diff} min`
    const h = Math.floor(diff / 60)
    if (h < 24)    return `hace ${h} h`
    return `hace ${Math.floor(h / 24)} días`
  }

  const tarjetas = datos ? [
    { id: 'apoderados', icon: IC.apoderados, label: 'Apoderados',      valor: datos.nApoderados ?? 0, sub: 'registrados',        color: '#EBF2FF', accent: '#0F2044' },
    { id: 'alumnos',    icon: IC.alumnos,    label: 'Alumnos activos', valor: datos.nAlumnos ?? 0,    sub: 'en servicio',        color: '#E3F5EC', accent: '#1A8A4A' },
    { id: 'cobros',     icon: IC.cobros,     label: 'Por cobrar',      valor: `$${(datos.pendiente || 0).toLocaleString('es-CL')}`, sub: 'este mes', color: '#FEF3C7', accent: '#B45309' },
    { id: 'rutas',      icon: IC.rutas,      label: 'Rutas',           valor: datos.nRutas ?? 0,      sub: 'configuradas',       color: '#F2EDFF', accent: '#6B21A8' },
    { id: 'asistencia', icon: IC.asistencia, label: 'Asistencia hoy',  valor: `${datos.presentes}/${datos.nAlumnosActivos ?? 0}`, sub: 'presentes en ida', color: '#E0F2FE', accent: '#0369A1' },
    { id: 'avisos',     icon: IC.avisos,     label: 'Último aviso',    valor: datos.aviso ? '1' : '—', sub: datos.tiempoAviso || 'sin avisos', color: '#FFF1E6', accent: '#C2440C' },
  ] : []

  return (
    <div style={s.vista}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ ...s.vtitulo, fontSize: 22, marginBottom: 4 }}>¡Bienvenido!</h2>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>{fechaLabel}</p>
      </div>

      <BannerPerfilIncompleto pasos={pasosPerfil} onNavegar={onNavegar} />

      {cargando ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
              <Skeleton w={60} h={14} r={4} />
              <div style={{ margin: '12px 0 6px' }}><Skeleton w={80} h={28} r={6} /></div>
              <Skeleton w={100} h={12} r={4} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {tarjetas.map(t => (
            <button
              key={t.id}
              onClick={() => onNavegar(t.id)}
              style={{ background: t.color, borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: `1.5px solid ${t.accent}22`, cursor: 'pointer', textAlign: 'left', transition: 'transform .15s, box-shadow .15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.07)' }}
              aria-label={`Ir a ${t.label}`}
            >
              <div style={{ display: 'inline-flex', marginBottom: 12, color: t.accent, width: 24, height: 24 }}>{t.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.accent, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{t.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#0F2044', lineHeight: 1, marginBottom: 6 }}>{t.valor}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{t.sub}</div>
            </button>
          ))}
        </div>
      )}

      {datos && datos.aviso && (
        <div style={{ marginTop: 28, background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', borderLeft: '4px solid #ea580c' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#C2440C', margin: '0 0 6px', letterSpacing: '.04em', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: '#C2440C' }}>{IC.megaphone}</span> Último aviso — {datos.tiempoAviso}</p>
          <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>{datos.aviso.mensaje}</p>
        </div>
      )}
    </div>
  )
}

// ─── Ruteo guiado ─────────────────────────────────────────────────────────────
// Flujo completo: seleccionar ruta → iniciar viaje → cards secuenciales →
// Subió (notifica apoderado, avanza) / Saltó (salta sin notificar) →
// modo entrega → cerrar viaje (notifica entrega a todos).

const IC_bus_subida  = <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1.5" y="6" width="15" height="9" rx="1.5"/><path d="M5 6V4.5a1.5 1.5 0 011.5-1.5h5A1.5 1.5 0 0113 4.5V6"/><circle cx="5" cy="13" r="1"/><circle cx="13" cy="13" r="1"/><path d="M9 3V1m-2 2l2-2 2 2" /></svg>
const IC_bus_bajada  = <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1.5" y="6" width="15" height="9" rx="1.5"/><path d="M5 6V4.5a1.5 1.5 0 011.5-1.5h5A1.5 1.5 0 0113 4.5V6"/><circle cx="5" cy="13" r="1"/><circle cx="13" cy="13" r="1"/><path d="M9 7v2m-2 0l2 2 2-2" /></svg>
const IC_play    = <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="5,3 15,9 5,15" fill="currentColor" stroke="none"/></svg>
const IC_check   = <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3,9 7,13 15,5"/></svg>
const IC_skip    = <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 9h8M10 6l3 3-3 3"/></svg>
const IC_flag    = <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 2v14M4 2l10 4-10 4"/></svg>

// Estados de viaje
const FASE = { SELECCION: 'seleccion', RECOGIDA: 'recogida', ENTREGA: 'entrega', CERRADO: 'cerrado' }

function Ruteo() {
  // ── Estado principal ──────────────────────────────────
  const [fase,       setFase]      = useState(FASE.SELECCION)
  const [rutas,      setRutas]     = useState([])
  const [rutaSel,    setRutaSel]   = useState(null)   // ruta elegida
  const [tipoViaje,  setTipoViaje] = useState('ida')  // 'ida' | 'vuelta'
  const [viajeId,    setViajeId]   = useState(null)
  const [alumnos,    setAlumnos]   = useState([])     // ordenados por ruta_alumnos.orden
  const [idxActual,  setIdxActual] = useState(0)      // puntero en la lista
  const [procesados, setProcesados]= useState([])     // { alumno_id, tipo, hora }
  const [_saltados,  setSaltados]  = useState(new Set()) // eslint-disable-line no-unused-vars
  const [busy,       setBusy]      = useState(false)
  const [cargando,   setCargando]  = useState(true)
  const [msg,        setMsg]       = useState(null)   // { texto, ok }
  // Para la pantalla de cierre
  const [resumen,    setResumen]   = useState(null)

  const horaLabel = iso => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

  // ── Cargar rutas del transportista ───────────────────
  const cargarRutas = useCallback(async () => {
    setCargando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('rutas')
      .select('id, nombre, horario_ida, horario_vuelta')
      .eq('user_id', user.id)
      .order('nombre')
    setRutas(data || [])
    setCargando(false)
  }, [])

  // ── Cargar alumnos de una ruta (ordenados) ───────────
  const cargarAlumnos = useCallback(async (rutaId) => {
    const { data } = await supabase
      .from('ruta_alumnos')
      .select('id, orden, direccion_parada, referencia, alumnos(id, nombre)')
      .eq('ruta_id', rutaId)
      .eq('activo', true)
      .order('orden')
    return (data || []).map(ra => ({
      id:        ra.alumnos.id,
      nombre:    ra.alumnos.nombre,
      orden:     ra.orden,
      direccion: ra.direccion_parada || '',
      referencia: ra.referencia || '',
    }))
  }, [])

  useEffect(() => { cargarRutas() }, [cargarRutas])

  // ── Seleccionar ruta e iniciar viaje ─────────────────
  const iniciarViaje = async () => {
    if (!rutaSel) return
    setBusy(true)
    const al = await cargarAlumnos(rutaSel.id)
    if (al.length === 0) {
      setMsg({ texto: 'Esta ruta no tiene alumnos asignados. Ve a Rutas y agrega alumnos primero.', ok: false })
      setBusy(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    const { data: viaje, error } = await supabase
      .from('viajes')
      .insert({ user_id: user.id, ruta_id: rutaSel.id, tipo: tipoViaje, estado: 'en_curso' })
      .select('id')
      .single()
    if (error) {
      setMsg({ texto: 'Error al iniciar el viaje. Intenta de nuevo.', ok: false })
      setBusy(false)
      return
    }
    // Emitir evento 'proximo' para el primer alumno (alerta al apoderado para prepararse)
    await supabase.from('eventos_viaje').insert({
      user_id: user.id, alumno_id: al[0].id, tipo: 'proximo', viaje_id: viaje.id,
    })
    setViajeId(viaje.id)
    setAlumnos(al)
    setIdxActual(0)
    setProcesados([])
    setSaltados(new Set())
    setFase(FASE.RECOGIDA)
    setMsg(null)
    setBusy(false)
  }

  // ── Registrar evento para alumno actual ──────────────
  const registrarEvento = async (tipo) => {
    const alumno = alumnos[idxActual]
    if (!alumno) return
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('eventos_viaje').insert({
      user_id: user.id, alumno_id: alumno.id, tipo, viaje_id: viajeId,
    })

    const nuevoProcesados = [...procesados, { alumno_id: alumno.id, nombre: alumno.nombre, tipo, hora: new Date().toISOString() }]
    setProcesados(nuevoProcesados)

    const siguiente = idxActual + 1

    // Si hay siguiente, emitir 'proximo' para que ese apoderado se prepare
    if (siguiente < alumnos.length) {
      await supabase.from('eventos_viaje').insert({
        user_id: user.id, alumno_id: alumnos[siguiente].id, tipo: 'proximo', viaje_id: viajeId,
      })
      setIdxActual(siguiente)
    } else {
      // Todos procesados → pasar a fase de entrega
      setFase(FASE.ENTREGA)
      setIdxActual(0)
    }
    setBusy(false)
  }

  const saltar = async () => {
    const alumno = alumnos[idxActual]
    setSaltados(prev => new Set([...prev, alumno.id]))
    await registrarEvento('saltado')
  }

  // ── Modo entrega: registrar 'entregado' uno a uno ────
  const registrarEntrega = async (alumnoId) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('eventos_viaje').insert({
      user_id: user.id, alumno_id: alumnoId, tipo: 'entregado', viaje_id: viajeId,
    })
    setProcesados(prev => prev.map(p =>
      p.alumno_id === alumnoId ? { ...p, entregado: true, hora_entrega: new Date().toISOString() } : p
    ))
  }

  // ── Cerrar viaje ─────────────────────────────────────
  const cerrarViaje = async () => {
    if (!window.confirm('¿Cerrar el viaje? Se notificará a todos los apoderados.')) return
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Marcar viaje como completado
    await supabase.from('viajes').update({ estado: 'completado', cerrado_at: new Date().toISOString() }).eq('id', viajeId)

    // Emitir 'entregado' masivo para alumnos subidos que aún no lo tienen
    const subidos = procesados.filter(p => p.tipo === 'subida' && !p.entregado)
    for (const p of subidos) {
      await supabase.from('eventos_viaje').insert({
        user_id: user.id, alumno_id: p.alumno_id, tipo: 'entregado', viaje_id: viajeId,
      })
    }

    const nSubidos  = procesados.filter(p => p.tipo === 'subida').length
    const nSaltados = procesados.filter(p => p.tipo === 'saltado').length
    setResumen({ nSubidos, nSaltados, total: alumnos.length, ruta: rutaSel.nombre })
    setFase(FASE.CERRADO)
    setBusy(false)
  }

  const reiniciar = () => {
    setFase(FASE.SELECCION)
    setRutaSel(null)
    setViajeId(null)
    setAlumnos([])
    setIdxActual(0)
    setProcesados([])
    setSaltados(new Set())
    setResumen(null)
    setMsg(null)
    cargarRutas()
  }

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════

  // ── Pantalla 0: Selección de ruta ────────────────────
  if (fase === FASE.SELECCION) {
    return (
      <div style={s.vista}>
        <div style={s.vistaHeader}>
          <h2 style={s.vtitulo}>Ruteo</h2>
          <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        {msg && (
          <div style={{ background: msg.ok ? '#dcfce7' : '#fef2f2', border: `1px solid ${msg.ok ? '#86efac' : '#fecaca'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: msg.ok ? '#166534' : '#991b1b' }} role="alert">
            {msg.texto}
          </div>
        )}

        {cargando ? (
          <div style={s.skeletonWrap} aria-busy="true">
            {[1,2,3].map(i => <div key={i} style={{ ...s.skeletonFila, marginBottom: 12 }}><Skeleton w="100%" h={64} r={12} /></div>)}
          </div>
        ) : rutas.length === 0 ? (
          <div style={s.vacio}>
            <span style={{ display: 'inline-flex', marginBottom: 12, color: '#8A96AA' }}>{IC.rutas}</span>
            <p style={{ marginBottom: 8 }}>No tienes rutas configuradas.</p>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Ve a <strong>Rutas</strong> para crear una y asignar alumnos.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Selecciona la ruta que vas a realizar hoy:</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {rutas.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRutaSel(r)}
                  style={{
                    textAlign: 'left', padding: '14px 18px', borderRadius: 12, border: `2px solid ${rutaSel?.id === r.id ? '#0F2044' : '#e2e8f0'}`,
                    background: rutaSel?.id === r.id ? '#EDF1F9' : '#fff',
                    cursor: 'pointer', transition: 'all .15s',
                    boxShadow: rutaSel?.id === r.id ? '0 0 0 3px rgba(15,32,68,.12)' : '0 1px 3px rgba(0,0,0,.06)',
                  }}
                  aria-pressed={rutaSel?.id === r.id}
                >
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0F2044', marginBottom: 4 }}>{r.nombre}</div>
                  {(r.horario_ida || r.horario_vuelta) && (
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {r.horario_ida && `Ida: ${r.horario_ida}`}
                      {r.horario_ida && r.horario_vuelta && '  ·  '}
                      {r.horario_vuelta && `Vuelta: ${r.horario_vuelta}`}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {rutaSel && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                {['ida', 'vuelta'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTipoViaje(t)}
                    style={{ padding: '8px 20px', borderRadius: 8, border: `2px solid ${tipoViaje === t ? '#F5C400' : '#e2e8f0'}`, background: tipoViaje === t ? '#FFF9E0' : '#fff', fontWeight: 600, fontSize: 13, color: tipoViaje === t ? '#0F2044' : '#64748b', cursor: 'pointer', textTransform: 'capitalize' }}
                    aria-pressed={tipoViaje === t}
                  >
                    {t === 'ida' ? '↑ Ida' : '↓ Vuelta'}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={iniciarViaje}
              disabled={!rutaSel || busy}
              style={{ ...s.btnPrimario, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, padding: '12px 28px', opacity: (!rutaSel || busy) ? .5 : 1 }}
            >
              {IC_play} {busy ? 'Iniciando…' : 'Iniciar viaje'}
            </button>
          </>
        )}
      </div>
    )
  }

  // ── Pantalla 1: Recogida secuencial ──────────────────
  if (fase === FASE.RECOGIDA) {
    const alumno  = alumnos[idxActual]
    const total   = alumnos.length
    const progreso= Math.round((idxActual / total) * 100)

    return (
      <div style={s.vista}>
        {/* Header con ruta y progreso */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <h2 style={{ ...s.vtitulo, marginBottom: 2 }}>{rutaSel.nombre}</h2>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, textTransform: 'capitalize' }}>{tipoViaje} · Recogida</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F2044' }}>{idxActual + 1} / {total}</span>
        </div>

        {/* Barra de progreso */}
        <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, marginBottom: 24, overflow: 'hidden' }} role="progressbar" aria-valuenow={idxActual} aria-valuemax={total}>
          <div style={{ height: '100%', width: `${progreso}%`, background: '#F5C400', borderRadius: 3, transition: 'width .3s' }} />
        </div>

        {/* Card del alumno actual */}
        <div style={{ background: '#0F2044', borderRadius: 16, padding: '28px 24px', color: '#fff', marginBottom: 20, boxShadow: '0 4px 16px rgba(15,32,68,.25)' }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#8AA4C8', marginBottom: 8, fontWeight: 600 }}>
            Parada {alumno.orden}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{alumno.nombre}</div>
          {alumno.direccion && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: '#CBD5E1' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true"><path d="M7 1a4 4 0 000 8c2.21 0 4-1.79 4-4S9.21 1 7 1z"/><path d="M7 13l-3-5h6l-3 5z"/></svg>
              <span>{alumno.direccion}</span>
            </div>
          )}
          {alumno.referencia && (
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6, paddingLeft: 20 }}>{alumno.referencia}</div>
          )}
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => registrarEvento('subida')}
            disabled={busy}
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 12, border: 'none', background: busy ? '#bbf7d0' : '#16a34a', color: '#fff', fontWeight: 700, fontSize: 15, cursor: busy ? 'wait' : 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,.25)' }}
            aria-label={`${alumno.nombre} subió al bus`}
          >
            {IC_bus_subida} Subió
          </button>
          <button
            onClick={saltar}
            disabled={busy}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 16px', borderRadius: 12, border: '2px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: busy ? 'wait' : 'pointer' }}
            aria-label={`Saltar a ${alumno.nombre} (ausente)`}
          >
            {IC_skip} Saltar
          </button>
        </div>

        {/* Mini-historial de procesados */}
        {procesados.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>Ya procesados</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {procesados.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ color: p.tipo === 'subida' ? '#16a34a' : '#94a3b8' }}>
                    {p.tipo === 'subida' ? IC_check : IC_skip}
                  </span>
                  <span style={{ flex: 1, fontWeight: 500, color: '#374151' }}>{p.nombre}</span>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{p.tipo === 'subida' ? 'Subió' : 'Saltado'}</span>
                  <span style={{ color: '#cbd5e1', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{horaLabel(p.hora)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Pantalla 2: Entrega ───────────────────────────────
  if (fase === FASE.ENTREGA) {
    const subidos = procesados.filter(p => p.tipo === 'subida')
    const todosEntregados = subidos.every(p => p.entregado)

    return (
      <div style={s.vista}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <h2 style={{ ...s.vtitulo, marginBottom: 2 }}>{rutaSel.nombre}</h2>
            <span style={{ fontSize: 12, color: '#b45309', fontWeight: 600 }}>Modo entrega</span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
            {subidos.filter(p => p.entregado).length} / {subidos.length} {IC_check}
          </span>
        </div>

        <div style={{ background: '#FFF9E0', border: '1px solid #F5C400', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#7C5A00' }}>
          Confirma la entrega de cada alumno. Al cerrar el viaje se notifica a todos los apoderados.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {subidos.map(p => (
            <div key={p.alumno_id} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0F2044' }}>{p.nombre}</div>
                {p.entregado && (
                  <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>Entregado · {horaLabel(p.hora_entrega)}</div>
                )}
              </div>
              {!p.entregado ? (
                <button
                  onClick={() => registrarEntrega(p.alumno_id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#dcfce7', color: '#16a34a', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                  aria-label={`Marcar entrega de ${p.nombre}`}
                >
                  {IC_bus_bajada} Entregado
                </button>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontSize: 13, fontWeight: 600 }}>{IC_check} Listo</span>
              )}
            </div>
          ))}

          {procesados.filter(p => p.tipo === 'saltado').length > 0 && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>No subieron hoy</p>
              {procesados.filter(p => p.tipo === 'saltado').map(p => (
                <div key={p.alumno_id} style={{ fontSize: 13, color: '#64748b', padding: '3px 0' }}>{p.nombre}</div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={cerrarViaje}
          disabled={busy}
          style={{ ...s.btnPrimario, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, padding: '13px 28px', background: todosEntregados ? '#0F2044' : '#6b7280', width: '100%', justifyContent: 'center' }}
          aria-label="Cerrar viaje y notificar a apoderados"
        >
          {IC_flag} {busy ? 'Cerrando…' : 'Cerrar viaje'}
        </button>
      </div>
    )
  }

  // ── Pantalla 3: Resumen final ─────────────────────────
  if (fase === FASE.CERRADO) {
    return (
      <div style={s.vista}>
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#16a34a' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="5,16 12,23 27,9"/></svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F2044', marginBottom: 8 }}>Viaje completado</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>{resumen?.ruta}</p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
            <div style={{ background: '#dcfce7', borderRadius: 12, padding: '16px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>{resumen?.nSubidos}</div>
              <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Alumnos transportados</div>
            </div>
            {resumen?.nSaltados > 0 && (
              <div style={{ background: '#fef9c3', borderRadius: 12, padding: '16px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#b45309' }}>{resumen?.nSaltados}</div>
                <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>No subieron</div>
              </div>
            )}
          </div>

          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 24 }}>
            Los apoderados han sido notificados de la entrega.
          </p>

          <button onClick={reiniciar} style={{ ...s.btnPrimario, padding: '12px 32px', fontSize: 15 }}>
            Nuevo viaje
          </button>
        </div>
      </div>
    )
  }

  return null
}

// Alias para compatibilidad con el render del dashboard (id 'viaje')
const Viaje = Ruteo

// ─── Menú ─────────────────────────────────────────────────────────────────────
const IC_perfil = <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="5" r="3"/><path d="M3 16c0-3.31 2.69-5 6-5s6 1.69 6 5"/><path d="M13.5 10.5l1 1 2-2" strokeWidth="1.5"/></svg>
const IC_ruteo  = <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1.5" y="6" width="15" height="9" rx="1.5"/><path d="M5 6V4.5a1.5 1.5 0 011.5-1.5h5A1.5 1.5 0 0113 4.5V6"/><circle cx="5" cy="13" r="1"/><circle cx="13" cy="13" r="1"/><path d="M6 3h6" strokeWidth="1.5"/><path d="M9 1.5V3"/></svg>

// ─── Bandeja de Solicitudes de Cupo (transportista) ──────────────────────────
function BandejaSolicitudes() {
  const [lista, setLista]       = useState([])
  const [cargando, setCargando] = useState(true)
  const [detalle, setDetalle]   = useState(null)   // solicitud abierta
  const [procesando, setProcesando] = useState(false)
  const [msgDetalle, setMsgDetalle] = useState(null) // { texto, ok }
  const [filtrando, setFiltrando]   = useState('pendiente') // 'pendiente'|'todas'
  const [precioInput, setPrecioInput] = useState('')
  const [notaInput, setNotaInput]     = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('solicitudes_cupo')
      .select(`
        id, estado, modalidad, precio_ofertado, nota_apoderado, nota_transportista, created_at,
        alumno:alumno_id ( nombre ),
        colegio:colegio_id ( nombre ),
        apoderado:apoderado_user_id (
          perfil_apoderado ( nombre, telefono, direccion )
        )
      `)
      .eq('transportista_user_id', user.id)
      .order('created_at', { ascending: false })
    setLista(data || [])
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Realtime: nueva solicitud llega en tiempo real
  useEffect(() => {
    let channel
    supabase.auth.getUser().then(({ data: { user } }) => {
      channel = supabase
        .channel(`solicitudes-transportista-${user.id}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'solicitudes_cupo',
            filter: `transportista_user_id=eq.${user.id}` },
          () => cargar()
        )
        .subscribe()
    })
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [cargar])

  async function responder(solicitudId, accion, precio, nota) {
    setProcesando(true); setMsgDetalle(null)
    const nuevoEstado = accion === 'aceptar' ? 'aceptada' : 'rechazada'
    const payload = { estado: nuevoEstado, nota_transportista: nota || null }
    if (accion === 'aceptar' && precio) payload.precio_ofertado = parseInt(precio)
    const { error } = await supabase.from('solicitudes_cupo')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', solicitudId)
    if (error) {
      setMsgDetalle({ texto: 'Error al procesar. Intenta nuevamente.', ok: false })
    } else {
      setMsgDetalle({ texto: accion === 'aceptar' ? 'Solicitud aceptada. El apoderado recibirá tu oferta.' : 'Solicitud rechazada.', ok: true })
      setDetalle(d => d ? { ...d, estado: nuevoEstado } : d)
      await cargar()
    }
    setProcesando(false)
  }

  const LABEL_MODALIDAD = { manana: 'Solo mañana', tarde: 'Solo tarde', completo: 'Servicio completo' }
  const LABEL_ESTADO    = {
    pendiente: { texto: 'Pendiente',  bg: '#FEF9C3', color: '#854D0E' },
    aceptada:  { texto: 'Aceptada',   bg: '#dcfce7', color: '#166534' },
    rechazada: { texto: 'Rechazada',  bg: '#fee2e2', color: '#991b1b' },
    vinculada: { texto: 'Vinculada',  bg: '#dbeafe', color: '#1e40af' },
    cancelada: { texto: 'Cancelada',  bg: '#f1f5f9', color: '#475569' },
  }

  const listaMostrar = filtrando === 'pendiente'
    ? lista.filter(l => l.estado === 'pendiente')
    : lista

  const pendientesCount = lista.filter(l => l.estado === 'pendiente').length

  if (cargando) return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      {[1,2,3].map(i => <div key={i} style={{ marginBottom: 12 }}><Skeleton h={88} r={12} /></div>)}
    </div>
  )

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px' }}>

      {/* Encabezado + filtro */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0F2044', fontFamily: "'Sora',system-ui,sans-serif" }}>
            Solicitudes de cupo
          </h1>
          {pendientesCount > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#854D0E' }}>
              {pendientesCount} solicitud{pendientesCount > 1 ? 'es' : ''} pendiente{pendientesCount > 1 ? 's' : ''} por revisar
            </p>
          )}
        </div>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
          {[['pendiente','Pendientes'],['todas','Todas']].map(([v, label]) => (
            <button key={v} onClick={() => setFiltrando(v)}
              style={{ background: filtrando === v ? '#0F2044' : 'transparent', color: filtrando === v ? '#fff' : '#64748b', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', position: 'relative' }}>
              {label}
              {v === 'pendiente' && pendientesCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, background: '#F5C400', color: '#0F2044', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 5px', minWidth: 16, textAlign: 'center' }}>{pendientesCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {listaMostrar.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          {IC.inbox}
          <p style={{ color: '#64748b', marginTop: 12, fontSize: 14 }}>
            {filtrando === 'pendiente' ? 'No tienes solicitudes pendientes.' : 'Aún no has recibido solicitudes.'}
          </p>
          {filtrando === 'pendiente' && lista.length > 0 && (
            <button onClick={() => setFiltrando('todas')} style={{ marginTop: 8, background: 'none', border: 'none', color: '#0F2044', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              Ver historial →
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {listaMostrar.map(sol => {
            const est  = LABEL_ESTADO[sol.estado] || LABEL_ESTADO.pendiente
            const apNombre = sol.apoderado?.perfil_apoderado?.nombre || 'Apoderado'
            const apTel    = sol.apoderado?.perfil_apoderado?.telefono // eslint-disable-line no-unused-vars
            return (
              <button key={sol.id}
                onClick={() => { setDetalle(sol); setMsgDetalle(null) }}
                style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: sol.estado === 'pendiente' ? '2px solid #F5C400' : '1.5px solid #e2e8f0', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0F2044', marginBottom: 2 }}>
                      {sol.alumno?.nombre || 'Alumno'} · {apNombre}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                      {sol.colegio?.nombre || '—'} · {LABEL_MODALIDAD[sol.modalidad] || sol.modalidad}
                    </div>
                    {sol.nota_apoderado && (
                      <div style={{ fontSize: 12, color: '#475569', background: '#f8fafc', borderRadius: 6, padding: '4px 8px', fontStyle: 'italic' }}>
                        "{sol.nota_apoderado}"
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{ background: est.bg, color: est.color, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>{est.texto}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {new Date(sol.created_at).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Modal detalle / respuesta */}
      {detalle && (() => {
        const est     = LABEL_ESTADO[detalle.estado] || LABEL_ESTADO.pendiente
        const apNombre = detalle.apoderado?.perfil_apoderado?.nombre || 'Apoderado'
        const apTel    = detalle.apoderado?.perfil_apoderado?.telefono
        const apDir    = detalle.apoderado?.perfil_apoderado?.direccion
        const esPendiente = detalle.estado === 'pendiente'
        return (
          <div role="dialog" aria-modal="true" aria-label="Detalle solicitud"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0 0' }}
            onClick={e => { if (e.target === e.currentTarget) setDetalle(null) }}>
            <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', padding: '24px 20px 40px' }}>
              {/* Handle */}
              <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 20px' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0F2044' }}>Solicitud de cupo</h2>
                <span style={{ background: est.bg, color: est.color, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{est.texto}</span>
              </div>

              {/* Info alumno + apoderado */}
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Alumno/a',  val: detalle.alumno?.nombre },
                    { label: 'Colegio',   val: detalle.colegio?.nombre },
                    { label: 'Modalidad', val: LABEL_MODALIDAD[detalle.modalidad] },
                    { label: 'Apoderado', val: apNombre },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F2044', marginTop: 2 }}>{val || '—'}</div>
                    </div>
                  ))}
                </div>
                {apDir && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Dirección del alumno</div>
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{apDir}</div>
                  </div>
                )}
                {apTel && (
                  <a href={`https://wa.me/${apTel.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 13, fontWeight: 600, color: '#25D366', textDecoration: 'none' }}>
                    💬 {apTel}
                  </a>
                )}
              </div>

              {detalle.nota_apoderado && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#92400E', fontWeight: 700, marginBottom: 4 }}>NOTA DEL APODERADO</div>
                  <p style={{ margin: 0, fontSize: 13, color: '#78350F' }}>"{detalle.nota_apoderado}"</p>
                </div>
              )}

              {msgDetalle && (
                <div style={{ fontSize: 13, fontWeight: 500, color: msgDetalle.ok ? '#16a34a' : '#dc2626', marginBottom: 12, padding: '8px 12px', background: msgDetalle.ok ? '#f0fdf4' : '#fef2f2', borderRadius: 8 }}>
                  {msgDetalle.texto}
                </div>
              )}

              {esPendiente && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                        Precio mensual que ofrecerás ($)
                      </label>
                      <input
                        type="number" min="1000" step="1000"
                        value={precioInput}
                        onChange={e => setPrecioInput(e.target.value)}
                        placeholder="ej: 45000"
                        style={s.input}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                        Nota para el apoderado (opcional)
                      </label>
                      <textarea
                        value={notaInput}
                        onChange={e => setNotaInput(e.target.value)}
                        placeholder="Ej: La ruta pasa a las 7:30 am por tu sector"
                        maxLength={300}
                        style={{ ...s.input, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => responder(detalle.id, 'rechazar', null, notaInput)}
                        disabled={procesando}
                        style={{ flex: 1, padding: '11px 0', borderRadius: 8, border: '1.5px solid #fca5a5', background: '#fee2e2', color: '#991b1b', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                        {procesando ? '…' : 'Rechazar'}
                      </button>
                      <button
                        onClick={() => responder(detalle.id, 'aceptar', precioInput, notaInput)}
                        disabled={procesando || !precioInput}
                        style={{ flex: 2, padding: '11px 0', borderRadius: 8, border: 'none', background: precioInput ? '#0F2044' : '#94a3b8', color: precioInput ? '#F5C400' : '#fff', fontWeight: 700, fontSize: 14, cursor: precioInput ? 'pointer' : 'not-allowed' }}>
                        {procesando ? 'Enviando…' : 'Aceptar y enviar oferta'}
                      </button>
                    </div>
                  </div>
              )}

              {!esPendiente && (
                <button onClick={() => setDetalle(null)}
                  style={{ width: '100%', padding: '12px 0', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Cerrar
                </button>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

const IC_solicitudes = <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><rect x="1.5" y="3" width="15" height="12" rx="1.5"/><path d="M5 7h8M5 10h5"/><circle cx="14" cy="4.5" r="2.5" fill="#F5C400" stroke="none"/></svg>

const MENU = [
  { id: 'home',         icon: IC.home,           label: 'Inicio' },
  { id: 'apoderados',   icon: IC.apoderados,     label: 'Apoderados' },
  { id: 'alumnos',      icon: IC.alumnos,        label: 'Alumnos' },
  { id: 'cobros',       icon: IC.cobros,         label: 'Cobros' },
  { id: 'rutas',        icon: IC.rutas,          label: 'Rutas' },
  { id: 'viaje',        icon: IC_ruteo,          label: 'Ruteo' },
  { id: 'solicitudes',  icon: IC_solicitudes,    label: 'Solicitudes' },
  { id: 'asistencia',   icon: IC.asistencia,     label: 'Asistencia' },
  { id: 'avisos',       icon: IC.avisos,         label: 'Avisos' },
  { id: 'perfil',       icon: IC_perfil,         label: 'Mi Perfil' },
]

// ─── Dashboard ────────────────────────────────────────────────────────────────
// El sidebar es fijo en desktop (≥768px) y drawer en mobile.
// El botón de logout aparece tanto en el sidebar como en la topbar mobile.
const SIDEBAR_W = 240

function ModalSalir({ onConfirmar, onCancelar }) {
  const [cuenta, setCuenta] = useState(30)
  useEffect(() => {
    if (cuenta <= 0) { onConfirmar(); return }
    const t = setTimeout(() => setCuenta(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cuenta, onConfirmar])
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', maxWidth: 360, width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,.18)', textAlign: 'center' }}>
        <div style={{ marginBottom: 12, color: '#0F2044' }}>{IC.logout}</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, color: '#0F2044' }}>¿Deseas salir?</h2>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>Tu sesión se cerrará. Deberás iniciar sesión nuevamente.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onCancelar}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #dde4ef', background: '#f8fafc', color: '#374151', fontSize: 15, cursor: 'pointer', fontWeight: 500 }}
          >Cancelar</button>
          <button
            onClick={onConfirmar}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#e53e3e', color: '#fff', fontSize: 15, cursor: 'pointer', fontWeight: 600 }}
          >Confirmar ({cuenta}s)</button>
        </div>
      </div>
    </div>
  )
}

// ─── Perfil Transportista ────────────────────────────────────────────────────
const MARCAS_VEHICULO = ['Hyundai','Kia','Toyota','Renault','Chevrolet','Mercedes-Benz','Volkswagen','Ford','Nissan','Otro']
const AÑOS_VEHICULO   = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i))

function Perfil() {
  const [perfil, setPerfil]     = useState(null)
  const [modo, setModo]         = useState('ver')   // 'ver' | 'editar'
  const [form, setForm]         = useState({})
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg]           = useState('')
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)

  // ── Marketplace: perfil público ──────────────────────────
  const [tpPerfil, setTpPerfil]       = useState(null)   // transportista_perfil row
  const [precios, setPrecios]         = useState([])     // precios_modalidad rows
  const [colegiosCat, setColegiosCat] = useState([])     // catálogo completo
  const [tcActivos, setTcActivos]     = useState([])     // transportista_colegios activos
  const [sectorFiltroPerf, setSectorFiltroPerf] = useState('') // filtro sector en checklist
  const [guardandoMkt, setGuardandoMkt] = useState(false)
  const [msgMkt, setMsgMkt]           = useState(null)   // {texto, ok}

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('perfil_transportista')
      .select('*').eq('user_id', user.id).maybeSingle()
    if (data) {
      setPerfil(data)
      setForm(data)
    } else {
      const vacio = { user_id: user.id, nombre: '', rut: '', telefono: '', email: user.email,
        marca: '', modelo: '', año: '', patente: '', color: '', capacidad: '',
        foto_url: '', mtt_verificado: false, mtt_fecha: null, experiencia_años: '' }
      setPerfil(vacio); setForm(vacio)
    }
    // Cargar datos marketplace en paralelo
    const [{ data: tp }, { data: pm }, { data: cat }, { data: tc }] = await Promise.all([
      supabase.from('transportista_perfil').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('precios_modalidad').select('*').eq('user_id', user.id).eq('activo', true),
      supabase.from('colegios').select('id,nombre,tipo,sector').eq('activo', true).order('nombre'),
      supabase.from('transportista_colegios').select('id,colegio_id').eq('user_id', user.id).eq('activo', true),
    ])
    setTpPerfil(tp || { user_id: user.id, visible: false, patente: '', anos_experiencia: '', descripcion: '', capacidad_total: '' })
    setPrecios(pm || [])
    setColegiosCat(cat || [])
    setTcActivos(tc || [])
  }

  // ── Toggle visible en marketplace ──────────────────────
  async function toggleVisible() {
    const { data: { user } } = await supabase.auth.getUser()
    const nuevoVisible = !tpPerfil.visible
    const { error } = await supabase.from('transportista_perfil')
      .upsert({ ...tpPerfil, visible: nuevoVisible, user_id: user.id }, { onConflict: 'user_id' })
    if (!error) setTpPerfil(p => ({ ...p, visible: nuevoVisible }))
  }

  async function togglePreciosPublicos() {
    const { data: { user } } = await supabase.auth.getUser()
    const nuevo = !tpPerfil.precios_publicos
    const { error } = await supabase.from('transportista_perfil')
      .upsert({ ...tpPerfil, precios_publicos: nuevo, user_id: user.id }, { onConflict: 'user_id' })
    if (!error) setTpPerfil(p => ({ ...p, precios_publicos: nuevo }))
  }

  // ── Guardar perfil público (descripción, experiencia, capacidad) ───────────
  async function guardarPerfilPublico(e) {
    e.preventDefault(); setGuardandoMkt(true); setMsgMkt(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('transportista_perfil')
        .upsert({ ...tpPerfil, user_id: user.id }, { onConflict: 'user_id' })
      if (error) throw error
      setMsgMkt({ texto: 'Perfil público guardado', ok: true })
    } catch(err) { setMsgMkt({ texto: err.message, ok: false }) }
    finally { setGuardandoMkt(false) }
  }

  // ── Guardar precio por modalidad ───────────────────────
  async function guardarPrecio(modalidad, valor) {
    const { data: { user } } = await supabase.auth.getUser()
    const precio_mensual = parseInt(valor, 10)
    if (!precio_mensual || precio_mensual <= 0) return
    const { error } = await supabase.from('precios_modalidad')
      .upsert({ user_id: user.id, modalidad, precio_mensual, activo: true }, { onConflict: 'user_id,modalidad' })
    if (!error) setPrecios(prev => {
      const sin = prev.filter(p => p.modalidad !== modalidad)
      return [...sin, { user_id: user.id, modalidad, precio_mensual, activo: true }]
    })
  }

  // ── Agregar / quitar colegio atendido ──────────────────
  async function toggleColegio(colegioId) {
    const { data: { user } } = await supabase.auth.getUser()
    const activo = tcActivos.find(t => t.colegio_id === colegioId)
    if (activo) {
      await supabase.from('transportista_colegios').update({ activo: false }).eq('id', activo.id)
      setTcActivos(prev => prev.filter(t => t.colegio_id !== colegioId))
    } else {
      const { data } = await supabase.from('transportista_colegios')
        .upsert({ user_id: user.id, colegio_id: colegioId, activo: true }, { onConflict: 'user_id,colegio_id' })
        .select('id,colegio_id').maybeSingle()
      if (data) setTcActivos(prev => [...prev, data])
    }
  }

  function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true); setMsg('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let foto_url = form.foto_url
      if (fotoFile) {
        const ext  = fotoFile.name.split('.').pop()
        const path = `transportistas/${user.id}.${ext}`
        const { error: upErr } = await supabase.storage.from('fotos').upload(path, fotoFile, { upsert: true })
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('fotos').getPublicUrl(path)
          foto_url = publicUrl
        }
      }
      const payload = { ...form, foto_url, user_id: user.id }
      const { error } = await supabase.from('perfil_transportista').upsert(payload, { onConflict: 'user_id' })
      if (error) throw error
      setPerfil(payload); setModo('ver')
      setMsg('✅ Perfil guardado')
    } catch(err) {
      setMsg('Error al guardar: ' + err.message)
    } finally { setGuardando(false) }
  }

  async function marcarMTT() {
    const { data: { user } } = await supabase.auth.getUser()
    const fecha = new Date().toISOString().split('T')[0]
    await supabase.from('perfil_transportista')
      .upsert({ ...perfil, mtt_verificado: true, mtt_fecha: fecha, user_id: user.id }, { onConflict: 'user_id' })
    setPerfil(p => ({ ...p, mtt_verificado: true, mtt_fecha: fecha }))
    setForm(p => ({ ...p, mtt_verificado: true, mtt_fecha: fecha }))
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const foto = fotoPreview || perfil?.foto_url

  if (!perfil) return <div style={s.vista}><Skeleton /></div>

  if (modo === 'editar') return (
    <div style={s.vista}>
      <div style={s.vistaHeader}>
        <h1 style={s.vtitulo}>Mi Perfil</h1>
        <button style={s.btnSecundario} onClick={() => { setModo('ver'); setFotoFile(null); setFotoPreview(null) }}>Cancelar</button>
      </div>
      {msg && <p style={{ ...s.errorMsg, color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', marginBottom: 12 }}>{msg}</p>}
      <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Foto */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#0F2044', fontSize: 14 }}>Foto del transportista</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {foto
              ? <img src={foto} alt="Foto perfil" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #dde4ef' }} />
              : <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F2F5FA', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #dde4ef', color: '#94a3b8', fontSize: 28 }}>👤</div>
            }
            <label style={{ ...s.btnPrimario, cursor: 'pointer', fontSize: 13 }}>
              Subir foto
              <input type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Datos personales */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          <p style={{ margin: '0 0 14px', fontWeight: 600, color: '#0F2044', fontSize: 14 }}>Datos personales</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={s.label}>Nombre completo</label>
              <input style={s.input} value={form.nombre||''} onChange={e=>f('nombre',e.target.value)} placeholder="Nombre Apellido" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={s.label}>RUT</label>
              <input style={s.input} value={form.rut||''} onChange={e=>f('rut',e.target.value)} placeholder="12.345.678-9" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={s.label}>Teléfono</label>
              <input style={s.input} value={form.telefono||''} onChange={e=>f('telefono',e.target.value)} placeholder="+56 9 1234 5678" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={s.label}>Años de experiencia</label>
              <input style={s.input} type="number" min="0" max="50" value={form.experiencia_años||''} onChange={e=>f('experiencia_años',e.target.value)} placeholder="ej: 8" />
            </div>
          </div>
        </div>

        {/* Datos del vehículo */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          <p style={{ margin: '0 0 14px', fontWeight: 600, color: '#0F2044', fontSize: 14 }}>Datos del vehículo</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={s.label}>Marca</label>
              <select style={s.input} value={form.marca||''} onChange={e=>f('marca',e.target.value)}>
                <option value="">Seleccionar</option>
                {MARCAS_VEHICULO.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={s.label}>Modelo</label>
              <input style={s.input} value={form.modelo||''} onChange={e=>f('modelo',e.target.value)} placeholder="ej: H1, Starex" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={s.label}>Año</label>
              <select style={s.input} value={form.año||''} onChange={e=>f('año',e.target.value)}>
                <option value="">Seleccionar</option>
                {AÑOS_VEHICULO.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={s.label}>Patente</label>
              <input style={{ ...s.input, textTransform: 'uppercase' }} value={form.patente||''} onChange={e=>f('patente',e.target.value.toUpperCase())} placeholder="ABCD12" maxLength={6} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={s.label}>Color</label>
              <input style={s.input} value={form.color||''} onChange={e=>f('color',e.target.value)} placeholder="ej: Blanco" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={s.label}>Capacidad (pasajeros)</label>
              <input style={s.input} type="number" min="1" max="20" value={form.capacidad||''} onChange={e=>f('capacidad',e.target.value)} placeholder="ej: 10" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" style={s.btnSecundario} onClick={() => { setModo('ver'); setFotoFile(null); setFotoPreview(null) }}>Cancelar</button>
          <button type="submit" style={s.btnPrimario} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar perfil'}</button>
        </div>
      </form>
    </div>
  )

  // ── Vista ──
  const mttOk    = perfil.mtt_verificado
  const mttFecha = perfil.mtt_fecha ? new Date(perfil.mtt_fecha).toLocaleDateString('es-CL') : null
  const mttVencido = mttFecha && (new Date() - new Date(perfil.mtt_fecha)) > 365 * 24 * 3600 * 1000

  return (
    <div style={s.vista}>
      <div style={s.vistaHeader}>
        <h1 style={s.vtitulo}>Mi Perfil</h1>
        <button style={s.btnPrimario} onClick={() => setModo('editar')}>Editar perfil</button>
      </div>

      {/* Tarjeta principal */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden', marginBottom: 16 }}>
        {/* Header azul */}
        <div style={{ background: '#0F2044', padding: '24px 24px 20px', display: 'flex', alignItems: 'center', gap: 18 }}>
          {foto
            ? <img src={foto} alt="Foto perfil" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #F5C400', flexShrink: 0 }} />
            : <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#1A3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #F5C400', fontSize: 32, flexShrink: 0 }}>👤</div>
          }
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 20, fontFamily: "'Sora',system-ui,sans-serif" }}>
              {perfil.nombre || <span style={{ color: '#7a9cc8', fontStyle: 'italic', fontSize: 16 }}>Sin nombre — edita tu perfil</span>}
            </div>
            {perfil.rut && <div style={{ color: '#a8c0dd', fontSize: 13, marginTop: 2 }}>RUT {perfil.rut}</div>}
            {perfil.experiencia_años && <div style={{ color: '#a8c0dd', fontSize: 13 }}>{perfil.experiencia_años} años de experiencia</div>}
          </div>
          {/* Badge MTT */}
          <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
            {mttOk && !mttVencido
              ? <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 10, padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 18 }}>✓</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', lineHeight: 1.2 }}>CERTIFICADO<br/>MTT</span>
                  {mttFecha && <span style={{ fontSize: 10, color: '#16a34a' }}>Verificado {mttFecha}</span>}
                </div>
              : mttVencido
                ? <div style={{ background: '#fef9c3', border: '1.5px solid #fde68a', borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>⚠ REVERIFICAR<br/>MTT</span>
                    {mttFecha && <div style={{ fontSize: 10, color: '#b45309' }}>Última vez: {mttFecha}</div>}
                  </div>
                : <div style={{ background: '#fee2e2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#991b1b' }}>SIN VERIFICAR<br/>MTT</span>
                  </div>
            }
          </div>
        </div>

        {/* Datos vehículo */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>Vehículo</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { label: 'Marca',     val: perfil.marca },
              { label: 'Modelo',    val: perfil.modelo },
              { label: 'Año',       val: perfil.año },
              { label: 'Patente',   val: perfil.patente },
              { label: 'Color',     val: perfil.color },
              { label: 'Capacidad', val: perfil.capacidad ? `${perfil.capacidad} pasajeros` : null },
            ].map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: val ? '#0F2044' : '#cbd5e1', fontStyle: val ? 'normal' : 'italic' }}>
                  {val || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verificación MTT */}
        <div style={{ padding: '16px 24px', background: '#F2F5FA' }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>Verificación MTT</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <a
              href={`http://apps.mtt.cl/consultaweb/?patente=${perfil.patente || ''}`}
              target="_blank" rel="noopener noreferrer"
              style={{ ...s.btnPrimario, textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {IC.link} Consultar en MTT
            </a>
            {!mttOk || mttVencido
              ? <button style={{ ...s.btnSecundario, fontSize: 13 }} onClick={marcarMTT}>
                  Marcar como verificado hoy
                </button>
              : <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>✓ Verificado el {mttFecha}</span>
            }
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Verifica la patente en el sitio oficial del MTT y marca como verificado</span>
          </div>
        </div>
      </div>

      {/* Contacto */}
      {(perfil.telefono || perfil.email) && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
          {perfil.telefono && (
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>Teléfono</div>
              <a href={`https://wa.me/${perfil.telefono.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 14, fontWeight: 600, color: '#0F2044', textDecoration: 'none' }}>
                {perfil.telefono}
              </a>
            </div>
          )}
          {perfil.email && (
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>Email</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0F2044' }}>{perfil.email}</span>
            </div>
          )}
        </div>
      )}

      {/* ── SECCIÓN MARKETPLACE ─────────────────────────── */}
      {tpPerfil && (<>

        {/* Toggle visible */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0F2044', marginBottom: 2 }}>Visible en el marketplace</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {tpPerfil.visible
                  ? 'Apoderados sin transporte pueden encontrarte y solicitar cupo.'
                  : 'Solo tus apoderados actuales te ven. Activa para recibir nuevas solicitudes.'}
              </div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={toggleVisible}
              aria-pressed={tpPerfil.visible}
              style={{
                width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', flexShrink: 0,
                background: tpPerfil.visible ? '#0F2044' : '#cbd5e1',
                position: 'relative', transition: 'background .2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 3,
                left: tpPerfil.visible ? 27 : 3,
                width: 22, height: 22, borderRadius: '50%',
                background: tpPerfil.visible ? '#F5C400' : '#fff',
                transition: 'left .2s',
                display: 'block',
              }}/>
            </button>
          </div>
        </div>

        {/* Toggle precios públicos — solo si ya está visible */}
        {tpPerfil.visible && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0F2044', marginBottom: 2 }}>Mostrar precios al apoderado</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {tpPerfil.precios_publicos
                    ? 'Los apoderados ven tus tarifas antes de solicitar cupo.'
                    : 'Los apoderados solo ven tus cupos disponibles. Activa para mostrar precios.'}
                </div>
              </div>
              <button
                onClick={togglePreciosPublicos}
                aria-pressed={tpPerfil.precios_publicos}
                style={{
                  width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: tpPerfil.precios_publicos ? '#0F2044' : '#cbd5e1',
                  position: 'relative', transition: 'background .2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 3,
                  left: tpPerfil.precios_publicos ? 27 : 3,
                  width: 22, height: 22, borderRadius: '50%',
                  background: tpPerfil.precios_publicos ? '#F5C400' : '#fff',
                  transition: 'left .2s',
                  display: 'block',
                }}/>
              </button>
            </div>
          </div>
        )}

        {/* Perfil público: descripción, experiencia, capacidad */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 16 }}>
          <p style={{ margin: '0 0 14px', fontWeight: 600, color: '#0F2044', fontSize: 14 }}>Perfil público</p>
          {msgMkt && (
            <div style={{ fontSize: 13, color: msgMkt.ok ? '#16a34a' : '#dc2626', marginBottom: 10, fontWeight: 500 }}>
              {msgMkt.texto}
            </div>
          )}
          <form onSubmit={guardarPerfilPublico} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={s.label}>Años de experiencia</label>
                <input style={s.input} type="number" min="0" max="50"
                  value={tpPerfil.anos_experiencia || ''}
                  onChange={e => setTpPerfil(p => ({ ...p, anos_experiencia: e.target.value }))}
                  placeholder="ej: 8" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={s.label}>Capacidad total del furgón</label>
                <input style={s.input} type="number" min="1" max="30"
                  value={tpPerfil.capacidad_total || ''}
                  onChange={e => setTpPerfil(p => ({ ...p, capacidad_total: e.target.value }))}
                  placeholder="ej: 12" />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={s.label}>Descripción breve <span style={{ color: '#94a3b8', fontWeight: 400 }}>(máx. 400 caracteres)</span></label>
              <textarea
                style={{ ...s.input, minHeight: 72, resize: 'vertical', fontFamily: 'inherit' }}
                maxLength={400}
                value={tpPerfil.descripcion || ''}
                onChange={e => setTpPerfil(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Cuéntales a los apoderados sobre tu servicio, sector que cubres, etc."
              />
              <span style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>
                {(tpPerfil.descripcion || '').length}/400
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={s.btnPrimario} disabled={guardandoMkt}>
                {guardandoMkt ? 'Guardando…' : 'Guardar perfil público'}
              </button>
            </div>
          </form>
        </div>

        {/* Precios por modalidad */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 16 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#0F2044', fontSize: 14 }}>Precios por modalidad</p>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>Precio mensual de referencia que verán los apoderados al buscar transporte.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'manana',   label: 'Solo mañana',   sub: 'Hogar → Colegio' },
              { key: 'tarde',    label: 'Solo tarde',    sub: 'Colegio → Hogar' },
              { key: 'completo', label: 'Servicio completo', sub: 'Ida y vuelta' },
            ].map(({ key, label, sub }) => {
              const actual = precios.find(p => p.modalidad === key)
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0F2044' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>$</span>
                    <input
                      style={{ ...s.input, width: 110, margin: 0, textAlign: 'right' }}
                      type="number" min="1000" step="1000"
                      defaultValue={actual?.precio_mensual || ''}
                      placeholder="0"
                      onBlur={e => guardarPrecio(key, e.target.value)}
                      key={actual?.precio_mensual}  // re-render si cambia desde BD
                    />
                  </div>
                  {actual?.precio_mensual && (
                    <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, minWidth: 70, textAlign: 'right' }}>
                      {actual.precio_mensual.toLocaleString('es-CL')} CLP
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 11, color: '#94a3b8' }}>El precio se guarda al salir del campo. Deja en 0 para no mostrar esa modalidad.</p>
        </div>

        {/* Colegios que atiende */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 16 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#0F2044', fontSize: 14 }}>Colegios que atiendes</p>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#64748b' }}>Los apoderados filtrarán por colegio al buscar transporte. Marca los que cubres.</p>
          {/* Filtro por sector */}
          {colegiosCat.length > 0 && (() => {
            const sectores = [...new Set(colegiosCat.map(c => c.sector).filter(Boolean))].sort()
            const LABEL_SECTOR = { penco: 'Penco centro', lirquen: 'Lirquén', cosmito: 'Cosmito' }
            return (
              <select
                value={sectorFiltroPerf}
                onChange={e => setSectorFiltroPerf(e.target.value)}
                style={{ ...s.input, marginBottom: 14, fontSize: 13 }}
              >
                <option value="">Todos los sectores</option>
                {sectores.map(sec => (
                  <option key={sec} value={sec}>{LABEL_SECTOR[sec] || sec}</option>
                ))}
              </select>
            )
          })()}
          {colegiosCat.length === 0
            ? <p style={{ fontSize: 13, color: '#94a3b8' }}>Cargando colegios…</p>
            : (() => {
                // Filtrar por sector si hay uno seleccionado
                const catFiltrado = sectorFiltroPerf
                  ? colegiosCat.filter(c => c.sector === sectorFiltroPerf)
                  : colegiosCat
                // Agrupar por tipo
                const grupos = {}
                const labelTipo = {
                  basica: 'Básica', basica_media: 'Básica y Media', media: 'Media',
                  especial_lenguaje: 'Lenguaje', especial_diferencial: 'Diferencial',
                  jardin: 'Jardín', sala_cuna: 'Sala Cuna', otro: 'Otro'
                }
                catFiltrado.forEach(c => {
                  const g = labelTipo[c.tipo] || c.tipo
                  if (!grupos[g]) grupos[g] = []
                  grupos[g].push(c)
                })
                if (Object.keys(grupos).length === 0) return (
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>No hay colegios en este sector.</p>
                )
                return Object.entries(grupos).map(([grupo, cols]) => (
                  <div key={grupo} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{grupo}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {cols.map(c => {
                        const marcado = tcActivos.some(t => t.colegio_id === c.id)
                        return (
                          <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: marcado ? '#EFF6FF' : '#F8FAFC', border: `1px solid ${marcado ? '#bfdbfe' : '#e2e8f0'}`, transition: 'background .15s' }}>
                            <input type="checkbox" checked={marcado} onChange={() => toggleColegio(c.id)}
                              style={{ width: 16, height: 16, accentColor: '#0F2044', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: marcado ? 600 : 400, color: '#0F2044' }}>{c.nombre}</div>
                              {c.sector && <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.sector === 'lirquen' ? 'Lirquén' : c.sector === 'cosmito' ? 'Cosmito' : 'Penco centro'}</div>}
                            </div>
                            {marcado && (
                              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#0F2044', background: '#F5C400', borderRadius: 4, padding: '2px 6px' }}>✓</span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))
              })()
          }
        </div>

      </>)}

      {/* T4: Historial de cambios del perfil ── */}
      <HistorialCambiosPerfil userId={perfil?.user_id} />

    </div>
  )
}

// T4: wrapper que carga user_id y renderiza HistorialCambios en Perfil
function HistorialCambiosPerfil({ userId }) {
  const [uid, setUid] = useState(userId || null)
  const [expandido, setExpandido] = useState(false)

  useEffect(() => {
    if (!uid) {
      supabase.auth.getUser().then(({ data: { user } }) => setUid(user?.id || null))
    }
  }, [uid])

  if (!uid) return null

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginTop: 4 }}>
      <button
        onClick={() => setExpandido(v => !v)}
        aria-expanded={expandido}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, color: '#0F2044' }}>Historial de cambios</span>
        <span style={{ fontSize: 12, color: '#64748b', transform: expandido ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>▼</span>
      </button>
      {expandido && (
        <div style={{ marginTop: 16 }}>
          <HistorialCambios propietario_id={uid} entidad={null} entidad_id={null} />
        </div>
      )}
    </div>
  )
}

function Dashboard({ sesion, onLogout }) {
  const [seccion, setSeccion]       = useState('home')
  const [drawerAbierto, setDrawer]  = useState(false)
  const [modalSalir, setModalSalir] = useState(false)
  // Detectar ancho para mostrar/ocultar sidebar fijo
  const [esDesktop, setEsDesktop]   = useState(window.innerWidth >= 768)

  const pedirSalir  = () => setModalSalir(true)
  const cancelarSalir = () => setModalSalir(false)
  const confirmarSalir = () => { setModalSalir(false); onLogout() }

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e) => { setEsDesktop(e.matches); if (e.matches) setDrawer(false) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const item = MENU.find(m => m.id === seccion)

  const Sidebar = () => (
    <nav
      style={{
        width: SIDEBAR_W, minWidth: SIDEBAR_W, background: '#0F2044',
        borderTop: '3px solid #F5C400',
        display: 'flex', flexDirection: 'column',
        padding: '24px 0 16px', height: '100vh',
        ...(esDesktop
          ? { position: 'sticky', top: 0, flexShrink: 0 }
          : { position: 'fixed', top: 0, left: drawerAbierto ? 0 : -SIDEBAR_W - 10,
              zIndex: 200, transition: 'left .25s', boxShadow: drawerAbierto ? '4px 0 24px rgba(0,0,0,.3)' : 'none' })
      }}
      aria-label="Menú principal"
    >
      <div style={s.sideHeader}>
        <span style={s.sideLogo}>{IC.bus}</span>
        <div>
          <div style={s.sideNombre}>Furcole</div>
          <div style={s.sideUser}>{sesion.user.email}</div>
        </div>
      </div>
      <div style={s.nav}>
        {MENU.map(m => (
          <button
            key={m.id}
            style={{ ...s.navBtn, ...(seccion === m.id ? s.navActivo : {}) }}
            onClick={() => { setSeccion(m.id); setDrawer(false) }}
            aria-current={seccion === m.id ? 'page' : undefined}
          >
            <span style={s.navIcon} aria-hidden="true">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>
      <button style={s.logoutBtn} onClick={pedirSalir} aria-label="Cerrar sesión">
        {IC.logout} Cerrar sesión
      </button>
    </nav>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter',system-ui,sans-serif", background: '#F2F5FA', overflow: 'hidden' }}>

      {modalSalir && <ModalSalir onConfirmar={confirmarSalir} onCancelar={cancelarSalir} />}

      {/* Overlay solo en mobile cuando drawer abierto */}
      {!esDesktop && drawerAbierto && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 199 }}
          onClick={() => setDrawer(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar />

      {/* Contenido principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <header style={s.topbar}>
          {/* Hamburger solo en mobile */}
          {!esDesktop && (
            <button
              style={s.hamburger}
              onClick={() => setDrawer(o => !o)}
              aria-label="Abrir menú"
              aria-expanded={drawerAbierto}
            >☰</button>
          )}
          <span style={{ ...s.topTitulo, flex: 1 }}>{item?.icon} {item?.label}</span>
          {/* Logout siempre visible en topbar */}
          <button
            onClick={pedirSalir}
            style={{ background: 'none', border: '1px solid #dde4ef', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            aria-label="Cerrar sesión"
          >
            {IC.logout} <span style={{ display: esDesktop ? 'inline' : 'none' }}>Salir</span>
          </button>
        </header>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {seccion === 'home'        && <Home onNavegar={setSeccion} />}
          {seccion === 'apoderados'  && <Apoderados />}
          {seccion === 'alumnos'     && <Alumnos />}
          {seccion === 'cobros'      && <Cobros />}
          {seccion === 'rutas'       && <Rutas />}
          {seccion === 'viaje'       && <Viaje />}
          {seccion === 'solicitudes' && <BandejaSolicitudes />}
          {seccion === 'asistencia'  && <Asistencia />}
          {seccion === 'avisos'      && <Avisos />}
          {seccion === 'perfil'      && <Perfil />}
        </div>
      </div>
    </div>
  )
}

// ─── Rate limiting login (cliente) ───────────────────────────────────────────
// Clave en localStorage: furcole_login_intentos
// Estructura: { count: number, bloqueadoHasta: number | null }
const MAX_INTENTOS   = 5
const BLOQUEO_MS     = 15 * 60 * 1000  // 15 minutos

function leerIntentos() {
  try {
    const raw = localStorage.getItem('furcole_login_intentos')
    return raw ? JSON.parse(raw) : { count: 0, bloqueadoHasta: null }
  } catch { return { count: 0, bloqueadoHasta: null } }
}

function guardarIntentos(data) {
  try { localStorage.setItem('furcole_login_intentos', JSON.stringify(data)) } catch {}
}

function resetIntentos() {
  try { localStorage.removeItem('furcole_login_intentos') } catch {}
}

// ─── Login ────────────────────────────────────────────────────────────────────
function Login({ vistaInicial = 'login' }) {
  const [vista, setVista]           = useState(vistaInicial) // 'login' | 'recuperar' | 'recuperar_ok'
  const [rol, setRol]               = useState('transportista') // 'transportista' | 'apoderado'
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState('')
  const [cargando, setCargando]     = useState(false)
  const [bloqueado, setBloqueado]   = useState(false)
  const [mostrarPass, setMostrarPass] = useState(false)
  const [segundos, setSegundos]     = useState(0)

  // Verificar bloqueo al montar
  useEffect(() => {
    const { bloqueadoHasta } = leerIntentos()
    if (bloqueadoHasta && Date.now() < bloqueadoHasta) {
      setBloqueado(true)
      setSegundos(Math.ceil((bloqueadoHasta - Date.now()) / 1000))
    }
  }, [])

  // Cuenta regresiva
  useEffect(() => {
    if (!bloqueado) return
    const t = setInterval(() => {
      const { bloqueadoHasta } = leerIntentos()
      const restante = bloqueadoHasta ? Math.ceil((bloqueadoHasta - Date.now()) / 1000) : 0
      if (restante <= 0) {
        resetIntentos()
        setBloqueado(false)
        setSegundos(0)
        setError('')
      } else {
        setSegundos(restante)
      }
    }, 1000)
    return () => clearInterval(t)
  }, [bloqueado])

  const sanitizar = (str) => str.trim().slice(0, 254)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    // Verificar bloqueo
    const intentos = leerIntentos()
    if (intentos.bloqueadoHasta && Date.now() < intentos.bloqueadoHasta) {
      setBloqueado(true)
      setSegundos(Math.ceil((intentos.bloqueadoHasta - Date.now()) / 1000))
      return
    }

    const emailLimpio    = sanitizar(email)
    const passwordLimpio = sanitizar(password)

    if (!emailLimpio || !passwordLimpio) { setError('Completa todos los campos'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) { setError('Ingresa un email válido'); return }
    if (passwordLimpio.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setCargando(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email: emailLimpio, password: passwordLimpio })
    setCargando(false)

    if (err) {
      const nuevoCount = intentos.count + 1
      if (nuevoCount >= MAX_INTENTOS) {
        const bloqueadoHasta = Date.now() + BLOQUEO_MS
        guardarIntentos({ count: nuevoCount, bloqueadoHasta })
        setBloqueado(true)
        setSegundos(Math.ceil(BLOQUEO_MS / 1000))
        setError(`Demasiados intentos fallidos. Espera 15 minutos.`)
      } else {
        guardarIntentos({ count: nuevoCount, bloqueadoHasta: null })
        const restantes = MAX_INTENTOS - nuevoCount
        setError(`Email o contraseña incorrectos. ${restantes} intento${restantes !== 1 ? 's' : ''} restante${restantes !== 1 ? 's' : ''}.`)
      }
    } else {
      resetIntentos()
    }
  }

  const handleRecuperar = async (e) => {
    e.preventDefault()
    setError('')
    const emailLimpio = sanitizar(email)
    if (!emailLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
      setError('Ingresa un email válido'); return
    }
    setCargando(true)
    const redirectTo = `${process.env.REACT_APP_URL || window.location.origin}/actualizar-password`
    await supabase.auth.resetPasswordForEmail(emailLimpio, { redirectTo })
    setCargando(false)
    setVista('recuperar_ok')
  }

  const formatSegundos = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div style={s.fondo}>
      <div style={s.card} role="main">
        <div style={s.logo} aria-hidden="true">{IC.busLarge}</div>
        <h1 style={s.titulo}>Furcole</h1>
        <p style={s.subtitulo}>Gestión de transporte escolar</p>

        {/* Tabs de rol */}
        {vista === 'login' && (
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 20, gap: 4 }} role="tablist">
            {[['transportista', 'Transportista'], ['apoderado', 'Apoderado']].map(([v, label]) => (
              <button key={v} role="tab" aria-selected={rol === v}
                onClick={() => setRol(v)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .15s',
                  background: rol === v ? '#0F2044' : 'transparent',
                  color: rol === v ? '#F5C400' : '#64748b' }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {vista === 'login' && (
          <form onSubmit={handleLogin} style={s.form} noValidate>
            <label style={s.labelLogin} htmlFor="login-email">Correo electrónico</label>
            <input
              id="login-email" style={s.input} type="email"
              placeholder="correo@ejemplo.com" value={email}
              onChange={e => setEmail(e.target.value)}
              required autoComplete="email" maxLength={254}
              disabled={bloqueado || cargando}
              aria-describedby={error ? 'login-error' : undefined}
            />
            <label style={s.labelLogin} htmlFor="login-pass">Contraseña</label>
            <div style={{ position: 'relative', width: '100%', display: 'block' }}>
              <input
                id="login-pass" style={{ ...s.input, paddingRight: 40 }} type={mostrarPass ? 'text' : 'password'}
                placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password" maxLength={128}
                disabled={bloqueado || cargando}
              />
              <button
                type="button"
                onClick={() => setMostrarPass(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', padding: 0, lineHeight: 1 }}
                aria-label={mostrarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >{mostrarPass ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}</button>
            </div>
            {bloqueado && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#dc2626', textAlign: 'center' }} role="alert">
                ⛔ Cuenta bloqueada. Intenta en {formatSegundos(segundos)}
              </div>
            )}
            {error && !bloqueado && <p id="login-error" style={s.errorMsg} role="alert">{error}</p>}
            <button style={s.btn} type="submit" disabled={cargando || bloqueado}>
              {cargando ? 'Ingresando…' : 'Ingresar'}
            </button>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#0F2044', fontSize: 13, cursor: 'pointer', marginTop: 4, textDecoration: 'underline' }}
              onClick={() => { setVista('recuperar'); setError('') }}
            >
              ¿Olvidaste tu contraseña?
            </button>
            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 16, paddingTop: 16 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>¿No tienes cuenta? </span>
              <button type="button"
                style={{ background: 'none', border: 'none', color: '#0F2044', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                onClick={() => window.location.href = rol === 'apoderado' ? '/registro-apoderado' : '/registro-transportista'}>
                Crear cuenta
              </button>
            </div>
          </form>
        )}

        {vista === 'recuperar' && (
          <form onSubmit={handleRecuperar} style={s.form} noValidate>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4, textAlign: 'left' }}>
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <label style={s.labelLogin} htmlFor="rec-email">Correo electrónico</label>
            <input
              id="rec-email" style={s.input} type="email"
              placeholder="correo@ejemplo.com" value={email}
              onChange={e => setEmail(e.target.value)}
              required autoComplete="email" maxLength={254} autoFocus
            />
            {error && <p style={s.errorMsg} role="alert">{error}</p>}
            <button style={s.btn} type="submit" disabled={cargando}>
              {cargando ? 'Enviando…' : 'Enviar enlace'}
            </button>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', marginTop: 4, textDecoration: 'underline' }}
              onClick={() => { setVista('login'); setError('') }}
            >
              ← Volver al inicio de sesión
            </button>
          </form>
        )}

        {vista === 'recuperar_ok' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 12 }}>{IC.email}</div>
            <p style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>
              Si el email está registrado, recibirás un enlace para restablecer tu contraseña.
            </p>
            <button
              style={s.btn}
              onClick={() => setVista('login')}
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Registro Apoderado (libre, sin alumnoKey) ───────────────────────────────
// Flujo: datos → verificar_email → buscar_transportista → solicitud_enviada
function RegistroApoderado() {
  const [paso, setPaso]         = useState('datos')
  const [form, setForm]         = useState({ nombre: '', email: '', password: '', confirmar: '' })
  const [uid, setUid]           = useState(null)   // user_id post-registro
  const [error, setError]       = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarPass, setMostrarPass] = useState(false)

  // Estado del buscador de transportistas
  const [transportistas, setTransportistas] = useState([])
  const [cargandoT, setCargandoT]           = useState(false)
  const [filtroColegio, setFiltroColegio]   = useState('')
  const [colegiosDisp, setColegiosDisp]     = useState([])
  const [solicitudEnviada, setSolicitudEnviada] = useState(null) // { transportistaNombre }
  const [enviandoSol, setEnviandoSol]       = useState(false)
  const [errorSol, setErrorSol]             = useState('')
  // Formulario de solicitud
  const [solAbierta, setSolAbierta]         = useState(null)  // transportista_user_id
  const [modalidad, setModalidad]           = useState('completo')
  const [notaAp, setNotaAp]                 = useState('')

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const sanitizar = str => str.trim().slice(0, 254)

  // ── Cargar transportistas visibles ─────────────────────────────────────────
  async function cargarTransportistas(colegio) {
    setCargandoT(true)
    setErrorSol('')
    let q = supabase
      .from('transportista_perfil')
      .select('user_id, nombre, telefono, foto_url, precio_mensual, precios_publicos, colegios, capacidad, modalidades')
      .eq('visible', true)
    if (colegio) {
      q = q.contains('colegios', [colegio])
    }
    const { data } = await q.order('nombre')
    setTransportistas(data || [])

    // Obtener lista de colegios únicos para el filtro
    if (!colegio) {
      const todos = (data || []).flatMap(t => t.colegios || [])
      setColegiosDisp([...new Set(todos)].sort())
    }
    setCargandoT(false)
  }

  // ── Enviar solicitud de cupo ────────────────────────────────────────────────
  async function enviarSolicitud(transportistaId, transportistaNombre) {
    setEnviandoSol(true); setErrorSol('')
    // Para enviar solicitud necesitamos sesión — el apoderado debe iniciar sesión primero
    // si no confirmó el email, guardamos la intención en localStorage
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorSol('Debes confirmar tu email e iniciar sesión antes de enviar una solicitud.')
      setEnviandoSol(false)
      return
    }
    const { error } = await supabase.from('solicitudes_cupo').insert({
      apoderado_user_id:     user.id,
      transportista_user_id: transportistaId,
      modalidad,
      nota_apoderado:        notaAp.trim() || null,
      estado:                'pendiente',
    })
    if (error) {
      setErrorSol(error.code === '23505'
        ? 'Ya tienes una solicitud pendiente con este transportista.'
        : 'Error al enviar la solicitud. Intenta nuevamente.')
    } else {
      setSolicitudEnviada({ transportistaNombre })
      setSolAbierta(null)
    }
    setEnviandoSol(false)
  }

  // ── Registrarse ────────────────────────────────────────────────────────────
  async function registrar(e) {
    e.preventDefault()
    setError('')
    const nombre   = sanitizar(form.nombre)
    const email    = sanitizar(form.email).toLowerCase()
    const password = form.password
    if (!nombre)                      { setError('Ingresa tu nombre completo'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Ingresa un email válido'); return }
    if (password.length < 8)          { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== form.confirmar)  { setError('Las contraseñas no coinciden'); return }
    setEnviando(true)
    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre, rol: 'apoderado' } }
      })
      if (authErr) throw authErr
      const newUid = data?.user?.id
      if (newUid) {
        setUid(newUid)
        await supabase.from('apoderado_perfil').upsert({
          user_id: newUid, nombre, email,
        }, { onConflict: 'user_id' })
      }
      setPaso('verificar')
    } catch(err) {
      setError(err.message || 'Error al registrarse')
    } finally { setEnviando(false) }
  }

  // ── Paso: email enviado ─────────────────────────────────────────────────────
  if (paso === 'verificar') return (
    <div style={s.fondo}>
      <div style={{ ...s.card, maxWidth: 460 }} role="main">
        <div style={s.logo}>{IC.busLarge}</div>
        <h1 style={s.titulo}>Furcole</h1>
        <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
            ✉️ Enviamos un link de confirmación a <strong>{form.email}</strong>.<br/>
            Confírmalo para activar tu cuenta.
          </p>
        </div>
        <p style={{ fontSize: 13, color: '#374151', marginBottom: 20 }}>
          Mientras tanto, puedes explorar los transportistas disponibles y reservar un cupo. La solicitud se enviará cuando inicies sesión.
        </p>
        <button
          style={s.btn}
          onClick={() => { cargarTransportistas(''); setPaso('buscar') }}
        >
          Buscar transportista →
        </button>
        <button type="button"
          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', marginTop: 12, textDecoration: 'underline', display: 'block', margin: '12px auto 0' }}
          onClick={() => window.location.href = '/portal'}>
          Ir al portal de apoderado
        </button>
      </div>
    </div>
  )

  // ── Paso: solicitud enviada ─────────────────────────────────────────────────
  if (paso === 'buscar' && solicitudEnviada) return (
    <div style={s.fondo}>
      <div style={{ ...s.card, maxWidth: 460 }} role="main">
        <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }} aria-hidden="true">🎉</div>
        <h1 style={{ ...s.titulo, marginBottom: 8 }}>¡Solicitud enviada!</h1>
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 20, textAlign: 'center' }}>
          Tu solicitud a <strong>{solicitudEnviada.transportistaNombre}</strong> fue enviada.<br/>
          El transportista la revisará y te contactará.
        </p>
        <button style={s.btn} onClick={() => setSolicitudEnviada(null)}>
          Buscar otro transportista
        </button>
        <button type="button"
          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', marginTop: 12, textDecoration: 'underline', display: 'block', margin: '12px auto 0' }}
          onClick={() => window.location.href = '/portal'}>
          Ir al portal
        </button>
      </div>
    </div>
  )

  // ── Paso: buscador de transportistas ───────────────────────────────────────
  if (paso === 'buscar') return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '24px 16px 48px' }}>
      {/* Header */}
      <div style={{ maxWidth: 680, margin: '0 auto 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ background: '#F5C400', borderRadius: 10, padding: 8, display: 'inline-flex' }} aria-hidden="true">{IC.bus}</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0F2044', fontFamily: "'Sora',system-ui,sans-serif" }}>
              Buscar transportista
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              Encuentra un furgón escolar para tu hijo/a
            </p>
          </div>
        </div>

        {/* Filtro por colegio */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 16 }}>
          <label htmlFor="filtro-colegio" style={{ fontSize: 13, fontWeight: 600, color: '#374151', flexShrink: 0 }}>
            Filtrar por colegio:
          </label>
          <select
            id="filtro-colegio"
            value={filtroColegio}
            onChange={e => { setFiltroColegio(e.target.value); cargarTransportistas(e.target.value) }}
            style={{ flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, background: '#fff', color: '#0F2044' }}
            aria-label="Filtrar transportistas por colegio"
          >
            <option value="">Todos los colegios</option>
            {colegiosDisp.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            {cargandoT ? 'Buscando…' : `${transportistas.length} disponible${transportistas.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Lista */}
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {cargandoT ? (
          [1,2,3].map(i => <div key={i}><Skeleton h={120} r={14} /></div>)
        ) : transportistas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }} aria-hidden="true">🚌</div>
            <p style={{ fontSize: 14, margin: 0 }}>No hay transportistas disponibles{filtroColegio ? ` para ${filtroColegio}` : ''}.</p>
            {filtroColegio && (
              <button
                style={{ background: 'none', border: 'none', color: '#0F2044', fontSize: 13, cursor: 'pointer', marginTop: 8, textDecoration: 'underline' }}
                onClick={() => { setFiltroColegio(''); cargarTransportistas('') }}>
                Ver todos
              </button>
            )}
          </div>
        ) : transportistas.map(t => {
          const estaAbierta = solAbierta === t.user_id
          const precioRef = t.precios_publicos && t.precio_mensual
          return (
            <div key={t.user_id} style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.08)', border: '1.5px solid #E2E8F0' }}>
              {/* Cabecera tarjeta */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: estaAbierta ? 16 : 0 }}>
                {/* Avatar */}
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {t.foto_url
                    ? <img src={t.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 20 }} aria-hidden="true">🚐</span>
                  }
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#0F2044' }}>{t.nombre || 'Transportista'}</p>
                  {precioRef && (
                    <p style={{ margin: '3px 0 0', fontSize: 13, color: '#059669', fontWeight: 600 }}>
                      ${Number(t.precio_mensual).toLocaleString('es-CL')} / mes
                    </p>
                  )}
                  {(t.colegios || []).length > 0 && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                      {(t.colegios || []).slice(0, 3).join(' · ')}{(t.colegios || []).length > 3 ? ' …' : ''}
                    </p>
                  )}
                </div>
                {/* Botón solicitar */}
                {!estaAbierta && (
                  <button
                    onClick={() => { setSolAbierta(t.user_id); setModalidad('completo'); setNotaAp('') }}
                    style={{ background: '#0F2044', color: '#F5C400', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                    aria-expanded="false"
                    aria-controls={`sol-form-${t.user_id}`}
                  >
                    Solicitar cupo
                  </button>
                )}
              </div>

              {/* Formulario de solicitud (expandible) */}
              {estaAbierta && (
                <div id={`sol-form-${t.user_id}`} role="region" aria-label={`Solicitud a ${t.nombre}`}>
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                    <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#0F2044' }}>
                      Solicitar cupo a {t.nombre}
                    </p>

                    {/* Modalidad */}
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                      Modalidad
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }} role="group" aria-label="Selecciona modalidad">
                      {[['completo','Completo (ida y vuelta)'],['manana','Solo mañana'],['tarde','Solo tarde']].map(([v, label]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setModalidad(v)}
                          style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            border: `1.5px solid ${modalidad === v ? '#0F2044' : '#CBD5E1'}`,
                            background: modalidad === v ? '#0F2044' : '#fff',
                            color: modalidad === v ? '#F5C400' : '#374151',
                          }}
                          aria-pressed={modalidad === v}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Nota opcional */}
                    <label htmlFor={`nota-${t.user_id}`} style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                      Mensaje al transportista <span style={{ fontWeight: 400, color: '#94A3B8' }}>(opcional)</span>
                    </label>
                    <textarea
                      id={`nota-${t.user_id}`}
                      value={notaAp}
                      onChange={e => setNotaAp(e.target.value.slice(0, 300))}
                      placeholder="Ej: Mi hijo va al colegio X en calle Y. ¿Tiene disponibilidad?"
                      maxLength={300}
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                    <p style={{ textAlign: 'right', fontSize: 11, color: '#94A3B8', margin: '2px 0 12px' }}>{notaAp.length}/300</p>

                    {errorSol && <p style={{ fontSize: 13, color: '#DC2626', margin: '0 0 12px' }} role="alert">{errorSol}</p>}

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => enviarSolicitud(t.user_id, t.nombre)}
                        disabled={enviandoSol}
                        style={{ flex: 1, background: '#F5C400', color: '#0F2044', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 14, cursor: enviandoSol ? 'wait' : 'pointer' }}
                        aria-busy={enviandoSol}
                      >
                        {enviandoSol ? 'Enviando…' : 'Enviar solicitud'}
                      </button>
                      <button
                        onClick={() => setSolAbierta(null)}
                        style={{ background: '#F1F5F9', color: '#374151', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, cursor: 'pointer' }}
                        aria-label="Cancelar solicitud"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer con link al portal */}
      <div style={{ maxWidth: 680, margin: '32px auto 0', textAlign: 'center' }}>
        <button
          type="button"
          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => window.location.href = '/portal'}
        >
          Ir al portal de apoderado
        </button>
      </div>
    </div>
  )

  return (
    <div style={s.fondo}>
      <div style={s.card} role="main">
        <div style={s.logo} aria-hidden="true">{IC.busLarge}</div>
        <h1 style={s.titulo}>Furcole</h1>
        <p style={s.subtitulo}>Crear cuenta — Apoderado</p>
        <form onSubmit={registrar} style={s.form} noValidate>
          <label style={s.labelLogin} htmlFor="ra-nombre">Nombre completo</label>
          <input id="ra-nombre" style={s.input} type="text" placeholder="Juan Pérez"
            value={form.nombre} onChange={e => f('nombre', e.target.value)}
            required maxLength={120} autoComplete="name" />
          <label style={s.labelLogin} htmlFor="ra-email">Correo electrónico</label>
          <input id="ra-email" style={s.input} type="email" placeholder="correo@ejemplo.com"
            value={form.email} onChange={e => f('email', e.target.value)}
            required maxLength={254} autoComplete="email" />
          <label style={s.labelLogin} htmlFor="ra-pass">Contraseña</label>
          <div style={{ position: 'relative', width: '100%', display: 'block' }}>
            <input id="ra-pass" style={{ ...s.input, paddingRight: 40 }}
              type={mostrarPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
              value={form.password} onChange={e => f('password', e.target.value)}
              required maxLength={128} autoComplete="new-password" />
            <button type="button" onClick={() => setMostrarPass(v => !v)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, lineHeight: 1 }}
              aria-label={mostrarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'} tabIndex={-1}>
              {mostrarPass
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
          <label style={s.labelLogin} htmlFor="ra-confirmar">Confirmar contraseña</label>
          <input id="ra-confirmar" style={s.input} type="password" placeholder="Repite tu contraseña"
            value={form.confirmar} onChange={e => f('confirmar', e.target.value)}
            required maxLength={128} autoComplete="new-password" />
          {error && <p style={s.errorMsg} role="alert">{error}</p>}
          <button style={s.btn} type="submit" disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>
        <button type="button"
          style={{ background: 'none', border: 'none', color: '#0F2044', fontSize: 13, cursor: 'pointer', marginTop: 8, textDecoration: 'underline' }}
          onClick={() => window.location.href = '/'}>
          ← Volver al inicio de sesión
        </button>
      </div>
    </div>
  )
}

// ─── Registro Transportista ───────────────────────────────────────────────────
function RegistroTransportista() {
  // paso: 'datos' → 'rntp' → 'cuenta' → 'email_enviado'
  const [paso, setPaso]         = useState('datos')
  const [form, setForm]         = useState({ nombre: '', email: '', password: '', confirmar: '', patente: '', telefono: '' })
  const [rntp, setRntp]         = useState(null)   // { estado, mensaje, datos }
  const [verificando, setVerificando] = useState(false)
  const [error, setError]       = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarPass, setMostrarPass] = useState(false)

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const sanitizar = str => str.trim().slice(0, 254)
  const FNURL = process.env.REACT_APP_SUPABASE_URL?.replace(/\/$/, '') + '/functions/v1/verificar-patente'

  // ── Paso 1: verificar patente en RNTP ──────────────────
  async function verificarPatente(e) {
    e.preventDefault()
    setError('')
    const patente = sanitizar(form.patente).toUpperCase().replace(/[\s\-\.]/g, '')
    if (!patente || patente.length < 4) { setError('Ingresa una patente válida'); return }
    setVerificando(true)
    try {
      const res = await fetch(FNURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || '' },
        body: JSON.stringify({ patente }),
      })
      const data = await res.json()
      setRntp(data)
      setPaso('rntp')
    } catch {
      // Si falla la edge function, permitimos continuar con estado 'error'
      setRntp({ estado: 'error', mensaje: 'No fue posible contactar el RNTP. Puedes continuar de todos modos; tu cuenta quedará en revisión.', datos: { patente } })
      setPaso('rntp')
    } finally { setVerificando(false) }
  }

  // ── Paso 2: crear cuenta ───────────────────────────────
  async function registrar(e) {
    e.preventDefault()
    setError('')
    const nombre   = sanitizar(form.nombre)
    const email    = sanitizar(form.email).toLowerCase()
    const patente  = sanitizar(form.patente).toUpperCase().replace(/[\s\-\.]/g, '')
    const telefono = sanitizar(form.telefono)
    const password = form.password
    if (!nombre)                      { setError('Ingresa tu nombre completo'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Ingresa un email válido'); return }
    if (password.length < 8)          { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== form.confirmar)  { setError('Las contraseñas no coinciden'); return }
    setEnviando(true)
    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email, password,
        options: { data: { nombre, rol: 'transportista' } }
      })
      if (authErr) throw authErr
      const uid = data?.user?.id
      if (uid) {
        const datosRntp = rntp?.datos ?? {}
        await supabase.from('transportista_perfil').upsert({
          user_id: uid, patente, telefono: telefono || null,
          visible: false, precios_publicos: false,
          tipo_servicio: datosRntp.tipo_servicio ?? null,
          capacidad: datosRntp.capacidad ? parseInt(datosRntp.capacidad, 10) : null,
          region: datosRntp.region ?? null,
          marca: datosRntp.marca ?? null,
          modelo: datosRntp.modelo ?? null,
          anio_fabricacion: datosRntp.anio_fabricacion ? parseInt(datosRntp.anio_fabricacion, 10) : null,
        }, { onConflict: 'user_id' })
        // Registrar resultado de verificación RNTP
        await supabase.from('transportista_verificacion').upsert({
          user_id: uid, patente,
          estado: rntp?.estado ?? 'pendiente',
          datos_rntp: rntp?.datos ?? null,
          verificado_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        // Log historial
        await supabase.from('historial_cambios').insert({
          entidad: 'transportista', entidad_id: uid,
          campo: 'registro', valor_anterior: null,
          valor_nuevo: JSON.stringify({ patente, estado_rntp: rntp?.estado }),
          realizado_por: uid,
        })
      }
      setPaso('email_enviado')
    } catch(err) {
      setError(err.message || 'Error al registrarse')
    } finally { setEnviando(false) }
  }

  // ── Pantalla: email enviado ────────────────────────────
  if (paso === 'email_enviado') return (
    <div style={s.fondo}>
      <div style={s.card} role="main">
        <div style={s.logo}>{IC.busLarge}</div>
        <h1 style={s.titulo}>Furcole</h1>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#0F2044', margin: '0 0 8px' }}>¡Cuenta creada!</p>
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 20 }}>
          Enviamos un link de confirmación a <strong>{form.email}</strong>.<br/>
          Confírmalo y luego inicia sesión para completar tu perfil.
        </p>
        <button style={s.btn} onClick={() => window.location.href = '/'}>Ir a iniciar sesión</button>
      </div>
    </div>
  )

  // ── Pantalla: resultado RNTP ───────────────────────────
  if (paso === 'rntp') {
    const esVerificado   = rntp?.estado === 'verificado'
    const esNoEncontrado = rntp?.estado === 'no_encontrado'
    const colorEstado    = esVerificado ? '#16a34a' : esNoEncontrado ? '#dc2626' : '#d97706'
    const iconEstado     = esVerificado
      ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      : esNoEncontrado
      ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>

    return (
      <div style={s.fondo}>
        <div style={{ ...s.card, maxWidth: 420 }} role="main">
          <div style={s.logo}>{IC.busLarge}</div>
          <h1 style={s.titulo}>Furcole</h1>
          <div style={{ margin: '0 0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {iconEstado}
            <span style={{ fontSize: 13, fontWeight: 700, color: colorEstado }}>
              {esVerificado ? 'Vehículo autorizado en RNTP' : esNoEncontrado ? 'Patente no encontrada en RNTP' : 'No se pudo verificar el RNTP'}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 16, textAlign: 'left', background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
            {rntp?.mensaje}
          </p>
          {esVerificado && rntp?.datos?.vencimiento && (
            <div style={{ fontSize: 12, color: '#64748b', background: '#f0fdf4', borderRadius: 8, padding: '8px 12px', marginBottom: 16, textAlign: 'left' }}>
              <strong>Vencimiento RNTP:</strong> {rntp.datos.vencimiento}
            </div>
          )}
          {esNoEncontrado && (
            <div style={{ fontSize: 12, color: '#7c3aed', background: '#faf5ff', borderRadius: 8, padding: '8px 12px', marginBottom: 16, textAlign: 'left' }}>
              Puedes crear igual tu cuenta. Quedará marcada como «pendiente de verificación» hasta que regularices tu inscripción en el RNTP.
            </div>
          )}
          {esVerificado && rntp?.datos && (
            <div style={{ fontSize: 12, color: '#374151', background: '#f8fafc', borderRadius: 8, padding: '10px 12px', marginBottom: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {rntp.datos.tipo_servicio && <span><strong>Tipo:</strong> {rntp.datos.tipo_servicio}</span>}
              {rntp.datos.capacidad && <span><strong>Capacidad:</strong> {rntp.datos.capacidad} pasajeros</span>}
              {rntp.datos.marca && rntp.datos.modelo && <span><strong>Vehículo:</strong> {rntp.datos.marca} {rntp.datos.modelo} ({rntp.datos.anio_fabricacion})</span>}
              {rntp.datos.responsable && <span><strong>Responsable:</strong> {rntp.datos.responsable}</span>}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={s.btn} onClick={() => {
              // Pre-llenar nombre con el responsable del RNTP si está disponible
              if (rntp?.datos?.responsable && !form.nombre) {
                const nombreRntp = rntp.datos.responsable
                  .toLowerCase()
                  .replace(/\b\w/g, c => c.toUpperCase())
                setForm(p => ({ ...p, nombre: nombreRntp }))
              }
              setPaso('cuenta')
            }}>
              {esVerificado ? 'Continuar con el registro →' : 'Continuar de todos modos →'}
            </button>
            <button type="button"
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => { setPaso('datos'); setRntp(null); setError('') }}>
              ← Cambiar patente
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>
            Fuente: <a href="http://apps.mtt.cl/consultaweb/" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8' }}>Registro Nacional de Transporte — MTT Chile</a>
          </p>
        </div>
      </div>
    )
  }

  // ── Pantalla: datos de cuenta (paso 'cuenta') ──────────
  if (paso === 'cuenta') return (
    <div style={s.fondo}>
      <div style={s.card} role="main">
        <div style={s.logo} aria-hidden="true">{IC.busLarge}</div>
        <h1 style={s.titulo}>Furcole</h1>
        <p style={s.subtitulo}>Datos de cuenta</p>
        <form onSubmit={registrar} style={s.form} noValidate>
          <label style={s.labelLogin} htmlFor="rt-nombre">Nombre completo</label>
          <input id="rt-nombre" style={s.input} type="text" placeholder="María González"
            value={form.nombre} onChange={e => f('nombre', e.target.value)}
            required maxLength={120} autoComplete="name" autoFocus />
          <label style={s.labelLogin} htmlFor="rt-email">Correo electrónico</label>
          <input id="rt-email" style={s.input} type="email" placeholder="correo@ejemplo.com"
            value={form.email} onChange={e => f('email', e.target.value)}
            required maxLength={254} autoComplete="email" />
          <label style={s.labelLogin} htmlFor="rt-tel">Teléfono (opcional)</label>
          <input id="rt-tel" style={s.input} type="tel" placeholder="+56 9 1234 5678"
            value={form.telefono} onChange={e => f('telefono', e.target.value)}
            maxLength={20} autoComplete="tel" />
          <label style={s.labelLogin} htmlFor="rt-pass">Contraseña</label>
          <div style={{ position: 'relative', width: '100%', display: 'block' }}>
            <input id="rt-pass" style={{ ...s.input, paddingRight: 40 }}
              type={mostrarPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
              value={form.password} onChange={e => f('password', e.target.value)}
              required maxLength={128} autoComplete="new-password" />
            <button type="button" onClick={() => setMostrarPass(v => !v)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, lineHeight: 1 }}
              aria-label={mostrarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'} tabIndex={-1}>
              {mostrarPass
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
          <label style={s.labelLogin} htmlFor="rt-confirmar">Confirmar contraseña</label>
          <input id="rt-confirmar" style={s.input} type="password" placeholder="Repite tu contraseña"
            value={form.confirmar} onChange={e => f('confirmar', e.target.value)}
            required maxLength={128} autoComplete="new-password" />
          {error && <p style={s.errorMsg} role="alert">{error}</p>}
          <button style={s.btn} type="submit" disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>
        <button type="button"
          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', marginTop: 8, textDecoration: 'underline' }}
          onClick={() => setPaso('rntp')}>
          ← Volver
        </button>
      </div>
    </div>
  )

  // ── Pantalla inicial: ingresar patente ─────────────────
  return (
    <div style={s.fondo}>
      <div style={s.card} role="main">
        <div style={s.logo} aria-hidden="true">{IC.busLarge}</div>
        <h1 style={s.titulo}>Furcole</h1>
        <p style={s.subtitulo}>Registro de transportista</p>
        <div style={{ background: '#f0f7ff', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#374151', textAlign: 'left', lineHeight: 1.6 }}>
          Primero verificaremos tu patente en el <strong>Registro Nacional de Transporte Escolar</strong> del MTT.
        </div>
        <form onSubmit={verificarPatente} style={s.form} noValidate>
          <label style={s.labelLogin} htmlFor="rt-patente">Patente del furgón escolar</label>
          <input id="rt-patente"
            style={{ ...s.input, textTransform: 'uppercase', letterSpacing: 3, fontSize: 18, fontWeight: 700, textAlign: 'center' }}
            type="text" placeholder="ABCD12"
            value={form.patente} onChange={e => f('patente', e.target.value.toUpperCase())}
            required maxLength={8} autoComplete="off" autoFocus />
          {error && <p style={s.errorMsg} role="alert">{error}</p>}
          <button style={s.btn} type="submit" disabled={verificando}>
            {verificando ? 'Consultando RNTP…' : 'Verificar en el RNTP →'}
          </button>
        </form>
        <button type="button"
          style={{ background: 'none', border: 'none', color: '#0F2044', fontSize: 13, cursor: 'pointer', marginTop: 8, textDecoration: 'underline' }}
          onClick={() => window.location.href = '/'}>
          ← Volver al inicio de sesión
        </button>
      </div>
    </div>
  )
}

// ─── Actualizar Contraseña (Sprint 6) ─────────────────────────────────────────
function ActualizarPassword() {
  const [password, setPassword]       = useState('')
  const [confirmar, setConfirmar]     = useState('')
  const [error, setError]             = useState('')
  const [guardando, setGuardando]     = useState(false)
  const [listo, setListo]             = useState(false)
  const [mostrarPass, setMostrarPass]           = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return }
    setGuardando(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setGuardando(false)
    if (err) { setError('No se pudo actualizar. El enlace puede haber expirado.') }
    else { setListo(true) }
  }

  if (listo) return (
    <div style={s.fondo}>
      <div style={s.card} role="main">
        <div style={{ marginBottom: 12 }}>{IC.check}</div>
        <h1 style={s.titulo}>Contraseña actualizada</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '8px 0 24px' }}>
          Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
        <button style={s.btn} onClick={() => window.location.href = '/'}>Ir al inicio de sesión</button>
      </div>
    </div>
  )

  return (
    <div style={s.fondo}>
      <div style={s.card} role="main">
        <div style={s.logo} aria-hidden="true">{IC.lock}</div>
        <h1 style={{ ...s.titulo, fontSize: 22 }}>Nueva contraseña</h1>
        <p style={s.subtitulo}>Elige una contraseña segura</p>
        <form onSubmit={guardar} style={s.form} noValidate>
          <label style={s.labelLogin} htmlFor="np-pass">Nueva contraseña</label>
          <div style={{ position: 'relative', width: '100%', display: 'block' }}>
            <input
              id="np-pass" style={{ ...s.input, paddingRight: 40 }} type={mostrarPass ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres" value={password}
              onChange={e => setPassword(e.target.value)}
              required autoFocus minLength={8} maxLength={128}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setMostrarPass(v => !v)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', padding: 0, lineHeight: 1 }}
              aria-label={mostrarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}
            >{mostrarPass ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}</button>
          </div>
          <label style={s.labelLogin} htmlFor="np-confirm">Confirmar contraseña</label>
          <div style={{ position: 'relative', width: '100%', display: 'block' }}>
            <input
              id="np-confirm" style={{ ...s.input, paddingRight: 40 }} type={mostrarConfirmar ? 'text' : 'password'}
              placeholder="Repite la contraseña" value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              required minLength={8} maxLength={128}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setMostrarConfirmar(v => !v)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', padding: 0, lineHeight: 1 }}
              aria-label={mostrarConfirmar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}
            >{mostrarConfirmar ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}</button>
          </div>
          {error && <p style={s.errorMsg} role="alert">{error}</p>}
          <button style={s.btn} type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [sesion, setSesion]     = useState(null)
  const [cargando, setCargando] = useState(true)
  const ruta                    = window.location.pathname
  const esRecovery              = window.location.hash.includes('type=recovery') ||
                                  window.location.search.includes('type=recovery')

  useEffect(() => {
    const hash = window.location.hash
    const tieneTokenEnHash = hash.includes('access_token=')

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.replace('/actualizar-password')
        return
      }
      setSesion(session)
      setCargando(false)
    })

    if (tieneTokenEnHash) {
      // Parsear token del hash manualmente y establecer sesión
      const params = new URLSearchParams(hash.replace('#', ''))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const type = params.get('type')
      if (access_token && refresh_token) {
        if (type === 'recovery') {
          window.location.replace('/actualizar-password')
        } else {
          supabase.auth.setSession({ access_token, refresh_token }).then(({ data: { session } }) => {
            setSesion(session)
            setCargando(false)
          })
        }
      }
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSesion(session)
        setCargando(false)
      })
    }

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut() }

  if (cargando) return <div style={s.centro} aria-busy="true"><Skeleton w={200} h={20} /></div>

  // Ruta pública: portal apoderado
  if (ruta.startsWith('/portal')) return <PortalApoderado />

  // T3: Ruta pública de invitación: /registro/{token}
  if (ruta.startsWith('/registro/')) return <PaginaRegistroToken token={ruta.split('/')[2]} />

  // Rutas públicas: registro
  if (ruta.startsWith('/registro-apoderado')) return <RegistroApoderado />
  if (ruta.startsWith('/registro-transportista')) return <RegistroTransportista />

  // Ruta pública: actualizar contraseña (directo o via token recovery en URL)
  if (ruta.startsWith('/actualizar-password') || esRecovery) return <ActualizarPassword />

  if (!sesion) return <Login />
  return <Dashboard sesion={sesion} onLogout={handleLogout} />
}

// ─── T3: Página pública de invitación de transportista ───────────────────────
// URL: /registro/{token}  — el token es el alumno_key del alumno
// El transportista comparte este link/QR con potenciales apoderados.
// Muestra: nombre del transportista, colegios atendidos, precios (si públicos),
// rutas, y CTA para registrarse como apoderado.
function PaginaRegistroToken({ token }) {
  const FASE_T = { CARGANDO: 'cargando', OK: 'ok', ERROR: 'error' }
  const [fase, setFase]           = useState(FASE_T.CARGANDO)
  const [datos, setDatos]         = useState(null) // { transportista, colegios, precios, rutas }

  useEffect(() => {
    async function cargar() {
      if (!token) { setFase(FASE_T.ERROR); return }
      try {
        // 1. Buscar alumno por alumno_key para obtener el user_id del transportista
        const { data: alumno, error: errA } = await supabase
          .from('alumnos')
          .select('id, user_id')
          .eq('alumno_key', token)
          .maybeSingle()

        if (errA || !alumno) { setFase(FASE_T.ERROR); return }

        const transportistaId = alumno.user_id

        // 2. Cargar en paralelo: perfil_transportista + colegios activos + precios + rutas
        const [
          { data: tp },
          { data: tColegios },
          { data: precios },
          { data: rutas },
        ] = await Promise.all([
          supabase.from('transportista_perfil')
            .select('nombre, foto_url, descripcion, anos_experiencia, capacidad_total, precios_publicos, visible')
            .eq('user_id', transportistaId)
            .maybeSingle(),
          supabase.from('transportista_colegios')
            .select('colegios(nombre, sector)')
            .eq('user_id', transportistaId)
            .eq('activo', true),
          supabase.from('precios_modalidad')
            .select('modalidad, precio_mensual')
            .eq('user_id', transportistaId)
            .eq('activo', true),
          supabase.from('rutas')
            .select('id, nombre, descripcion')
            .eq('user_id', transportistaId)
            .eq('activo', true)
            .limit(5),
        ])

        if (!tp) { setFase(FASE_T.ERROR); return }

        const colegiosLista = (tColegios || []).map(tc => tc.colegios).filter(Boolean)
        const labelModal = { completo: 'Servicio completo (ida y vuelta)', ida: 'Solo ida', vuelta: 'Solo vuelta' }

        setDatos({
          tp,
          colegios:  colegiosLista,
          precios:   (precios || []).map(p => ({ ...p, label: labelModal[p.modalidad] || p.modalidad })),
          rutas:     rutas || [],
          alumnoId:  alumno.id,
          tpId:      transportistaId,
        })
        setFase(FASE_T.OK)
      } catch(e) {
        setFase(FASE_T.ERROR)
      }
    }
    cargar()
  }, [token]) // eslint-disable-line

  const estiloFondo = {
    minHeight: '100vh', background: '#F2F5FA', fontFamily: "'Inter',system-ui,sans-serif",
    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px 40px',
  }

  if (fase === FASE_T.CARGANDO) return (
    <div style={estiloFondo} aria-busy="true">
      <div style={{ width: '100%', maxWidth: 480, marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton w="60%" h={28} r={8} />
        <Skeleton w="100%" h={120} r={12} />
        <Skeleton w="100%" h={80} r={12} />
      </div>
    </div>
  )

  if (fase === FASE_T.ERROR) return (
    <div style={{ ...estiloFondo, justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 380, padding: '0 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F2044', margin: '0 0 8px' }}>Link no válido</h2>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
          Este link de invitación no existe o ha expirado. Solicita uno nuevo al transportista.
        </p>
      </div>
    </div>
  )

  const { tp, colegios, precios, rutas } = datos

  return (
    <div style={estiloFondo}>
      {/* Header Furcole */}
      <div style={{ width: '100%', maxWidth: 520, borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 32, paddingTop: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>🚌</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#0F2044', fontFamily: "'Sora',system-ui,sans-serif" }}>Furcole</span>
      </div>

      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Tarjeta principal del transportista */}
        <div style={{ background: '#0F2044', borderRadius: 16, padding: 24, color: '#fff', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {tp.foto_url
            ? <img src={tp.foto_url} alt={`Foto de ${tp.nombre}`} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #F5C400', flexShrink: 0 }} />
            : <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1A3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>👤</div>
          }
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#F5C400', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Transportista escolar</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.2 }}>{tp.nombre || 'Transportista'}</h1>
            {tp.descripcion && <p style={{ fontSize: 13, color: '#a8c0dd', margin: 0, lineHeight: 1.5 }}>{tp.descripcion}</p>}
            <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              {tp.anos_experiencia && (
                <span style={{ fontSize: 12, background: '#1A3A6B', borderRadius: 6, padding: '3px 10px', color: '#cbd5e1' }}>
                  {tp.anos_experiencia} años de experiencia
                </span>
              )}
              {tp.capacidad_total && (
                <span style={{ fontSize: 12, background: '#1A3A6B', borderRadius: 6, padding: '3px 10px', color: '#cbd5e1' }}>
                  Capacidad: {tp.capacidad_total} alumnos
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Colegios atendidos */}
        {colegios.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#0F2044' }}>Colegios atendidos</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {colegios.map((c, i) => (
                <span key={i} style={{ background: '#EFF6FF', color: '#1e40af', borderRadius: 6, padding: '4px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #bfdbfe' }}>
                  {c.nombre}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Precios (si son públicos) */}
        {tp.precios_publicos && precios.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#0F2044' }}>Tarifas mensuales</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {precios.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>{p.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#0F2044' }}>
                    ${Number(p.precio_mensual).toLocaleString('es-CL')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rutas disponibles */}
        {rutas.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#0F2044' }}>Rutas disponibles</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rutas.map(r => (
                <div key={r.id} style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0F2044' }}>{r.nombre}</div>
                  {r.descripcion && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{r.descripcion}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA: registrarse */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
            ¿Quieres unirte a la ruta de <strong>{tp.nombre}</strong>?<br />
            Regístrate como apoderado para enviar una solicitud de cupo.
          </p>
          <a
            href={`/registro-apoderado`}
            style={{
              display: 'inline-block', padding: '13px 28px', borderRadius: 8,
              background: '#F5C400', color: '#0F2044', fontWeight: 700, fontSize: 15,
              textDecoration: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            Registrarme como apoderado →
          </a>
        </div>

      </div>
    </div>
  )
}

// ─── T7: Flujo "cambiar establecimiento" desde el Portal Apoderado ────────────
// Este componente es exportado para uso en PortalApoderado.js.
// Permite al apoderado buscar transportistas de otro colegio y enviar una nueva solicitud de cupo.
// Props: { alumnoId, alumnoNombre, userId, onCerrar }
export function FlujoCambioEstablecimiento({ alumnoId, alumnoNombre, userId, onCerrar }) {
  const FASE_CE = { BUSCAR: 'buscar', CONFIRMADO: 'confirmado' }
  const [fase, setFase]                   = useState(FASE_CE.BUSCAR)
  const [colegioFiltro, setColegioFiltro] = useState('')
  const [colegios, setColegios]           = useState([])
  const [transportistas, setTransportistas] = useState([])
  const [cargando, setCargando]           = useState(false)
  const [solAbierta, setSolAbierta]       = useState(null) // transportista_user_id
  const [modalidad, setModalidad]         = useState('completo')
  const [nota, setNota]                   = useState('')
  const [enviando, setEnviando]           = useState(false)
  const [error, setError]                 = useState('')
  const [confirmado, setConfirmado]       = useState(null)

  // Cargar colegios disponibles al montar
  useEffect(() => {
    supabase.from('colegios').select('id, nombre').eq('activo', true).order('nombre')
      .then(({ data }) => setColegios(data || []))
  }, [])

  async function buscar() {
    setCargando(true); setError(''); setTransportistas([])
    let q = supabase.from('transportista_perfil')
      .select('user_id, nombre, foto_url, descripcion, anos_experiencia, capacidad_total, precios_publicos')
      .eq('visible', true)
    if (colegioFiltro) {
      // filtrar por colegio via transportista_colegios
      const { data: tcs } = await supabase.from('transportista_colegios')
        .select('user_id').eq('colegio_id', colegioFiltro).eq('activo', true)
      const ids = (tcs || []).map(t => t.user_id)
      if (ids.length === 0) { setTransportistas([]); setCargando(false); return }
      q = q.in('user_id', ids)
    }
    const { data } = await q.limit(20)
    setTransportistas(data || [])
    setCargando(false)
  }

  async function enviarSolicitud(tpId, tpNombre) {
    setEnviando(true); setError('')
    try {
      const { error: errSol } = await supabase.from('solicitudes_cupo').insert({
        apoderado_user_id:    userId,
        transportista_user_id: tpId,
        alumno_id:            alumnoId,
        modalidad,
        nota_apoderado:       nota.trim() || null,
        estado:               'pendiente',
      })
      if (errSol) {
        if (errSol.code === '23505') { setError('Ya enviaste una solicitud a este transportista.'); setEnviando(false); return }
        throw errSol
      }
      // T8: log cambio de establecimiento desde portal apoderado
      logCambio({ entidad: 'alumno', entidad_id: alumnoId, campo: 'solicitud_enviada', valor_nuevo: { transportista_user_id: tpId, modalidad }, realizado_por: userId })
      setConfirmado({ tpNombre })
      setFase(FASE_CE.CONFIRMADO)
    } catch(e) {
      setError('Error al enviar solicitud. Inténtalo de nuevo.')
    }
    setEnviando(false)
  }

  if (fase === FASE_CE.CONFIRMADO) return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
      <h3 style={{ fontWeight: 700, color: '#0F2044', margin: '0 0 8px', fontSize: 18 }}>Solicitud enviada</h3>
      <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
        Tu solicitud de cupo para <strong>{alumnoNombre}</strong> fue enviada a <strong>{confirmado.tpNombre}</strong>.<br />
        Te avisaremos cuando sea aceptada.
      </p>
      <button onClick={onCerrar} style={{ padding: '10px 24px', borderRadius: 8, background: '#0F2044', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
        Cerrar
      </button>
    </div>
  )

  return (
    <div>
      <h3 style={{ fontWeight: 700, color: '#0F2044', margin: '0 0 16px', fontSize: 16 }}>
        Cambiar establecimiento — {alumnoNombre}
      </h3>

      {/* Filtro por colegio */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={colegioFiltro}
          onChange={e => setColegioFiltro(e.target.value)}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde4ef', fontSize: 14, minWidth: 180 }}
          aria-label="Filtrar por colegio"
        >
          <option value="">Todos los colegios</option>
          {colegios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <button
          onClick={buscar}
          disabled={cargando}
          style={{ padding: '10px 18px', borderRadius: 8, background: '#0F2044', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
        >
          {cargando ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      {/* Resultados */}
      {cargando ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-busy="true">
          {[1,2].map(i => <Skeleton key={i} w="100%" h={80} r={10} />)}
        </div>
      ) : transportistas.length === 0 && !cargando ? (
        <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
          Haz clic en "Buscar" para ver transportistas disponibles.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {transportistas.map(tp => (
            <div key={tp.user_id} style={{ background: '#F8FAFC', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {tp.foto_url
                  ? <img src={tp.foto_url} alt="" aria-hidden="true" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F2044' }}>{tp.nombre}</div>
                  {tp.descripcion && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{tp.descripcion}</div>}
                </div>
                <button
                  onClick={() => setSolAbierta(solAbierta === tp.user_id ? null : tp.user_id)}
                  aria-expanded={solAbierta === tp.user_id}
                  style={{ padding: '8px 14px', borderRadius: 8, background: '#0F2044', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                >
                  {solAbierta === tp.user_id ? 'Cancelar' : 'Solicitar'}
                </button>
              </div>

              {/* Formulario inline de solicitud */}
              {solAbierta === tp.user_id && (
                <div style={{ marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Modalidad</label>
                  <select value={modalidad} onChange={e => setModalidad(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde4ef', fontSize: 14 }}>
                    <option value="completo">Ida y vuelta</option>
                    <option value="ida">Solo ida</option>
                    <option value="vuelta">Solo vuelta</option>
                  </select>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Mensaje (opcional)</label>
                  <textarea
                    value={nota}
                    onChange={e => setNota(e.target.value)}
                    placeholder="Cuéntale algo al transportista…"
                    maxLength={500}
                    rows={3}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde4ef', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  {error && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }} role="alert">{error}</p>}
                  <button
                    onClick={() => enviarSolicitud(tp.user_id, tp.nombre)}
                    disabled={enviando}
                    style={{ padding: '11px 0', borderRadius: 8, background: '#F5C400', color: '#0F2044', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                  >
                    {enviando ? 'Enviando…' : 'Enviar solicitud de cupo'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = {
  fondo:         { minHeight: '100vh', background: '#F2F5FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',system-ui,sans-serif" },
  card:          { background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 4px 24px rgba(0,0,0,.10)', textAlign: 'center' },
  logo:          { marginBottom: 8 },
  titulo:        { fontSize: 26, fontWeight: 700, color: '#0F2044', margin: '0 0 4px' },
  subtitulo:     { color: '#64748b', margin: '0 0 28px', fontSize: 14 },
  centro:        { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Inter',system-ui,sans-serif" },
  sidebar:       { position: 'fixed', top: 0, left: 0, height: '100vh', width: 240, background: '#0F2044', borderTop: '3px solid #F5C400', display: 'flex', flexDirection: 'column', zIndex: 100, transition: 'left .25s', padding: '24px 0 16px' },
  sideHeader:    { display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px 24px', borderBottom: '1px solid #263F6B' },
  sideLogo:      { lineHeight: 0 },
  sideNombre:    { color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: "'Sora',system-ui,sans-serif", letterSpacing: '.01em' },
  sideUser:      { color: '#7a9cc8', fontSize: 12, marginTop: 2 },
  nav:           { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
  navBtn:        { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: '#a8c0dd', fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left', position: 'relative' },
  navActivo:     { background: '#1A3A6B', color: '#fff', borderLeft: '3px solid #F5C400', paddingLeft: 9 },
  navIcon:       { width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoutBtn:     { margin: '0 12px', padding: '10px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748b', fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 },
  overlay:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 99 },
  main:          { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar:        { display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: 56, background: '#fff', borderBottom: '1px solid #dde4ef', position: 'sticky', top: 0, zIndex: 10 },
  hamburger:     { fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#0F2044', padding: 4 },
  topTitulo:     { fontWeight: 600, fontSize: 16, color: '#0F2044', display: 'flex', alignItems: 'center', gap: 8 },
  contenido:     { flex: 1, overflowY: 'auto' },
  vista:         { padding: 24 },
  vistaHeader:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
  vtitulo:       { fontSize: 20, fontWeight: 700, color: '#0F2044', margin: 0 },
  tabla:         { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.07)' },
  tablaHead:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 80px', padding: '10px 16px', background: '#F2F5FA', borderBottom: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em' },
  tablaFila:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 80px', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', transition: 'background .15s' },
  celNombre:     { fontWeight: 600, color: '#0F2044', fontSize: 14 },
  cel:           { color: '#64748b', fontSize: 14 },
  celAcciones:   { display: 'flex', gap: 4, justifyContent: 'flex-end' },
  btnIcono:      { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 4px', transition: 'opacity .15s' },
  badge:         { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  skeletonWrap:  { display: 'flex', flexDirection: 'column', gap: 12, padding: 4 },
  skeletonFila:  { background: '#fff', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 24, alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.05)' },
  vacio:         { textAlign: 'center', padding: '60px 20px', color: '#64748b', lineHeight: 1.6 },
  resumenRow:    { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  resumenCard:   { flex: 1, minWidth: 120, background: '#F2F5FA', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 },
  resumenLabel:  { fontSize: 12, color: '#64748b', fontWeight: 500 },
  resumenValor:  { fontSize: 20, fontWeight: 700, color: '#0F2044' },
  form:          { display: 'flex', flexDirection: 'column', gap: 10 },
  label:         { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: -4 },
  labelLogin:    { fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'left', marginBottom: -4 },
  input:         { padding: '11px 13px', borderRadius: 8, border: '1.5px solid #dde4ef', fontSize: 14, outline: 'none', fontFamily: "'Inter',system-ui,sans-serif", background: '#fff', width: '100%', boxSizing: 'border-box' },
  btn:           { padding: 13, borderRadius: 8, background: '#0F2044', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  btnPrimario:   { padding: '9px 18px', borderRadius: 8, background: '#0F2044', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecundario: { padding: '9px 18px', borderRadius: 8, background: '#f1f5f9', color: '#374151', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  errorMsg:      { color: '#dc2626', fontSize: 13, margin: 0 },
  modalFondo:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard:     { background: '#fff', borderRadius: 16, padding: '28px 28px 24px', width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,.18)' },
  modalTitulo:   { fontSize: 17, fontWeight: 700, color: '#0F2044', margin: '0 0 18px' },
  modalBtns:     { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 },
}