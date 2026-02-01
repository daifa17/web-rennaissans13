import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- IMPORT SEMUA HALAMAN DISINI ---
import Home from './Home';
import Admin from './Admin';
import Login from './Login'; // <--- Pastikan baris ini ada!

function App() {
  return (
    <Routes>
      {/* Halaman Utama (Home) */}
      <Route path="/" element={<Home />} />
      
      {/* Halaman Login (Gerbang Admin) */}
      <Route path="/login" element={<Login />} />
      
      {/* Halaman Admin (Dashboard) */}
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

export default App;