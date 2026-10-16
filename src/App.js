import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// ── Vistas (las iremos construyendo) ──
function Alumnos() {
  return <div style={s.vista}><h2 style={s.vtitulo}>🎒 Alumnos</h2><p style={s.vmsg}>Aquí irá la lista de alumnos.</p></div>
}
function Apoderados() {
  return <div style={s.vista}><h2 style={s.vtitulo}>👨‍👩‍👧 Apoderados</h2><p style={s.vmsg}>Aquí irá la lista de apoderados.</p></div>
}
function Cobros() {
  return <div style={s.vista}><h2 style={s.vtitulo}>💰 Cobros</h2><p style={s.vmsg}>Aquí irán los cobros mensuales.</p></div>
}

const MENU = [
  { id: 'alumnos',    icon: '🎒', label: 'Alumnos' },
  { id: 'apoderados', icon: '👨‍👩‍👧', label: 'Apoderados' },
  { id: 'cobros',     icon: '💰', label: 'Cobros' },
]

function Dashboard({ sesion, onLogout }) {
  const [seccion, setSeccion] = useState('alumnos')
  const [menuAbierto, setMenuAbierto] = useState(false)

  const nombre = sesion.user.email.split('@')[0]

  return (
    <div style={s.app}>
      {/* Sidebar */}
      <aside style={{...s.sidebar, left: window.innerWidth >= 768 ? 0 : (menuAbierto ? 0 : '-240px')}}>
        <div style={s.sideHeader}>
          <span style={s.sideLogo}>🚌</span>
          <div>
            <div style={s.sideNombre}>Furcole</div>
            <div style={s.sideUser}>{nombre}</div>
          </div>
        </div>
        <nav style={s.nav}>
          {MENU.map(m => (
            <button
              key={m.id}
              style={{...s.navBtn, ...(seccion === m.id ? s.navActivo : {})}}
              onClick={() => { setSeccion(m.id); setMenuAbierto(false) }}
            >
              <span style={s.navIcon}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </nav>
        <button style={s.logoutBtn} onClick={onLogout}>← Cerrar sesión</button>
      </aside>

      {/* Overlay móvil */}
      {menuAbierto && <div style={s.overlay} onClick={() => setMenuAbierto(false)} />}

      {/* Contenido principal */}
      <main style={s.main}>
        <header style={s.topbar}>
          <button style={s.hamburger} onClick={() => setMenuAbierto(!menuAbierto)}>☰</button>
          <span style={s.topTitulo}>{MENU.find(m => m.id === seccion)?.label}</span>
        </header>
        <div style={s.contenido}>
          {seccion === 'alumnos'    && <Alumnos />}
          {seccion === 'apoderados' && <Apoderados />}
          {seccion === 'cobros'     && <Cobros />}
        </div>
      </main>
    </div>
  )
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
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
      <div style={s.card}>
        <div style={s.logo}>🚌</div>
        <h1 style={s.titulo}>Furcole</h1>
        <p style={s.subtitulo}>Gestión de transporte escolar</p>
        <form onSubmit={handleLogin} style={s.form}>
          <input style={s.input} type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={s.input} type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} type="submit" disabled={cargando}>{cargando ? 'Ingresando...' : 'Ingresar'}</button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [sesion, setSesion] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session); setCargando(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSesion(session))
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut() }

  if (cargando) return <div style={s.centro}>Cargando...</div>
  if (!sesion)  return <Login />
  return <Dashboard sesion={sesion} onLogout={handleLogout} />
}

const s = {
  // Login
  fondo:     { minHeight:'100vh', background:'#f0f4f9', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif' },
  card:      { background:'#fff', borderRadius:16, padding:'40px 36px', width:'100%', maxWidth:380, boxShadow:'0 4px 24px rgba(0,0,0,.10)', textAlign:'center' },
  logo:      { fontSize:48, marginBottom:8 },
  titulo:    { fontSize:26, fontWeight:700, color:'#0f1f3d', margin:'0 0 4px' },
  subtitulo: { color:'#64748b', margin:'0 0 28px', fontSize:14 },
  form:      { display:'flex', flexDirection:'column', gap:12 },
  input:     { padding:'12px 14px', borderRadius:8, border:'1.5px solid #dde4ef', fontSize:15, outline:'none' },
  btn:       { padding:13, borderRadius:8, background:'#2563eb', color:'#fff', border:'none', fontSize:15, fontWeight:600, cursor:'pointer', marginTop:4 },
  error:     { color:'#dc2626', fontSize:13, margin:0 },
  centro:    { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'system-ui' },
  // Dashboard
  app:       { display:'flex', height:'100vh', fontFamily:'system-ui,sans-serif', background:'#f0f4f9' },
  sidebar:   { position:'fixed', top:0, left:0, height:'100vh', width:240, background:'#0f1f3d', display:'flex', flexDirection:'column', zIndex:100, transition:'left .25s', padding:'24px 0 16px' },
  sideHeader:{ display:'flex', alignItems:'center', gap:12, padding:'0 20px 24px', borderBottom:'1px solid #1e3050' },
  sideLogo:  { fontSize:28 },
  sideNombre:{ color:'#fff', fontWeight:700, fontSize:15 },
  sideUser:  { color:'#7a9cc8', fontSize:12, marginTop:2 },
  nav:       { flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:4 },
  navBtn:    { display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'none', background:'transparent', color:'#a8c0dd', fontSize:14, fontWeight:500, cursor:'pointer', textAlign:'left' },
  navActivo: { background:'#1e3a5f', color:'#fff' },
  navIcon:   { fontSize:18, width:24, textAlign:'center' },
  logoutBtn: { margin:'0 12px', padding:'10px 12px', borderRadius:8, border:'none', background:'transparent', color:'#64748b', fontSize:13, cursor:'pointer', textAlign:'left' },
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:99 },
  main:      { flex:1, display:'flex', flexDirection:'column', marginLeft: window.innerWidth >= 768 ? 240 : 0, minWidth:0 },
  topbar:    { display:'flex', alignItems:'center', gap:12, padding:'0 20px', height:56, background:'#fff', borderBottom:'1px solid #dde4ef', position:'sticky', top:0, zIndex:10 },
  hamburger: { fontSize:20, background:'none', border:'none', cursor:'pointer', color:'#0f1f3d', padding:4 },
  topTitulo: { fontWeight:600, fontSize:16, color:'#0f1f3d' },
  contenido: { flex:1, overflowY:'auto' },
  // Vistas placeholder
  vista:     { padding:32 },
  vtitulo:   { fontSize:22, fontWeight:700, color:'#0f1f3d', marginBottom:8 },
  vmsg:      { color:'#64748b' },
}