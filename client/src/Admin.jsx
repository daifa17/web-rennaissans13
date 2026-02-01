import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const API_URL = 'http://localhost:3000'; 

  // =========================================
  // 1. STATE MANAGEMENT
  // =========================================
  
  // State: SISWA
  const [students, setStudents] = useState([]);
  const [studentForm, setStudentForm] = useState({ nama: '', jabatan: '', instagram: '', file: null });
  const [studentEditMode, setStudentEditMode] = useState({ active: false, id: null });
  const [showStudentForm, setShowStudentForm] = useState(false);

  // State: WALI KELAS
  const [wali, setWali] = useState({ nama: '', quote: '', file: null, existingFoto: '' });
  
  // State: OUR JOURNEY
  const [journey, setJourney] = useState([]);
  const [journeyForm, setJourneyForm] = useState({ tahun: '', judul: '', deskripsi: '' });

  // State: GALLERY (Captured Moments)
  const [gallery, setGallery] = useState([]);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryFile, setGalleryFile] = useState(null);

  // State: FLASHBACK (Video Upload)
  const [flashback, setFlashback] = useState([]);
  const [flashbackTitle, setFlashbackTitle] = useState("");
  const [flashbackDesc, setFlashbackDesc] = useState("");
  const [flashbackFile, setFlashbackFile] = useState(null);

  // State: MODERASI (User Content)
  const [signatures, setSignatures] = useState([]);
  const [words, setWords] = useState([]);
  const [playlist, setPlaylist] = useState([]);

  // =========================================
  // 2. FETCH DATA (LOAD SEMUA)
  // =========================================
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
        const resStudents = await axios.get(`${API_URL}/students`); setStudents(resStudents.data);
        const resWali = await axios.get(`${API_URL}/wali`).catch(() => null); 
        if(resWali && resWali.data) setWali({ ...resWali.data, file: null, existingFoto: resWali.data.foto_url });
        const resJourney = await axios.get(`${API_URL}/journey`).catch(() => null); if(resJourney) setJourney(resJourney.data);
        const resGallery = await axios.get(`${API_URL}/gallery`).catch(() => null); if(resGallery) setGallery(resGallery.data);
        const resFlashback = await axios.get(`${API_URL}/flashback`).catch(() => null); if(resFlashback) setFlashback(resFlashback.data);
        const resSig = await axios.get(`${API_URL}/signatures`).catch(() => null); if(resSig) setSignatures(resSig.data);
        const resWords = await axios.get(`${API_URL}/words`).catch(() => null); if(resWords) setWords(resWords.data);
        const resPlaylist = await axios.get(`${API_URL}/playlist`).catch(() => null); if(resPlaylist) setPlaylist(resPlaylist.data);
    } catch (error) {
        console.error("Gagal load data:", error);
    }
  };

  // =========================================
  // 3. HANDLERS (LOGIKA TOMBOL)
  // =========================================

  // --- SISWA ---
  const handleEditStudent = (student) => { setStudentEditMode({ active: true, id: student.id }); setStudentForm({ nama: student.nama, jabatan: student.jabatan, instagram: student.instagram, file: null }); setShowStudentForm(true); };
  const handleDeleteStudent = async (id) => { if(window.confirm("Hapus siswa?")) { await axios.delete(`${API_URL}/students/${id}`); fetchAllData(); } };
  const handleSubmitStudent = async (e) => { e.preventDefault(); const formData = new FormData(); formData.append('nama', studentForm.nama); formData.append('jabatan', studentForm.jabatan); formData.append('instagram', studentForm.instagram); if (studentForm.file) formData.append('foto', studentForm.file); try { if (studentEditMode.active) await axios.put(`${API_URL}/students/${studentEditMode.id}`, formData, { headers: {'Content-Type': 'multipart/form-data'} }); else await axios.post(`${API_URL}/students`, formData, { headers: {'Content-Type': 'multipart/form-data'} }); alert("Sukses!"); setShowStudentForm(false); setStudentForm({ nama: '', jabatan: '', instagram: '', file: null }); setStudentEditMode({ active: false, id: null }); fetchAllData(); } catch (error) { alert("Gagal."); } };

  // --- WALI KELAS ---
  const handleUpdateWali = async (e) => { e.preventDefault(); const formData = new FormData(); formData.append('nama', wali.nama); formData.append('quote', wali.quote); if (wali.file) formData.append('foto', wali.file); try { await axios.post(`${API_URL}/wali`, formData, { headers: {'Content-Type': 'multipart/form-data'} }); alert("Wali Updated!"); fetchAllData(); } catch (error) { alert("Gagal."); } };

  // --- JOURNEY ---
  const handleAddJourney = async (e) => { e.preventDefault(); try { await axios.post(`${API_URL}/journey`, journeyForm); alert("Journey Added!"); setJourneyForm({ tahun: '', judul: '', deskripsi: '' }); fetchAllData(); } catch (err) { alert("Gagal."); } };
  const handleDeleteJourney = async (id) => { if(window.confirm("Hapus?")) { await axios.delete(`${API_URL}/journey/${id}`); fetchAllData(); } };

  // --- GALLERY (FOTO) ---
  const handleAddGallery = async (e) => {
      e.preventDefault();
      if (!galleryFile) return alert("Pilih foto dulu!");
      const formData = new FormData();
      formData.append('image', galleryFile);
      formData.append('caption', galleryCaption);
      try {
          await axios.post(`${API_URL}/gallery`, formData, { headers: {'Content-Type': 'multipart/form-data'} });
          alert("Foto terupload!"); setGalleryCaption(""); setGalleryFile(null); fetchAllData();
      } catch (e) { alert("Gagal upload."); }
  };

  // --- FLASHBACK (VIDEO) ---
  const handleAddFlashback = async (e) => {
      e.preventDefault();
      if (!flashbackFile) return alert("Pilih video dulu!");
      const formData = new FormData();
      formData.append('video', flashbackFile); // Kirim File Video
      formData.append('title', flashbackTitle);
      formData.append('description', flashbackDesc);
      try {
          alert("Sedang mengupload video... Mohon tunggu.");
          await axios.post(`${API_URL}/flashback`, formData, { headers: {'Content-Type': 'multipart/form-data'} });
          alert("Video berhasil diupload!"); setFlashbackTitle(""); setFlashbackDesc(""); setFlashbackFile(null); fetchAllData();
      } catch (e) { alert("Gagal upload video."); }
  };

  // --- GENERIC DELETE (Untuk Gallery, Flashback, Signature, Words, Playlist) ---
  const handleDeleteContent = async (type, id) => {
      if(!window.confirm("Hapus item ini?")) return;
      try {
          await axios.delete(`${API_URL}/${type}/${id}`);
          fetchAllData();
      } catch (err) { alert(`Gagal hapus data ${type}`); }
  };


  return (
    <div className="min-h-screen bg-[#051125] text-white font-sans flex overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#0a192f] border-r border-white/5 flex flex-col z-20 h-screen">
        <div className="p-6 border-b border-white/5"><h2 className="font-bold text-yellow-500 tracking-widest text-sm">ADMIN PANEL</h2></div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="text-xs text-gray-500 uppercase font-bold px-4 py-2 mt-2">Core Data</p>
            <button onClick={() => setActiveTab('students')} className={`w-full text-left px-4 py-3 rounded ${activeTab === 'students' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>🎓 Data Siswa</button>
            <button onClick={() => setActiveTab('wali')} className={`w-full text-left px-4 py-3 rounded ${activeTab === 'wali' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>👨‍🏫 Wali Kelas</button>
            <button onClick={() => setActiveTab('journey')} className={`w-full text-left px-4 py-3 rounded ${activeTab === 'journey' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>🚀 Our Journey</button>
            
            <p className="text-xs text-gray-500 uppercase font-bold px-4 py-2 mt-4">Media</p>
            <button onClick={() => setActiveTab('gallery')} className={`w-full text-left px-4 py-3 rounded ${activeTab === 'gallery' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>📸 Captured Moments</button>
            <button onClick={() => setActiveTab('flashback')} className={`w-full text-left px-4 py-3 rounded ${activeTab === 'flashback' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>🎬 Flashback (Video)</button>

            <p className="text-xs text-gray-500 uppercase font-bold px-4 py-2 mt-4 text-red-400">Moderasi User</p>
            <button onClick={() => setActiveTab('signatures')} className={`w-full text-left px-4 py-3 rounded ${activeTab === 'signatures' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>✍️ Signature Wall</button>
            <button onClick={() => setActiveTab('words')} className={`w-full text-left px-4 py-3 rounded ${activeTab === 'words' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>💌 Words Unsaid</button>
            <button onClick={() => setActiveTab('playlist')} className={`w-full text-left px-4 py-3 rounded ${activeTab === 'playlist' ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}>🎵 Playlist Lagu</button>
        </nav>
        <div className="p-4 border-t border-white/5"><button onClick={() => navigate('/')} className="w-full py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition text-sm">LOG OUT</button></div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        
        {/* 1. DATA SISWA */}
        {activeTab === 'students' && (
            <div>
                <h1 className="text-3xl font-bold mb-6">Data Siswa</h1>
                {!showStudentForm ? (
                    <button onClick={() => setShowStudentForm(true)} className="bg-yellow-500 text-black px-4 py-2 rounded font-bold mb-6">+ Tambah Siswa</button>
                ) : (
                    <form onSubmit={handleSubmitStudent} className="bg-[#0f2545] p-6 rounded-xl border border-white/10 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Nama" value={studentForm.nama} onChange={e => setStudentForm({...studentForm, nama: e.target.value})} className="bg-[#0a192f] p-3 rounded text-white border border-white/10" required />
                            <input type="text" placeholder="Jabatan" value={studentForm.jabatan} onChange={e => setStudentForm({...studentForm, jabatan: e.target.value})} className="bg-[#0a192f] p-3 rounded text-white border border-white/10" required />
                            <input type="text" placeholder="Instagram" value={studentForm.instagram} onChange={e => setStudentForm({...studentForm, instagram: e.target.value})} className="bg-[#0a192f] p-3 rounded text-white border border-white/10" />
                            <input type="file" onChange={e => setStudentForm({...studentForm, file: e.target.files[0]})} className="text-sm text-gray-300" />
                        </div>
                        <div className="mt-4 flex gap-2"><button type="submit" className="bg-green-600 px-4 py-2 rounded text-white font-bold">Simpan</button><button type="button" onClick={() => setShowStudentForm(false)} className="bg-gray-600 px-4 py-2 rounded text-white">Batal</button></div>
                    </form>
                )}
                <div className="overflow-x-auto bg-[#0f2545] rounded-xl border border-white/10">
                    <table className="w-full text-left"><thead className="bg-[#0a192f] text-gray-400 text-xs uppercase"><tr><th className="px-6 py-3">Foto</th><th className="px-6 py-3">Nama</th><th className="px-6 py-3">Jabatan</th><th className="px-6 py-3 text-right">Aksi</th></tr></thead>
                        <tbody>{students.map((student) => (<tr key={student.id} className="border-t border-white/5 hover:bg-white/5"><td className="px-6 py-3"><div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">{student.foto_url && <img src={`${API_URL}/uploads/${student.foto_url}`} alt="" className="w-full h-full object-cover"/>}</div></td><td className="px-6 py-3 font-bold">{student.nama}</td><td className="px-6 py-3 text-yellow-500 text-sm">{student.jabatan}</td><td className="px-6 py-3 text-right space-x-2"><button onClick={() => handleEditStudent(student)} className="text-blue-400 text-sm font-bold">Edit</button><button onClick={() => handleDeleteStudent(student.id)} className="text-red-400 text-sm font-bold">Hapus</button></td></tr>))}</tbody></table>
                </div>
            </div>
        )}

        {/* 2. WALI KELAS */}
        {activeTab === 'wali' && (
            <div>
                <h1 className="text-3xl font-bold mb-6">Wali Kelas</h1>
                <form onSubmit={handleUpdateWali} className="bg-[#0f2545] p-6 rounded-xl border border-white/10 max-w-2xl">
                    <div className="flex gap-6 mb-4">
                         <div className="w-32 h-32 bg-gray-700 rounded-full overflow-hidden border-2 border-yellow-500 shrink-0">{(wali.file || wali.existingFoto) && <img src={wali.file ? URL.createObjectURL(wali.file) : `${API_URL}/uploads/${wali.existingFoto}`} className="w-full h-full object-cover" alt="Preview"/>}</div>
                         <div className="w-full space-y-3"><input type="text" value={wali.nama} onChange={e => setWali({...wali, nama: e.target.value})} className="w-full bg-[#0a192f] p-2 rounded text-white border border-white/10" placeholder="Nama Wali" /><input type="file" onChange={e => setWali({...wali, file: e.target.files[0]})} className="w-full text-sm text-gray-300" /></div>
                    </div>
                    <div className="mb-4"><textarea rows="3" value={wali.quote} onChange={e => setWali({...wali, quote: e.target.value})} className="w-full bg-[#0a192f] p-2 rounded text-white border border-white/10" placeholder="Quote"></textarea></div>
                    <button type="submit" className="bg-yellow-500 text-black px-6 py-2 rounded font-bold">Update Data Wali</button>
                </form>
            </div>
        )}

        {/* 3. JOURNEY */}
        {activeTab === 'journey' && (
            <div>
                <h1 className="text-3xl font-bold mb-6">Our Journey</h1>
                <form onSubmit={handleAddJourney} className="bg-[#0f2545] p-6 rounded-xl border border-white/10 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="Tahun" value={journeyForm.tahun} onChange={e => setJourneyForm({...journeyForm, tahun: e.target.value})} className="bg-[#0a192f] p-2 rounded text-white border border-white/10" />
                    <input type="text" placeholder="Judul" value={journeyForm.judul} onChange={e => setJourneyForm({...journeyForm, judul: e.target.value})} className="bg-[#0a192f] p-2 rounded text-white border border-white/10 md:col-span-2" />
                    <textarea placeholder="Deskripsi" value={journeyForm.deskripsi} onChange={e => setJourneyForm({...journeyForm, deskripsi: e.target.value})} className="bg-[#0a192f] p-2 rounded text-white border border-white/10 md:col-span-3 h-20"></textarea>
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded font-bold w-fit">Tambah Journey</button>
                </form>
                <div className="space-y-3">{journey.map(item => (<div key={item.id} className="bg-[#0f2545] p-4 rounded border-l-4 border-yellow-500 flex justify-between items-center"><div><span className="text-yellow-500 font-bold text-sm">{item.tahun}</span><h4 className="font-bold text-white">{item.judul}</h4><p className="text-gray-400 text-sm">{item.deskripsi}</p></div><button onClick={() => handleDeleteJourney(item.id)} className="text-red-400 font-bold text-sm">Hapus</button></div>))}</div>
            </div>
        )}

        {/* 4. GALLERY (UPLOAD FOTO) */}
        {activeTab === 'gallery' && (
            <div>
                <h1 className="text-3xl font-bold mb-6">Captured Moments</h1>
                <form onSubmit={handleAddGallery} className="bg-[#0f2545] p-6 rounded-xl border border-white/10 mb-8 max-w-2xl">
                    <label className="block text-gray-400 text-sm mb-2">Upload Foto Kenangan</label>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <input type="file" onChange={e => setGalleryFile(e.target.files[0])} className="text-sm text-gray-300 w-full mb-2" accept="image/*"/>
                            <input type="text" placeholder="Caption (Optional)" value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)} className="w-full bg-[#0a192f] p-2 rounded text-white border border-white/10 text-sm"/>
                        </div>
                        <button className="bg-blue-600 px-4 py-2 rounded text-white font-bold whitespace-nowrap mb-1">Upload</button>
                    </div>
                </form>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {gallery.map(item => (
                        <div key={item.id} className="relative group rounded-lg overflow-hidden aspect-square border border-white/10">
                            <img src={`${API_URL}/uploads/${item.image_url}`} alt="Gallery" className="w-full h-full object-cover" />
                            <button onClick={() => handleDeleteContent('gallery', item.id)} className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">Hapus</button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[10px] text-center text-white">{item.caption}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 5. FLASHBACK (UPLOAD VIDEO) */}
        {activeTab === 'flashback' && (
            <div>
                <h1 className="text-3xl font-bold mb-6">Flashback Video</h1>
                <form onSubmit={handleAddFlashback} className="bg-[#0f2545] p-6 rounded-xl border border-white/10 mb-8 max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-400 mb-1 block">Upload Video (MP4)</label>
                        <input type="file" accept="video/*" onChange={e => setFlashbackFile(e.target.files[0])} className="w-full bg-[#0a192f] p-3 rounded text-white border border-white/10" required />
                    </div>
                    <input type="text" placeholder="Judul Video" value={flashbackTitle} onChange={e => setFlashbackTitle(e.target.value)} className="bg-[#0a192f] p-3 rounded text-white border border-white/10" required />
                    <input type="text" placeholder="Deskripsi Singkat" value={flashbackDesc} onChange={e => setFlashbackDesc(e.target.value)} className="bg-[#0a192f] p-3 rounded text-white border border-white/10" />
                    <button className="bg-red-600 text-white font-bold py-2 rounded md:col-span-2 hover:bg-red-500 transition">Upload Video</button>
                </form>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {flashback.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-4 rounded-xl border border-white/10">
                            <video controls className="w-full h-48 object-cover rounded-lg mb-3 border border-white/5 bg-black">
                                <source src={`${API_URL}/uploads/${item.video_url}`} type="video/mp4" />
                                Browser tidak support video.
                            </video>
                            <h4 className="font-bold text-white mb-1">{item.title}</h4>
                            <p className="text-xs text-gray-400 mb-3">{item.description}</p>
                            <button onClick={() => handleDeleteContent('flashback', item.id)} className="text-red-400 text-xs border border-red-500/30 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition">Hapus Video</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 6. MODERASI SIGNATURE */}
        {activeTab === 'signatures' && (
            <div>
                 <h1 className="text-3xl font-bold mb-6">Moderasi Signature</h1>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{signatures.map(sig => (<div key={sig.id} className="bg-[#0f2545] p-4 rounded-xl border border-white/10"><h4 className="font-bold text-yellow-500">{sig.nama_pengirim}</h4><p className="text-white text-sm italic my-2">"{sig.pesan}"</p><button onClick={() => handleDeleteContent('signatures', sig.id)} className="w-full bg-red-600 text-white py-1 rounded text-xs font-bold mt-2">HAPUS</button></div>))}</div>
            </div>
        )}

        {/* 7. MODERASI WORDS */}
        {activeTab === 'words' && (
            <div>
                 <h1 className="text-3xl font-bold mb-6">Moderasi Words Unsaid</h1>
                 <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full text-left bg-[#0f2545]"><thead className="bg-[#0a192f] text-gray-400 text-xs uppercase"><tr><th className="px-6 py-3">Untuk</th><th className="px-6 py-3">Pesan</th><th className="px-6 py-3 text-right">Aksi</th></tr></thead><tbody>{words.map(word => (<tr key={word.id} className="border-t border-white/5"><td className="px-6 py-3 font-bold">{word.untuk}</td><td className="px-6 py-3 text-gray-300 italic">"{word.pesan}"</td><td className="px-6 py-3 text-right"><button onClick={() => handleDeleteContent('words', word.id)} className="text-red-400 font-bold text-sm">Hapus</button></td></tr>))}</tbody></table></div>
            </div>
        )}

        {/* 8. MODERASI PLAYLIST (UPDATE: TAMPILKAN REQUESTED BY & SOURCE ICON) */}
        {activeTab === 'playlist' && (
            <div>
                 <h1 className="text-3xl font-bold mb-6">Moderasi Playlist</h1>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {playlist.map(item => (
                        <div key={item.id} className="bg-[#0f2545] p-4 rounded-xl border border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                {/* Icon Berubah sesuai Source */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl ${item.source === 'youtube' ? 'bg-red-600' : 'bg-green-600'}`}>
                                    {item.source === 'youtube' ? '▶️' : '🎵'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white line-clamp-1">{item.song_title}</h4>
                                    <p className="text-xs text-gray-400">{item.artist}</p>
                                    {/* Menampilkan Siapa yg Request */}
                                    <p className="text-[10px] text-yellow-500 mt-1 italic">
                                        Req by: {item.requested_by || 'Anonymous'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => handleDeleteContent('playlist', item.id)} className="bg-red-600/20 text-red-400 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition text-xs font-bold">HAPUS</button>
                        </div>
                    ))}
                 </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;