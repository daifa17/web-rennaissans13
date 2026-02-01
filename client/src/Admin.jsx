import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Pakai Supabase Client

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  
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
  // 2. FETCH DATA (LOAD SEMUA DARI SUPABASE)
  // =========================================
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
        // Students
        const { data: s } = await supabase.from('students').select('*').order('id');
        setStudents(s || []);

        // Wali Kelas (Ambil data pertama)
        const { data: w } = await supabase.from('wali_kelas').select('*').limit(1).maybeSingle();
        if(w) setWali({ id: w.id, nama: w.nama, quote: w.quote, existingFoto: w.foto_url, file: null });

        // Journey
        const { data: j } = await supabase.from('journey').select('*').order('tahun');
        setJourney(j || []);

        // Gallery
        const { data: g } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
        setGallery(g || []);

        // Flashback
        const { data: f } = await supabase.from('flashback').select('*').order('created_at', { ascending: false });
        setFlashback(f || []);

        // Moderasi
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
  // 3. HELPER: UPLOAD FILE KE STORAGE
  // =========================================
  const uploadFile = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
    
    // Upload ke bucket 'public-files'
    const { error } = await supabase.storage
        .from('public-files')
        .upload(fileName, file);

    if (error) {
        alert("Gagal upload file: " + error.message);
        throw error;
    }
    return fileName; // Kembalikan nama file untuk disimpan di DB
  };

  // =========================================
  // 4. HANDLERS (LOGIKA TOMBOL)
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
          let fotoUrl = studentEditMode.oldPhoto; // Default pakai foto lama
          if (studentForm.file) {
              fotoUrl = await uploadFile(studentForm.file); // Kalau ada file baru, upload
          }

          const payload = { 
              nama: studentForm.nama, 
              jabatan: studentForm.jabatan, 
              instagram: studentForm.instagram,
              foto_url: fotoUrl
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
          if (wali.file) {
              fotoUrl = await uploadFile(wali.file);
          }

          const payload = { nama: wali.nama, quote: wali.quote, foto_url: fotoUrl };

          if (wali.id) {
              // Update jika sudah ada data
              await supabase.from('wali_kelas').update(payload).eq('id', wali.id);
          } else {
              // Insert jika tabel kosong
              await supabase.from('wali_kelas').insert([payload]);
          }

          alert("Wali Kelas Updated!"); 
          fetchAllData(); 
      } catch (error) { 
          alert("Gagal update wali."); 
      } finally {
          setUploading(false);
      }
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
  
  const handleDeleteJourney = async (id) => { 
      if(window.confirm("Hapus?")) { 
          await supabase.from('journey').delete().eq('id', id);
          fetchAllData(); 
      } 
  };

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
      try {
          await supabase.from(table).delete().eq('id', id);
          fetchAllData();
      } catch (err) { alert(`Gagal hapus data.`); }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#051125] text-white font-sans flex overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#0a192f] border-r border-white/5 flex flex-col z-20 h-screen">
        <div className="p-6 border-b border-white/5 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h2 className="font-bold text-yellow-500 tracking-widest text-sm">ADMIN PANEL</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            <p className="text-xs text-gray-500 uppercase font-bold px-4 py-2 mt-2">Core Data</p>
            <button onClick={() => setActiveTab('students')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'students' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>🎓 Data Siswa</button>
            <button onClick={() => setActiveTab('wali')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'wali' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>👨‍🏫 Wali Kelas</button>
            <button onClick={() => setActiveTab('journey')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'journey' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>🚀 Our Journey</button>
            
            <p className="text-xs text-gray-500 uppercase font-bold px-4 py-2 mt-4">Media</p>
            <button onClick={() => setActiveTab('gallery')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'gallery' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>📸 Captured Moments</button>
            <button onClick={() => setActiveTab('flashback')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'flashback' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>🎬 Flashback (Video)</button>

            <p className="text-xs text-gray-500 uppercase font-bold px-4 py-2 mt-4 text-red-400">Moderasi User</p>
            <button onClick={() => setActiveTab('signatures')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'signatures' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>✍️ Signature Wall</button>
            <button onClick={() => setActiveTab('words')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'words' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>💌 Words Unsaid</button>
            <button onClick={() => setActiveTab('playlist')} className={`w-full text-left px-4 py-3 rounded transition ${activeTab === 'playlist' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>🎵 Playlist Lagu</button>
        </nav>
        <div className="p-4 border-t border-white/5">
            <button onClick={handleLogout} className="w-full py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition text-sm font-bold border border-red-500/20">LOG OUT</button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-8 overflow-y-auto h-screen bg-[#051125] custom-scrollbar relative">
        {uploading && (
            <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-bold text-white">Sedang Mengupload...</h3>
                <p className="text-gray-400 text-sm">Mohon tunggu, jangan tutup halaman.</p>
            </div>
        )}

        {/* 1. DATA SISWA */}
        {activeTab === 'students' && (
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold mb-6 text-white">Data Siswa</h1>
                {!showStudentForm ? (
                    <button onClick={() => setShowStudentForm(true)} className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-6 py-2 rounded-lg font-bold mb-6 hover:scale-105 transition shadow-lg shadow-yellow-500/20">+ Tambah Siswa</button>
                ) : (
                    <form onSubmit={handleSubmitStudent} className="bg-[#0f2545] p-6 rounded-xl border border-white/10 mb-6 shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-xs text-gray-400">Nama Lengkap</label><input type="text" value={studentForm.nama} onChange={e => setStudentForm({...studentForm, nama: e.target.value})} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10 focus:border-yellow-500 outline-none" required /></div>
                            <div><label className="text-xs text-gray-400">Jabatan / Role</label><input type="text" value={studentForm.jabatan} onChange={e => setStudentForm({...studentForm, jabatan: e.target.value})} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10 focus:border-yellow-500 outline-none" required /></div>
                            <div><label className="text-xs text-gray-400">Instagram (Pakai @)</label><input type="text" value={studentForm.instagram} onChange={e => setStudentForm({...studentForm, instagram: e.target.value})} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10 focus:border-yellow-500 outline-none" /></div>
                            <div><label className="text-xs text-gray-400">Foto (Kosongkan jika tidak ganti)</label><input type="file" onChange={e => setStudentForm({...studentForm, file: e.target.files[0]})} className="w-full text-sm text-gray-300 mt-1" /></div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button type="submit" className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded text-white font-bold transition">Simpan Data</button>
                            <button type="button" onClick={() => {setShowStudentForm(false); setStudentEditMode({active:false, id:null, oldPhoto:null}); setStudentForm({nama:'', jabatan:'', instagram:'', file:null});}} className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded text-white transition">Batal</button>
                        </div>
                    </form>
                )}
                
                {/* --- FIX SCROLL TABEL DISINI --- */}
                <div className="table-scroll">
                    <table className="w-full text-left">
                        <thead className="bg-[#0a192f] text-gray-400 text-xs uppercase font-bold tracking-wider"><tr><th className="px-6 py-4">Foto</th><th className="px-6 py-4">Nama</th><th className="px-6 py-4">Jabatan</th><th className="px-6 py-4 text-right">Aksi</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-white/5 transition">
                                    <td className="px-6 py-3"><div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-white/20">{student.foto_url ? <img src={`${STORAGE_URL}/${student.foto_url}`} alt="" className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-[10px]">N/A</div>}</div></td>
                                    <td className="px-6 py-3 font-bold text-white">{student.nama}</td>
                                    <td className="px-6 py-3 text-yellow-500 text-sm">{student.jabatan}</td>
                                    <td className="px-6 py-3 text-right space-x-3">
                                        <button onClick={() => handleEditStudent(student)} className="text-blue-400 hover:text-blue-300 text-sm font-bold transition">Edit</button>
                                        <button onClick={() => handleDeleteStudent(student.id)} className="text-red-400 hover:text-red-300 text-sm font-bold transition">Hapus</button>
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
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold mb-6">Wali Kelas</h1>
                <form onSubmit={handleUpdateWali} className="bg-[#0f2545] p-8 rounded-xl border border-white/10 max-w-2xl shadow-xl">
                    <div className="flex gap-8 mb-6 items-center">
                         <div className="w-32 h-32 bg-gray-700 rounded-full overflow-hidden border-4 border-yellow-500 shrink-0 shadow-lg">
                             {(wali.file || wali.existingFoto) ? <img src={wali.file ? URL.createObjectURL(wali.file) : `${STORAGE_URL}/${wali.existingFoto}`} className="w-full h-full object-cover" alt="Preview"/> : <div className="flex items-center justify-center h-full text-xs">No Foto</div>}
                         </div>
                         <div className="w-full space-y-4">
                             <div><label className="text-xs text-gray-400">Nama Wali Kelas</label><input type="text" value={wali.nama} onChange={e => setWali({...wali, nama: e.target.value})} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10 focus:border-yellow-500 outline-none" placeholder="Nama Wali" /></div>
                             <div><label className="text-xs text-gray-400">Ganti Foto</label><input type="file" onChange={e => setWali({...wali, file: e.target.files[0]})} className="w-full text-sm text-gray-300" /></div>
                         </div>
                    </div>
                    <div className="mb-6">
                        <label className="text-xs text-gray-400">Kutipan / Quote</label>
                        <textarea rows="3" value={wali.quote} onChange={e => setWali({...wali, quote: e.target.value})} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10 focus:border-yellow-500 outline-none resize-none" placeholder="Quote"></textarea>
                    </div>
                    <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold transition shadow-lg">Simpan Perubahan</button>
                </form>
            </div>
        )}

        {/* 3. JOURNEY */}
        {activeTab === 'journey' && (
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold mb-6">Our Journey</h1>
                <form onSubmit={handleAddJourney} className="bg-[#0f2545] p-6 rounded-xl border border-white/10 mb-8 shadow-xl grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-1"><input type="text" placeholder="Tahun" value={journeyForm.tahun} onChange={e => setJourneyForm({...journeyForm, tahun: e.target.value})} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10 focus:border-yellow-500 outline-none" /></div>
                    <div className="md:col-span-2"><input type="text" placeholder="Judul Event" value={journeyForm.judul} onChange={e => setJourneyForm({...journeyForm, judul: e.target.value})} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10 focus:border-yellow-500 outline-none" /></div>
                    <div className="md:col-span-3"><input type="text" placeholder="Deskripsi Singkat" value={journeyForm.deskripsi} onChange={e => setJourneyForm({...journeyForm, deskripsi: e.target.value})} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10 focus:border-yellow-500 outline-none" /></div>
                    <button type="submit" className="md:col-span-6 bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-lg font-bold transition">Tambah Journey</button>
                </form>
                <div className="space-y-4">
                    {journey.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-5 rounded-lg border border-white/5 border-l-4 border-l-yellow-500 flex justify-between items-center hover:bg-white/5 transition">
                            <div>
                                <span className="text-yellow-500 font-bold text-xs uppercase tracking-widest">{item.tahun}</span>
                                <h4 className="font-bold text-white text-lg">{item.judul}</h4>
                                <p className="text-gray-400 text-sm mt-1">{item.deskripsi}</p>
                            </div>
                            <button onClick={() => handleDeleteJourney(item.id)} className="text-red-400 hover:text-red-300 font-bold text-sm bg-red-500/10 px-4 py-2 rounded border border-red-500/20 transition">Hapus</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 4. GALLERY */}
        {activeTab === 'gallery' && (
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold mb-6">Captured Moments</h1>
                <form onSubmit={handleAddGallery} className="bg-[#0f2545] p-6 rounded-xl border border-white/10 mb-8 max-w-3xl shadow-xl">
                    <label className="block text-gray-400 text-sm mb-2">Upload Foto Kenangan</label>
                    <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-3">
                            <input type="file" onChange={e => setGalleryFile(e.target.files[0])} className="text-sm text-gray-300 w-full bg-[#0a192f] p-2 rounded border border-white/10" accept="image/*"/>
                            <input type="text" placeholder="Caption (Opsional)" value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10 focus:border-yellow-500 outline-none text-sm"/>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-500 px-6 py-2 h-full rounded text-white font-bold whitespace-nowrap transition">Upload Foto</button>
                    </div>
                </form>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {gallery.map(item => (
                        <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square border border-white/10 shadow-lg">
                            <img src={`${STORAGE_URL}/${item.image_url}`} alt="Gallery" className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2">
                                <p className="text-xs text-white line-clamp-2 mb-2">{item.caption}</p>
                                <button onClick={() => handleDeleteContent('gallery', item.id)} className="w-full bg-red-600 text-white text-xs py-1 rounded font-bold">HAPUS</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 5. FLASHBACK */}
        {activeTab === 'flashback' && (
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold mb-6">Flashback Video</h1>
                <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-lg mb-6 text-yellow-500 text-sm">
                    ⚠️ <b>Info:</b> Upload video mungkin memakan waktu tergantung kecepatan internet. Maksimal ukuran file disarankan di bawah 50MB agar tidak gagal.
                </div>
                <form onSubmit={handleAddFlashback} className="bg-[#0f2545] p-6 rounded-xl border border-white/10 mb-8 max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4 shadow-xl">
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-400 mb-1 block">File Video (MP4)</label>
                        <input type="file" accept="video/*" onChange={e => setFlashbackFile(e.target.files[0])} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10" required />
                    </div>
                    <input type="text" placeholder="Judul Video" value={flashbackTitle} onChange={e => setFlashbackTitle(e.target.value)} className="bg-[#0a192f] p-3 rounded text-white border border-white/10 focus:border-yellow-500 outline-none" required />
                    <input type="text" placeholder="Deskripsi Singkat" value={flashbackDesc} onChange={e => setFlashbackDesc(e.target.value)} className="bg-[#0a192f] p-3 rounded text-white border border-white/10 focus:border-yellow-500 outline-none" />
                    <button className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg md:col-span-2 transition">Upload Video</button>
                </form>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {flashback.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-4 rounded-xl border border-white/10 shadow-lg">
                            <video controls className="w-full h-48 object-cover rounded-lg mb-3 border border-white/5 bg-black">
                                <source src={`${STORAGE_URL}/${item.video_url}`} type="video/mp4" />
                                Browser tidak support video.
                            </video>
                            <h4 className="font-bold text-white mb-1 text-lg">{item.title}</h4>
                            <p className="text-xs text-gray-400 mb-4">{item.description}</p>
                            <button onClick={() => handleDeleteContent('flashback', item.id)} className="w-full text-red-400 text-xs border border-red-500/30 px-3 py-2 rounded hover:bg-red-500 hover:text-white transition font-bold">HAPUS VIDEO</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 6. MODERASI SIGNATURE */}
        {activeTab === 'signatures' && (
            <div className="animate-fade-in-up">
                 <h1 className="text-3xl font-bold mb-6">Moderasi Signature</h1>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {signatures.map(sig => (
                        <div key={sig.id} className="bg-[#0f2545] p-5 rounded-xl border border-white/10 hover:border-yellow-500/50 transition shadow-lg relative group">
                            <h4 className="font-bold text-yellow-500 text-lg font-serif">{sig.nama_pengirim}</h4>
                            <p className="text-white text-sm italic my-3 opacity-80">"{sig.pesan}"</p>
                            <p className="text-[10px] text-gray-500 absolute top-4 right-4">{new Date(sig.created_at).toLocaleDateString()}</p>
                            <button onClick={() => handleDeleteContent('signatures', sig.id)} className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-2 rounded text-xs font-bold transition mt-2">HAPUS</button>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {/* 7. MODERASI WORDS */}
        {activeTab === 'words' && (
            <div className="animate-fade-in-up">
                 <h1 className="text-3xl font-bold mb-6">Moderasi Words Unsaid</h1>
                 
                 {/* --- FIX SCROLL TABEL DISINI JUGA --- */}
                 <div className="table-scroll">
                    <table className="w-full text-left bg-[#0f2545]">
                        <thead className="bg-[#0a192f] text-gray-400 text-xs uppercase font-bold"><tr><th className="px-6 py-4">Untuk</th><th className="px-6 py-4">Pesan</th><th className="px-6 py-4 text-right">Aksi</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                            {words.map(word => (
                                <tr key={word.id} className="hover:bg-white/5 transition">
                                    <td className="px-6 py-3 font-bold text-yellow-500">{word.untuk}</td>
                                    <td className="px-6 py-3 text-gray-300 italic">"{word.pesan}"</td>
                                    <td className="px-6 py-3 text-right">
                                        <button onClick={() => handleDeleteContent('words_unsaid', word.id)} className="text-red-400 hover:text-red-300 font-bold text-sm bg-red-500/10 px-3 py-1 rounded transition">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        )}

        {/* 8. MODERASI PLAYLIST */}
        {activeTab === 'playlist' && (
            <div className="animate-fade-in-up">
                 <h1 className="text-3xl font-bold mb-6">Moderasi Playlist</h1>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {playlist.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-4 rounded-xl border border-white/10 flex justify-between items-center hover:bg-white/5 transition shadow-lg">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xl ${item.source === 'youtube' ? 'bg-red-600' : 'bg-green-600'}`}>
                                    {item.source === 'youtube' ? '▶️' : '🎵'}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-white truncate text-lg">{item.song_title}</h4>
                                    <p className="text-xs text-gray-400 truncate">{item.artist}</p>
                                    <p className="text-[10px] text-yellow-500 mt-1 italic">Req by: {item.requested_by || 'Anonymous'}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDeleteContent('playlist', item.id)} className="bg-red-600/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition text-xs font-bold ml-2">HAPUS</button>
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