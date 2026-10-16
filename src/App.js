import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function App() {
  const [sesion, setSesion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loginCargando, setLoginCargando] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session)
      setCargando(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginCargando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos')
    setLoginCargando(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (cargando) return <div style={s.centro}>Cargando...</div>

  if (!sesion) return (
    <div style={s.fondo}>
      <div style={s.card}>
        <div style={s.logo}>🚌</div>
        <h1 style={s.titulo}>Furcole</h1>
        <p style={s.subtitulo}>Gestión de transporte escolar</p>
        <form onSubmit={handleLogin} style={s.form}>
          <input
            style={s.input}
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={s.input}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} type="submit" disabled={loginCargando}>
            {loginCargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div style={s.fondo}>
      <div style={s.card}>
        <div style={s.logo}>🚌</div>
        <h2 style={s.titulo}>¡Bienvenida!</h2>
        <p style={s.subtitulo}>{sesion.user.email}</p>
        <p style={{color:'#22c55e', margin:'16px 0', fontWeight:600}}>✓ Sesión iniciada correctamente</p>
        <button style={{...s.btn, background:'#64748b'}} onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

const s = {
  fondo: { minHeight:'100vh', background:'#f0f4f9', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui, sans-serif' },
  card: { background:'#fff', borderRadius:16, padding:'40px 36px', width:'100%', maxWidth:380, boxShadow:'0 4px 24px rgba(0,0,0,.10)', textAlign:'center' },
  logo: { fontSize:48, marginBottom:8 },
  titulo: { fontSize:26, fontWeight:700, color:'#0f1f3d', margin:'0 0 4px' },
  subtitulo: { color:'#64748b', margin:'0 0 28px', fontSize:14 },
  form: { display:'flex', flexDirection:'column', gap:12 },
  input: { padding:'12px 14px', borderRadius:8, border:'1.5px solid #dde4ef', fontSize:15, outline:'none' },
  btn: { padding:'13px', borderRadius:8, background:'#2563eb', color:'#fff', border:'none', fontSize:15, fontWeight:600, cursor:'pointer', marginTop:4 },
  error: { color:'#dc2626', fontSize:13, margin:0 },
  centro: { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'system-ui' }
}

export default App