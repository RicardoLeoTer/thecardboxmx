import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home.jsx';

// Cada sección se descarga solo cuando alguien entra a ella: el inicio carga más rápido
const Catalog = lazy(() => import('../pages/Catalog.jsx'));
const About = lazy(() => import('../pages/About.jsx'));
const Rifas = lazy(() => import('../pages/Rifas.jsx'));
const Blog = lazy(() => import('../pages/Blog.jsx'));
const Arcade = lazy(() => import('../pages/Arcade.jsx'));
const Product = lazy(() => import('../pages/Product.jsx'));

// El panel admin se carga solo cuando alguien entra a /admin (no pesa en la tienda)
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

export default function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#060608' }} />}>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* /catalogo, /catalogo/pokemon, /catalogo/deportes/mlb, /catalogo/ofertas
            filtros en la URL: ?tipo=singles|gradeadas|sellado  ?segmento=sir|full-art|parallel|autografo
            /catalogo/cartas-solas y /catalogo/producto-cerrado redirigen a las nuevas */}
        <Route path="/catalogo/*" element={<Catalog />} />
        <Route path="/nosotros" element={<About />} />
        <Route path="/rifas" element={<Rifas />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<Blog />} />
        <Route path="/arcade" element={<Arcade />} />
        <Route path="/carta/:slug" element={<Product />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
      </Suspense>
    </Router>
  );
}
