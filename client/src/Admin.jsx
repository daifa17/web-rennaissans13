import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; 

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  
  // --- 1. LOGIC RESPONSIVE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // URL Storage Supabase
  const STORAGE_URL = 'https://fjagcvvlfaarxjitdbsy.supabase.co/storage/v1/object/public/public-files';

  // --- 2. STATE DATA ---
  const [students, setStudents] = useState([]);
  const [studentForm, setStudentForm] = useState({ nama: '', jabatan: '', instagram: '', file: null });
  const [studentEditMode, setStudentEditMode] = useState({ active: false, id: null, oldPhoto: null });
  const [showStudentForm, setShowStudentForm] = useState(false);

  // (Data Wali Kelas DIHAPUS)
  
  const [journey, setJourney] = useState([]);
  const [journeyForm, setJourneyForm] = useState({ tahun: '', judul: '', deskripsi: '' });

  const [gallery, setGallery] = useState([]);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryFile, setGalleryFile] = useState(null);

  const [flashback, setFlashback] = useState([]);
  const [flashbackTitle, setFlashbackTitle] = useState("");
  const [flashbackDesc, setFlashbackDesc] = useState("");
  const [flashbackFile, setFlashbackFile] = useState(null);

  const [signatures, setSignatures] = useState([]);
  const [words, setWords] = useState([]);
  const [playlist, setPlaylist] = useState([]);

  const [uploading, setUploading] = useState(false);

  // --- 3. SMART FETCHING ---
  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    // (Fetch Wali DIHAPUS)
    else if (activeTab === 'journey') fetchJourney();
    else if (activeTab === 'gallery') fetchGallery();
    else if (activeTab === 'flashback') fetchFlashback();
    else if (activeTab === 'signatures') fetchSignatures();
    else if (activeTab === 'words') fetchWords();
    else if (activeTab === 'playlist') fetchPlaylist();
  }, [activeTab]);

  // Fungsi Fetching
  const fetchStudents = async () => { const { data } = await supabase.from('students').select('*').order('id'); setStudents(data || []); };
  const fetchJourney = async () => { const { data } = await supabase.from('journey').select('*').order('tahun'); setJourney(data || []); };
  const fetchGallery = async () => { const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false }); setGallery(data || []); };
  const fetchFlashback = async () => { const { data } = await supabase.from('flashback').select('*').order('created_at', { ascending: false }); setFlashback(data || []); };
  const fetchSignatures = async () => { const { data } = await supabase.from('signatures').select('*').order('created_at', { ascending: false }); setSignatures(data || []); };
  const fetchWords = async () => { const { data } = await supabase.from('words_unsaid').select('*').order('created_at', { ascending: false }); setWords(data || []); };
  const fetchPlaylist = async () => { const { data } = await supabase.from('playlist').select('*').order('created_at', { ascending: false }); setPlaylist(data || []); };

  // Helper Refresh
  const refreshCurrentTab = () => {
      if (activeTab === 'students') fetchStudents();
      else if (activeTab === 'journey') fetchJourney();
      else if (activeTab === 'gallery') fetchGallery();
      else if (activeTab === 'flashback') fetchFlashback();
      else if (activeTab === 'signatures') fetchSignatures();
      else if (activeTab === 'words') fetchWords();
      else if (activeTab === 'playlist') fetchPlaylist();
  };

  // --- 4. UPLOAD HELPER ---
  const uploadFile = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
    const { error } = await supabase.storage.from('public-files').upload(fileName, file);
    if (error) { alert("Gagal upload: " + error.message); throw error; }
    return fileName;
  };

  // --- 5. ACTION HANDLERS ---
  const handleSubmitStudent = async (e) => { 
      e.preventDefault(); setUploading(true);
      try {
          let fotoUrl = studentEditMode.oldPhoto;
          if (studentForm.file) fotoUrl = await uploadFile(studentForm.file);
          const payload = { nama: studentForm.nama, jabatan: studentForm.jabatan, instagram: studentForm.instagram, foto_url: fotoUrl };
          
          if (studentEditMode.active) await supabase.from('students').update(payload).eq('id', studentEditMode.id);
          else await supabase.from('students').insert([payload]);
          
          alert("Siswa Tersimpan!"); setShowStudentForm(false); setStudentForm({ nama: '', jabatan: '', instagram: '', file: null }); setStudentEditMode({ active: false, id: null, oldPhoto: null }); 
          refreshCurrentTab(); 
      } catch (err) { alert("Gagal."); } finally { setUploading(false); }
  };

  const handleDeleteContent = async (table, id) => { if(window.confirm("Hapus item ini?")) { await supabase.from(table).delete().eq('id', id); refreshCurrentTab(); } };
  
  const handleEditStudent = (s) => { setStudentEditMode({active:true, id:s.id, oldPhoto:s.foto_url}); setStudentForm({nama:s.nama, jabatan:s.jabatan, instagram:s.instagram, file:null}); setShowStudentForm(true); };
  
  // (Handler Wali DIHAPUS)

  const handleAddJourney = async (e) => { e.preventDefault(); await supabase.from('journey').insert([journeyForm]); alert("Journey Added!"); setJourneyForm({tahun:'',judul:'',deskripsi:''}); refreshCurrentTab(); };
  
  const handleAddGallery = async (e) => { e.preventDefault(); if(!galleryFile) return; setUploading(true); try { const f = await uploadFile(galleryFile); await supabase.from('gallery').insert([{image_url: f, caption: galleryCaption}]); alert("Uploaded!"); setGalleryCaption(""); setGalleryFile(null); refreshCurrentTab(); } catch(e){alert("Gagal");} finally{setUploading(false);} };
  
  const handleAddFlashback = async (e) => { e.preventDefault(); if(!flashbackFile) return; setUploading(true); try { alert("Uploading Video..."); const f = await uploadFile(flashbackFile); await supabase.from('flashback').insert([{video_url: f, title: flashbackTitle, description: flashbackDesc}]); alert("Video Uploaded!"); setFlashbackTitle(""); setFlashbackDesc(""); setFlashbackFile(null); refreshCurrentTab(); } catch(e){alert("Gagal");} finally{setUploading(false);} };
  
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  // --- STYLING ---
  const containerStyle = { display: 'flex', minHeight: '100vh', backgroundColor: '#051125', color: 'white', overflow: 'hidden', position: 'relative' };
  const sidebarStyle = {
      width: '260px', backgroundColor: '#0a192f', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', zIndex: 50,
      position: isMobile ? 'fixed' : 'relative', left: isMobile && !isSidebarOpen ? '-100%' : '0', top: 0, bottom: 0, transition: 'left 0.3s ease', height: '100vh'
  };

  return (
    <div style={containerStyle}>
      {/* Overlay Mobile */}
      {isMobile && isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* SIDEBAR */}
      <aside style={sidebarStyle} className="sidebar-custom shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="font-bold text-yellow-500 tracking-widest text-sm">ADMIN PANEL</h2>
            {isMobile && <button onClick={() => setIsSidebarOpen(false)} className="text-white font-bold text-xl">✕</button>}
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="text-[10px] text-gray-500 uppercase font-bold px-4 py-2 mt-2">Core Data</p>
            {/* 'wali' dihapus dari array */}
            {['students', 'journey'].map(tab => (
                 <button key={tab} onClick={() => { setActiveTab(tab); if(isMobile) setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded transition text-sm ${activeTab === tab ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>
                    {tab === 'students' ? '🎓 Siswa' : '🚀 Journey'}
                 </button>
            ))}
            <p className="text-[10px] text-gray-500 uppercase font-bold px-4 py-2 mt-4">Media</p>
            {['gallery', 'flashback'].map(tab => (
                 <button key={tab} onClick={() => { setActiveTab(tab); if(isMobile) setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded transition text-sm ${activeTab === tab ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>
                    {tab === 'gallery' ? '📸 Gallery' : '🎬 Video'}
                 </button>
            ))}
            <p className="text-[10px] text-gray-500 uppercase font-bold px-4 py-2 mt-4 text-red-400">Moderasi</p>
            {['signatures', 'words', 'playlist'].map(tab => (
                 <button key={tab} onClick={() => { setActiveTab(tab); if(isMobile) setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded transition text-sm ${activeTab === tab ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>
                    {tab === 'signatures' ? '✍️ Signature' : tab === 'words' ? '💌 Words' : '🎵 Playlist'}
                 </button>
            ))}
        </nav>
        <div className="p-4 border-t border-white/5"><button onClick={handleLogout} className="w-full py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition text-xs font-bold border border-red-500/20">LOG OUT</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative custom-scrollbar">
        {isMobile && <button onClick={() => setIsSidebarOpen(true)} className="mb-6 bg-[#0a192f] p-3 rounded text-white flex items-center gap-2 shadow-lg border border-white/10"><span>☰ MENU</span></button>}

        {uploading && <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-white font-bold">Processing...</p></div>}

        {/* --- KONTEN TABS --- */}
        
        {/* STUDENTS */}
        {activeTab === 'students' && (
            <div className="animate-fade-in-up">
                <h1 className="text-2xl font-bold mb-6">Data Siswa</h1>
                {!showStudentForm ? (
                    <button onClick={() => setShowStudentForm(true)} className="bg-yellow-500 text-black px-4 py-2 rounded font-bold mb-6 text-sm shadow-lg hover:scale-105 transition">+ Tambah Siswa</button>
                ) : (
                    <form onSubmit={handleSubmitStudent} className="bg-[#0f2545] p-5 rounded-xl border border-white/10 mb-6 shadow-xl">
                        <div className="grid grid-cols-1 gap-4">
                            <input type="text" placeholder="Nama Lengkap" value={studentForm.nama} onChange={e => setStudentForm({...studentForm, nama: e.target.value})} className="bg-[#0a192f] p-3 rounded text-white border border-white/10 outline-none focus:border-yellow-500" required />
                            <input type="text" placeholder="Jabatan" value={studentForm.jabatan} onChange={e => setStudentForm({...studentForm, jabatan: e.target.value})} className="bg-[#0a192f] p-3 rounded text-white border border-white/10 outline-none focus:border-yellow-500" required />
                            <input type="text" placeholder="Instagram (@username)" value={studentForm.instagram} onChange={e => setStudentForm({...studentForm, instagram: e.target.value})} className="bg-[#0a192f] p-3 rounded text-white border border-white/10 outline-none focus:border-yellow-500" />
                            <div className="text-xs text-gray-400">Foto Profil (Max 100KB agar ringan):</div>
                            <input type="file" onChange={e => setStudentForm({...studentForm, file: e.target.files[0]})} className="text-sm text-gray-300" accept="image/*" />
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button type="submit" className="bg-green-600 px-6 py-2 rounded text-white font-bold text-sm">Simpan</button>
                            <button type="button" onClick={() => {setShowStudentForm(false); setStudentEditMode({active:false,id:null,oldPhoto:null}); setStudentForm({nama:'',jabatan:'',instagram:'',file:null});}} className="bg-gray-600 px-6 py-2 rounded text-white text-sm">Batal</button>
                        </div>
                    </form>
                )}
                <div className="overflow-x-auto rounded-xl border border-white/5">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-[#0a192f] text-gray-400 text-xs uppercase"><tr><th className="p-4">Foto</th><th className="p-4">Nama</th><th className="p-4">Jabatan</th><th className="p-4 text-right">Aksi</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {students.map((s) => (
                                <tr key={s.id} className="hover:bg-white/5 transition">
                                    <td className="p-4"><div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-white/20">
                                        {s.foto_url ? <img src={`${STORAGE_URL}/${s.foto_url}`} loading="lazy" className="w-full h-full object-cover" alt="foto" /> : <div className="text-[9px] h-full flex items-center justify-center">N/A</div>}
                                    </div></td>
                                    <td className="p-4 font-bold">{s.nama}</td>
                                    <td className="p-4 text-yellow-500 text-sm">{s.jabatan}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleEditStudent(s)} className="text-blue-400 text-sm font-bold">Edit</button>
                                        <button onClick={() => handleDeleteContent('students', s.id)} className="text-red-400 text-sm font-bold">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* TAB WALI KELAS TELAH DIHAPUS */}

        {/* JOURNEY */}
        {activeTab === 'journey' && (
            <div className="animate-fade-in-up">
                <h1 className="text-2xl font-bold mb-6">Our Journey</h1>
                <form onSubmit={handleAddJourney} className="bg-[#0f2545] p-5 rounded-xl border border-white/10 mb-6 grid gap-4 shadow-xl">
                    <input type="text" placeholder="Tahun" value={journeyForm.tahun} onChange={e => setJourneyForm({...journeyForm, tahun: e.target.value})} className="bg-[#0a192f] p-3 rounded text-white border border-white/10 outline-none focus:border-yellow-500" />
                    <input type="text" placeholder="Judul Event" value={journeyForm.judul} onChange={e => setJourneyForm({...journeyForm, judul: e.target.value})} className="bg-[#0a192f] p-3 rounded text-white border border-white/10 outline-none focus:border-yellow-500" />
                    <input type="text" placeholder="Deskripsi Singkat" value={journeyForm.deskripsi} onChange={e => setJourneyForm({...journeyForm, deskripsi: e.target.value})} className="bg-[#0a192f] p-3 rounded text-white border border-white/10 outline-none focus:border-yellow-500" />
                    <button className="bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold transition">Tambah Event</button>
                </form>
                <div className="space-y-3">
                    {journey.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-4 rounded-lg border-l-4 border-yellow-500 flex justify-between items-center shadow-md hover:bg-white/5 transition">
                            <div><span className="text-yellow-500 font-bold text-xs bg-yellow-500/10 px-2 py-1 rounded">{item.tahun}</span><h4 className="font-bold text-lg mt-1">{item.judul}</h4><p className="text-sm text-gray-400">{item.deskripsi}</p></div>
                            <button onClick={() => handleDeleteContent('journey', item.id)} className="text-red-400 text-xs border border-red-500/30 px-3 py-2 rounded font-bold hover:bg-red-500 hover:text-white transition">Hapus</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* GALLERY */}
        {activeTab === 'gallery' && (
            <div className="animate-fade-in-up">
                <h1 className="text-2xl font-bold mb-6">Captured Moments</h1>
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded mb-4 text-xs text-blue-300">💡 Tips: Compress foto di <b>iloveimg.com</b> sebelum upload biar web ngebut!</div>
                <form onSubmit={handleAddGallery} className="bg-[#0f2545] p-5 rounded-xl mb-6 flex flex-col md:flex-row gap-3 shadow-xl border border-white/10">
                    <input type="file" onChange={e => setGalleryFile(e.target.files[0])} className="text-sm text-gray-300 w-full" accept="image/*"/>
                    <input type="text" placeholder="Caption (Opsional)" value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)} className="bg-[#0a192f] p-2 rounded text-white border border-white/10 text-sm w-full outline-none focus:border-yellow-500"/>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition">Upload</button>
                </form>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {gallery.map(item => (
                        <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 shadow-lg">
                            <img src={`${STORAGE_URL}/${item.image_url}`} loading="lazy" className="w-full h-full object-cover transition duration-500 group-hover:scale-110" alt="Gallery" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2">
                                <p className="text-xs text-white line-clamp-2 mb-2">{item.caption}</p>
                                <button onClick={() => handleDeleteContent('gallery', item.id)} className="w-full bg-red-600 text-white text-xs py-1 rounded font-bold hover:bg-red-500">HAPUS</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* FLASHBACK */}
        {activeTab === 'flashback' && (
            <div className="animate-fade-in-up">
                 <h1 className="text-2xl font-bold mb-6">Flashback Video</h1>
                 <form onSubmit={handleAddFlashback} className="bg-[#0f2545] p-5 rounded-xl mb-6 grid gap-4 shadow-xl border border-white/10">
                    <input type="file" accept="video/*" onChange={e => setFlashbackFile(e.target.files[0])} className="text-sm text-gray-300"/>
                    <input type="text" placeholder="Judul Video" value={flashbackTitle} onChange={e => setFlashbackTitle(e.target.value)} className="bg-[#0a192f] p-3 rounded text-white border border-white/10 outline-none focus:border-yellow-500"/>
                    <button className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold transition">Upload Video</button>
                 </form>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flashback.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-4 rounded-xl border border-white/10 shadow-lg">
                            <video controls className="w-full h-40 object-cover bg-black mb-3 rounded border border-white/5"><source src={`${STORAGE_URL}/${item.video_url}`} type="video/mp4" /></video>
                            <h4 className="font-bold text-lg">{item.title}</h4>
                            <p className="text-xs text-gray-400 mb-3">{item.description}</p>
                            <button onClick={() => handleDeleteContent('flashback', item.id)} className="text-red-400 text-xs border border-red-500/30 w-full py-2 rounded font-bold hover:bg-red-500 hover:text-white transition">HAPUS VIDEO</button>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {/* MODERASI TABS */}
        {(activeTab === 'signatures' || activeTab === 'words' || activeTab === 'playlist') && (
            <div className="animate-fade-in-up">
                 <h1 className="text-2xl font-bold mb-6 capitalize">Moderasi {activeTab}</h1>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeTab === 'signatures' && signatures.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-5 rounded-xl border border-white/10 shadow-md">
                             <h4 className="text-yellow-500 font-bold font-serif text-lg">{item.nama_pengirim}</h4>
                             <p className="text-sm italic text-gray-300 my-2">"{item.pesan}"</p>
                             <button onClick={() => handleDeleteContent('signatures', item.id)} className="text-red-400 text-xs border border-red-500/30 px-3 py-1 rounded mt-2 hover:bg-red-500 hover:text-white transition">Hapus</button>
                        </div>
                    ))}
                    {activeTab === 'words' && words.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-5 rounded-xl border border-white/10 shadow-md">
                             <span className="text-yellow-500 font-bold text-xs bg-yellow-500/10 px-2 py-1 rounded">Untuk: {item.untuk}</span>
                             <p className="text-sm italic text-gray-300 mt-3 mb-3">"{item.pesan}"</p>
                             <button onClick={() => handleDeleteContent('words_unsaid', item.id)} className="text-red-400 text-xs border border-red-500/30 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition">Hapus</button>
                        </div>
                    ))}
                    {activeTab === 'playlist' && playlist.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-4 rounded-xl border border-white/10 flex justify-between items-center shadow-md">
                             <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-10 h-10 flex items-center justify-center rounded-full text-white ${item.source==='youtube'?'bg-red-600':'bg-green-600'}`}>{item.source==='youtube'?'▶':'🎵'}</div>
                                <div className="min-w-0">
                                    <h4 className="font-bold truncate">{item.song_title}</h4>
                                    <p className="text-xs text-gray-400 truncate">{item.artist}</p>
                                </div>
                             </div>
                             <button onClick={() => handleDeleteContent('playlist', item.id)} className="text-red-400 text-xs border border-red-500/30 px-3 py-1 rounded ml-2 hover:bg-red-500 hover:text-white transition">Hapus</button>
                        </div>
                    ))}
                 </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default Admin;