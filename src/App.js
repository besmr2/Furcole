import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 18, r = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
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
      <style>{`@keyframes shimmer{to{background-position:-200% 0}}.btn-icon:hover{opacity:.75}.fila:hover{background:#f8fafc}`}</style>
      <div style={s.vistaHeader}>
        <h2 style={s.vtitulo}>Apoderados</h2>
        <button style={s.btnPrimario} onClick={abrirNuevo} aria-label="Agregar apoderado">+ Agregar</button>
      </div>
      {cargando ? (
        <div style={s.skeletonWrap} aria-busy="true" aria-label="Cargando">
          {[1,2,3].map(i => <div key={i} style={s.skeletonFila}><Skeleton w={140} h={16}/><Skeleton w={100} h={14}/><Skeleton w={160} h={14}/></div>)}
        </div>
      ) : lista.length === 0 ? (
        <div style={s.vacio} role="status"><span style={{fontSize:40}}>👨‍👩‍👧</span><p>Aún no hay apoderados.<br/>Agrega el primero.</p></div>
      ) : (
        <div style={s.tabla} role="table" aria-label="Lista de apoderados">
          <div style={s.tablaHead} role="row">
            <span role="columnheader">Nombre</span><span role="columnheader">Teléfono</span>
            <span role="columnheader">Email</span><span role="columnheader" aria-label="Acciones"/>
          </div>
          {lista.map(ap => (
            <div key={ap.id} className="fila" style={s.tablaFila} role="row">
              <span style={s.celNombre} role="cell">{ap.nombre}</span>
              <span style={s.cel} role="cell">{ap.telefono || '—'}</span>
              <span style={s.cel} role="cell">{ap.email || '—'}</span>
              <span style={s.celAcciones} role="cell">
                <button className="btn-icon" style={s.btnIcono} onClick={() => abrirEditar(ap)} aria-label={`Editar ${ap.nombre}`}>✏️</button>
                <button className="btn-icon" style={s.btnIcono} onClick={() => eliminar(ap.id)} aria-label={`Eliminar ${ap.nombre}`}>🗑️</button>
              </span>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <div style={s.modalFondo} role="dialog" aria-modal="true" aria-label={modal==='nuevo'?'Nuevo apoderado':'Editar apoderado'} onClick={e=>{if(e.target===e.currentTarget)cerrar()}}>
          <div style={s.modalCard}>
            <h3 style={s.modalTitulo}>{modal==='nuevo'?'Nuevo apoderado':'Editar apoderado'}</h3>
            <form onSubmit={guardar} style={s.form} noValidate>
              <label style={s.label} htmlFor="ap-nombre">Nombre <span aria-hidden="true" style={{color:'#dc2626'}}>*</span></label>
              <input id="ap-nombre" style={s.input} type="text" placeholder="Nombre completo" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} required autoFocus maxLength={120}/>
              <label style={s.label} htmlFor="ap-tel">Teléfono</label>
              <input id="ap-tel" style={s.input} type="tel" placeholder="+56 9 1234 5678" value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} maxLength={20}/>
              <label style={s.label} htmlFor="ap-email">Email</label>
              <input id="ap-email" style={s.input} type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} maxLength={120}/>
              {error && <p style={s.errorMsg} role="alert">{error}</p>}
              <div style={s.modalBtns}>
                <button type="button" style={s.btnSecundario} onClick={cerrar}>Cancelar</button>
                <button type="submit" style={s.btnPrimario} disabled={guardando}>{guardando?'Guardando…':'Guardar'}</button>
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

  const abrirNuevo = () => {
    setForm({ nombre: '', apoderado_id: apoderados[0]?.id || '', monto: '', activo: true })
    setError(''); setModal('nuevo')
  }
  const abrirEditar = (al) => {
    setForm({ nombre: al.nombre, apoderado_id: al.apoderado_id, monto: String(al.monto), activo: al.activo })
    setError(''); setModal(al)
  }
  const cerrar = () => { setModal(false); setError('') }

  const guardar = async (e) => {
    e.preventDefault()
    const nombre = form.nombre.trim()
    const monto  = parseFloat(form.monto)
    if (!nombre)              { setError('El nombre es obligatorio'); return }
    if (!form.apoderado_id)   { setError('Selecciona un apoderado'); return }
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

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este alumno?')) return
    await supabase.from('alumnos').delete().eq('id', id)
    cargar()
  }

  const toggleActivo = async (al) => {
    await supabase.from('alumnos').update({ activo: !al.activo }).eq('id', al.id)
    cargar()
  }

  return (
    <div style={s.vista}>
      <div style={s.vistaHeader}>
        <h2 style={s.vtitulo}>Alumnos</h2>
        <button style={s.btnPrimario} onClick={abrirNuevo} aria-label="Agregar alumno">+ Agregar</button>
      </div>

      {cargando ? (
        <div style={s.skeletonWrap} aria-busy="true" aria-label="Cargando">
          {[1,2,3].map(i => <div key={i} style={s.skeletonFila}><Skeleton w={140} h={16}/><Skeleton w={120} h={14}/><Skeleton w={70} h={14}/><Skeleton w={60} h={22} r={20}/></div>)}
        </div>
      ) : apoderados.length === 0 ? (
        <div style={s.vacio} role="status">
          <span style={{fontSize:40}}>⚠️</span>
          <p>Primero debes agregar al menos un <strong>apoderado</strong>.</p>
        </div>
      ) : lista.length === 0 ? (
        <div style={s.vacio} role="status"><span style={{fontSize:40}}>🎒</span><p>Aún no hay alumnos.<br/>Agrega el primero.</p></div>
      ) : (
        <div style={s.tabla} role="table" aria-label="Lista de alumnos">
          <div style={{...s.tablaHead, gridTemplateColumns:'1fr 1fr 100px 90px 80px'}} role="row">
            <span role="columnheader">Nombre</span>
            <span role="columnheader">Apoderado</span>
            <span role="columnheader">Monto</span>
            <span role="columnheader">Estado</span>
            <span role="columnheader" aria-label="Acciones"/>
          </div>
          {lista.map(al => (
            <div key={al.id} className="fila" style={{...s.tablaFila, gridTemplateColumns:'1fr 1fr 100px 90px 80px', opacity: al.activo ? 1 : 0.55}} role="row">
              <span style={s.celNombre} role="cell">{al.nombre}</span>
              <span style={s.cel} role="cell">{al.apoderados?.nombre || '—'}</span>
              <span style={s.cel} role="cell">${Number(al.monto).toLocaleString('es-CL')}</span>
              <span role="cell">
                <button
                  onClick={() => toggleActivo(al)}
                  style={{...s.badge, background: al.activo ? '#dcfce7' : '#f1f5f9', color: al.activo ? '#16a34a' : '#94a3b8', cursor:'pointer', border:'none'}}
                  aria-label={al.activo ? `Desactivar ${al.nombre}` : `Activar ${al.nombre}`}
                  aria-pressed={al.activo}
                >
                  {al.activo ? 'Activo' : 'Inactivo'}
                </button>
              </span>
              <span style={s.celAcciones} role="cell">
                <button className="btn-icon" style={s.btnIcono} onClick={() => abrirEditar(al)} aria-label={`Editar ${al.nombre}`}>✏️</button>
                <button className="btn-icon" style={s.btnIcono} onClick={() => eliminar(al.id)} aria-label={`Eliminar ${al.nombre}`}>🗑️</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={s.modalFondo} role="dialog" aria-modal="true" aria-label={modal==='nuevo'?'Nuevo alumno':'Editar alumno'} onClick={e=>{if(e.target===e.currentTarget)cerrar()}}>
          <div style={s.modalCard}>
            <h3 style={s.modalTitulo}>{modal==='nuevo'?'Nuevo alumno':'Editar alumno'}</h3>
            <form onSubmit={guardar} style={s.form} noValidate>
              <label style={s.label} htmlFor="al-nombre">Nombre <span aria-hidden="true" style={{color:'#dc2626'}}>*</span></label>
              <input id="al-nombre" style={s.input} type="text" placeholder="Nombre completo" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} required autoFocus maxLength={120}/>

              <label style={s.label} htmlFor="al-apoderado">Apoderado <span aria-hidden="true" style={{color:'#dc2626'}}>*</span></label>
              <select id="al-apoderado" style={s.input} value={form.apoderado_id} onChange={e=>setForm(f=>({...f,apoderado_id:e.target.value}))} required>
                <option value="">Seleccionar apoderado…</option>
                {apoderados.map(ap => <option key={ap.id} value={ap.id}>{ap.nombre}</option>)}
              </select>

              <label style={s.label} htmlFor="al-monto">Monto mensual (CLP) <span aria-hidden="true" style={{color:'#dc2626'}}>*</span></label>
              <input id="al-monto" style={s.input} type="number" placeholder="50000" min="0" step="1000" value={form.monto} onChange={e=>setForm(f=>({...f,monto:e.target.value}))} required/>

              <label style={s.label} htmlFor="al-activo">Estado</label>
              <select id="al-activo" style={s.input} value={form.activo} onChange={e=>setForm(f=>({...f,activo:e.target.value==='true'}))}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>

              {error && <p style={s.errorMsg} role="alert">{error}</p>}
              <div style={s.modalBtns}>
                <button type="button" style={s.btnSecundario} onClick={cerrar}>Cancelar</button>
                <button type="submit" style={s.btnPrimario} disabled={guardando}>{guardando?'Guardando…':'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Cobros placeholder ───────────────────────────────────────────────────────
function Cobros() {
  return <div style={s.vista}><h2 style={s.vtitulo}>Cobros</h2><p style={s.vmsg}>Próximamente.</p></div>
}

// ─── Menú ─────────────────────────────────────────────────────────────────────
const MENU = [
  { id: 'apoderados', icon: '👨‍👩‍👧', label: 'Apoderados' },
  { id: 'alumnos',    icon: '🎒',      label: 'Alumnos' },
  { id: 'cobros',     icon: '💰',      label: 'Cobros' },
]

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ sesion, onLogout }) {
  const [seccion, setSeccion]         = useState('apoderados')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const nombre = sesion.user.email.split('@')[0]

  return (
    <div style={s.app}>
      <aside style={{...s.sidebar, left: window.innerWidth >= 768 ? 0 : (menuAbierto ? 0 : '-240px')}}>
        <div style={s.sideHeader}>
          <span style={s.sideLogo}>🚌</span>
          <div>
            <div style={s.sideNombre}>Furcole</div>
            <div style={s.sideUser}>{nombre}</div>
          </div>
        </div>
        <nav style={s.nav} aria-label="Navegación principal">
          {MENU.map(m => (
            <button key={m.id} style={{...s.navBtn,...(seccion===m.id?s.navActivo:{})}}
              onClick={()=>{setSeccion(m.id);setMenuAbierto(false)}}
              aria-current={seccion===m.id?'page':undefined}>
              <span style={s.navIcon} aria-hidden="true">{m.icon}</span>{m.label}
            </button>
          ))}
        </nav>
        <button style={s.logoutBtn} onClick={onLogout}>← Cerrar sesión</button>
      </aside>
      {menuAbierto && <div style={s.overlay} onClick={()=>setMenuAbierto(false)} aria-hidden="true"/>}
      <main style={{...s.main, marginLeft: window.innerWidth >= 768 ? 240 : 0}}>
        <header style={s.topbar}>
          <button style={s.hamburger} onClick={()=>setMenuAbierto(!menuAbierto)} aria-label="Abrir menú" aria-expanded={menuAbierto}>☰</button>
          <span style={s.topTitulo}>{MENU.find(m=>m.id===seccion)?.label}</span>
        </header>
        <div style={s.contenido}>
          {seccion==='apoderados' && <Apoderados/>}
          {seccion==='alumnos'    && <Alumnos/>}
          {seccion==='cobros'     && <Cobros/>}
        </div>
      </main>
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [cargando, setCargando] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setCargando(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos')
    setCargando(false)
  }

  return (
    <div style={s.fondo}>
      <div style={s.card} role="main">
        <div style={s.logo} aria-hidden="true">🚌</div>
        <h1 style={s.titulo}>Furcole</h1>
        <p style={s.subtitulo}>Gestión de transporte escolar</p>
        <form onSubmit={handleLogin} style={s.form} noValidate>
          <label style={s.labelLogin} htmlFor="login-email">Correo electrónico</label>
          <input id="login-email" style={s.input} type="email" placeholder="correo@ejemplo.com" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>
          <label style={s.labelLogin} htmlFor="login-pass">Contraseña</label>
          <input id="login-pass" style={s.input} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/>
          {error && <p style={s.errorMsg} role="alert">{error}</p>}
          <button style={s.btn} type="submit" disabled={cargando}>{cargando?'Ingresando…':'Ingresar'}</button>
        </form>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [sesion, setSesion]     = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSesion(session); setCargando(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSesion(session))
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut() }

  if (cargando) return <div style={s.centro} aria-busy="true"><Skeleton w={200} h={20}/></div>
  if (!sesion)  return <Login/>
  return <Dashboard sesion={sesion} onLogout={handleLogout}/>
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = {
  fondo:       { minHeight:'100vh', background:'#f0f4f9', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif' },
  card:        { background:'#fff', borderRadius:16, padding:'40px 36px', width:'100%', maxWidth:380, boxShadow:'0 4px 24px rgba(0,0,0,.10)', textAlign:'center' },
  logo:        { fontSize:48, marginBottom:8 },
  titulo:      { fontSize:26, fontWeight:700, color:'#0f1f3d', margin:'0 0 4px' },
  subtitulo:   { color:'#64748b', margin:'0 0 28px', fontSize:14 },
  centro:      { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'system-ui' },
  app:         { display:'flex', height:'100vh', fontFamily:'system-ui,sans-serif', background:'#f0f4f9' },
  sidebar:     { position:'fixed', top:0, left:0, height:'100vh', width:240, background:'#0f1f3d', display:'flex', flexDirection:'column', zIndex:100, transition:'left .25s', padding:'24px 0 16px' },
  sideHeader:  { display:'flex', alignItems:'center', gap:12, padding:'0 20px 24px', borderBottom:'1px solid #1e3050' },
  sideLogo:    { fontSize:28 },
  sideNombre:  { color:'#fff', fontWeight:700, fontSize:15 },
  sideUser:    { color:'#7a9cc8', fontSize:12, marginTop:2 },
  nav:         { flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:4 },
  navBtn:      { display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'none', background:'transparent', color:'#a8c0dd', fontSize:14, fontWeight:500, cursor:'pointer', textAlign:'left' },
  navActivo:   { background:'#1e3a5f', color:'#fff' },
  navIcon:     { fontSize:18, width:24, textAlign:'center' },
  logoutBtn:   { margin:'0 12px', padding:'10px 12px', borderRadius:8, border:'none', background:'transparent', color:'#64748b', fontSize:13, cursor:'pointer', textAlign:'left' },
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:99 },
  main:        { flex:1, display:'flex', flexDirection:'column', minWidth:0 },
  topbar:      { display:'flex', alignItems:'center', gap:12, padding:'0 20px', height:56, background:'#fff', borderBottom:'1px solid #dde4ef', position:'sticky', top:0, zIndex:10 },
  hamburger:   { fontSize:20, background:'none', border:'none', cursor:'pointer', color:'#0f1f3d', padding:4 },
  topTitulo:   { fontWeight:600, fontSize:16, color:'#0f1f3d' },
  contenido:   { flex:1, overflowY:'auto' },
  vista:       { padding:24 },
  vistaHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  vtitulo:     { fontSize:20, fontWeight:700, color:'#0f1f3d', margin:0 },
  vmsg:        { color:'#64748b' },
  tabla:       { background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.07)' },
  tablaHead:   { display:'grid', gridTemplateColumns:'1fr 1fr 1.5fr 80px', padding:'10px 16px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', fontSize:12, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.04em' },
  tablaFila:   { display:'grid', gridTemplateColumns:'1fr 1fr 1.5fr 80px', padding:'12px 16px', borderBottom:'1px solid #f1f5f9', alignItems:'center', transition:'background .15s' },
  celNombre:   { fontWeight:600, color:'#0f1f3d', fontSize:14 },
  cel:         { color:'#64748b', fontSize:14 },
  celAcciones: { display:'flex', gap:4, justifyContent:'flex-end' },
  btnIcono:    { background:'none', border:'none', cursor:'pointer', fontSize:16, padding:'2px 4px', transition:'opacity .15s' },
  badge:       { display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600 },
  skeletonWrap:{ display:'flex', flexDirection:'column', gap:12, padding:4 },
  skeletonFila:{ background:'#fff', borderRadius:10, padding:'14px 16px', display:'flex', gap:24, alignItems:'center', boxShadow:'0 1px 3px rgba(0,0,0,.05)' },
  vacio:       { textAlign:'center', padding:'60px 20px', color:'#64748b', lineHeight:1.6 },
  form:        { display:'flex', flexDirection:'column', gap:10 },
  label:       { fontSize:13, fontWeight:600, color:'#374151', marginBottom:-4 },
  labelLogin:  { fontSize:13, fontWeight:600, color:'#374151', textAlign:'left', marginBottom:-4 },
  input:       { padding:'11px 13px', borderRadius:8, border:'1.5px solid #dde4ef', fontSize:14, outline:'none', fontFamily:'system-ui', background:'#fff' },
  btn:         { padding:13, borderRadius:8, background:'#2563eb', color:'#fff', border:'none', fontSize:15, fontWeight:600, cursor:'pointer', marginTop:4 },
  btnPrimario: { padding:'9px 18px', borderRadius:8, background:'#2563eb', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer' },
  btnSecundario:{ padding:'9px 18px', borderRadius:8, background:'#f1f5f9', color:'#374151', border:'none', fontSize:14, fontWeight:500, cursor:'pointer' },
  errorMsg:    { color:'#dc2626', fontSize:13, margin:0 },
  modalFondo:  { position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modalCard:   { background:'#fff', borderRadius:16, padding:'28px 28px 24px', width:'100%', maxWidth:420, boxShadow:'0 8px 40px rgba(0,0,0,.18)' },
  modalTitulo: { fontSize:17, fontWeight:700, color:'#0f1f3d', margin:'0 0 18px' },
  modalBtns:   { display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 },
}