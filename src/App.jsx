import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home.jsx';
import Catalog from '../pages/Catalog.jsx';
import About from '../pages/About.jsx';
import Rifas from '../pages/Rifas.jsx';
import Blog from '../pages/Blog.jsx';

// El panel admin se carga solo cuando alguien entra a /admin (no pesa en la tienda)
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

export default function App() {
  return (
    <Router>
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
        <Route path="/admin/*" element={<Suspense fallback={null}><AdminApp /></Suspense>} />
      </Routes>
    </Router>
  );
}
