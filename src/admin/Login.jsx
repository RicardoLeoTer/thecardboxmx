import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Correo o contraseña incorrectos')
    setLoading(false)
  }

  return (
    <div className="adm-center">
      <form className="card login" onSubmit={submit}>
        <h2>The Card Box · Admin</h2>
        <label>Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  )
}
