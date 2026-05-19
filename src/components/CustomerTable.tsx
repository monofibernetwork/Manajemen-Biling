import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Customer } from '../types';
import { Wifi, WifiOff, MoreVertical, X, Phone, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Search, Edit3, Loader2, SlidersHorizontal, Check, History, Activity, Clock, Calendar, RefreshCw, Server, Ban } from 'lucide-react';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

interface CustomerTableProps {
  customers: Customer[];
  setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>;
}

type SortKey = 'name' | 'speedPlan' | 'pppoeUsername' | 'status' | 'uptime' | 'ontSerialNumber' | 'ontRxPower' | 'paymentStatus';

import { useTenant } from '../contexts/TenantContext';

export function CustomerTable({ customers, setCustomers }: CustomerTableProps) {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{id: string, name: string} | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    user: true,
    planIp: true,
    credentials: true,
    pppoe: true,
    snOnt: true,
    rxPower: true,
    traffic: true,
    uptime: true,
  });
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const addSnOntRef = useRef<HTMLInputElement>(null);
  const editSnOntRef = useRef<HTMLInputElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncMikrotik = async () => {
    setIsSyncing(true);
    try {
      // Simulate API call to MikroTik router to fetch live PPPoE stats
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatePromises = customers.map(async cust => {
        // Randomly simulate some customers changing state
        const isOnline = Math.random() > 0.15; // 85% chance online
        const newUptime = isOnline ? `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m` : '0h 0m 0s';
        const newRxPower = isOnline ? -(Math.random() * 10 + 15).toFixed(2) + ' dBm' : 'N/A';
        const newCurrentUpload = isOnline ? (Math.random() * 20).toFixed(1) + ' Mbps' : '0 Mbps';
        const newCurrentDownload = isOnline ? (Math.random() * 50).toFixed(1) + ' Mbps' : '0 Mbps';

        const updatedData = {
          status: isOnline ? 'online' : 'offline',
          uptime: cust.status === 'isolir' ? cust.uptime : newUptime,
          ontRxPower: cust.status === 'isolir' ? cust.ontRxPower : newRxPower,
          currentUpload: cust.status === 'isolir' ? '0 Mbps' : newCurrentUpload,
          currentDownload: cust.status === 'isolir' ? '0 Mbps' : newCurrentDownload
        };

        await updateDoc(doc(db, 'customers', cust.id), updatedData);
        
        return {
          ...cust,
          ...updatedData
        };
      });

      const newCustomers = await Promise.all(updatePromises);

      if (setCustomers) {
        setCustomers(newCustomers as Customer[]);
      }
      
      setNotification({ message: 'Sinkronisasi berhasil', type: 'success' });
      
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Sinkronisasi gagal', type: 'error' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  useEffect(() => {
    if (isAddFormOpen) {
      setTimeout(() => addSnOntRef.current?.focus(), 100);
    }
  }, [isAddFormOpen]);

  useEffect(() => {
    if (customerToEdit) {
      setTimeout(() => editSnOntRef.current?.focus(), 100);
    }
  }, [customerToEdit]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setIsColumnMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [newUser, setNewUser] = useState({
    name: '', address: '', phone: '', pppoeUsername: '', pppoePassword: '', ontSerialNumber: '', speedPlan: '50 Mbps', referredByCode: ''
  });
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fake status fluctuation removed since we use Real-time Firebase
  }, [setCustomers]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCustomers = useMemo(() => {
    let sortableItems = [...customers];
    
    if (paymentStatusFilter !== 'all') {
      sortableItems = sortableItems.filter(c => c.paymentStatus === paymentStatusFilter);
    }
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      sortableItems = sortableItems.filter(c => 
        c.name.toLowerCase().includes(lowerSearch) ||
        c.id.toLowerCase().includes(lowerSearch) ||
        c.pppoeUsername.toLowerCase().includes(lowerSearch) ||
        (c.ontSerialNumber && c.ontSerialNumber.toLowerCase().includes(lowerSearch))
      );
    }
    
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal: any = a[sortConfig.key] || '';
        let bVal: any = b[sortConfig.key] || '';
        
        if (sortConfig.key === 'uptime') {
          const parseUptime = (uptimeStr: string) => {
            if (uptimeStr === '0h 0m 0s' || uptimeStr === '-') return 0;
            let totalSeconds = 0;
            const matchD = uptimeStr.match(/(\d+)d/);
            const matchH = uptimeStr.match(/(\d+)h/);
            const matchM = uptimeStr.match(/(\d+)m/);
            const matchS = uptimeStr.match(/(\d+)s/);
            if (matchD) totalSeconds += parseInt(matchD[1]) * 86400;
            if (matchH) totalSeconds += parseInt(matchH[1]) * 3600;
            if (matchM) totalSeconds += parseInt(matchM[1]) * 60;
            if (matchS) totalSeconds += parseInt(matchS[1]);
            return totalSeconds;
          };
          aVal = parseUptime(aVal as string);
          bVal = parseUptime(bVal as string);
        } else {
          aVal = String(aVal).toLowerCase();
          bVal = String(bVal).toLowerCase();
        }

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [customers, sortConfig]);

  const renderSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown size={14} className="text-slate-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp size={14} className="text-primary-600" />;
    }
    return <ArrowDown size={14} className="text-primary-600" />;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setCustomers) return;

    if (!newUser.name.trim()) {
      setFormError('Nama pelanggan tidak boleh kosong.');
      return;
    }
    if (!newUser.phone.trim() || !/^\d{10,15}$/.test(newUser.phone.replace(/\D/g, ''))) {
      setFormError('Nomor telepon harus berupa angka (10-15 digit).');
      return;
    }
    if (!newUser.address.trim()) {
      setFormError('Alamat tidak boleh kosong.');
      return;
    }
    if (!newUser.pppoeUsername.trim() || /\s/.test(newUser.pppoeUsername)) {
      setFormError('Username PPPoE tidak boleh kosong dan tidak boleh mengandung spasi.');
      return;
    }
    if (!newUser.speedPlan.trim()) {
      setFormError('Paket harus dipilih.');
      return;
    }
    
    if (newUser.ontSerialNumber && !/^[a-zA-Z0-9]{12,16}$/.test(newUser.ontSerialNumber)) {
      setFormError('SN ONT tidak valid! Harus berupa 12-16 karakter alphanumeric.');
      return;
    }
    setFormError(null);
    
    setIsLoading(true);
    setLoadingMessage('Menambahkan pelanggan baru...');

    try {
      let billingAmount = 150000;
      if (newUser.speedPlan === '100 Mbps') billingAmount = 230000;
      if (newUser.speedPlan === '200 Mbps') billingAmount = 330000;

      const newId = `CUST-00${Date.now().toString().slice(-4)}`;
      const generatedReferralCode = newId.replace('-', '') + Math.random().toString(36).substring(2, 5).toUpperCase();
      let referredByRefId = null;

      if (newUser.referredByCode) {
        const referredCustomer = customers.find(c => c.referralCode === newUser.referredByCode);
        if (referredCustomer) {
          referredByRefId = referredCustomer.id;
          const currentCount = referredCustomer.referralCount || 0;
          const newCount = currentCount + 1;
          
          let updatesToReferrer: any = { referralCount: newCount };
          if (newCount % 3 === 0) {
             updatesToReferrer.billingAmount = 0; // free internet for 1 month
          }
          await updateDoc(doc(db, 'customers', referredCustomer.id), updatesToReferrer);
        }
      }

      const newCustomer: Customer = {
        id: newId,
        name: newUser.name,
        address: newUser.address,
        phone: newUser.phone,
        pppoeUsername: newUser.pppoeUsername,
        pppoePassword: newUser.pppoePassword,
        ontSerialNumber: newUser.ontSerialNumber,
        speedPlan: newUser.speedPlan,
        status: 'offline',
        ipAddress: '192.168.10.' + Math.floor(Math.random() * 200 + 10),
        uptime: '0h 0m 0s',
        paymentStatus: 'unpaid',
        billingAmount: billingAmount,
        referralCode: generatedReferralCode,
        referredBy: referredByRefId || undefined,
        referralCount: 0,
        tenantId
      } as any;

      await setDoc(doc(db, 'customers', newCustomer.id), newCustomer);

      setIsAddFormOpen(false);
      setNewUser({ name: '', address: '', phone: '', pppoeUsername: '', pppoePassword: '', ontSerialNumber: '', speedPlan: '50 Mbps', referredByCode: '' });
      let msg = `Customer added to Database.`;
      if (referredByRefId) msg += ` Referral accepted!`;
      alert(msg);
    } catch (err: any) {
      setFormError('Error saving to Database: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setCustomers || !customerToEdit) return;

    if (customerToEdit.ontSerialNumber && !/^[a-zA-Z0-9]{12,16}$/.test(customerToEdit.ontSerialNumber)) {
      setEditFormError('SN ONT tidak valid! Harus berupa 12-16 karakter alphanumeric.');
      return;
    }
    setEditFormError(null);

    setIsLoading(true);
    setLoadingMessage('Menyimpan perubahan pelanggan...');

    try {
      let billingAmount = 150000;
      if (customerToEdit.speedPlan === '100 Mbps') billingAmount = 230000;
      if (customerToEdit.speedPlan === '200 Mbps') billingAmount = 330000;

      const updatedCustomer = { ...customerToEdit, billingAmount };
      await updateDoc(doc(db, 'customers', customerToEdit.id), updatedCustomer as any);
      
      setCustomerToEdit(null);
      setNotification({ message: `Data pelanggan ${customerToEdit.name} berhasil diperbarui.`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setEditFormError('Error updating Database: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setCustomerToDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (!setCustomers || !customerToDelete) return;
    
    setIsLoading(true);
    setLoadingMessage('Menghapus pelanggan...');
    
    try {
      await deleteDoc(doc(db, 'customers', customerToDelete.id));
      setCustomerToDelete(null);
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIsolir = async (id: string, name: string) => {
    if (!confirm(`Anda yakin ingin mengisolir pelanggan ${name}?`)) return;
    setIsLoading(true);
    setLoadingMessage(`Mengisolir pelanggan ${name}...`);
    try {
      await updateDoc(doc(db, 'customers', id), { 
        status: 'isolir',
        isIsolated: true 
      });
      setNotification({ message: `Pelanggan ${name} berhasil diisolir.`, type: 'success' });
    } catch (err: any) {
      alert('Error mengisolir pelanggan: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportHtml = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Data Export</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 2rem; color: #333; }
        h1 { color: #1a56db; margin-bottom: 0.5rem; }
        p { color: #6b7280; margin-bottom: 2rem; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f9fafb; color: #374151; font-weight: 600; }
        tr:hover { background-color: #f3f4f6; }
        .status-online { color: #059669; font-weight: 600; }
        .status-offline { color: #dc2626; font-weight: 600; }
        .badge { padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
        .badge-unpaid { background-color: #fef2f2; color: #dc2626; }
        .badge-paid { background-color: #ecfdf5; color: #059669; }
        .badge-overdue { background-color: #fffbeb; color: #d97706; }
    </style>
</head>
<body>
    <h1>Laporan Data Pelanggan</h1>
    <p>Diekspor pada: ${new Date().toLocaleString('id-ID')}</p>
    <table>
        <thead>
            <tr>
                <th>Customer</th>
                <th>Paket</th>
                <th>Status Konek</th>
                <th>IP Address</th>
                <th>Status Pembayaran</th>
            </tr>
        </thead>
        <tbody>
            ${sortedCustomers.map(c => `
                <tr>
                    <td>
                        <strong>${c.name}</strong><br>
                        <span style="font-size: 13px; color: #6b7280;">ID: ${c.id} | ${c.phone}</span>
                    </td>
                    <td>${c.speedPlan}</td>
                    <td class="${c.status === 'online' ? 'status-online' : 'status-offline'}">
                        ${c.status === 'online' ? 'Online' : 'Offline'}
                    </td>
                    <td style="font-family: monospace;">${c.ipAddress}</td>
                    <td>
                        <span class="badge badge-${c.paymentStatus}">${c.paymentStatus.toUpperCase()}</span>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_Pelanggan_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl p-4 transition-all">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-700">{loadingMessage}</p>
          </div>
        </div>
      )}
      
      {customerToDelete && (
        <div className="absolute inset-0 z-20 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center rounded-3xl p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Hapus</h3>
            <p className="text-sm text-slate-400 mb-6">
              Anda yakin ingin menghapus data pelanggan <strong>{customerToDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 hover:bg-white text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-rose-600/20 flex items-center gap-2"
              >
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {customerToEdit && (
        <div className="absolute inset-0 z-10 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center rounded-3xl p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Edit Data Pelanggan</h3>
              <button 
                onClick={() => setCustomerToEdit(null)}
                className="text-slate-500 hover:text-slate-700 p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {editFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm flex items-center gap-2">
                  <Activity size={16} />
                  <span>{editFormError}</span>
                </div>
              )}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Nama Lengkap</label>
                <input required type="text" value={customerToEdit.name} onChange={e => setCustomerToEdit({...customerToEdit, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-600" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">WhatsApp (WA)</label>
                  <input required type="text" placeholder="0821..." value={customerToEdit.phone} onChange={e => setCustomerToEdit({...customerToEdit, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-600 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Username PPPoE</label>
                  <input required type="text" value={customerToEdit.pppoeUsername} onChange={e => setCustomerToEdit({...customerToEdit, pppoeUsername: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-600 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Password PPPoE</label>
                  <input required type="text" value={customerToEdit.pppoePassword} onChange={e => setCustomerToEdit({...customerToEdit, pppoePassword: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-600 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">SN ONT (Opsional)</label>
                  <input ref={editSnOntRef} type="text" placeholder="Contoh: ZTEG12345678 (SN ONT)" title="SN ONT harus berupa alphanumeric dengan panjang 12 hingga 16 karakter" value={customerToEdit.ontSerialNumber || ''} onChange={e => setCustomerToEdit({...customerToEdit, ontSerialNumber: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 16)})} className={`w-full bg-slate-50 border ${customerToEdit.ontSerialNumber && !/^[a-zA-Z0-9]{12,16}$/.test(customerToEdit.ontSerialNumber) ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:border-primary-600'} rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-100 font-mono uppercase transition-colors`} />
                  {customerToEdit.ontSerialNumber && !/^[a-zA-Z0-9]{12,16}$/.test(customerToEdit.ontSerialNumber) && (
                    <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                      <Activity size={10} />
                      Harus 12-16 karakter alphanumeric
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Alamat</label>
                <input required type="text" value={customerToEdit.address} onChange={e => setCustomerToEdit({...customerToEdit, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-600" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Paket Internet</label>
                <select value={customerToEdit.speedPlan} onChange={e => setCustomerToEdit({...customerToEdit, speedPlan: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-600">
                  <option value="50 Mbps">50 Mbps (Rp 150.000)</option>
                  <option value="100 Mbps">100 Mbps (Rp 230.000)</option>
                  <option value="200 Mbps">200 Mbps (Rp 330.000)</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-slate-200">
                <button type="button" onClick={() => setCustomerToEdit(null)} className="px-4 py-2 hover:bg-white text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200">Batal</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-primary-600/20 flex items-center gap-2">
                  <Edit3 size={16} /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {isAddFormOpen && (
        <div className="absolute inset-0 z-10 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center rounded-3xl p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Tambah Pelanggan Baru</h3>
              <button 
                onClick={() => setIsAddFormOpen(false)}
                className="text-slate-500 hover:text-slate-700 p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm flex items-center gap-2">
                  <Activity size={16} />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Nama Lengkap</label>
                <input 
                  required 
                  type="text" 
                  value={newUser.name} 
                  onChange={e => {
                    const newName = e.target.value;
                    const oldGen = newUser.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const isVirginUser = !newUser.pppoeUsername || newUser.pppoeUsername === oldGen;
                    const isVirginPass = !newUser.pppoePassword || newUser.pppoePassword === oldGen;
                    const generatedValue = newName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    setNewUser({
                      ...newUser, 
                      name: newName,
                      pppoeUsername: isVirginUser ? generatedValue : newUser.pppoeUsername,
                      pppoePassword: isVirginPass ? generatedValue : newUser.pppoePassword
                    });
                  }} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-600" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">WhatsApp (WA)</label>
                  <input required type="text" placeholder="0821..." value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-600 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Username PPPoE</label>
                  <input required type="text" value={newUser.pppoeUsername} onChange={e => setNewUser({...newUser, pppoeUsername: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-600 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Password PPPoE</label>
                  <input required type="text" value={newUser.pppoePassword} onChange={e => setNewUser({...newUser, pppoePassword: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-600 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">SN ONT (Opsional)</label>
                  <input ref={addSnOntRef} type="text" placeholder="Contoh: ZTEG12345678 (SN ONT)" title="SN ONT harus berupa alphanumeric dengan panjang 12 hingga 16 karakter" value={newUser.ontSerialNumber} onChange={e => setNewUser({...newUser, ontSerialNumber: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 16)})} className={`w-full bg-slate-50 border ${newUser.ontSerialNumber && !/^[a-zA-Z0-9]{12,16}$/.test(newUser.ontSerialNumber) ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:border-primary-600'} rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-100 font-mono uppercase transition-colors`} />
                  {newUser.ontSerialNumber && !/^[a-zA-Z0-9]{12,16}$/.test(newUser.ontSerialNumber) && (
                    <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                      <Activity size={10} />
                      Harus 12-16 karakter alphanumeric
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Alamat</label>
                <input required type="text" value={newUser.address} onChange={e => setNewUser({...newUser, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-600" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Paket Internet</label>
                <select value={newUser.speedPlan} onChange={e => setNewUser({...newUser, speedPlan: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-600">
                  <option value="50 Mbps">50 Mbps (Rp 150.000)</option>
                  <option value="100 Mbps">100 Mbps (Rp 230.000)</option>
                  <option value="200 Mbps">200 Mbps (Rp 330.000)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Kode Referral (Opsional)</label>
                <input type="text" value={newUser.referredByCode} onChange={e => setNewUser({...newUser, referredByCode: e.target.value})} placeholder="Masukkan kode referral teman" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-600 font-mono uppercase" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-slate-200">
                <button type="button" onClick={() => setIsAddFormOpen(false)} className="px-4 py-2 hover:bg-white text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200">Batal</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-primary-600/20">Simpan User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">PPPoE Active Users</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-500 uppercase">Live</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Total {customers.length} subscribers in database</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-700 outline-none focus:border-primary-500 appearance-none pr-8 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors"
            >
              <option value="all">Semua Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text" 
              placeholder="Cari pelanggan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-primary-600 transition-colors"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          
          <div className="relative" ref={columnMenuRef}>
            <button 
              onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center shadow-sm"
              title="Pilih Kolom"
            >
              <SlidersHorizontal size={16} />
            </button>
            {isColumnMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2">
                <div className="px-3 pb-2 mb-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tampilkan Kolom</div>
                {[
                  { id: 'user', label: 'User' },
                  { id: 'planIp', label: 'Plan & IP' },
                  { id: 'credentials', label: 'Credentials' },
                  { id: 'pppoe', label: 'PPPoE Status' },
                  { id: 'snOnt', label: 'SN ONT' },
                  { id: 'rxPower', label: 'Rx Power' },
                  { id: 'traffic', label: 'Status & Traffic' },
                  { id: 'uptime', label: 'Uptime' }
                ].map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setVisibleCols(prev => ({ ...prev, [col.id]: !prev[col.id as keyof typeof visibleCols] }))}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span>{col.label}</span>
                    {visibleCols[col.id as keyof typeof visibleCols] && <Check size={14} className="text-primary-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={handleSyncMikrotik}
            disabled={isSyncing}
            className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 rounded-xl text-xs transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Server size={14} className={isSyncing ? "animate-pulse" : ""} />
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Menyinkronkan..." : "Sinkronisasi Data"}
          </button>
          <button onClick={handleExportHtml} className="bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl text-xs transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export HTML
          </button>
          <button onClick={() => setIsAddFormOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-primary-500/20 whitespace-nowrap">
            <span>+</span> Add User
          </button>
        </div>
      </div>
      {notification && (
        <div className={`mx-6 mt-4 p-3 rounded-xl border flex items-center gap-3 animate-in fade-in ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
          {notification.type === 'success' ? <Check size={16} /> : <Activity size={16} />}
          <p className="text-xs">{notification.message}</p>
        </div>
      )}
      <div className="overflow-x-auto hidden sm:block -mx-4 sm:mx-0">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
          <thead className="bg-white/80 text-slate-500 border-b border-slate-200">
            <tr>
              {visibleCols.user && (
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs tracking-wider uppercase">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="cursor-pointer hover:text-slate-700 transition-colors flex items-center gap-1" onClick={() => handleSort('name')}>
                    User {renderSortIcon('name')}
                  </span>
                  <span className="cursor-pointer hover:text-slate-700 transition-colors flex items-center gap-1" onClick={() => handleSort('status')}>
                    Status {renderSortIcon('status')}
                  </span>
                  <span className="cursor-pointer hover:text-slate-700 transition-colors flex items-center gap-1" onClick={() => handleSort('paymentStatus')}>
                    Payment {renderSortIcon('paymentStatus')}
                  </span>
                </div>
              </th>
              )}
              {visibleCols.planIp && (
              <th className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs tracking-wider uppercase cursor-pointer hover:bg-white transition-colors" onClick={() => handleSort('speedPlan')}>
                <div className="flex items-center gap-1">Plan & IP {renderSortIcon('speedPlan')}</div>
              </th>
              )}
              {visibleCols.credentials && (
              <th className="hidden md:table-cell px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs tracking-wider uppercase cursor-pointer hover:bg-white transition-colors" onClick={() => handleSort('pppoeUsername')}>
                <div className="flex items-center gap-1">Credentials {renderSortIcon('pppoeUsername')}</div>
              </th>
              )}
              {visibleCols.pppoe && (
              <th className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs tracking-wider uppercase cursor-pointer hover:bg-white transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">PPPoE {renderSortIcon('status')}</div>
              </th>
              )}
              {visibleCols.snOnt && (
              <th className="hidden lg:table-cell px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs tracking-wider uppercase cursor-pointer hover:bg-white transition-colors" onClick={() => handleSort('ontSerialNumber')}>
                <div className="flex items-center gap-1">SN ONT {renderSortIcon('ontSerialNumber')}</div>
              </th>
              )}
              {visibleCols.rxPower && (
              <th className="hidden lg:table-cell px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs tracking-wider uppercase cursor-pointer hover:bg-white transition-colors" onClick={() => handleSort('ontRxPower')}>
                <div className="flex items-center gap-1">Rx Power {renderSortIcon('ontRxPower')}</div>
              </th>
              )}
              {visibleCols.traffic && (
              <th className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs tracking-wider uppercase cursor-pointer hover:bg-white transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">Traffic {renderSortIcon('status')}</div>
              </th>
              )}
              {visibleCols.uptime && (
              <th className="hidden md:table-cell px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs tracking-wider uppercase cursor-pointer hover:bg-white transition-colors" onClick={() => handleSort('uptime')}>
                <div className="flex items-center gap-1">Uptime {renderSortIcon('uptime')}</div>
              </th>
              )}
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs tracking-wider uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {isInitialLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skel-desk-${i}`} className="animate-pulse">
                  {visibleCols.user && (
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-slate-200"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-20 sm:w-24"></div>
                        <div className="h-3 bg-slate-200 rounded w-16"></div>
                      </div>
                    </div>
                  </td>
                  )}
                  {visibleCols.planIp && (
                  <td className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                    <div className="h-3 bg-slate-200 rounded w-24"></div>
                  </td>
                  )}
                  {visibleCols.credentials && (
                  <td className="hidden md:table-cell px-4 sm:px-6 py-3 sm:py-4 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                  </td>
                  )}
                  {visibleCols.pppoe && (
                  <td className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4">
                    <div className="h-6 w-20 bg-slate-200 rounded-lg"></div>
                  </td>
                  )}
                  {visibleCols.snOnt && (
                  <td className="hidden lg:table-cell px-4 sm:px-6 py-3 sm:py-4">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </td>
                  )}
                  {visibleCols.rxPower && (
                  <td className="hidden lg:table-cell px-4 sm:px-6 py-3 sm:py-4">
                    <div className="h-4 bg-slate-200 rounded w-16"></div>
                  </td>
                  )}
                  {visibleCols.traffic && (
                  <td className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-16"></div>
                    <div className="h-3 bg-slate-200 rounded w-20"></div>
                  </td>
                  )}
                  {visibleCols.uptime && (
                  <td className="hidden md:table-cell px-4 sm:px-6 py-3 sm:py-4">
                    <div className="h-4 bg-slate-200 rounded w-16"></div>
                  </td>
                  )}
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                    <div className="h-8 w-16 bg-slate-200 rounded ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : sortedCustomers.map((cust) => (
               <tr 
                key={cust.id} 
                className={`hover:bg-white/30 transition-colors group cursor-pointer`}
                onClick={() => navigate(`/customers/${cust.id}`)}
              >
                {visibleCols.user && (
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 rounded-full bg-white text-slate-400 flex items-center justify-center font-bold text-[10px] sm:text-xs uppercase border border-slate-300 shrink-0">
                      {cust.name.substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <div 
                          className="font-semibold text-slate-900 hover:text-primary-600 hover:underline cursor-pointer text-xs sm:text-sm transition-colors"
                          onClick={(e) => { e.stopPropagation(); navigate(`/customers/${cust.id}`); }}
                        >
                          {cust.name}
                        </div>
                        {cust.status === 'online' ? (
                          <Wifi size={14} className="text-emerald-500 shrink-0" />
                        ) : (
                          <WifiOff size={14} className="text-rose-500 shrink-0" />
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          cust.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          cust.paymentStatus === 'overdue' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {cust.paymentStatus}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mb-0.5 max-w-[150px] sm:max-w-xs truncate">{cust.address}</div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-600 font-mono shrink-0">
                          <Phone size={10} />
                          {cust.phone}
                        </div>
                        <div className="sm:hidden flex items-center gap-1 shrink-0">
                          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                          <span className="text-slate-600 font-mono text-[9px]">{cust.speedPlan}</span>
                          <span className="text-primary-500 font-mono text-[9px] ml-0.5">{cust.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                )}
                {visibleCols.planIp && (
                <td className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white text-slate-700 text-[10px] font-mono border border-slate-300 mb-1">
                    <Wifi size={12} className="text-slate-400" />
                    {cust.speedPlan}
                  </div>
                  <div className="text-primary-600 font-mono text-[10px] sm:text-[11px] block">{cust.ipAddress}</div>
                </td>
                )}
                {visibleCols.credentials && (
                <td className="hidden md:table-cell px-4 sm:px-6 py-3 sm:py-4 font-mono text-slate-400 text-[11px] leading-relaxed">
                  <div><span className="text-slate-400">USR:</span> <span className="text-slate-700">{cust.pppoeUsername}</span></div>
                  {cust.pppoePassword && <div><span className="text-slate-400">PWD:</span> <span className="text-slate-700">{cust.pppoePassword}</span></div>}
                </td>
                )}
                {visibleCols.pppoe && (
                <td className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4">
                  {cust.status === 'online' ? (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
                      Conn
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-rose-100 text-rose-800 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest border border-rose-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
                      Disc
                    </span>
                  )}
                </td>
                )}
                {visibleCols.snOnt && (
                <td className="hidden lg:table-cell px-4 sm:px-6 py-3 sm:py-4 font-mono text-slate-900 text-[11px] uppercase">
                  {cust.ontSerialNumber ? <span className="text-primary-600">{cust.ontSerialNumber}</span> : <span className="text-slate-400">-</span>}
                </td>
                )}
                {visibleCols.rxPower && (
                <td className="hidden lg:table-cell px-4 sm:px-6 py-3 sm:py-4">
                  <div className={`font-mono text-[10px] sm:text-xs ${cust.status === 'online' ? (!cust.ontRxPower ? 'text-slate-400' : parseFloat(cust.ontRxPower) < -27 ? 'text-rose-600 font-bold' : 'text-emerald-600') : 'text-slate-400'}`}>
                    {cust.status === 'online' ? (cust.ontRxPower || '-') : '-'}
                  </div>
                </td>
                )}
                {visibleCols.traffic && (
                <td className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4">
                  {cust.status === 'online' ? (
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-400/10 text-emerald-600 text-[10px] font-mono font-semibold uppercase tracking-widest border border-emerald-400/20 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        UP
                      </span>
                      <div className="text-[10px] font-mono leading-tight">
                        <div className="text-slate-400 flex items-center justify-between gap-2 max-w-[100px]">
                          <span className="text-slate-400">DL:</span>
                          <span className="text-emerald-600">{cust.currentDownload || '0 Mbps'}</span>
                        </div>
                        <div className="text-slate-400 flex items-center justify-between gap-2 max-w-[100px]">
                          <span className="text-slate-400">UL:</span>
                          <span className="text-primary-600">{cust.currentUpload || '0 Mbps'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-400/10 text-rose-600 text-[10px] font-mono font-semibold uppercase tracking-widest border border-rose-400/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        DOWN
                      </span>
                    </div>
                  )}
                </td>
                )}
                {visibleCols.uptime && (
                <td className="hidden md:table-cell px-4 sm:px-6 py-3 sm:py-4 text-slate-500 font-mono text-[10px] sm:text-xs">
                  {cust.uptime !== '0h 0m 0s' ? cust.uptime : '-'}
                </td>
                )}
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(cust.id, cust.name); }}
                      className="text-slate-500 hover:text-rose-500 p-2 rounded-lg hover:bg-white transition-colors"
                      title="Hapus Pelanggan"
                    >
                      <Trash2 size={16} />
                    </button>
                    {(cust.status !== 'isolir' && !cust.isIsolated) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleIsolir(cust.id, cust.name); }}
                        className="text-slate-500 hover:text-amber-500 p-2 rounded-lg hover:bg-white transition-colors"
                        title="Isolir Pelanggan"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                    <button 
                      className="text-slate-500 hover:text-primary-700 p-2 rounded-lg hover:bg-primary-50 border border-transparent hover:border-primary-200 active:text-primary-800 active:bg-primary-100 transition-all shadow-sm"
                      onClick={(e) => { e.stopPropagation(); setCustomerToEdit(cust); }}
                      title="Edit Detail"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden flex flex-col divide-y divide-slate-100">
        {isInitialLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`skel-mob-${i}`} className="p-4 flex items-start gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
              <div className="w-full space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                <div className="h-16 bg-slate-100 rounded-xl mt-3"></div>
              </div>
            </div>
          ))
        ) : sortedCustomers.map(cust => (
          <div 
            key={`mob-${cust.id}`} 
            className={`p-4 bg-white hover:bg-slate-50 transition-colors flex flex-col gap-3 cursor-pointer`}
            onClick={() => navigate(`/customers/${cust.id}`)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                  {cust.name.substring(0, 2)}
                </div>
                <div className="overflow-hidden">
                  <h4 
                    className="font-semibold text-slate-900 hover:text-primary-600 hover:underline cursor-pointer text-sm leading-tight flex items-center gap-1.5 truncate transition-colors"
                    onClick={(e) => { e.stopPropagation(); navigate(`/customers/${cust.id}`); }}
                  >
                    <span className="truncate">{cust.name}</span>
                    {cust.status === 'online' ? (
                      <Wifi size={14} className="text-emerald-500 shrink-0" />
                    ) : (
                      <WifiOff size={14} className="text-rose-500 shrink-0" />
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{cust.address}</p>
                  <p className="text-[10px] font-mono text-emerald-600 mt-0.5 flex items-center gap-1">
                    <Phone size={10} /> {cust.phone}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0 z-10">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(cust.id, cust.name); }} className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors" title="Hapus Pelanggan"><Trash2 size={16} /></button>
                  {(cust.status !== 'isolir' && !cust.isIsolated) && (
                    <button onClick={(e) => { e.stopPropagation(); handleIsolir(cust.id, cust.name); }} className="text-slate-400 hover:text-amber-500 p-1 rounded transition-colors" title="Isolir Pelanggan"><Ban size={16} /></button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); setCustomerToEdit(cust); }} className="text-slate-400 hover:text-primary-700 hover:bg-primary-50 p-1 rounded border border-transparent hover:border-primary-200 active:text-primary-800 active:bg-primary-100 transition-all shadow-sm" title="Edit Detail"><Edit3 size={16} /></button>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                  cust.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                  cust.paymentStatus === 'overdue' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {cust.paymentStatus}
                </span>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-10">Plan</span>
                  <span className="text-xs font-semibold text-slate-800">{cust.speedPlan}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">IP</span>
                  <span className="text-[11px] font-mono text-primary-600 font-medium">{cust.ipAddress}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-10">PPPoE</span>
                  {cust.status === 'online' ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Conn
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-mono font-bold uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                      Disc
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Rx</span>
                  <span className={`font-mono text-[10px] font-medium ${cust.status === 'online' ? (!cust.ontRxPower ? 'text-slate-400' : parseFloat(cust.ontRxPower) < -27 ? 'text-rose-600 font-bold' : 'text-emerald-600') : 'text-slate-400'}`}>
                    {cust.status === 'online' ? (cust.ontRxPower || '-') : '-'}
                  </span>
                </div>
              </div>
              {cust.status === 'online' && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-400">DL:</span>
                    <span className="text-[10px] font-mono text-emerald-600 shrink-0">{cust.currentDownload || '0 Mbps'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-400">UL:</span>
                    <span className="text-[10px] font-mono text-primary-600 shrink-0">{cust.currentUpload || '0 Mbps'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-400">UP:</span>
                    <span className="text-[10px] font-mono text-slate-600 shrink-0">{cust.uptime}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
