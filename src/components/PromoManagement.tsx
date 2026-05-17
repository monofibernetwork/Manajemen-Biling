import React, { useState, useEffect } from 'react';
import { Gift, Plus, Search, Check, X, Calendar, Edit, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTenant } from '../contexts/TenantContext';

export function PromoManagement() {
  const { tenantId } = useTenant();
  const [promos, setPromos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    buyMonths: 3,
    getFreeMonths: 1,
    targetPackages: 'all', 
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    isActive: true,
    description: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [simulatePrice, setSimulatePrice] = useState(200000);

  useEffect(() => {
    if (!tenantId) return;
    
    const q = query(collection(db, 'promos'), where('tenantId', '==', tenantId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setPromos(data);
    });

    return () => unsubscribe();
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingPromo) {
        await updateDoc(doc(db, 'promos', editingPromo.id), formData);
      } else {
        await addDoc(collection(db, 'promos'), {
          ...formData,
          tenantId,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingPromo(null);
      resetForm();
    } catch (error) {
      console.error("Error saving promo:", error);
      alert("Gagal menyimpan promo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus promo ini?')) {
      try {
        await deleteDoc(doc(db, 'promos', id));
      } catch (error) {
        console.error("Error deleting promo:", error);
      }
    }
  };

  const handleEdit = (promo: any) => {
    setEditingPromo(promo);
    setFormData({
      name: promo.name || '',
      buyMonths: promo.buyMonths || 1,
      getFreeMonths: promo.getFreeMonths || 0,
      targetPackages: promo.targetPackages || 'all',
      startDate: promo.startDate || '',
      endDate: promo.endDate || '',
      isActive: promo.isActive ?? true,
      description: promo.description || ''
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      buyMonths: 3,
      getFreeMonths: 1,
      targetPackages: 'all',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      isActive: true,
      description: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Gift className="text-rose-500" /> Manajemen Promo & Diskon
          </h1>
          <p className="text-slate-500 text-sm mt-1">Buat paket promo berlangganan khusus pelanggan Anda.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setEditingPromo(null); setIsModalOpen(true); }}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Buat Promo Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promos.map(promo => {
          let baseSimPrice = 200000;
          let pkgName = 'Rp 200rb';
          
          if (promo.targetPackages === 'basic') { baseSimPrice = 150000; pkgName = 'Basic Rp 150rb'; }
          else if (promo.targetPackages === 'pro') { baseSimPrice = 200000; pkgName = 'Pro Rp 200rb'; }
          else if (promo.targetPackages === 'gamer') { baseSimPrice = 350000; pkgName = 'Gamer Rp 350rb'; }

          return (
          <div key={promo.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-rose-300 transition-all group">
            <div className="p-1 h-32 bg-gradient-to-r from-rose-500 to-orange-400 relative">
               <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold border border-white/30">
                 {promo.isActive ? 'Aktif' : 'Tidak Aktif'}
               </div>
               <div className="absolute -bottom-6 left-6 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100">
                  <Gift className="text-rose-500" size={24} />
               </div>
            </div>
            <div className="p-6 pt-10">
              <h3 className="font-bold text-lg text-slate-900 mb-1">{promo.name}</h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{promo.description || 'Tidak ada deskripsi'}</p>
              
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mekanisme</span>
                </div>
                <p className="text-sm font-medium text-slate-800">
                  Beli <strong className="text-primary-600 px-1">{promo.buyMonths} Bulan</strong> 
                  <span className="mx-1">→</span>
                  Gratis <strong className="text-emerald-600 px-1">{promo.getFreeMonths} Bulan</strong>
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  <span>Berlaku: <strong className="text-slate-800">{promo.startDate}</strong> s/d <strong className="text-slate-800">{promo.endDate}</strong></span>
                </div>
              </div>

              <div className="mb-4 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-2">Simulasi Pelanggan (Cth: Paket {pkgName})</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Bayar {promo.buyMonths} Bulan</span>
                    <span className="font-semibold text-slate-700">Rp {(promo.buyMonths * baseSimPrice).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Normal {promo.buyMonths + promo.getFreeMonths} Bulan</span>
                    <span className="line-through text-slate-400">Rp {((promo.buyMonths + promo.getFreeMonths) * baseSimPrice).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-emerald-100 mt-1">
                    <span className="font-bold text-emerald-700">Pelanggan Hemat</span>
                    <span className="font-bold text-emerald-600">Rp {(promo.getFreeMonths * baseSimPrice).toLocaleString('id-ID')}!</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => handleEdit(promo)}
                  className="flex-1 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl transition-colors border border-slate-200"
                >
                  Edit Promo
                </button>
                <button 
                  onClick={() => handleDelete(promo.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
          );
        })}
        
        {promos.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border border-slate-200 border-dashed rounded-2xl">
            <div className="p-4 bg-slate-50 rounded-full inline-block mb-4 text-slate-400">
              <Gift size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Belum Ada Promo</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Tingkatkan retensi dan ajak pelanggan berlangganan jangka panjang dengan promo khusus.</p>
            <button 
              onClick={() => { resetForm(); setEditingPromo(null); setIsModalOpen(true); }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-medium transition-colors"
            >
              Buat Promo Pertama
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gift className="text-rose-500" size={20} />
                {editingPromo ? 'Edit Promo' : 'Buat Promo Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Promo</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Contoh: Promo Beli 3 Gratis 1 Bulan"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-rose-50 p-4 rounded-xl border border-rose-100">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Bayar Untuk (Bulan)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.buyMonths}
                    onChange={e => setFormData({...formData, buyMonths: parseInt(e.target.value)})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Gratis (Bulan)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.getFreeMonths}
                    onChange={e => setFormData({...formData, getFreeMonths: parseInt(e.target.value)})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center mb-2 border-b border-emerald-100 pb-2">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Simulasi untuk Pelanggan</h4>
                  <select 
                    value={simulatePrice}
                    onChange={(e) => setSimulatePrice(Number(e.target.value))}
                    className="text-xs bg-white border border-emerald-200 rounded px-2 py-1 text-emerald-700 outline-none"
                  >
                    <option value={150000}>Basic (Rp 150.000)</option>
                    <option value={200000}>Pro (Rp 200.000)</option>
                    <option value={350000}>Gamer (Rp 350.000)</option>
                  </select>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Total Harga Normal ({formData.buyMonths + formData.getFreeMonths} Bulan)</span>
                  <span className="text-slate-400 line-through">Rp {((formData.buyMonths + formData.getFreeMonths) * simulatePrice).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Terlihat di Aplikasi (Bayar {formData.buyMonths} Bulan)</span>
                  <span className="font-bold text-slate-800">Rp {(formData.buyMonths * simulatePrice).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-emerald-200">
                  <span className="font-bold text-emerald-700">Keuntungan Pelanggan (Hemat)</span>
                  <span className="font-extrabold text-emerald-600">Rp {(formData.getFreeMonths * simulatePrice).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tgl Berakhir</label>
                  <input 
                    type="date" 
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Target Paket</label>
                  <select 
                    value={formData.targetPackages}
                    onChange={e => setFormData({...formData, targetPackages: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="all">Semua Paket Internet</option>
                    <option value="basic">Hanya Paket Basic (10 Mbps)</option>
                    <option value="pro">Hanya Paket Pro (20 Mbps)</option>
                    <option value="gamer">Hanya Paket Gamer (50 Mbps)</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status Promo</label>
                  <select 
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={e => setFormData({...formData, isActive: e.target.value === 'active'})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Deskripsi (Opsional)</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Keterangan singkat mengenai promo ini..."
                  rows={3}
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
