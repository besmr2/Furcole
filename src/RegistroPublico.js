import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from './supabase'

const s = {
  page:        { minHeight: '100vh', background: '#f0f4f9', fontFamily: 'system-ui,sans-serif', padding: '24px 16px' },
  card:        { maxWidth: 560, margin: '0 auto', background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,.08)' },
  titulo:      { fontSize: 22, fontWeight: 700, color: '#1a2640', margin: '0 0 4px' },
  sub:         { fontSize: 14, color: '#6b7280', margin: '0 0 20px' },
  ficha:       { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 24 },
  fichaFila:   { display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: '#374151', marginBottom: 6 },
  label:       { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 },
  input:       { width: '100%', border: '1.5px solid #dde4ef', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif', outline: 'none' },
  select:      { width: '100%', border: '1.5px solid #dde4ef', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', background: '#fff', fontFamily: 'system-ui,sans-serif' },
  campo:       { marginBottom: 14 },
  hijoCard:    { border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 12, background: '#fafafa' },
  btnPrimario: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%' },
  btnSec:      { background: '#f1f5f9', color: '#374151', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', fontWeight: 500, fontSize: 13, cursor: 'pointer' },
  btnQuitar:   { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, padding: '2px 6px' },
  alerta:      { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, color: '#b91c1c', fontSize: 13, marginBottom: 16 },
  seccion:     { fontSize: 14, fontWeight: 600, color: '#1a2640', margin: '0 0 14px' },
}

const hijoVacio = () => ({ nombre: '', curso: '', ruta_id: '' })

export default function RegistroPublico() {
  const { token } = useParams()
  const [estado, setEstado] = useState('cargando')
  const [chofer, setChofer] = useState(null)
  const [rutas, setRutas] = useState([])
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '' })
  const [hijos, setHijos] = useState([hijoVacio()])
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      const { data: inv } = await supabase
        .from('invitaciones')
        .select('user_id')
        .eq('token', token)
        .eq('activo', true)
        .single()

      if (!inv) { setEstado('invalido'); return }

      const { data: rutasData } = await supabase
        .from('rutas')
        .select('id, nombre, horario_ida, horario_vuelta')
        .eq('user_id', inv.user_id)
        .eq('activo', true)
        .order('nombre')

      setChofer({ user_id: inv.user_id })
      setRutas(rutasData || [])
      setEstado('valido')
    }
    cargar()
  }, [token])

  const setHijo = (i, campo, valor) =>
    setHijos(prev => prev.map((h, idx) => idx === i ? { ...h, [campo]: valor } : h))

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim())               { setError('El nombre del apoderado es obligatorio.'); return }
    if (!form.telefono.trim())             { setError('El teléfono es obligatorio.'); return }
    if (hijos.some(h => !h.nombre.trim())) { setError('Ingresa el nombre de cada alumno.'); return }
    if (hijos.some(h => !h.ruta_id))       { setError('Selecciona el colegio para cada alumno.'); return }

    setEnviando(true)

    const { data: apo, error: err1 } = await supabase
      .from('apoderados')
      .insert({
        user_id: chofer.user_id,
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim() || null,
      })
      .select('id')
      .single()

    if (err1) { setError('Error al registrar. Intenta nuevamente.'); setEnviando(false); return }

    const alumnos = hijos.map(h => ({
      user_id: chofer.user_id,
      apoderado_id: apo.id,
      nombre: h.nombre.trim(),
      curso: h.curso.trim() || null,
      ruta_id: h.ruta_id || null,
      activo: true,
      monto: 0,
    }))

    const { error: err2 } = await supabase.from('alumnos').insert(alumnos)
    if (err2) { setError('Apoderado registrado, pero hubo un error con los alumnos.'); setEnviando(false); return }

    setEstado('enviado')
  }

  /* ── estados de pantalla ── */
  if (estado === 'cargando') return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ height: 22, background: '#e2e8f0', borderRadius: 6, marginBottom: 10, width: '60%' }} />
        <div style={{ height: 14, background: '#f1f5f9', borderRadius: 6, width: '40%' }} />
      </div>
    </div>
  )

  if (estado === 'invalido') return (
    <div style={s.page}>
      <div style={{ ...s.card, textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <h2 style={s.titulo}>Link no válido</h2>
        <p style={s.sub}>Este link no existe o ya no está activo.<br />Solicita uno nuevo al transportista.</p>
      </div>
    </div>
  )

  if (estado === 'enviado') return (
    <div style={s.page}>
      <div style={{ ...s.card, textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={s.titulo}>¡Registro exitoso!</h2>
        <p style={s.sub}>Tu inscripción fue enviada. El transportista revisará los datos y te contactará para confirmar.</p>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🚌</div>
        <h1 style={s.titulo}>Inscripción furgón escolar</h1>
        <p style={s.sub}>Completa el formulario para registrar a tu(s) hijo(s) en el transporte.</p>

        {rutas.length > 0 && (
          <div style={s.ficha}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>📍 Colegios disponibles</p>
            {rutas.map(r => (
              <div key={r.id} style={s.fichaFila}>
                <span>🏫</span>
                <strong>{r.nombre}</strong>
                {r.horario_ida && <span style={{ color: '#6b7280' }}>· Ida {r.horario_ida}</span>}
                {r.horario_vuelta && <span style={{ color: '#6b7280' }}> Vuelta {r.horario_vuelta}</span>}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={enviar} noValidate>
          <p style={s.seccion}>Datos del apoderado</p>

          {error && <div style={s.alerta} role="alert">{error}</div>}

          <div style={s.campo}>
            <label style={s.label} htmlFor="ap-nombre">
              Nombre completo <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="ap-nombre"
              style={s.input}
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: María González"
            />
          </div>

          <div style={s.campo}>
            <label style={s.label} htmlFor="ap-tel">
              Teléfono <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="ap-tel"
              type="tel"
              style={s.input}
              value={form.telefono}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div style={{ ...s.campo, marginBottom: 24 }}>
            <label style={s.label} htmlFor="ap-email">Email (opcional)</label>
            <input
              id="ap-email"
              type="email"
              style={s.input}
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="correo@ejemplo.cl"
            />
          </div>

          <p style={s.seccion}>Alumnos a inscribir</p>

          {hijos.map((h, i) => (
            <div key={i} style={s.hijoCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Alumno {i + 1}</span>
                {hijos.length > 1 && (
                  <button
                    type="button"
                    style={s.btnQuitar}
                    onClick={() => setHijos(p => p.filter((_, idx) => idx !== i))}
                  >
                    Quitar
                  </button>
                )}
              </div>

              <div style={s.campo}>
                <label style={s.label} htmlFor={'h-nombre-' + i}>
                  Nombre <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id={'h-nombre-' + i}
                  style={s.input}
                  value={h.nombre}
                  onChange={e => setHijo(i, 'nombre', e.target.value)}
                  placeholder="Nombre del alumno"
                />
              </div>

              <div style={s.campo}>
                <label style={s.label} htmlFor={'h-curso-' + i}>Curso</label>
                <input
                  id={'h-curso-' + i}
                  style={s.input}
                  value={h.curso}
                  onChange={e => setHijo(i, 'curso', e.target.value)}
                  placeholder="Ej: 3° Básico"
                />
              </div>

              <div style={s.campo}>
                <label style={s.label} htmlFor={'h-ruta-' + i}>
                  Colegio <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  id={'h-ruta-' + i}
                  style={s.select}
                  value={h.ruta_id}
                  onChange={e => setHijo(i, 'ruta_id', e.target.value)}
                >
                  <option value="">Selecciona el colegio...</option>
                  {rutas.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <button
            type="button"
            style={{ ...s.btnSec, width: '100%', marginBottom: 16 }}
            onClick={() => setHijos(p => [...p, hijoVacio()])}
          >
            + Agregar otro hijo/a
          </button>

          <button type="submit" style={s.btnPrimario} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Confirmar inscripción'}
          </button>
        </form>
      </div>
    </div>
  )
}