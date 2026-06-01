import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from '../pages/Home.jsx';
import Catalog from '../pages/Catalog.jsx';
import About from '../pages/About.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo/cartas-solas" element={<Catalog />} />
        <Route path="/catalogo/producto-cerrado" element={<Catalog />} />
        <Route path="/nosotros" element={<About />} />
        {/* Redirect old /catalogo to /catalogo/cartas-solas */}
        <Route path="/catalogo" element={<Catalog />} />
      </Routes>
    </Router>
  );
}
