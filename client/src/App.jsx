import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import AdminDashboard from './AdminDashboard'; // Pastikan nama filenya sesuai

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Utama (Web Sekolah) */}
        <Route path="/" element={<Home />} />
        
        {/* Halaman Login Admin */}
        <Route path="/login" element={<Login />} />
        
        {/* Halaman Dashboard Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;