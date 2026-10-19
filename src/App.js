import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { QRCodeCanvas as QRCode } from 'qrcode.react'

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
  bus:        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true"><rect x="3" y="8" width="30" height="20" rx="3" fill="#0F2044"/><rect x="5" y="10" width="8" height="6" rx="1" fill="#F5C400"/><rect x="15" y="10" width="8" height="6" rx="1" fill="#F5C400"/><rect x="25" y="10" width="6" height="6" rx="1" fill="#F5C400"/><rect x="3" y="24" width="30" height="4" rx="1" fill="#0F2044"/><circle cx="9" cy="29" r="3" fill="#263F6B" stroke="#F5C400" strokeWidth="1.5"/><circle cx="27" cy="29" r="3" fill="#263F6B" stroke="#F5C400" strokeWidth="1.5"/><rect x="5" y="19" width="26" height="3" rx="1" fill="#F5C400" opacity=".3"/><path d="M3 16h30" stroke="#F5C400" strokeWidth=".8" opacity=".4"/></svg>,
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
  const [cargando, setCargando]     = useState(true)
  const [modal, setModal]           = useState(false)
  const [form, setForm]             = useState({ nombre: '', apoderado_id: '', monto: '', activo: true })
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    const [{ data: alumnos }, { data: apods }] = await Promise.all([
      supabase.from('alumnos').select('*, apoderados(nombre)').order('nombre'),
      supabase.from('apoderados').select('id, nombre').order('nombre'),
    ])
    setLista(alumnos || [])
    setApoderados(apods || [])
    setCargando(false)
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const abrirNuevo  = () => { setForm({ nombre: '', apoderado_id: apoderados[0]?.id || '', monto: '', activo: true }); setError(''); setModal('nuevo') }
  const abrirEditar = (al) => { setForm({ nombre: al.nombre, apoderado_id: al.apoderado_id, monto: String(al.monto), activo: al.activo }); setError(''); setModal(al) }
  const cerrar      = () => { setModal(false); setError('') }

  const guardar = async (e) => {
    e.preventDefault()
    const nombre = form.nombre.trim()
    const monto  = parseFloat(form.monto)
    if (!nombre)                   { setError('El nombre es obligatorio'); return }
    if (!form.apoderado_id)        { setError('Selecciona un apoderado'); return }
    if (isNaN(monto) || monto < 0) { setError('Ingresa un monto válido'); return }
    setGuardando(true); setError('')
    const payload = { nombre, apoderado_id: form.apoderado_id, monto, activo: form.activo }
    if (modal === 'nuevo') {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: err } = await supabase.from('alumnos').insert({ ...payload, user_id: user.id })
      if (err) { setError('Error al guardar'); setGuardando(false); return }
    } else {
      const { error: err } = await supabase.from('alumnos').update(payload).eq('id', modal.id)
      if (err) { setError('Error al actualizar'); setGuardando(false); return }
    }
    setGuardando(false); cerrar(); cargar()
  }

  const eliminar     = async (id) => { if (!window.confirm('¿Eliminar este alumno?')) return; await supabase.from('alumnos').delete().eq('id', id); cargar() }
  const toggleActivo = async (al)  => { await supabase.from('alumnos').update({ activo: !al.activo }).eq('id', al.id); cargar() }

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
          <div style={{ ...s.tablaHead, gridTemplateColumns: '1fr 1fr 100px 90px 80px' }} role="row">
            <span role="columnheader">Nombre</span>
            <span role="columnheader">Apoderado</span>
            <span role="columnheader">Monto</span>
            <span role="columnheader">Estado</span>
            <span role="columnheader" aria-label="Acciones" />
          </div>
          {lista.map(al => (
            <div key={al.id} className="fila" style={{ ...s.tablaFila, gridTemplateColumns: '1fr 1fr 100px 90px 80px', opacity: al.activo ? 1 : 0.55 }} role="row">
              <span style={s.celNombre} role="cell">{al.nombre}</span>
              <span style={s.cel} role="cell">{al.apoderados?.nombre || '—'}</span>
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

function Cobros() {
  const ahora  = new Date()
  const mesHoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`

  const [mes, setMes]             = useState(mesHoy)
  const [lista, setLista]         = useState([])
  const [cargando, setCargando]   = useState(true)
  const [generando, setGenerando] = useState(false)
  const [msg, setMsg]             = useState('')
  const [editando, setEditando]   = useState(null)   // { id, monto }
  const [montoEdit, setMontoEdit] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [pagandoFlow, setPagandoFlow] = useState(new Set())  // IDs en proceso Flow

  const cargar = useCallback(async () => {
    setCargando(true)
    const desde = `${mes}-01`
    const hasta = `${mes}-31`
    const { data } = await supabase
      .from('cobros')
      .select('*, alumnos(nombre, monto, apoderados(nombre))')
      .gte('mes', desde)
      .lte('mes', hasta)
      .order('pagado')
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
    const mesDate = `${mes}-01`
    const { data: existentes } = await supabase.from('cobros').select('alumno_id').eq('mes', mesDate)
    const yaExisten = new Set((existentes || []).map(c => c.alumno_id))
    const nuevos = alumnos
      .filter(a => !yaExisten.has(a.id))
      .map(a => ({ user_id: user.id, alumno_id: a.id, mes: mesDate, monto: a.monto, pagado: false }))
    if (nuevos.length === 0) {
      setMsg('Los cobros de este mes ya fueron generados.')
      setGenerando(false)
      return
    }
    await supabase.from('cobros').insert(nuevos)
    setMsg(`✅ ${nuevos.length} cobro(s) generado(s).`)
    setGenerando(false)
    cargar()
  }

  const togglePagado = async (cobro) => {
    await supabase.from('cobros').update({
      pagado: !cobro.pagado,
      pagado_at: !cobro.pagado ? new Date().toISOString() : null,
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
  const totalPagado    = lista.filter(c => c.pagado).reduce((acc, c) => acc + Number(c.monto), 0)
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
          <label htmlFor="sel-mes" style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Mes:</label>
          <input
            id="sel-mes"
            type="month"
            style={{ ...s.input, padding: '7px 10px', fontSize: 13 }}
            value={mes}
            onChange={e => setMes(e.target.value)}
            aria-label="Seleccionar mes"
          />
          <button style={s.btnPrimario} onClick={generar} disabled={generando} aria-label="Generar cobros del mes">
            {generando ? 'Generando…' : 'Generar mes'}
          </button>
        </div>
      </div>

      {msg && (
        <p style={{ ...s.errorMsg, color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', marginBottom: 12 }} role="status">
          {msg}
        </p>
      )}

      {!cargando && lista.length > 0 && (
        <div style={s.resumenRow}>
          <div style={s.resumenCard}>
            <span style={s.resumenLabel}>Total mes</span>
            <span style={s.resumenValor}>${totalMes.toLocaleString('es-CL')}</span>
          </div>
          <div style={{ ...s.resumenCard, background: '#dcfce7' }}>
            <span style={s.resumenLabel}>Pagado</span>
            <span style={{ ...s.resumenValor, color: '#16a34a' }}>${totalPagado.toLocaleString('es-CL')}</span>
          </div>
          <div style={{ ...s.resumenCard, background: '#fef9c3' }}>
            <span style={s.resumenLabel}>Pendiente</span>
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
            Presiona <em>Generar mes</em> para crearlos.
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
            <div key={c.id} className="fila" style={{ ...s.tablaFila, gridTemplateColumns: '1fr 1fr 130px 110px 90px 110px', opacity: c.pagado ? 0.9 : 1 }} role="row">
              <span style={s.celNombre} role="cell">{c.alumnos?.nombre || '—'}</span>
              <span style={s.cel} role="cell">{c.alumnos?.apoderados?.nombre || '—'}</span>
              <span style={{ ...s.cel, fontWeight: 600 }} role="cell">${Number(c.monto).toLocaleString('es-CL')}</span>
              <span role="cell">
                <button
                  onClick={() => togglePagado(c)}
                  style={{ ...s.badge, background: c.pagado ? '#dcfce7' : '#fef9c3', color: c.pagado ? '#16a34a' : '#b45309', cursor: 'pointer', border: 'none' }}
                  aria-label={c.pagado ? `Marcar pendiente ${c.alumnos?.nombre}` : `Marcar pagado ${c.alumnos?.nombre}`}
                  aria-pressed={c.pagado}
                >
                  {c.pagado ? '✓ Pagado' : 'Pendiente'}
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
                {!c.pagado ? (
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
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [editId, setEditId] = useState(null)
  const [token, setToken] = useState(null)
  const [copiado, setCopiado] = useState(false)

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
        <div style={s.tabla} role="table" aria-label="Rutas">
          <div style={{ ...s.tablaHead, gridTemplateColumns: '1.5fr 1.5fr 80px 80px 90px 70px' }} role="row">
            <span role="columnheader">Colegio</span>
            <span role="columnheader">Dirección</span>
            <span role="columnheader">Ida</span>
            <span role="columnheader">Vuelta</span>
            <span role="columnheader">Capacidad</span>
            <span role="columnheader" aria-label="Acciones" />
          </div>
          {lista.map(r => (
            <div key={r.id} className="fila" style={{ ...s.tablaFila, gridTemplateColumns: '1.5fr 1.5fr 80px 80px 90px 70px' }} role="row">
              <span style={s.celNombre} role="cell">{r.nombre}</span>
              <span style={s.cel} role="cell">{r.direccion || '—'}</span>
              <span style={s.cel} role="cell">{r.horario_ida || '—'}</span>
              <span style={s.cel} role="cell">{r.horario_vuelta || '—'}</span>
              <span style={s.cel} role="cell">{r.capacidad} cupos</span>
              <span style={s.celAcciones} role="cell">
                <button className="btn-icon" style={s.btnIcono} onClick={() => abrirEditar(r)} aria-label={`Editar ruta ${r.nombre}`}>{IC.edit}</button>
                <button className="btn-icon" style={{ ...s.btnIcono, color: '#C0202F' }} onClick={() => eliminar(r.id)} aria-label={`Eliminar ruta ${r.nombre}`}>{IC.trash}</button>
              </span>
            </div>
          ))}
        </div>
      )}

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
function Home({ onNavegar }) {
  const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const meses      = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const hoyLabel   = new Date()
  const fechaLabel = `${diasSemana[hoyLabel.getDay()]} ${hoyLabel.getDate()} de ${meses[hoyLabel.getMonth()]} ${hoyLabel.getFullYear()}`

  const [datos, setDatos]     = useState(null)
  const [cargando, setCarg]   = useState(true)

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
      ] = await Promise.all([
        supabase.from('apoderados').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('alumnos').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('activo', true),
        supabase.from('cobros').select('monto, pagado').eq('user_id', uid).gte('mes', mesHoy).lte('mes', `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-31`),
        supabase.from('rutas').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('asistencia').select('presente').eq('user_id', uid).eq('fecha', fechaHoy).eq('tipo', 'ida'),
        supabase.from('alumnos').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('activo', true),
        supabase.from('avisos').select('mensaje, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(1),
      ])
      const pendiente = (cobros || []).filter(c => !c.pagado).reduce((a, c) => a + Number(c.monto), 0)
      const presentes = (asistHoy || []).filter(a => a.presente).length
      const aviso     = ultimoAviso && ultimoAviso.length > 0 ? ultimoAviso[0] : null
      const tiempoAviso = aviso ? tiempoRelativo(aviso.created_at) : null
      setDatos({ nApoderados, nAlumnos, pendiente, nRutas, presentes, nAlumnosActivos, aviso, tiempoAviso })
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

// ─── Menú ─────────────────────────────────────────────────────────────────────
const MENU = [
  { id: 'home',       icon: IC.home,       label: 'Inicio' },
  { id: 'apoderados', icon: IC.apoderados, label: 'Apoderados' },
  { id: 'alumnos',    icon: IC.alumnos,    label: 'Alumnos' },
  { id: 'cobros',     icon: IC.cobros,     label: 'Cobros' },
  { id: 'rutas',      icon: IC.rutas,      label: 'Rutas' },
  { id: 'asistencia', icon: IC.asistencia, label: 'Asistencia' },
  { id: 'avisos',     icon: IC.avisos,     label: 'Avisos' },
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
          {seccion === 'home'       && <Home onNavegar={setSeccion} />}
          {seccion === 'apoderados' && <Apoderados />}
          {seccion === 'alumnos'    && <Alumnos />}
          {seccion === 'cobros'     && <Cobros />}
          {seccion === 'rutas'      && <Rutas />}
          {seccion === 'asistencia' && <Asistencia />}
          {seccion === 'avisos'     && <Avisos />}
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

  // Ruta pública: actualizar contraseña (directo o via token recovery en URL)
  if (ruta.startsWith('/actualizar-password') || esRecovery) return <ActualizarPassword />

  if (!sesion) return <Login />
  return <Dashboard sesion={sesion} onLogout={handleLogout} />
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