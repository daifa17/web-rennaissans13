import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Pastikan path ini benar!

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // INI LOGIC SUPABASE NYA
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      // Jika sukses, masuk ke admin
      navigate('/admin'); 

    } catch (err) {
      // Tampilkan pesan error
      setError('Email atau Password salah!');
      console.error("Login Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#051125] flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Hiasan Background (Lingkaran Samar) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

      {/* KARTU LOGIN */}
      <div className="w-full max-w-md bg-[#0a192f] border border-yellow-500/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(234,179,8,0.15)] relative z-10 animate-fade-in-up">
        
        {/* LOGO DI TENGAH ATAS */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-[#051125] rounded-full border-2 border-yellow-500 flex items-center justify-center shadow-lg">
             <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-yellow-500 font-bold tracking-widest mb-2">ADMIN ACCESS</h1>
          <p className="text-gray-400 text-xs uppercase tracking-wider">Silakan Masuk Untuk Mengelola Data</p>
        </div>

        {/* ALERT ERROR */}
        {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded mb-4 text-center">
                {error}
            </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-yellow-500 text-xs font-bold mb-2 ml-1">EMAIL</label>
            <input 
              type="email" 
              placeholder="Masukkan email admin..."
              className="w-full bg-[#051125] border border-white/10 rounded-lg p-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-yellow-500 text-xs font-bold mb-2 ml-1">PASSWORD</label>
            <input 
              type="password" 
              placeholder="Masukkan password..."
              className="w-full bg-[#051125] border border-white/10 rounded-lg p-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition transform hover:-translate-y-1 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'MEMERIKSA...' : 'MASUK DASHBOARD'}
          </button>
        </form>

        {/* FOOTER KECIL */}
        <div className="mt-8 text-center border-t border-white/5 pt-4">
           <button onClick={() => navigate('/')} className="text-gray-500 hover:text-yellow-500 text-sm transition">
             ← Kembali ke Halaman Utama
           </button>
        </div>

      </div>
    </div>
  );
};

export default Login;