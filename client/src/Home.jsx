import React, { useState, useEffect, useRef } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { supabase } from './supabaseClient'; 

// --- 1. KOMPONEN PINTAR: VIDEO (LOGIC TIKTOK STYLE) ---
// Video ini melapor ke "pusat" kalau dia lagi dilihat, biar yang lain diam.
const SmartVideo = ({ id, url, title, activeVideoId, setActiveVideoId }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  // Cek apakah video ini yang harus bersuara?
  useEffect(() => {
    if (activeVideoId === id) {
      setIsMuted(false); // Kalau saya aktif, nyalakan suara
    } else {
      setIsMuted(true); // Kalau bukan saya, bisukan
    }
  }, [activeVideoId, id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!videoRef.current) return;

        // Logic Autoplay
        if (entry.isIntersecting) {
          videoRef.current.play().catch(() => {});
          
          // Logic Fokus: Kalau video terlihat lebih dari 60% di layar,
          // jadikan dia sebagai "Active Video" (biar dia doang yang bunyi)
          if (entry.intersectionRatio > 0.6) {
             setActiveVideoId(id);
          }
        } else {
          videoRef.current.pause();
        }
      },
      { threshold: 0.7 } // Harus 70% terlihat baru dianggap "Fokus"
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [id, setActiveVideoId]);

  return (
    <div className={`min-w-[280px] md:min-w-[400px] aspect-video rounded-xl overflow-hidden border relative bg-black group shadow-2xl mx-2 transition-all duration-500 ${activeVideoId === id ? 'border-yellow-500 scale-105 z-10' : 'border-white/10 scale-100 opacity-60'}`}>
      <video 
        ref={videoRef} 
        src={url} 
        muted={isMuted} 
        loop 
        playsInline 
        className="w-full h-full object-cover" 
      />
      
      {/* Judul */}
      <div className="absolute top-2 left-2 bg-black/60 px-3 py-1 rounded text-white text-xs font-bold border border-white/10 backdrop-blur-sm z-10">
        {title}
      </div>

      {/* Indikator Suara */}
      <div className="absolute bottom-4 right-4 bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg z-20 transition-all">
        {isMuted ? "🔇" : "🔊"}
      </div>
    </div>
  );
};

// --- 2. KOMPONEN TIME CAPSULE FORM ---
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
        if (existingData.length > 0) { alert("Kode sudah dipakai, ganti yang lain!"); setLoading(false); return; }
        const { error: insertError } = await supabase.from('time_capsules').insert([{ sender_name: formData.name, message: formData.message, unlock_date: formData.date, secret_key: formData.customCode }]);
        if (insertError) throw insertError;
        setFinalCode(formData.customCode); setStep('result');
    } catch (err) { alert("Gagal mengunci pesan."); } finally { setLoading(false); }
  };

  const handleOpenCapsule = async (e) => {
      e.preventDefault(); setLoading(true); setOpenResult(null);
      try {
          const { data, error } = await supabase.from('time_capsules').select('*').eq('secret_key', inputKey).maybeSingle();
          if (error) throw error;
          if (!data) { setOpenResult({ status: 'NotFound' }); } 
          else {
              const today = new Date().toISOString().split('T')[0];
              if (data.unlock_date > today) { setOpenResult({ status: 'Locked', message: `Baru bisa dibuka tanggal ${data.unlock_date}`, sender: data.sender_name }); } 
              else { setOpenResult({ status: 'Unlocked', data: data }); }
          }
      } catch (err) { alert("Error membuka kapsul."); } finally { setLoading(false); }
  };

  if (step === 'result') {
    return (
      <div className="bg-gradient-to-br from-[#0f1f3b] to-[#0a1529] border border-green-500/30 p-8 rounded-2xl text-center shadow-2xl h-full flex flex-col justify-center items-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 text-3xl animate-bounce">🔒</div>
        <h3 className="text-xl font-bold text-white mb-2">Berhasil Dikunci!</h3>
        <p className="text-gray-400 text-sm mb-4">Simpan kode rahasia ini:</p>
        <div className="bg-black/40 border-2 border-dashed border-yellow-500 p-4 rounded-lg mb-6 w-full cursor-pointer" onClick={() => {navigator.clipboard.writeText(finalCode); alert("Kode disalin!");}}>
            <h2 className="text-3xl font-mono font-bold text-yellow-500 tracking-widest uppercase">{finalCode}</h2>
        </div>
        <button onClick={() => {setStep('form'); setFormData({name:'', message:'', date:'', customCode:''});}} className="text-sm text-green-500 underline">Tulis pesan baru</button>
      </div>
    );
  }

  if (step === 'open') {
      return (
        <div className="bg-[#0f1f3b] border border-white/10 p-8 rounded-2xl shadow-xl h-full flex flex-col relative min-h-[400px]">
            <button onClick={() => {setStep('form'); setOpenResult(null);}} className="absolute top-4 left-4 text-gray-400 hover:text-white">← Kembali</button>
            {!openResult ? (
                <div className="flex-1 flex flex-col justify-center pt-10">
                    <h3 className="text-2xl font-bold text-yellow-500 mb-6 text-center">Buka Kapsul</h3>
                    <form onSubmit={handleOpenCapsule} className="space-y-4">
                        <input type="text" placeholder="Masukkan Kodemu..." value={inputKey} onChange={e => setInputKey(e.target.value)} className="w-full bg-black/30 border border-white/20 p-4 rounded-lg text-center text-xl font-bold text-white uppercase tracking-widest outline-none focus:border-yellow-500" required />
                        <button disabled={loading} className="w-full bg-yellow-500 text-black font-bold py-3 rounded-lg hover:bg-yellow-400 transition">{loading ? "Mengecek..." : "BUKA 🔓"}</button>
                    </form>
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-center text-center pt-10">
                    {openResult.status === 'Unlocked' ? (
                        <div className="animate-zoom-in">
                            <p className="text-gray-400 text-xs mb-2">Pesan dari masa lalu:</p>
                            <div className="bg-white/10 p-6 rounded-xl border border-white/20 mb-4 relative">
                                <span className="absolute -top-3 left-4 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded">DARI: {openResult.data.sender_name}</span>
                                <p className="text-xl font-serif italic text-white leading-relaxed">"{openResult.data.message}"</p>
                            </div>
                        </div>
                    ) : openResult.status === 'Locked' ? (
                        <div><div className="text-5xl mb-4">⏳</div><h3 className="text-red-400 font-bold mb-2">BELUM WAKTUNYA!</h3><p className="text-gray-300">{openResult.message}</p></div>
                    ) : (
                        <div><div className="text-5xl mb-4">❌</div><h3 className="text-gray-400 font-bold">Kode Salah</h3></div>
                    )}
                    <button onClick={() => setOpenResult(null)} className="mt-6 text-yellow-500 underline text-sm">Coba lagi</button>
                </div>
            )}
        </div>
      );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-xl h-full flex flex-col min-h-[400px]">
        <div className="flex justify-between items-center mb-6"><h4 className="font-bold text-white">Buat Kapsul Baru</h4><button onClick={() => setStep('open')} className="text-[10px] bg-white/10 px-3 py-1 rounded border border-white/20">PUNYA KODE?</button></div>
        <form onSubmit={handleLockMessage} className="space-y-4 flex-1 flex flex-col">
            <input type="text" placeholder="Namamu..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full bg-[#050b14]/80 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-yellow-500" />
            <input type="text" placeholder="Kode Rahasia (cth: ALUMNI2024)" value={formData.customCode} onChange={e => setFormData({...formData, customCode: e.target.value})} required className="w-full bg-[#050b14]/80 border border-white/10 rounded-lg px-4 py-3 text-yellow-500 font-bold uppercase outline-none focus:border-yellow-500" />
            <textarea rows="3" placeholder="Pesan untuk masa depan..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required className="w-full bg-[#050b14]/80 border border-white/10 rounded-lg px-4 py-3 text-white outline-none resize-none flex-1 focus:border-yellow-500"></textarea>
            <div className="bg-[#050b14]/80 p-3 rounded-lg border border-white/10"><label className="block text-gray-500 text-[10px] uppercase font-bold mb-1">Bisa dibuka pada:</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className="w-full bg-transparent text-white outline-none cursor-pointer" /></div>
            <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg shadow-lg flex justify-center items-center gap-2">{loading ? "Menyimpan..." : "Kunci Pesan 🔒"}</button>
        </form>
    </div>
  );
};

// --- 3. KOMPONEN UTAMA HOME ---
const Home = () => {
  const STORAGE_URL = 'https://fjagcvvlfaarxjitdbsy.supabase.co/storage/v1/object/public/public-files';
  
  const bgAudioRef = useRef(null);
  const flashbackSectionRef = useRef(null); // Ref untuk section flashback
  
  const [showIntro, setShowIntro] = useState(true);
  const [animateExit, setAnimateExit] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false); 
  
  // State untuk melacak video mana yang sedang aktif (bersuara)
  const [activeVideoId, setActiveVideoId] = useState(null);

  const handleEnterWebsite = () => {
    setAnimateExit(true);
    setContentLoaded(true);
    setTimeout(() => {
        setShowIntro(false);
        if (bgAudioRef.current) {
            bgAudioRef.current.volume = 0.5;
            bgAudioRef.current.play().catch(e => console.log("Audio play error:", e));
        }
    }, 1000);
  };

  const stopBgMusic = () => { if (bgAudioRef.current) bgAudioRef.current.pause(); };

  // --- LOGIC: AUDIO DUCKING (Backsound mengecil pas Flashback) ---
  useEffect(() => {
    const observer = new IntersectionObserver(
        ([entry]) => {
            if (bgAudioRef.current) {
                if (entry.isIntersecting) {
                    // Masuk Flashback: Kecilin Volume Backsound
                    console.log("Masuk Flashback: Volume Backsound Turun");
                    bgAudioRef.current.volume = 0.1; 
                } else {
                    // Keluar Flashback: Volume Normal Lagi
                    console.log("Keluar Flashback: Volume Backsound Naik");
                    bgAudioRef.current.volume = 0.5;
                    setActiveVideoId(null); // Reset video aktif biar gak ada yang bunyi
                }
            }
        },
        { threshold: 0.3 } // 30% section flashback masuk layar, trigger logic ini
    );

    if (flashbackSectionRef.current) {
        observer.observe(flashbackSectionRef.current);
    }
    return () => observer.disconnect();
  }, [contentLoaded]); // Jalankan ulang kalau konten sudah dimuat

  useEffect(() => {
    const handleScroll = () => { setScrolled(window.scrollY > 50); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  // --- DATA STATES ---
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
  const [newSigName, setNewSigName] = useState(""); 
  const [newWordTo, setNewWordTo] = useState("");
  const [newWordMsg, setNewWordMsg] = useState("");
  const [newSongData, setNewSongData] = useState({ title: '', artist: '', spotifyId: '', requestedBy: '' });

  const fonts = ['font-marker', 'font-rock', 'font-caveat', 'font-shadows', 'font-dancing', 'font-indie', 'font-gloria'];
  const colors = ['text-pink-400', 'text-yellow-400', 'text-cyan-400', 'text-green-400', 'text-purple-400', 'text-red-400', 'text-white'];

  useEffect(() => {
    const fetchData = async () => {
        const [sData, wData, jData, pData, wdData, gData, fData, sigData] = await Promise.all([
            supabase.from('students').select('*').order('id'),
            supabase.from('wali_kelas').select('*').limit(1),
            supabase.from('journey').select('*').order('id'),
            supabase.from('playlist').select('*').order('id', {ascending: false}),
            supabase.from('words_unsaid').select('*').order('id', {ascending: false}),
            supabase.from('gallery').select('*').order('created_at', {ascending: false}),
            supabase.from('flashback').select('*').order('created_at', {ascending: false}),
            supabase.from('signatures').select('*').order('created_at', {ascending: false})
        ]);

        if(sData.data) setStudents(sData.data);
        if(wData.data && wData.data.length > 0) setWali(wData.data[0]);
        if(jData.data) setJourney(jData.data);
        if(pData.data) setPlaylist(pData.data);
        if(wdData.data) setWords(wdData.data);
        if(gData.data) setGallery(gData.data);
        if(fData.data) setFlashback(fData.data);
        
        if (sigData.data) {
            const dataWithStyle = sigData.data.map(item => ({
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

  const handleAddSignature = async (e) => { 
    e.preventDefault(); if(!newSigName.trim()) return; 
    const { error } = await supabase.from('signatures').insert([{ nama_pengirim: newSigName, pesan: "Signature Wall" }]);
    if(!error) { setNewSigName(""); setShowSigModal(false); alert("Tanda tangan ditempel!"); } 
  };

  const handleAddWord = async (e) => { 
    e.preventDefault(); const recipient = newWordTo.trim() === "" ? "Seseorang" : newWordTo;
    const { error } = await supabase.from('words_unsaid').insert([{ untuk: recipient, pesan: newWordMsg }]);
    if(!error) { setNewWordTo(""); setNewWordMsg(""); setShowWordModal(false); alert("Pesan terkirim!"); }
  };
  
  const handleAddSong = async (e) => { 
      e.preventDefault(); if(!newSongData.title || !newSongData.spotifyId) return; 
      const { error } = await supabase.from('playlist').insert([{ song_title: newSongData.title, artist: newSongData.artist, spotify_id: newSongData.spotifyId, requested_by: newSongData.requestedBy }]);
      if(!error) { setNewSongData({ title: '', artist: '', spotifyId: '', requestedBy: '' }); setShowMusicModal(false); alert("Lagu direquest!"); }
  };

  return (
    <div className="bg-[#051125] min-h-screen text-white font-sans relative overflow-x-hidden selection:bg-yellow-500 selection:text-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Dancing+Script:wght@700&family=Gloria+Hallelujah&family=Indie+Flower&family=Permanent+Marker&family=Rock+Salt&family=Shadows+Into+Light&display=swap');
        .font-marker { font-family: 'Permanent Marker', cursive; } .font-rock { font-family: 'Rock Salt', cursive; } .font-caveat { font-family: 'Caveat', cursive; } .font-shadows { font-family: 'Shadows Into Light', cursive; } .font-dancing { font-family: 'Dancing Script', cursive; } .font-indie { font-family: 'Indie Flower', cursive; } .font-gloria { font-family: 'Gloria Hallelujah', cursive; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: #0f1f3b; border-radius: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #EAB308, #CA8A04); border-radius: 4px; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } } .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-scroll { display: flex; width: max-content; animation: scroll 40s linear infinite; } .animate-scroll:hover { animation-play-state: paused; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fadeInUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } } .animate-zoom-in { animation: zoomIn 0.3s ease-out forwards; }
        @keyframes twinkling { 0% { opacity: 0.2; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.2; transform: scale(1); } } .star { position: absolute; background: white; border-radius: 50%; animation: twinkling infinite ease-in-out; }
      `}</style>

      {/* BACKGROUND & AUDIO */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#051125]">
         {[...Array(15)].map((_, i) => ( <div key={i} className="star" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`, animationDuration: `${Math.random() * 3 + 2}s` }}></div> ))}
         <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-purple-900/10 blur-[100px] rounded-full"></div>
      </div>
      <audio ref={bgAudioRef} src="/backsound.mp3" loop />

      {/* INTRO SCREEN */}
      {showIntro && (
        <div className={`fixed inset-0 z-[9999] bg-[#020a1a] flex flex-col items-center justify-center text-center p-4 transition-all duration-1000 ${animateExit ? 'opacity-0 scale-110' : 'opacity-100'}`}>
           <div className="mb-8 relative animate-float">
                <div className="w-32 h-32 bg-gradient-to-tr from-yellow-600 to-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)] border-4 border-yellow-200/20"><span className="text-5xl">🎓</span></div>
           </div>
           <h1 className="text-4xl md:text-6xl font-serif text-white font-bold mb-4 tracking-widest animate-fade-in-up">RENAISSANS</h1>
           <p className="text-yellow-500/80 mb-12 text-sm tracking-[0.5em] uppercase font-bold animate-pulse">Class of Memories</p>
           <button onClick={handleEnterWebsite} className="px-10 py-4 border border-yellow-500 text-yellow-500 text-sm font-bold uppercase tracking-[0.2em] rounded-full hover:bg-yellow-500 hover:text-black transition-all duration-500">Buka Album ▶</button>
        </div>
      )}

      {/* KONTEN UTAMA */}
      {contentLoaded && (
        <div className="relative z-10 flex flex-col min-h-screen">
            
            {/* NAVBAR (FIXED) */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#051125]/95 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
                        <span className="text-2xl">🎓</span>
                        <span className="font-serif font-bold text-yellow-500 tracking-widest text-lg md:text-xl">RENAISSANS</span>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-gray-300">
                        <button onClick={() => scrollToSection('students')} className="hover:text-yellow-500 transition">Siswa</button>
                        <button onClick={() => scrollToSection('gallery')} className="hover:text-yellow-500 transition">Gallery</button>
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT WRAPPER */}
            <main className="flex-grow">
                {/* HERO */}
                <header id="hero" className="text-center pt-32 pb-16 px-4 relative z-10">
                    <div className="relative z-10 flex flex-col items-center justify-center mb-6 animate-fade-in-up">
                        <div className="w-32 h-32 rounded-full bg-[#0a1529] border-4 border-yellow-500/50 flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.3)]"><img src="logo.png" alt="Logo" className="w-full h-full object-cover rounded-full opacity-90"/></div>
                    </div>
                    <h1 className="text-3xl md:text-6xl font-serif text-yellow-500 font-bold mb-4 tracking-wider animate-fade-in-up">
                        <TypeAnimation sequence={['CLASS OF MEMORIES', 1000, 'FOREVER YOUNG', 1000]} wrapper="span" speed={50} repeat={Infinity} cursor={true}/>
                    </h1>
                </header>

                {/* WORDS UNSAID */}
                <section id="words" className="max-w-6xl mx-auto px-6 mb-24 relative z-10 animate-fade-in-up">
                    <div className="text-center mb-10">
                        <h3 className="text-yellow-500 font-serif text-2xl tracking-[0.2em] uppercase">Words Unsaid</h3>
                        <button onClick={() => setShowWordModal(true)} className="mt-4 bg-yellow-500 text-black px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-yellow-400 transition">✉️ Titip Pesan</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {words.slice(0, 6).map((word) => (
                            <div key={word.id} className="bg-[#112240]/80 p-5 rounded-lg border-l-4 border-yellow-500 hover:-translate-y-1 transition duration-300">
                                <p className="text-gray-300 italic mb-2 text-sm line-clamp-3">"{word.pesan}"</p>
                                <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2"><span className="text-white text-xs font-bold">To: {word.untuk}</span></div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* GURU */}
                <section className="max-w-4xl mx-auto mb-16 px-6 relative z-10">
                    <div className="bg-[#0a192f]/80 backdrop-blur border border-yellow-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-lg">
                        <div className="w-32 h-32 shrink-0 rounded-full border-4 border-yellow-500 overflow-hidden">
                            {wali && wali.foto_url ? (<img src={`${STORAGE_URL}/${wali.foto_url}`} loading="lazy" alt="Guru" className="w-full h-full object-cover"/>) : (<div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs">NO FOTO</div>)}
                        </div>
                        <div className="text-center md:text-left"><h2 className="text-2xl font-serif text-white font-bold mb-1">Bapak/Ibu Guru</h2><p className="text-yellow-500 mb-2 font-bold tracking-widest">{wali ? wali.nama : 'Loading...'}</p><blockquote className="text-gray-300 italic text-sm border-l-4 border-yellow-500/30 pl-4">"{wali ? wali.quote : 'Loading...'}"</blockquote></div>
                    </div>
                </section>

                {/* SISWA GRID */}
                <div id="students" className="max-w-xl mx-auto px-6 mb-8 sticky top-20 z-40">
                    <input type="text" placeholder="Cari teman..." className="w-full bg-[#0f2545]/90 border border-white/10 rounded-full py-3 px-6 text-white outline-none focus:border-yellow-500 shadow-xl text-sm backdrop-blur-sm" onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 md:px-12 pb-20 relative z-10">
                    {students.filter((val) => { if (searchTerm === "") return val; else if (val.nama.toLowerCase().includes(searchTerm.toLowerCase())) return val; return null; }).map((student) => (
                        <div key={student.id} className="bg-[#0a192f] rounded-lg overflow-hidden border border-white/5 hover:border-yellow-500 transition duration-300 hover:-translate-y-2 hover:shadow-lg group">
                            <div className="h-48 w-full relative overflow-hidden bg-gray-900">
                                {student.foto_url ? (
                                    <img src={`${STORAGE_URL}/${student.foto_url}`} loading="lazy" alt={student.nama} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                                ) : (<div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">NO PHOTO</div>)}
                                <div className="absolute top-2 right-2"><span className="bg-yellow-500 text-black text-[9px] font-bold px-2 py-1 rounded shadow">{student.jabatan}</span></div>
                            </div>
                            <div className="p-3 bg-[#0a192f]"><h2 className="text-sm font-bold text-white mb-1 truncate">{student.nama}</h2>{student.instagram && <p className="text-gray-500 text-[10px] truncate">@{student.instagram.replace('@','')}</p>}</div>
                        </div>
                    ))}
                </div>

                {/* GALLERY */}
                <section id="gallery" className="mb-12 overflow-hidden relative z-10">
                    <div className="text-center mb-6"><h3 className="text-yellow-500 font-serif text-xl tracking-[0.2em] uppercase">Captured Moments</h3></div>
                    <div className="bg-black/30 py-6 overflow-hidden">
                        <div className="animate-scroll flex gap-4 pl-4">
                            {gallery.map((item, index) => (
                                <div key={index} onClick={() => setSelectedImage(item)} className="w-48 h-32 shrink-0 rounded overflow-hidden border border-white/10 relative cursor-pointer hover:scale-105 transition"><img src={`${STORAGE_URL}/${item.image_url}`} loading="lazy" alt="Gallery" className="w-full h-full object-cover"/></div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* OUR JOURNEY */}
                <section id="journey" className="py-12 px-6 max-w-3xl mx-auto relative z-10">
                    <div className="text-center mb-10"><h3 className="text-yellow-500 font-serif text-xl tracking-widest uppercase">Our Journey</h3></div>
                    <div className="relative border-l-2 border-yellow-500/30 ml-4 space-y-8">{journey.map((item, index) => (<div key={item.id} className="relative pl-8"><div className="absolute top-1 -left-[7px] w-3 h-3 bg-yellow-500 rounded-full shadow border-2 border-[#051125]"></div><div className="bg-[#0a192f] p-4 rounded-lg border border-white/5 shadow"><h4 className="text-lg font-bold text-white">{item.judul}</h4><span className="text-xs text-yellow-500 uppercase tracking-widest block mb-2">{item.tahun}</span><p className="text-gray-400 text-sm">{item.deskripsi}</p></div></div>))}</div>
                </section>

                {/* FLASHBACK (SECTION REF UNTUK AUDIO DUCKING) */}
                <section id="flashback" ref={flashbackSectionRef} className="py-12 px-4 relative z-10 max-w-7xl mx-auto min-h-[400px]">
                    <div className="text-center mb-8"><h3 className="text-4xl font-serif font-bold text-yellow-500/80 tracking-tighter">FLASHBACK</h3></div>
                    {/* Horizontal Scroll Snap biar enak swipe-nya */}
                    <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-6 justify-center snap-x snap-mandatory">
                        {flashback.map((item) => (
                            <div key={item.id} className="snap-center">
                                <SmartVideo 
                                    id={item.id}
                                    url={`${STORAGE_URL}/${item.video_url}`} 
                                    title={item.title} 
                                    activeVideoId={activeVideoId}
                                    setActiveVideoId={setActiveVideoId}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* SIGNATURE WALL & JUKEBOX */}
                <section className="py-16 px-6 bg-[#080d1a] relative z-10">
                    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
                        {/* Signature */}
                        <div>
                            <h3 className="text-yellow-500 font-serif text-xl tracking-widest uppercase mb-6 text-center">Signature Wall</h3>
                            <div className="bg-[#0f1f3b] border border-white/10 rounded-xl p-6 h-[400px] relative overflow-hidden">
                                <div className="h-full overflow-y-auto flex flex-wrap gap-6 justify-center content-start pb-12">
                                    {signatures.map((sign) => (<div key={sign.id} style={{ transform: `rotate(${sign.style?.rotation || '0deg'}) scale(${sign.style?.scale || 1})` }}><span className={`${sign.style?.font || 'font-marker'} text-2xl ${sign.style?.color || 'text-white'} opacity-90`}>{sign.nama_pengirim}</span></div>))}
                                </div>
                                <button onClick={() => setShowSigModal(true)} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-yellow-400 transition">+ Add Yours</button>
                            </div>
                        </div>
                        {/* Jukebox */}
                        <div>
                            <h3 className="text-yellow-500 font-serif text-xl tracking-widest uppercase mb-6 text-center">Jukebox</h3>
                            <div className="bg-[#0f1f3b] border border-white/10 rounded-xl p-6 h-[400px] flex flex-col">
                                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
                                    {playlist.map((item) => (
                                        <div key={item.id} onClick={() => { stopBgMusic(); }} className="flex items-center gap-3 bg-[#0a192f] p-3 rounded border border-white/5 cursor-pointer hover:bg-[#1a2e52] transition">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${item.source === 'youtube' ? 'bg-red-600' : 'bg-green-600'}`}>{item.source === 'youtube' ? '▶' : '🎵'}</div>
                                            <div className="min-w-0"><h4 className="text-white text-sm font-bold truncate">{item.song_title}</h4><p className="text-gray-400 text-xs truncate">{item.artist}</p></div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setShowMusicModal(true)} className="w-full bg-green-600 text-white py-2 rounded font-bold text-sm hover:bg-green-500 transition">Request Lagu 🎵</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TIME CAPSULE */}
                <section className="py-16 px-6 relative z-10"><div className="max-w-4xl mx-auto"><h3 className="text-3xl font-serif font-bold text-white mb-6 text-center">Time Capsule</h3><TimeCapsuleForm /></div></section>
            </main>

            {/* FOOTER (Sekarang pasti muncul di bawah) */}
            <footer className="bg-[#020a1a] py-8 text-center text-gray-500 text-xs border-t border-white/5 relative z-10 w-full">
                <p>© 2024 Class of Memories | Built with ❤️</p>
            </footer>

            {/* LIGHTBOX MODAL */}
            {selectedImage && (<div className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}><img src={`${STORAGE_URL}/${selectedImage.image_url}`} className="max-w-full max-h-[80vh] object-contain" alt="Preview" /></div>)}

            {/* MODALS */}
            {showSigModal && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"><div className="bg-[#0f2545] p-6 rounded-xl w-full max-w-sm relative"><button onClick={() => setShowSigModal(false)} className="absolute top-2 right-4 text-gray-400 text-xl">✕</button><h3 className="font-bold text-yellow-500 mb-4">Tanda Tangan</h3><form onSubmit={handleAddSignature} className="space-y-3"><input type="text" value={newSigName} onChange={(e) => setNewSigName(e.target.value)} placeholder="Namamu..." maxLength={15} className="w-full bg-[#0a192f] text-white p-3 rounded border border-white/10 outline-none" /><button type="submit" className="w-full bg-yellow-500 text-black font-bold py-2 rounded">Tempel 📌</button></form></div></div>)}
            {showWordModal && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"><div className="bg-[#0f2545] p-6 rounded-xl w-full max-w-sm relative"><button onClick={() => setShowWordModal(false)} className="absolute top-2 right-4 text-gray-400 text-xl">✕</button><h3 className="font-bold text-yellow-500 mb-4">Titip Pesan</h3><form onSubmit={handleAddWord} className="space-y-3"><input type="text" value={newWordTo} onChange={(e) => setNewWordTo(e.target.value)} placeholder="Untuk Siapa?" className="w-full bg-[#0a192f] text-white p-3 rounded border border-white/10 outline-none" /><textarea value={newWordMsg} onChange={(e) => setNewWordMsg(e.target.value)} placeholder="Pesanmu..." rows="3" className="w-full bg-[#0a192f] text-white p-3 rounded border border-white/10 outline-none" required /><button type="submit" className="w-full bg-yellow-500 text-black font-bold py-2 rounded">Kirim 💌</button></form></div></div>)}
            {showMusicModal && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"><div className="bg-[#0f2545] p-6 rounded-xl w-full max-w-sm relative"><button onClick={() => setShowMusicModal(false)} className="absolute top-2 right-4 text-gray-400 text-xl">✕</button><h3 className="font-bold text-yellow-500 mb-4">Request Lagu</h3><form onSubmit={handleAddSong} className="space-y-3"><input type="text" placeholder="Nama Kamu" value={newSongData.requestedBy} onChange={e => setNewSongData({...newSongData, requestedBy: e.target.value})} className="w-full bg-[#0a192f] text-white p-3 rounded border border-white/10 outline-none" required /><input type="text" placeholder="Judul Lagu" value={newSongData.title} onChange={e => setNewSongData({...newSongData, title: e.target.value})} className="w-full bg-[#0a192f] text-white p-3 rounded border border-white/10 outline-none" required /><input type="text" placeholder="Artis" value={newSongData.artist} onChange={e => setNewSongData({...newSongData, artist: e.target.value})} className="w-full bg-[#0a192f] text-white p-3 rounded border border-white/10 outline-none" /><input type="text" placeholder="Link Spotify/YouTube" value={newSongData.spotifyId} onChange={e => setNewSongData({...newSongData, spotifyId: e.target.value})} className="w-full bg-[#0a192f] text-white p-3 rounded border border-white/10 outline-none text-xs" required /><button type="submit" className="w-full bg-yellow-500 text-black font-bold py-2 rounded">Request 🎵</button></form></div></div>)}
        </div>
      )}
    </div>
  );
};

export default Home;