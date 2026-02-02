import React, { useState, useEffect, useRef } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient'; 

// --- 1. KOMPONEN VIDEO PINTAR (Disesuaikan dengan Desain Kamu) ---
const FlashbackItem = ({ item, activeVideoId, setActiveVideoId, STORAGE_URL }) => {
  const videoRef = useRef(null);
  const isActive = activeVideoId === item.id;

  // Logic: Kalau video ini "Active", nyalakan suara. Kalau tidak, bisukan.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isActive;
    }
  }, [isActive]);

  // Logic: Autoplay saat muncul di layar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      },
      { threshold: 0.5 }
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      className={`group relative flex-1 hover:flex-[3] transition-all duration-700 ease-in-out rounded-3xl overflow-hidden border border-white/10 hover:border-yellow-500 shadow-2xl cursor-pointer bg-black ${isActive ? 'flex-[3] border-yellow-500' : ''}`}
      onMouseEnter={() => setActiveVideoId(item.id)} // Desktop: Hover buat nyalain suara
      onMouseLeave={() => setActiveVideoId(null)}  // Desktop: Lepas mute
      onClick={() => setActiveVideoId(isActive ? null : item.id)} // Mobile: Klik buat nyalain suara
    >
      <div className={`absolute inset-0 bg-black/60 z-10 transition duration-500 pointer-events-none ${isActive ? 'bg-transparent' : 'group-hover:bg-transparent'}`}></div>
      
      <video 
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover opacity-50 grayscale transition duration-700 scale-[1.3] group-hover:scale-100 group-hover:opacity-100 group-hover:grayscale-0 ${isActive ? 'opacity-100 grayscale-0 scale-100' : ''}`}
        src={`${STORAGE_URL}/${item.video_url}`}
        loop 
        playsInline 
        muted={!isActive} // Default Mute kecuali aktif
      />

      {/* Judul & Deskripsi */}
      <div className={`absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-full transition duration-500 z-20 pointer-events-none ${isActive ? 'translate-y-0' : 'group-hover:translate-y-0'}`}>
        <h4 className="text-white font-serif text-2xl font-bold mb-1">{item.title}</h4>
        <p className="text-yellow-500 text-xs tracking-widest uppercase">{item.description}</p>
        <div className="mt-2 text-white/80 text-[10px] flex items-center gap-2">
           <span>{isActive ? "🔊 Playing" : "🔇 Muted"}</span>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONEN TIME CAPSULE FORM ---
const TimeCapsuleForm = () => {
  const [step, setStep] = useState('form'); 
  const [formData, setFormData] = useState({ name: '', message: '', date: '', customCode: '' });
  const [finalCode, setFinalCode] = useState(''); 
  const [inputKey, setInputKey] = useState('');
  const [openResult, setOpenResult] = useState(null); 
  const [loading, setLoading] = useState(false);

  const handleLockMessage = async (e) => {
    e.preventDefault();
    if (!formData.date) return alert("Pilih tanggal bukanya dulu!");
    if (!formData.customCode) return alert("Bikin kode rahasiamu dulu!");
    setLoading(true);

    try {
        const { data: existingData, error: checkError } = await supabase.from('time_capsules').select('id').eq('secret_key', formData.customCode);
        if (checkError) throw checkError;
        if (existingData.length > 0) { alert("Yah, kode itu sudah dipakai orang lain. Coba ganti yang unik!"); setLoading(false); return; }
        const { error: insertError } = await supabase.from('time_capsules').insert([{ sender_name: formData.name, message: formData.message, unlock_date: formData.date, secret_key: formData.customCode }]);
        if (insertError) throw insertError;
        setFinalCode(formData.customCode); setStep('result');
    } catch (err) { console.error(err); alert("Gagal mengunci pesan. Cek koneksi internet."); } finally { setLoading(false); }
  };

  const handleOpenCapsule = async (e) => {
      e.preventDefault(); setLoading(true); setOpenResult(null);
      try {
          const { data, error } = await supabase.from('time_capsules').select('*').eq('secret_key', inputKey).maybeSingle();
          if (error) throw error;
          if (!data) { setOpenResult({ status: 'NotFound' }); } else {
              const today = new Date().toISOString().split('T')[0];
              if (data.unlock_date > today) { setOpenResult({ status: 'Locked', message: `Sabar ya! Pesan ini baru bisa dibuka tanggal ${data.unlock_date}`, sender: data.sender_name }); } 
              else { setOpenResult({ status: 'Unlocked', data: data }); }
          }
      } catch (err) { alert("Terjadi kesalahan saat membuka kapsul."); } finally { setLoading(false); }
  };

  if (step === 'result') {
    return (
      <div className="bg-gradient-to-br from-[#0f1f3b] to-[#0a1529] border border-green-500/30 p-8 rounded-2xl text-center shadow-2xl animate-fade-in-up h-full flex flex-col justify-center items-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 text-3xl animate-bounce-slow">🔒</div>
        <h3 className="text-xl font-bold text-white mb-2">Berhasil Dikunci!</h3>
        <p className="text-gray-400 text-sm mb-4">Ingat baik-baik kode rahasia yang kamu buat ini:</p>
        <div className="bg-black/40 border-2 border-dashed border-yellow-500 p-4 rounded-lg mb-6 w-full relative group cursor-pointer" onClick={() => {navigator.clipboard.writeText(finalCode); alert("Kode disalin!");}}>
            <h2 className="text-3xl font-mono font-bold text-yellow-500 tracking-widest uppercase">{finalCode}</h2>
            <p className="text-[10px] text-gray-500 mt-1 uppercase">Klik untuk copy</p>
        </div>
        <button onClick={() => {setStep('form'); setFormData({name:'', message:'', date:'', customCode:''});}} className="text-sm text-green-500 underline">Tulis pesan baru</button>
      </div>
    );
  }

  if (step === 'open') {
      return (
        <div className="bg-[#0f1f3b] border border-white/10 p-8 rounded-2xl shadow-xl h-full flex flex-col relative animate-fade-in-up">
            <button onClick={() => {setStep('form'); setOpenResult(null);}} className="absolute top-4 left-4 text-gray-400 hover:text-white">← Kembali</button>
            {!openResult ? (
                <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-yellow-500 mb-6 text-center">Buka Kapsul Waktu</h3>
                    <form onSubmit={handleOpenCapsule} className="space-y-4">
                        <input type="text" placeholder="Masukkan Kodemu..." value={inputKey} onChange={e => setInputKey(e.target.value)} className="w-full bg-black/30 border border-white/20 p-4 rounded-lg text-center text-xl font-bold text-white uppercase tracking-widest focus:border-yellow-500 outline-none" required />
                        <button disabled={loading} className="w-full bg-yellow-500 text-black font-bold py-3 rounded-lg hover:bg-yellow-400 transition">{loading ? "Mengecek..." : "BUKA SEKARANG 🔓"}</button>
                    </form>
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-center text-center">
                    {openResult.status === 'Unlocked' ? (
                        <div className="animate-zoom-in">
                            <p className="text-gray-400 text-xs mb-2">Pesan dari masa lalu ({new Date(openResult.data.created_at).toLocaleDateString()}):</p>
                            <div className="bg-white/10 p-6 rounded-xl border border-white/20 mb-4 relative">
                                <span className="absolute -top-3 left-4 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded">DARI: {openResult.data.sender_name}</span>
                                <p className="text-xl font-serif italic text-white leading-relaxed">"{openResult.data.message}"</p>
                            </div>
                            <p className="text-green-400 font-bold text-sm">✨ Akhirnya terbuka!</p>
                        </div>
                    ) : openResult.status === 'Locked' ? (
                        <div className="animate-pulse">
                            <div className="text-5xl mb-4">⏳</div>
                            <h3 className="text-red-400 font-bold text-xl mb-2">BELUM WAKTUNYA!</h3>
                            <p className="text-gray-300">{openResult.message}</p>
                            <p className="text-xs text-gray-500 mt-4">Pesan ini milik: <span className="text-yellow-500">{openResult.sender}</span></p>
                        </div>
                    ) : (
                        <div><div className="text-5xl mb-4">❌</div><h3 className="text-gray-400 font-bold">Kode Salah / Tidak Ditemukan</h3></div>
                    )}
                    <button onClick={() => setOpenResult(null)} className="mt-6 text-yellow-500 underline text-sm">Coba kode lain</button>
                </div>
            )}
        </div>
      );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-xl hover:border-yellow-500/30 transition duration-500 relative overflow-hidden group h-full flex flex-col">
        <div className="flex justify-between items-center mb-6"><h4 className="font-bold text-white">Buat Kapsul Baru</h4><button onClick={() => setStep('open')} className="text-[10px] bg-white/10 px-3 py-1 rounded border border-white/20 hover:bg-white/20 transition">PUNYA KODE?</button></div>
        <form onSubmit={handleLockMessage} className="space-y-4 flex-1 flex flex-col">
            <input type="text" placeholder="Namamu..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full bg-[#050b14]/80 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-yellow-500 outline-none" />
            <input type="text" placeholder="Bikin Kode Rahasia (cth: ALUMNI2024)" value={formData.customCode} onChange={e => setFormData({...formData, customCode: e.target.value})} required className="w-full bg-[#050b14]/80 border border-white/10 rounded-lg px-4 py-3 text-yellow-500 font-bold tracking-wider placeholder-gray-600 focus:border-yellow-500 outline-none uppercase" />
            <p className="text-[10px] text-gray-500 -mt-2">*Ingat kode ini untuk membuka pesan nanti.</p>
            <textarea rows="3" placeholder="Pesan untuk masa depan..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required className="w-full bg-[#050b14]/80 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-yellow-500 outline-none resize-none flex-1"></textarea>
            <div className="bg-[#050b14]/80 p-3 rounded-lg border border-white/10"><label className="block text-gray-500 text-[10px] uppercase font-bold mb-1">Bisa dibuka pada tanggal:</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className="w-full bg-transparent text-white outline-none cursor-pointer" /></div>
            <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-blue-600/40 transform hover:-translate-y-1 transition duration-300 flex justify-center items-center gap-2">{loading ? <span>Menyimpan...</span> : <><span>Kunci Pesan</span><span>🔒</span></>}</button>
        </form>
    </div>
  );
};

// --- KOMPONEN UTAMA HOME ---
const Home = () => {
  const STORAGE_URL = 'https://fjagcvvlfaarxjitdbsy.supabase.co/storage/v1/object/public/public-files';
  
  // --- STATES & REF ---
  const bgAudioRef = useRef(null);
  const flashbackSectionRef = useRef(null); // Ref untuk section flashback (buat audio ducking)
  const [showIntro, setShowIntro] = useState(true);
  const [animateExit, setAnimateExit] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState(null); // Untuk tracking video mana yang bersuara

  // --- LOGIKA AUDIO ---
  const handleEnterWebsite = () => {
    setAnimateExit(true);
    setTimeout(() => {
        setShowIntro(false);
        if (bgAudioRef.current) {
            bgAudioRef.current.volume = 0.5;
            bgAudioRef.current.play().catch(e => console.log("Audio play error:", e));
        }
    }, 1000);
  };

  // Logika Audio Ducking (Volume turun saat di Flashback)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (bgAudioRef.current) {
          if (entry.isIntersecting) {
            console.log("Di Flashback: Volume Turun");
            bgAudioRef.current.volume = 0.1; // Kecilkan volume background
          } else {
            console.log("Keluar Flashback: Volume Normal");
            bgAudioRef.current.volume = 0.5; // Normalkan volume
            setActiveVideoId(null); // Matikan semua suara video
          }
        }
      },
      { threshold: 0.2 } // Trigger saat 20% section flashback terlihat
    );

    if (flashbackSectionRef.current) {
        observer.observe(flashbackSectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const stopBgMusic = () => { if (bgAudioRef.current) bgAudioRef.current.pause(); };

  // --- NAVBAR SCROLL ---
  useEffect(() => {
    const handleScroll = () => { setScrolled(window.scrollY > 50); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  // --- STATES DATA ---
  const [students, setStudents] = useState([]);
  const [wali, setWali] = useState(null); 
  const [journey, setJourney] = useState([]); 
  const [signatures, setSignatures] = useState([]); 
  const [words, setWords] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [gallery, setGallery] = useState([]); 
  const [flashback, setFlashback] = useState([]); 

  // --- UI STATES ---
  const [searchTerm, setSearchTerm] = useState("");
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showSigModal, setShowSigModal] = useState(false); 
  const [showWordModal, setShowWordModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // --- INPUT STATES ---
  const [newSigName, setNewSigName] = useState(""); 
  const [newWordTo, setNewWordTo] = useState("");
  const [newWordMsg, setNewWordMsg] = useState("");
  const [newSongData, setNewSongData] = useState({ title: '', artist: '', spotifyId: '', requestedBy: '' });
  const [activeSong, setActiveSong] = useState({ id: "2zE01Qg5W7z9r7Xqj3Z1Z1", source: "spotify" });

  const fonts = ['font-marker', 'font-rock', 'font-caveat', 'font-shadows', 'font-dancing', 'font-indie', 'font-gloria'];
  const colors = ['text-pink-400', 'text-yellow-400', 'text-cyan-400', 'text-green-400', 'text-purple-400', 'text-red-400', 'text-white'];

  // --- LOAD DATA SUPABASE ---
  useEffect(() => {
    const fetchData = async () => {
        const get = async (table) => { const { data } = await supabase.from(table).select('*').order('id', { ascending: true }); return data || []; };

        setStudents(await get('students'));
        const w = await get('wali_kelas'); if(w && w.length > 0) setWali(w[0]);
        setJourney(await get('journey'));
        setPlaylist(await get('playlist'));
        setWords(await get('words_unsaid'));
        setGallery(await get('gallery'));
        setFlashback(await get('flashback'));
        
        const { data: sigs } = await supabase.from('signatures').select('*').order('created_at', { ascending: false });
        if (sigs) {
            const dataWithStyle = sigs.map(item => ({
                ...item,
                style: {
                    rotation: `${Math.floor(Math.random() * 40) - 20}deg`, 
                    scale: 0.9 + Math.random() * 0.3,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    font: fonts[Math.floor(Math.random() * fonts.length)],
                }
            }));
            setSignatures(dataWithStyle);
        }
    };
    fetchData();
  }, []);

  // --- HANDLERS (Sama seperti sebelumnya) ---
  const reloadWords = async () => { const { data } = await supabase.from('words_unsaid').select('*'); if(data) setWords(data); };
  const reloadPlaylist = async () => { const { data } = await supabase.from('playlist').select('*'); if(data) setPlaylist(data); };
  const reloadSignatures = async () => {
      const { data } = await supabase.from('signatures').select('*').order('created_at', { ascending: false });
      if(data) {
        const dataWithStyle = data.map(item => ({
            ...item,
            style: { rotation: `${Math.floor(Math.random() * 40) - 20}deg`, scale: 0.9 + Math.random() * 0.3, color: colors[Math.floor(Math.random() * colors.length)], font: fonts[Math.floor(Math.random() * fonts.length)] }
        }));
        setSignatures(dataWithStyle);
      }
  };

  const handleAddSignature = async (e) => { 
    e.preventDefault(); if(!newSigName.trim()) return; 
    const { error } = await supabase.from('signatures').insert([{ nama_pengirim: newSigName, pesan: "Signature Wall" }]);
    if(!error) { setNewSigName(""); setShowSigModal(false); reloadSignatures(); alert("Tanda tangan ditempel!"); } 
  };

  const handleAddWord = async (e) => { 
    e.preventDefault(); const recipient = newWordTo.trim() === "" ? "Seseorang" : newWordTo;
    const { error } = await supabase.from('words_unsaid').insert([{ untuk: recipient, pesan: newWordMsg }]);
    if(!error) { setNewWordTo(""); setNewWordMsg(""); setShowWordModal(false); reloadWords(); alert("Pesan terkirim!"); }
  };
  
  const handleAddSong = async (e) => { 
      e.preventDefault(); if(!newSongData.title || !newSongData.spotifyId) return; 
      const { error } = await supabase.from('playlist').insert([{ song_title: newSongData.title, artist: newSongData.artist, spotify_id: newSongData.spotifyId, requested_by: newSongData.requestedBy }]);
      if(!error) { setNewSongData({ title: '', artist: '', spotifyId: '', requestedBy: '' }); setShowMusicModal(false); reloadPlaylist(); alert("Lagu direquest!"); }
  };

  const searchMusic = (platform) => {
      const query = encodeURIComponent(`${newSongData.title} ${newSongData.artist}`);
      if (!newSongData.title) return alert("Isi Judul lagu dulu!");
      if (platform === 'spotify') window.open(`https://open.spotify.com/search/${query}`, '_blank');
      else window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  return (
    <div className="bg-[#051125] min-h-screen text-white font-sans relative overflow-x-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Dancing+Script:wght@700&family=Gloria+Hallelujah&family=Indie+Flower&family=Permanent+Marker&family=Rock+Salt&family=Shadows+Into+Light&display=swap');
        .font-marker { font-family: 'Permanent Marker', cursive; } .font-rock { font-family: 'Rock Salt', cursive; } .font-caveat { font-family: 'Caveat', cursive; } .font-shadows { font-family: 'Shadows Into Light', cursive; } .font-dancing { font-family: 'Dancing Script', cursive; } .font-indie { font-family: 'Indie Flower', cursive; } .font-gloria { font-family: 'Gloria Hallelujah', cursive; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: #0f1f3b; border-radius: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #EAB308, #CA8A04); border-radius: 4px; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } } .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-scroll { display: flex; width: max-content; animation: scroll 40s linear infinite; } .animate-scroll:hover { animation-play-state: paused; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fadeInUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } } .animate-zoom-in { animation: zoomIn 0.3s ease-out forwards; }
        @keyframes twinkling { 0% { opacity: 0.2; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.2; transform: scale(1); } } .star { position: absolute; background: white; border-radius: 50%; animation: twinkling infinite ease-in-out; }
        @keyframes grain { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-5%, -10%); } 20% { transform: translate(-15%, 5%); } 30% { transform: translate(7%, -25%); } 40% { transform: translate(-5%, 25%); } 50% { transform: translate(-15%, 10%); } 60% { transform: translate(15%, 0%); } 70% { transform: translate(0%, 15%); } 80% { transform: translate(3%, 35%); } 90% { transform: translate(-10%, 10%); } } .bg-grain::after { content: ""; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E"); animation: grain 8s steps(10) infinite; pointer-events: none; z-index: 1; opacity: 0.4; }
      `}</style>

      {/* BACKGROUND & AUDIO */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-grain">
         {[...Array(20)].map((_, i) => ( <div key={i} className="star" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`, animationDuration: `${Math.random() * 3 + 2}s`, animationDelay: `${Math.random() * 2}s` }}></div> ))}
         <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full animate-float"></div>
         <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-900/10 blur-[150px] rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      <audio ref={bgAudioRef} src="/backsound.mp3" loop />

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#051125]/80 backdrop-blur-md shadow-lg py-3 border-b border-white/5' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
                <span className="text-2xl">🎓</span><span className="font-serif font-bold text-yellow-500 tracking-widest text-lg md:text-xl">RENAISSANS</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-gray-300">
                <button onClick={() => scrollToSection('students')} className="hover:text-yellow-500 transition">Siswa</button>
                <button onClick={() => scrollToSection('gallery')} className="hover:text-yellow-500 transition">Gallery</button>
                <button onClick={() => scrollToSection('journey')} className="hover:text-yellow-500 transition">Journey</button>
                <button onClick={() => scrollToSection('flashback')} className="hover:text-yellow-500 transition">Flashback</button>
            </div>
            {/* Tombol Admin DIHAPUS sesuai request */}
            <div className="w-8"></div> 
        </div>
      </nav>

      {/* INTRO SCREEN */}
      {showIntro && (
        <div className={`fixed inset-0 z-[9999] bg-[#020a1a] flex flex-col items-center justify-center text-center p-4 transition-all duration-1000 ${animateExit ? 'opacity-0 scale-110' : 'opacity-100'}`}>
           <div className="mb-8 relative animate-float">
                <div className="absolute inset-0 bg-yellow-500 blur-[80px] opacity-20"></div>
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-tr from-yellow-600 to-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)] relative z-10 border-4 border-yellow-200/20"><span className="text-5xl">🎓</span></div>
           </div>
           <h1 className="text-4xl md:text-7xl font-serif text-white font-bold mb-4 tracking-widest animate-fade-in-up">RENAISSANS</h1>
           <p className="text-yellow-500/80 mb-12 text-sm tracking-[0.5em] uppercase font-bold animate-pulse">Class of Memories</p>
           <button onClick={handleEnterWebsite} className="group relative px-12 py-5 bg-transparent border border-yellow-500 text-yellow-500 text-sm font-bold uppercase tracking-[0.2em] rounded-full overflow-hidden hover:text-black transition-all duration-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_60px_rgba(234,179,8,0.8)] hover:scale-105"><span className="absolute inset-0 w-full h-full bg-yellow-500/0 group-hover:bg-yellow-500 transition-all duration-500 ease-out"></span><span className="relative flex items-center gap-3"><span>Buka Album</span><span className="group-hover:translate-x-1 transition-transform">▶</span></span></button>
           <p className="absolute bottom-10 text-gray-600 text-[10px] animate-bounce">Tap to Start Experience 🎧</p>
        </div>
      )}

      {/* HERO SECTION */}
      <header id="hero" className="text-center pt-32 pb-16 px-4 relative overflow-hidden z-10">
          <div className="relative z-10 flex flex-col items-center justify-center mb-8 group animate-fade-in-up">
             <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full bg-[#0a1529] border-4 border-yellow-500/50 shadow-[0_0_60px_rgba(234,179,8,0.4)] flex items-center justify-center animate-float group-hover:scale-105 transition duration-500 overflow-hidden"><img src="logo.png" alt="Logo" className="w-full h-full object-cover p-2 rounded-full opacity-90 group-hover:opacity-100 transition"/></div>
             <div className="mt-4 bg-gradient-to-r from-yellow-700 to-yellow-500 text-black text-[10px] md:text-xs font-bold px-6 py-1 rounded-full tracking-[0.2em] uppercase shadow-lg transform -translate-y-4 group-hover:-translate-y-2 transition duration-300">Est. 2024</div>
          </div>
          <h1 className="text-4xl md:text-7xl font-serif text-yellow-500 font-bold mb-4 tracking-wider relative z-10 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <TypeAnimation sequence={['CLASS OF MEMORIES', 1000, 'OUR BEST MOMENTS', 1000, 'FOREVER YOUNG', 1000]} wrapper="span" speed={50} repeat={Infinity} cursor={true}/>
          </h1>
          <p className="text-gray-400 italic text-lg relative z-10 animate-fade-in-up" style={{animationDelay: '0.6s'}}>"Kenangan berlalu, tapi jejaknya abadi."</p>
      </header>

      {/* WORDS UNSAID */}
      <section id="words" className="max-w-6xl mx-auto px-6 mb-24 relative z-10 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
          <div className="text-center mb-10">
              <h3 className="text-yellow-500 font-serif text-2xl tracking-[0.2em] uppercase">Words Unsaid</h3>
              <p className="text-gray-400 text-sm mt-2 italic">"Apa yang ingin kau sampaikan?"</p>
              <button onClick={() => setShowWordModal(true)} className="mt-6 bg-yellow-500 text-black px-6 py-2 rounded-full font-bold hover:shadow-[0_0_20px_rgba(234,179,8,0.6)] hover:scale-105 transition text-xs uppercase tracking-wider flex items-center gap-2 mx-auto"><span>✉️</span> Titip Pesan</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {words.length === 0 ? (<div className="col-span-3 text-center text-gray-500 italic py-10 bg-[#112240]/30 rounded backdrop-blur-sm">Belum ada pesan. Jadilah yang pertama!</div>) : (words.map((word) => (<div key={word.id} className="bg-[#112240]/80 backdrop-blur-md p-6 rounded-tr-3xl rounded-bl-3xl border-l-4 border-yellow-500 relative hover:-translate-y-2 hover:shadow-2xl hover:bg-[#1a2e52] transition duration-500 group"><span className="text-6xl text-yellow-500/20 font-serif absolute top-2 right-4 group-hover:text-yellow-500/40 transition">"</span><p className="text-gray-300 italic mb-4 leading-relaxed line-clamp-3 group-hover:text-white transition">"{word.pesan}"</p><div className="flex items-center gap-3 mt-4 border-t border-white/5 pt-4"><div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-bold text-xs">?</div><div><p className="text-white text-sm font-bold">To: {word.untuk}</p><p className="text-gray-500 text-[10px] uppercase">Secret Message</p></div></div></div>)))}
          </div>
      </section>

      {/* GURU */}
      <section className="max-w-4xl mx-auto mb-16 px-6 relative z-10">
        <div className="relative bg-[#0a192f]/80 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-[0_0_30px_rgba(234,179,8,0.1)] hover:shadow-[0_0_50px_rgba(234,179,8,0.3)] transition duration-500 group">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-6 py-1 font-bold tracking-widest text-xs rounded-full uppercase shadow-lg">Wali Kelas</div>
            <div className="w-40 h-40 md:w-48 md:h-48 shrink-0 rounded-full border-4 border-yellow-500 overflow-hidden shadow-2xl group-hover:scale-105 transition duration-500">
                {wali && wali.foto_url ? (<img src={`${STORAGE_URL}/${wali.foto_url}`} alt="Guru" className="w-full h-full object-cover object-top"/>) : (<div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs">NO FOTO</div>)}
            </div>
            <div className="text-center md:text-left"><h2 className="text-3xl font-serif text-white font-bold mb-2 group-hover:text-yellow-400 transition">Bapak/Ibu Guru</h2><p className="text-yellow-500 mb-4 font-bold tracking-widest">{wali ? wali.nama : 'Loading...'}</p><blockquote className="text-gray-300 italic text-sm md:text-base border-l-4 border-yellow-500/30 pl-4">"{wali ? wali.quote : 'Loading...'}"</blockquote></div>
        </div>
      </section>

      {/* GRID SISWA */}
      <div id="students" className="max-w-xl mx-auto px-6 mb-12 sticky top-20 z-40">
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
            <div className="relative"><input type="text" placeholder="Cari nama teman..." className="w-full bg-[#0f2545]/90 backdrop-blur border border-white/10 rounded-full py-4 px-8 text-white outline-none focus:border-yellow-500 transition shadow-2xl placeholder-gray-500" onChange={(e) => setSearchTerm(e.target.value)} /><span className="absolute right-6 top-4 text-xl opacity-50 animate-pulse">🔍</span></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-6 md:px-16 pb-20 relative z-10">
        {students.filter((val) => { if (searchTerm === "") return val; else if (val.nama.toLowerCase().includes(searchTerm.toLowerCase())) return val; return null; }).map((student) => (
            <div key={student.id} className="bg-[#0a192f] rounded-xl overflow-hidden border border-white/5 hover:border-yellow-500 transition duration-500 hover:-translate-y-3 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] group relative flex flex-col">
                <div className="h-80 w-full relative overflow-hidden bg-black">
                    {student.foto_url ? (
                        <>{/* Layer 1: Background Blur */}<div className="absolute inset-0 bg-cover bg-center blur-xl opacity-60 scale-110" style={{ backgroundImage: `url(${STORAGE_URL}/${student.foto_url})` }}></div>
                        {/* Layer 2: Foto Asli */}<img src={`${STORAGE_URL}/${student.foto_url}`} alt={student.nama} className="relative w-full h-full object-contain z-10 transition-transform duration-500 group-hover:scale-105"/></>
                    ) : (<div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-500">NO PHOTO</div>)}
                    <div className="absolute top-3 right-3 z-20"><span className="bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-lg transform scale-90 group-hover:scale-100 transition">{student.jabatan}</span></div>
                </div>
                <div className="p-6 relative z-20 bg-[#0a192f]"><h2 className="text-xl font-serif font-bold text-white mb-1 truncate group-hover:text-yellow-400 transition">{student.nama}</h2>{student.instagram ? (<a href={`https://instagram.com/${student.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 text-xs mb-3 flex items-center gap-2 hover:text-white transition group/link"><span className="group-hover/link:animate-spin">📸</span> {student.instagram}</a>) : (<p className="text-gray-600 text-xs mb-3">-</p>)}<div className="w-full h-[1px] bg-white/10 mt-3 group-hover:bg-yellow-500/50 transition"></div></div>
            </div>
        ))}
      </div>

      {/* CAPTURED MOMENTS */}
      <section id="gallery" className="mb-0 pb-0 overflow-hidden relative z-10">
        <div className="text-center mb-8"><h3 className="text-yellow-500 font-serif text-2xl tracking-[0.2em] uppercase">Captured Moments</h3></div>
        <div className="border-t-4 border-b-4 border-yellow-600 bg-black/50 py-8 rotate-1 shadow-2xl mb-12 overflow-hidden backdrop-blur-sm">
            <div className="animate-scroll flex gap-8">
                {gallery.length === 0 ? (<div className="w-full text-center text-gray-500 py-10 min-w-full">Belum ada foto kenangan. Upload di Admin!</div>) : ([...gallery, ...gallery, ...gallery].map((item, index) => (
                    <div key={index} onClick={() => setSelectedImage(item)} className="w-72 h-48 shrink-0 rounded-lg overflow-hidden border-2 border-white/20 relative group cursor-pointer hover:border-yellow-500 transition duration-300 hover:scale-105 shadow-xl"><img src={`${STORAGE_URL}/${item.image_url}`} alt={item.caption} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700"/><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center"><p className="text-white text-xs font-bold uppercase tracking-wider px-2 text-center transform translate-y-4 group-hover:translate-y-0 transition duration-500">🔍 Lihat Foto</p></div></div>
                )))}
            </div>
        </div>
      </section>

      {/* OUR JOURNEY */}
      <section id="journey" className="py-20 px-6 max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16"><h3 className="text-yellow-500 font-serif text-2xl tracking-[0.2em] uppercase mb-2">Our Journey</h3><div className="w-24 h-1 bg-yellow-500 mx-auto rounded-full animate-pulse"></div></div>
        <div className="relative border-l-2 border-yellow-500/30 ml-4 md:ml-1/2 space-y-12">{journey.map((item, index) => (<div key={item.id} className="relative pl-8 md:pl-0 group"><div className="absolute top-0 -left-[9px] md:left-1/2 md:-ml-[9px] w-5 h-5 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.8)] border-4 border-[#051125] group-hover:scale-125 transition duration-300 z-20"></div><div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right md:ml-0' : 'md:ml-auto md:pl-12'}`}><span className={`text-yellow-500 font-bold text-6xl opacity-10 absolute -top-10 z-0 group-hover:opacity-30 transition duration-500 ${index % 2 === 0 ? 'left-0 md:right-10' : 'left-10'}`}>{index + 1}</span><div className="relative z-10 bg-[#0a192f] p-6 rounded-xl border border-white/5 hover:border-yellow-500/50 transition duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] hover:-translate-y-1"><h4 className="text-xl font-bold text-white mb-2">{item.judul}</h4><span className="text-xs text-yellow-500 uppercase tracking-widest mb-4 block">{item.tahun}</span><p className="text-gray-400 text-sm leading-relaxed">{item.deskripsi}</p></div></div></div>))}</div>
      </section>

      {/* FLASHBACK (DENGAN SMART AUTOPLAY & DUCKING) */}
      <section id="flashback" ref={flashbackSectionRef} className="py-24 px-4 overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center mb-16 relative z-10"><h3 className="text-5xl md:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-800 opacity-80 tracking-tighter animate-float">FLASHBACK</h3><p className="text-white/40 text-sm tracking-[0.5em] uppercase -mt-4 bg-[#051125] px-4">Hover/Click to Unmute</p></div>
            
            {/* Horizontal Flex Expand Layout (Original Design) */}
            <div className="flex flex-col md:flex-row gap-4 h-[600px] w-full">
                {flashback.map((item) => (
                    <FlashbackItem 
                        key={item.id} 
                        item={item} 
                        activeVideoId={activeVideoId} 
                        setActiveVideoId={setActiveVideoId} 
                        STORAGE_URL={STORAGE_URL}
                    />
                ))}
            </div>
        </div>
      </section>

      {/* SIGNATURE WALL */}
      <section className="py-20 px-6 relative overflow-hidden bg-[#051125] z-10"><div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/black-chalk.png')]"></div><div className="max-w-6xl mx-auto relative z-10"><div className="text-center mb-12"><h3 className="text-yellow-500 font-serif text-2xl tracking-[0.3em] uppercase mb-4">Leave Your Mark</h3><h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">THE SIGNATURE WALL</h2></div><div className="bg-[#0f1f3b]/80 backdrop-blur border-4 border-gray-800 rounded-3xl p-8 relative shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] h-[600px]"><div className="h-full overflow-y-auto custom-scrollbar flex flex-wrap justify-center content-start gap-12 p-10 pb-24">{signatures.map((sign) => (<div key={sign.id} className={`cursor-default select-none group transition duration-500 hover:scale-150 transform hover:z-50`} style={{ transform: `rotate(${sign.style?.rotation || '0deg'}) scale(${sign.style?.scale || 1})` }}><span className={`${sign.style?.font || 'font-marker'} text-3xl md:text-5xl ${sign.style?.color || 'text-white'} opacity-90 group-hover:opacity-100 transition duration-300 drop-shadow-md`}>{sign.nama_pengirim}</span></div>))}</div><div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"><button onClick={() => setShowSigModal(true)} className="border-2 border-dashed border-gray-500 rounded-lg px-6 py-3 text-gray-400 font-bold hover:text-yellow-500 hover:border-yellow-500 hover:bg-yellow-500/10 transition flex items-center gap-2 backdrop-blur-sm bg-black/60 shadow-xl hover:scale-105 transform"><span>+</span> Add Yours</button></div></div></div></section>

      {/* JUKEBOX */}
      <section className="py-24 px-6 bg-[#0a192f] relative overflow-hidden z-10"><div className="text-center mb-16 relative z-10"><h3 className="text-yellow-500 font-serif text-4xl tracking-widest uppercase">Our Soundtrack</h3><button onClick={() => setShowMusicModal(true)} className="mt-6 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold text-sm transition shadow-[0_0_20px_rgba(29,185,84,0.4)] hover:scale-105 flex items-center gap-2 mx-auto"><span>➕</span> Request Lagu</button></div><div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-start relative z-10"><div className="w-full lg:w-1/3 sticky top-10"><div className="relative group p-4 bg-gray-900 rounded-3xl border-4 border-gray-800 shadow-2xl"><div className="rounded-xl overflow-hidden shadow-[0_0_30px_rgba(29,185,84,0.3)] bg-black h-[352px] flex items-center justify-center">{activeSong.source === 'youtube' ? (<iframe style={{borderRadius: "12px"}} width="100%" height="352" src={`https://www.youtube.com/embed/${activeSong.id}?autoplay=1`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>) : (<iframe style={{borderRadius: "12px"}} src={`https://open.spotify.com/embed/track/${activeSong.id}?utm_source=generator&theme=0`} width="100%" height="352" frameBorder="0" allowFullScreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>)}</div></div></div><div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">{playlist.map((item) => (<div key={item.id} onClick={() => { stopBgMusic(); setActiveSong({ id: item.spotify_id, source: item.source || 'spotify' }); }} className="flex items-center gap-4 bg-[#112240] p-4 rounded-xl border border-white/5 hover:border-yellow-500 hover:bg-[#1a2e52] cursor-pointer transition-all duration-300 group shadow-lg hover:-translate-x-1 hover:-translate-y-1"><div className="relative w-16 h-16 flex-shrink-0"><div className={`w-full h-full rounded-full border-2 border-yellow-500 flex items-center justify-center text-2xl group-hover:rotate-12 transition ${item.source === 'youtube' ? 'bg-red-600' : 'bg-green-600'}`}>{item.source === 'youtube' ? '▶️' : '🎵'}</div></div><div className="flex-1 overflow-hidden"><h4 className="text-white font-bold truncate text-lg">{item.song_title}</h4><p className="text-gray-400 text-sm truncate">{item.artist}</p><p className="text-xs text-gray-500 italic mt-1 truncate">Req by: <span className="text-yellow-500">{item.requested_by}</span></p></div></div>))}</div></div></section>

      {/* TIME CAPSULE */}
      <section className="py-24 px-6 relative overflow-hidden z-10"><div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12"><div className="w-full md:w-1/2 text-left animate-fade-in-up"><h3 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">Time <br/> Capsule.</h3><p className="text-gray-400 text-lg mb-8 leading-relaxed">Tulis pesan untuk dirimu di masa depan. Pesan ini akan terkunci sampai kita bertemu lagi.</p></div><div className="w-full md:w-1/2"><TimeCapsuleForm /></div></div></section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#020a1a] pt-16 pb-8 mt-12 relative z-10">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              <div><h4 className="text-yellow-500 font-serif font-bold text-xl mb-4">RENAISSANS</h4><p className="text-gray-400 text-sm leading-relaxed">Sebuah ruang digital untuk menyimpan kenangan, tawa, dan cerita kita bersama.</p></div>
              <div><h4 className="text-white font-bold text-lg mb-4">Navigasi</h4><ul className="space-y-2 text-sm text-gray-400"><li><button onClick={() => scrollToSection('students')} className="hover:text-yellow-500 transition">Data Siswa</button></li><li><button onClick={() => scrollToSection('gallery')} className="hover:text-yellow-500 transition">Galeri Foto</button></li><li><button onClick={() => scrollToSection('flashback')} className="hover:text-yellow-500 transition">Flashback Video</button></li></ul></div>
              <div><h4 className="text-white font-bold text-lg mb-4">Created By</h4><p className="text-gray-400 text-sm">Divisi IT & Multimedia</p><p className="text-gray-500 text-xs mt-2">© 2024 Class of Memories</p></div>
          </div>
          <div className="mt-12 text-center border-t border-white/5 pt-8"><p className="text-white/20 text-xs tracking-[0.3em] uppercase">See You On Top</p></div>
      </footer>

      {/* --- LIGHTBOX MODAL --- */}
      {selectedImage && (
        <div className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in" onClick={() => setSelectedImage(null)}>
           <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 text-white/50 hover:text-white text-5xl transition z-50">×</button>
           <div className="max-w-5xl w-full max-h-screen p-4 relative flex flex-col items-center animate-zoom-in" onClick={(e) => e.stopPropagation()}>
               <div className="relative shadow-[0_0_50px_rgba(255,255,255,0.1)] rounded-lg overflow-hidden border border-white/10"><img src={`${STORAGE_URL}/${selectedImage.image_url}`} className="max-w-full max-h-[80vh] object-contain" alt="Full Preview" /></div>
               {selectedImage.caption && (<p className="text-center text-white text-lg font-serif italic mt-6 bg-black/50 px-6 py-2 rounded-full border border-white/10">"{selectedImage.caption}"</p>)}
           </div>
        </div>
      )}

      {/* MODALS */}
      {showSigModal && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up"><div className="bg-[#0f2545] p-8 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl relative"><button onClick={() => setShowSigModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button><h3 className="text-2xl font-bold text-yellow-500 mb-2 font-serif">Tinggalkan Jejak!</h3><form onSubmit={handleAddSignature} className="space-y-4"><input type="text" value={newSigName} onChange={(e) => setNewSigName(e.target.value)} placeholder="Ketik namamu..." maxLength={15} autoFocus className="w-full bg-[#0a192f] text-white p-4 rounded-lg border border-white/10 focus:border-yellow-500 outline-none text-center text-xl font-bold" /><button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg hover:shadow-lg hover:scale-105 transition">Tempel di Dinding 📌</button></form></div></div>)}
      {showWordModal && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up"><div className="bg-[#0f2545] p-8 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl relative"><button onClick={() => setShowWordModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button><h3 className="text-2xl font-bold text-yellow-500 mb-2 font-serif">Titip Pesan</h3><form onSubmit={handleAddWord} className="space-y-4"><input type="text" value={newWordTo} onChange={(e) => setNewWordTo(e.target.value)} placeholder="Untuk Siapa? (Boleh Kosong)" className="w-full bg-[#0a192f] text-white p-3 rounded-lg border border-white/10 focus:border-yellow-500 outline-none" /><textarea value={newWordMsg} onChange={(e) => setNewWordMsg(e.target.value)} placeholder="Pesanmu..." rows="4" className="w-full bg-[#0a192f] text-white p-3 rounded-lg border border-white/10 focus:border-yellow-500 outline-none resize-none" required /><button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg hover:scale-105 transition">Kirim Pesan 💌</button></form></div></div>)}
      {showMusicModal && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up"><div className="bg-[#0f2545] p-8 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl relative"><button onClick={() => setShowMusicModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button><h3 className="text-2xl font-bold text-yellow-500 mb-2 font-serif">Request Soundtrack</h3><form onSubmit={handleAddSong} className="space-y-3"><input type="text" placeholder="Nama Kamu" value={newSongData.requestedBy} onChange={e => setNewSongData({...newSongData, requestedBy: e.target.value})} className="w-full bg-[#0a192f] text-white p-3 rounded-lg border border-white/10 focus:border-yellow-500 outline-none" required /><div className="w-full h-[1px] bg-white/10 my-2"></div><input type="text" placeholder="Judul Lagu" value={newSongData.title} onChange={e => setNewSongData({...newSongData, title: e.target.value})} className="w-full bg-[#0a192f] text-white p-3 rounded-lg border border-white/10 focus:border-yellow-500 outline-none" required /><input type="text" placeholder="Nama Artis" value={newSongData.artist} onChange={e => setNewSongData({...newSongData, artist: e.target.value})} className="w-full bg-[#0a192f] text-white p-3 rounded-lg border border-white/10 focus:border-yellow-500 outline-none" required /><div className="flex gap-2 text-xs"><button type="button" onClick={() => searchMusic('spotify')} className="flex-1 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white py-2 rounded transition border border-green-600/50">🔍 Cari di Spotify</button><button type="button" onClick={() => searchMusic('youtube')} className="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-2 rounded transition border border-red-600/50">🔍 Cari di YouTube</button></div><input type="text" placeholder="Paste Link Spotify / YouTube..." value={newSongData.spotifyId} onChange={e => setNewSongData({...newSongData, spotifyId: e.target.value})} className="w-full bg-[#0a192f] text-white p-3 rounded-lg border border-white/10 focus:border-yellow-500 outline-none text-xs font-mono" required /><button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg hover:scale-105 transition">Tambahkan ke Playlist 🎵</button></form></div></div>)}

    </div>
  );
};

export default Home;