import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; 

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  
  // --- LOGIC RESPONSIVE (DITAMBAHKAN) ---
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
  // --------------------------------------

  // URL Storage Supabase (Ganti Project ID kamu jika berbeda)
  const STORAGE_URL = 'https://fjagcvvlfaarxjitdbsy.supabase.co/storage/v1/object/public/public-files';

  // =========================================
  // 1. STATE MANAGEMENT
  // =========================================
  
  // State: SISWA
  const [students, setStudents] = useState([]);
  const [studentForm, setStudentForm] = useState({ nama: '', jabatan: '', instagram: '', file: null });
  const [studentEditMode, setStudentEditMode] = useState({ active: false, id: null, oldPhoto: null });
  const [showStudentForm, setShowStudentForm] = useState(false);

  // State: WALI KELAS
  const [wali, setWali] = useState({ id: null, nama: '', quote: '', file: null, existingFoto: '' });
  
  // State: OUR JOURNEY
  const [journey, setJourney] = useState([]);
  const [journeyForm, setJourneyForm] = useState({ tahun: '', judul: '', deskripsi: '' });

  // State: GALLERY
  const [gallery, setGallery] = useState([]);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryFile, setGalleryFile] = useState(null);

  // State: FLASHBACK
  const [flashback, setFlashback] = useState([]);
  const [flashbackTitle, setFlashbackTitle] = useState("");
  const [flashbackDesc, setFlashbackDesc] = useState("");
  const [flashbackFile, setFlashbackFile] = useState(null);

  // State: MODERASI
  const [signatures, setSignatures] = useState([]);
  const [words, setWords] = useState([]);
  const [playlist, setPlaylist] = useState([]);

  // Loading State
  const [uploading, setUploading] = useState(false);

  // =========================================
  // 2. FETCH DATA
  // =========================================
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
        const { data: s } = await supabase.from('students').select('*').order('id');
        setStudents(s || []);

        const { data: w } = await supabase.from('wali_kelas').select('*').limit(1).maybeSingle();
        if(w) setWali({ id: w.id, nama: w.nama, quote: w.quote, existingFoto: w.foto_url, file: null });

        const { data: j } = await supabase.from('journey').select('*').order('tahun');
        setJourney(j || []);

        const { data: g } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
        setGallery(g || []);

        const { data: f } = await supabase.from('flashback').select('*').order('created_at', { ascending: false });
        setFlashback(f || []);

        const { data: sig } = await supabase.from('signatures').select('*').order('created_at', { ascending: false });
        setSignatures(sig || []);
        const { data: wd } = await supabase.from('words_unsaid').select('*').order('created_at', { ascending: false });
        setWords(wd || []);
        const { data: pl } = await supabase.from('playlist').select('*').order('created_at', { ascending: false });
        setPlaylist(pl || []);
    } catch (error) {
        console.error("Gagal load data:", error);
    }
  };

  // =========================================
  // 3. HELPER: UPLOAD FILE
  // =========================================
  const uploadFile = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
    
    const { error } = await supabase.storage.from('public-files').upload(fileName, file);
    if (error) {
        alert("Gagal upload file: " + error.message);
        throw error;
    }
    return fileName;
  };

  // =========================================
  // 4. HANDLERS
  // =========================================
  // --- SISWA ---
  const handleEditStudent = (student) => { 
      setStudentEditMode({ active: true, id: student.id, oldPhoto: student.foto_url }); 
      setStudentForm({ nama: student.nama, jabatan: student.jabatan, instagram: student.instagram, file: null }); 
      setShowStudentForm(true); 
  };
  
  const handleDeleteStudent = async (id) => { 
      if(window.confirm("Hapus siswa?")) { 
          await supabase.from('students').delete().eq('id', id);
          fetchAllData(); 
      } 
  };
  
  const handleSubmitStudent = async (e) => { 
      e.preventDefault(); 
      setUploading(true);
      try {
          let fotoUrl = studentEditMode.oldPhoto;
          if (studentForm.file) {
              fotoUrl = await uploadFile(studentForm.file);
          }
          const payload = { 
              nama: studentForm.nama, jabatan: studentForm.jabatan, 
              instagram: studentForm.instagram, foto_url: fotoUrl
          };
          if (studentEditMode.active) {
              await supabase.from('students').update(payload).eq('id', studentEditMode.id);
          } else {
              await supabase.from('students').insert([payload]);
          }
          alert("Data Siswa Disimpan!");
          setShowStudentForm(false); 
          setStudentForm({ nama: '', jabatan: '', instagram: '', file: null }); 
          setStudentEditMode({ active: false, id: null, oldPhoto: null }); 
          fetchAllData(); 
      } catch (error) { 
          alert("Gagal menyimpan data."); 
          console.error(error);
      } finally {
          setUploading(false);
      }
  };

  // --- WALI KELAS ---
  const handleUpdateWali = async (e) => { 
      e.preventDefault(); 
      setUploading(true);
      try {
          let fotoUrl = wali.existingFoto;
          if (wali.file) fotoUrl = await uploadFile(wali.file);
          const payload = { nama: wali.nama, quote: wali.quote, foto_url: fotoUrl };
          if (wali.id) await supabase.from('wali_kelas').update(payload).eq('id', wali.id);
          else await supabase.from('wali_kelas').insert([payload]);
          alert("Wali Kelas Updated!"); 
          fetchAllData(); 
      } catch (error) { alert("Gagal update wali."); } 
      finally { setUploading(false); }
  };

  // --- JOURNEY ---
  const handleAddJourney = async (e) => { 
      e.preventDefault(); 
      try { 
          await supabase.from('journey').insert([journeyForm]);
          alert("Journey Added!"); 
          setJourneyForm({ tahun: '', judul: '', deskripsi: '' }); 
          fetchAllData(); 
      } catch (err) { alert("Gagal."); } 
  };
  const handleDeleteJourney = async (id) => { if(window.confirm("Hapus?")) { await supabase.from('journey').delete().eq('id', id); fetchAllData(); } };

  // --- GALLERY ---
  const handleAddGallery = async (e) => {
      e.preventDefault();
      if (!galleryFile) return alert("Pilih foto dulu!");
      setUploading(true);
      try {
          const fileName = await uploadFile(galleryFile);
          await supabase.from('gallery').insert([{ image_url: fileName, caption: galleryCaption }]);
          alert("Foto terupload!"); 
          setGalleryCaption(""); setGalleryFile(null); fetchAllData();
      } catch (e) { alert("Gagal upload."); }
      finally { setUploading(false); }
  };

  // --- FLASHBACK (VIDEO) ---
  const handleAddFlashback = async (e) => {
      e.preventDefault();
      if (!flashbackFile) return alert("Pilih video dulu!");
      setUploading(true);
      try {
          alert("Sedang mengupload video... Mohon jangan tutup halaman.");
          const fileName = await uploadFile(flashbackFile);
          await supabase.from('flashback').insert([{ video_url: fileName, title: flashbackTitle, description: flashbackDesc }]);
          alert("Video berhasil diupload!"); 
          setFlashbackTitle(""); setFlashbackDesc(""); setFlashbackFile(null); fetchAllData();
      } catch (e) { alert("Gagal upload video."); }
      finally { setUploading(false); }
  };

  // --- GENERIC DELETE ---
  const handleDeleteContent = async (table, id) => {
      if(!window.confirm("Hapus item ini?")) return;
      try { await supabase.from(table).delete().eq('id', id); fetchAllData(); } catch (err) { alert(`Gagal hapus data.`); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  // === STYLE HELPERS ===
  // Menggunakan style inline untuk layout container utama agar responsif
  const containerStyle = {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#051125',
      color: 'white',
      overflow: 'hidden',
      position: 'relative'
  };

  const sidebarStyle = {
      width: '260px',
      backgroundColor: '#0a192f',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
      // Logic Mobile:
      position: isMobile ? 'fixed' : 'relative',
      left: isMobile && !isSidebarOpen ? '-100%' : '0',
      top: 0, bottom: 0,
      transition: 'left 0.3s ease',
      height: '100vh'
  };

  const overlayStyle = {
      display: isMobile && isSidebarOpen ? 'block' : 'none',
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 40
  };

  const mainContentStyle = {
      flex: 1,
      padding: '20px',
      overflowY: 'auto',
      height: '100vh',
      position: 'relative'
  };

  return (
    <div style={containerStyle}>
      
      {/* Overlay Hitam untuk Mobile */}
      <div style={overlayStyle} onClick={() => setIsSidebarOpen(false)}></div>

      {/* --- SIDEBAR --- */}
      <aside style={sidebarStyle} className="sidebar-custom">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h2 className="font-bold text-yellow-500 tracking-widest text-sm">ADMIN</h2>
            </div>
            {/* Tombol Close di Sidebar Mobile */}
            {isMobile && <button onClick={() => setIsSidebarOpen(false)} className="text-white font-bold">✕</button>}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="text-xs text-gray-500 uppercase font-bold px-4 py-2 mt-2">Core Data</p>
            {['students', 'wali', 'journey'].map(tab => (
                 <button key={tab} onClick={() => { setActiveTab(tab); if(isMobile) setIsSidebarOpen(false); }} 
                    className={`w-full text-left px-4 py-3 rounded transition text-sm ${activeTab === tab ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>
                    {tab === 'students' ? '🎓 Data Siswa' : tab === 'wali' ? '👨‍🏫 Wali Kelas' : '🚀 Our Journey'}
                 </button>
            ))}
            
            <p className="text-xs text-gray-500 uppercase font-bold px-4 py-2 mt-4">Media</p>
            {['gallery', 'flashback'].map(tab => (
                 <button key={tab} onClick={() => { setActiveTab(tab); if(isMobile) setIsSidebarOpen(false); }} 
                    className={`w-full text-left px-4 py-3 rounded transition text-sm ${activeTab === tab ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>
                    {tab === 'gallery' ? '📸 Moments' : '🎬 Video'}
                 </button>
            ))}

            <p className="text-xs text-gray-500 uppercase font-bold px-4 py-2 mt-4 text-red-400">Moderasi</p>
            {['signatures', 'words', 'playlist'].map(tab => (
                 <button key={tab} onClick={() => { setActiveTab(tab); if(isMobile) setIsSidebarOpen(false); }} 
                    className={`w-full text-left px-4 py-3 rounded transition text-sm ${activeTab === tab ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>
                    {tab === 'signatures' ? '✍️ Signature' : tab === 'words' ? '💌 Words' : '🎵 Playlist'}
                 </button>
            ))}
        </nav>
        
        <div className="p-4 border-t border-white/5">
            <button onClick={handleLogout} className="w-full py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition text-sm font-bold border border-red-500/20">LOG OUT</button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main style={mainContentStyle}>
        
        {/* Tombol Hamburger (Hanya muncul di Mobile) */}
        {isMobile && (
            <button onClick={() => setIsSidebarOpen(true)} className="mb-6 bg-gray-800 p-2 rounded text-white flex items-center gap-2">
                <span>☰ MENU</span>
            </button>
        )}

        {/* Loading Spinner */}
        {uploading && (
            <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-bold text-white">Sedang Proses...</h3>
            </div>
        )}

        {/* 1. DATA SISWA */}
        {activeTab === 'students' && (
            <div className="animate-fade-in-up">
                <h1 className="text-2xl font-bold mb-6 text-white">Data Siswa</h1>
                {!showStudentForm ? (
                    <button onClick={() => setShowStudentForm(true)} className="bg-yellow-500 text-black px-4 py-2 rounded font-bold mb-6 text-sm">+ Tambah Siswa</button>
                ) : (
                    <form onSubmit={handleSubmitStudent} className="bg-[#0f2545] p-4 rounded-xl border border-white/10 mb-6">
                        <div className="grid grid-cols-1 gap-4">
                            <input type="text" placeholder="Nama" value={studentForm.nama} onChange={e => setStudentForm({...studentForm, nama: e.target.value})} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10" required />
                            <input type="text" placeholder="Jabatan" value={studentForm.jabatan} onChange={e => setStudentForm({...studentForm, jabatan: e.target.value})} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10" required />
                            <input type="text" placeholder="Instagram (@)" value={studentForm.instagram} onChange={e => setStudentForm({...studentForm, instagram: e.target.value})} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10" />
                            <input type="file" onChange={e => setStudentForm({...studentForm, file: e.target.files[0]})} className="text-sm text-gray-300" />
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button type="submit" className="bg-green-600 px-4 py-2 rounded text-white font-bold text-sm">Simpan</button>
                            <button type="button" onClick={() => setShowStudentForm(false)} className="bg-gray-600 px-4 py-2 rounded text-white text-sm">Batal</button>
                        </div>
                    </form>
                )}
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-[#0a192f] text-gray-400 text-xs uppercase"><tr><th className="p-4">Foto</th><th className="p-4">Nama</th><th className="p-4">Jabatan</th><th className="p-4 text-right">Aksi</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-white/5">
                                    <td className="p-4"><div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">{student.foto_url && <img src={`${STORAGE_URL}/${student.foto_url}`} className="w-full h-full object-cover"/>}</div></td>
                                    <td className="p-4 font-bold">{student.nama}</td>
                                    <td className="p-4 text-yellow-500 text-sm">{student.jabatan}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleEditStudent(student)} className="text-blue-400 text-sm">Edit</button>
                                        <button onClick={() => handleDeleteStudent(student.id)} className="text-red-400 text-sm">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* 2. WALI KELAS */}
        {activeTab === 'wali' && (
            <div>
                <h1 className="text-2xl font-bold mb-6">Wali Kelas</h1>
                <form onSubmit={handleUpdateWali} className="bg-[#0f2545] p-6 rounded-xl border border-white/10">
                    <div className="flex flex-col md:flex-row gap-6 mb-4 items-center">
                         <div className="w-24 h-24 bg-gray-700 rounded-full overflow-hidden border-2 border-yellow-500">
                             {(wali.file || wali.existingFoto) && <img src={wali.file ? URL.createObjectURL(wali.file) : `${STORAGE_URL}/${wali.existingFoto}`} className="w-full h-full object-cover"/>}
                         </div>
                         <div className="w-full space-y-3">
                             <input type="text" value={wali.nama} onChange={e => setWali({...wali, nama: e.target.value})} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10" placeholder="Nama Wali" />
                             <input type="file" onChange={e => setWali({...wali, file: e.target.files[0]})} className="text-sm text-gray-300" />
                         </div>
                    </div>
                    <textarea rows="3" value={wali.quote} onChange={e => setWali({...wali, quote: e.target.value})} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10 mb-4" placeholder="Quote"></textarea>
                    <button type="submit" className="w-full bg-yellow-500 text-black py-2 rounded font-bold">Simpan</button>
                </form>
            </div>
        )}

        {/* 3. JOURNEY */}
        {activeTab === 'journey' && (
            <div>
                <h1 className="text-2xl font-bold mb-6">Our Journey</h1>
                <form onSubmit={handleAddJourney} className="bg-[#0f2545] p-4 rounded-xl border border-white/10 mb-6 grid gap-4">
                    <input type="text" placeholder="Tahun" value={journeyForm.tahun} onChange={e => setJourneyForm({...journeyForm, tahun: e.target.value})} className="bg-[#0a192f] p-3 rounded text-white border border-white/10" />
                    <input type="text" placeholder="Judul" value={journeyForm.judul} onChange={e => setJourneyForm({...journeyForm, judul: e.target.value})} className="bg-[#0a192f] p-3 rounded text-white border border-white/10" />
                    <input type="text" placeholder="Deskripsi" value={journeyForm.deskripsi} onChange={e => setJourneyForm({...journeyForm, deskripsi: e.target.value})} className="bg-[#0a192f] p-3 rounded text-white border border-white/10" />
                    <button className="bg-green-600 text-white py-2 rounded font-bold">Tambah</button>
                </form>
                <div className="space-y-3">
                    {journey.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-4 rounded border-l-4 border-yellow-500 flex justify-between items-center">
                            <div><span className="text-yellow-500 font-bold text-xs">{item.tahun}</span><h4 className="font-bold">{item.judul}</h4></div>
                            <button onClick={() => handleDeleteJourney(item.id)} className="text-red-400 text-sm border border-red-500/30 px-2 py-1 rounded">Hapus</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 4. GALLERY */}
        {activeTab === 'gallery' && (
            <div>
                <h1 className="text-2xl font-bold mb-6">Gallery</h1>
                <form onSubmit={handleAddGallery} className="bg-[#0f2545] p-4 rounded-xl mb-6 flex flex-col gap-3">
                    <input type="file" onChange={e => setGalleryFile(e.target.files[0])} className="text-sm text-gray-300" accept="image/*"/>
                    <input type="text" placeholder="Caption" value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)} className="bg-[#0a192f] p-3 rounded text-white border border-white/10 text-sm"/>
                    <button className="bg-blue-600 text-white py-2 rounded font-bold">Upload</button>
                </form>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {gallery.map(item => (
                        <div key={item.id} className="relative group aspect-square rounded overflow-hidden border border-white/10">
                            <img src={`${STORAGE_URL}/${item.image_url}`} className="w-full h-full object-cover" />
                            <button onClick={() => handleDeleteContent('gallery', item.id)} className="absolute bottom-0 w-full bg-red-600 text-white text-xs py-1">HAPUS</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 5. FLASHBACK (VIDEO) */}
        {activeTab === 'flashback' && (
            <div>
                 <h1 className="text-2xl font-bold mb-6">Flashback Video</h1>
                 <form onSubmit={handleAddFlashback} className="bg-[#0f2545] p-4 rounded-xl mb-6 flex flex-col gap-3">
                    <input type="file" accept="video/*" onChange={e => setFlashbackFile(e.target.files[0])} className="text-sm text-gray-300"/>
                    <input type="text" placeholder="Judul" value={flashbackTitle} onChange={e => setFlashbackTitle(e.target.value)} className="bg-[#0a192f] p-3 rounded text-white border border-white/10"/>
                    <button className="bg-red-600 text-white py-2 rounded font-bold">Upload Video</button>
                 </form>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flashback.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-3 rounded border border-white/10">
                            <video controls className="w-full h-40 object-cover bg-black mb-2"><source src={`${STORAGE_URL}/${item.video_url}`} type="video/mp4" /></video>
                            <h4 className="font-bold">{item.title}</h4>
                            <button onClick={() => handleDeleteContent('flashback', item.id)} className="text-red-400 text-xs mt-2 border border-red-500/30 px-2 py-1 rounded">Hapus</button>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {/* 6, 7, 8 MODERASI (Signature, Words, Playlist) */}
        {(activeTab === 'signatures' || activeTab === 'words' || activeTab === 'playlist') && (
            <div>
                 <h1 className="text-2xl font-bold mb-6">Moderasi {activeTab}</h1>
                 <div className="grid grid-cols-1 gap-3">
                    {activeTab === 'signatures' && signatures.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-4 rounded border border-white/10 flex justify-between items-start">
                             <div><h4 className="text-yellow-500 font-bold">{item.nama_pengirim}</h4><p className="text-sm italic text-gray-300">"{item.pesan}"</p></div>
                             <button onClick={() => handleDeleteContent('signatures', item.id)} className="text-red-400 text-xs border border-red-500/30 px-2 py-1 rounded">Hapus</button>
                        </div>
                    ))}
                    {activeTab === 'words' && words.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-4 rounded border border-white/10 flex justify-between items-start">
                             <div><span className="text-yellow-500 font-bold text-xs">Untuk: {item.untuk}</span><p className="text-sm italic text-gray-300">"{item.pesan}"</p></div>
                             <button onClick={() => handleDeleteContent('words_unsaid', item.id)} className="text-red-400 text-xs border border-red-500/30 px-2 py-1 rounded">Hapus</button>
                        </div>
                    ))}
                    {activeTab === 'playlist' && playlist.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-4 rounded border border-white/10 flex justify-between items-center">
                             <div><h4 className="font-bold">{item.song_title}</h4><p className="text-xs text-gray-400">{item.artist}</p></div>
                             <button onClick={() => handleDeleteContent('playlist', item.id)} className="text-red-400 text-xs border border-red-500/30 px-2 py-1 rounded">Hapus</button>
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