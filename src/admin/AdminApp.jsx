import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Login from './Login'
import Inventory from './Inventory'
import ProductForm from './ProductForm'
import Summary from './Summary'
import Blog from './Blog'
import ArcadeAdmin from './Arcade'
import Covers from './Covers'
import './admin.css'

const AdminCtx = createContext(null)
export const useAdmin = () => useContext(AdminCtx)

// Permite "Agregar a pantalla de inicio" y abrir /admin como app (sin barra del navegador)
function useInstallableApp() {
  useEffect(() => {
    const tags = [
      ['link', { rel: 'manifest', href: '/admin-app/manifest.webmanifest' }],
      ['link', { rel: 'apple-touch-icon', href: '/admin-app/apple-touch-icon.png' }],
      ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
      ['meta', { name: 'mobile-web-app-capable', content: 'yes' }],
      ['meta', { name: 'apple-mobile-web-app-title', content: 'TCB Admin' }],
      ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ].map(([tag, attrs]) => {
      const el = document.createElement(tag)
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
      document.head.appendChild(el)
      return el
    })
    const prevTitle = document.title
    document.title = 'TCB Admin'
    return () => { tags.forEach((el) => el.remove()); document.title = prevTitle }
  }, [])
}

export default function AdminApp() {
  useInstallableApp()
  const [session, setSession] = useState(undefined) // undefined = cargando
  const [partner, setPartner] = useState(null) // null = cargando, false = sin acceso
  const [lookups, setLookups] = useState({ categories: [], collections: [], partners: [], tags: [], formats: [] })

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const reloadLookups = useCallback(async () => {
    const [p, c, col, t, fm] = await Promise.all([
      supabase.from('partners').select('*').order('name'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('collections').select('*').order('year', { ascending: false }),
      supabase.from('tags').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('sealed_formats').select('*').eq('is_active', true).order('sort_order'),
    ])
    const partners = p.data ?? []
    setLookups({ partners, categories: c.data ?? [], collections: col.data ?? [], tags: t.data ?? [], formats: fm.data ?? [] })
    return partners
  }, [])

  useEffect(() => {
    if (!session) {
      setPartner(null)
      return
    }
    reloadLookups().then((partners) => {
      setPartner(partners.find((x) => x.user_id === session.user.id) ?? false)
    })
  }, [session, reloadLookups])

  if (!supabase)
    return (
      <div className="adm-center">
        <p>Falta configurar Supabase: agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver supabase/LEEME.md).</p>
      </div>
    )
  if (session === undefined) return <div className="adm-center">Cargando…</div>
  if (!session) return <Login />
  if (partner === null) return <div className="adm-center">Cargando…</div>
  if (partner === false)
    return (
      <div className="adm-center">
        <p>Esta cuenta no está dada de alta como socio.</p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Salir</button>
      </div>
    )

  return (
    <AdminCtx.Provider value={{ partner, ...lookups, reloadLookups }}>
      <div className="adm">
        <header className="adm-header">
          <strong>The Card Box · Admin</strong>
          <span className="adm-user">
            {partner.name}
            <button className="link" onClick={() => supabase.auth.signOut()}>Salir</button>
          </span>
        </header>

        <main className="adm-main">
          <Routes>
            <Route index element={<Inventory />} />
            <Route path="nuevo" element={<ProductForm />} />
            <Route path="editar/:id" element={<ProductForm />} />
            <Route path="resumen" element={<Summary />} />
            <Route path="blog" element={<Blog />} />
            <Route path="arcade" element={<ArcadeAdmin />} />
            <Route path="portadas" element={<Covers />} />
            <Route path="*" element={<Navigate to="." replace />} />
          </Routes>
        </main>

        <nav className="adm-nav">
          <NavLink to="." end>📦<span>Inventario</span></NavLink>
          <NavLink to="nuevo" className="adm-nav-main">＋<span>Nuevo</span></NavLink>
          <NavLink to="resumen">📊<span>Resumen</span></NavLink>
          <NavLink to="portadas">🖼️<span>Portadas</span></NavLink>
          <NavLink to="blog">📰<span>Blog</span></NavLink>
          <NavLink to="arcade">🎮<span>Arcade</span></NavLink>
        </nav>
      </div>
    </AdminCtx.Provider>
  )
}
