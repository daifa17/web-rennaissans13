import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- UBAH IMPORT JADI LAZY LOAD ---
// Ini bikin HP pengunjung gak perlu download kode Admin yang berat
// kalau mereka cuma mau lihat Home.
const Home = lazy(() => import('./Home'));
const Login = lazy(() => import('./Login'));
const AdminDashboard = lazy(() => import('./Admin'));

// Komponen Loading Sementara (Muncul sedetik pas pindah halaman)
const PageLoader = () => (
  <div className="min-h-screen bg-[#051125] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <Router>
      {/* Suspense wajib dipakai kalau pakai Lazy Load */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Halaman Utama */}
          <Route path="/" element={<Home />} />
          
          {/* Halaman Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Halaman Dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;