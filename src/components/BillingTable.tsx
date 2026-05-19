import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { AlertCircle, CheckCircle2, Clock, MoreVertical, Send, Check, Receipt, X, Printer, Download, QrCode, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generateDynamicQris } from '../lib/qris';
import { formatDate, formatShortDate } from '../lib/formatDate';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare global {
  interface Window {
    snap: any;
  }
}

interface BillingTableProps {
  customers: Customer[];
  isWaBillingEnabled?: boolean;
  onConfirmPayment?: (id: string) => void;
}

import { useTenant } from '../contexts/TenantContext';

export function BillingTable({ customers, isWaBillingEnabled = true, onConfirmPayment }: BillingTableProps) {
  const { branding } = useTenant();
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Customer | null>(null);
  const [selectedQrisCust, setSelectedQrisCust] = useState<Customer | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  
  const qrisStaticPayload = localStorage.getItem('qrisStaticPayload') || '';

  const [autoReminderEnabled, setAutoReminderEnabled] = useState(false);

  useEffect(() => {
    // Load Midtrans Snap script dynamically
    const script = document.createElement("script");
    const isProd = false; // Set to true for production environment
    script.src = isProd ? "https://app.midtrans.com/snap/snap.js" : "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = localStorage.getItem('midtransClientKey') || import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'YOUR_CLIENT_KEY';
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleGeneratePDFAll = () => {
    setIsGeneratingPdf(true);
    setNotification({ message: 'Generating PDF Invoices...', type: 'success' });

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        let isFirst = true;
        
        // Print all unpaid/overdue customers
        const targetCustomers = customers.filter(c => c.paymentStatus === 'unpaid' || c.paymentStatus === 'overdue');
        
        if (targetCustomers.length === 0) {
           setNotification({ message: 'Tidak ada invoice pending (semua lunas).', type: 'success' });
           setIsGeneratingPdf(false);
           return;
        }

        targetCustomers.forEach((cust) => {
          if (!isFirst) {
            doc.addPage();
          }
          isFirst = false;

          // Header
          doc.setFontSize(20);
          doc.setTextColor(30, 64, 175); // primary-800
          doc.text('INVOICE', 14, 20);
          
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(branding?.businessName || 'ISP Network', 14, 30);
          
          doc.text(`Dicetak: ${formatDate(new Date().toISOString())}`, 14, 35);
          
          // Customer details
          doc.setFontSize(12);
          doc.setTextColor(0);
          doc.text('Tagihan Kepada:', 14, 50);
          doc.setFontSize(10);
          doc.text(`Nama: ${cust.name}`, 14, 57);
          doc.text(`Paket: ${cust.speedPlan}`, 14, 64);
          doc.text(`No. WA: ${cust.phone}`, 14, 71);
          
          // Invoice Info
          doc.text(`Bulan: ${formatShortDate(new Date().toISOString())}`, 140, 50);
          doc.text(`Status: ${cust.paymentStatus.toUpperCase()}`, 140, 57);

          const amount = cust.billingAmount || 0;
          
          autoTable(doc, {
            startY: 85,
            head: [['Deskripsi', 'Total']],
            body: [
              [`Langganan Internet - ${cust.speedPlan}`, formatCurrency(amount)]
            ],
            theme: 'grid',
            headStyles: { fillColor: [30, 64, 175] }
          });
          
          const finalY = (doc as any).lastAutoTable.finalY + 10;
          doc.setFontSize(12);
          doc.setFont('bold');
          doc.text(`Total Tagihan: ${formatCurrency(amount)}`, 14, finalY);

          // Footer
          doc.setFont('normal');
          doc.setFontSize(9);
          doc.setTextColor(150);
          doc.text('Mohon segera lakukan pembayaran sebelum jatuh tempo.', 14, finalY + 15);
        });

        doc.save(`Invoices_${formatShortDate(new Date().toISOString())}.pdf`);
        setNotification({ message: 'PDF Invoices berhasil di-generate!', type: 'success' });
      } catch (err) {
        console.error(err);
        setNotification({ message: 'Gagal membuat PDF', type: 'error' });
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 500);
  };

  const runAutoReminders = async () => {
    if (isSending) return;
    setIsSending(true);
    setNotification({ message: 'Mengirimkan WA Blast tagihan...', type: 'success' });
    
    try {
      const upcoming = customers.filter(c => c.paymentStatus === 'unpaid');
      const overdue = customers.filter(c => c.paymentStatus === 'overdue');
      const totalRemind = upcoming.length + overdue.length;
      
      if (totalRemind === 0) {
        setNotification({ message: 'Tidak ada pelanggan yang mendekati/lewat jatuh tempo.', type: 'success' });
        setTimeout(() => setNotification(null), 3000);
        setIsSending(false);
        return;
      }

      const response = await fetch('/api/whatsapp/blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Blast invoice kepada pelanggan! Total: ${totalRemind}`,
          targetNumbers: [...upcoming, ...overdue].map(c => c.phone)
        })
      });

      if (response.ok) {
        setNotification({ 
          message: `Berhasil mengirim ${totalRemind} pesan WA otomatis!`, 
          type: 'success' 
        });
      } else {
        throw new Error('Gagal mengirim');
      }
    } catch (e: any) {
      setNotification({ message: 'Gagal mengirim fitur Blast', type: 'error' });
    }
    
    setIsSending(false);
    setTimeout(() => setNotification(null), 6000);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoReminderEnabled) {
      // Jalankan pertama kali saat diaktifkan
      const timer = setTimeout(() => {
        runAutoReminders();
      }, 1000);
      
      // Simulasikan pengecekan setiap 30 detik
      interval = setInterval(() => {
        runAutoReminders();
      }, 30000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [autoReminderEnabled, customers]);

  // ... rest of the code ...
  const handleInitiatePayment = async (customer: Customer) => {
    setIsSending(true);
    setNotification({ message: `Initiating payment for ${customer.name}...`, type: 'success' });
    try {
      const midtransServerKey = localStorage.getItem('midtransServerKey');
      const midtransClientKey = localStorage.getItem('midtransClientKey');

      const response = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `INV-${customer.id}-${Date.now()}`,
          grossAmount: customer.billingAmount,
          serverKey: midtransServerKey,
          clientKey: midtransClientKey,
          customerDetails: {
            first_name: customer.name,
            email: `${customer.id.toLowerCase()}@example.com`,
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      // If midtrans token is generated, we can give user a link or open it.
      if (window.snap) {
        window.snap.pay(data.token, {
          onSuccess: function (result: any) {
            setNotification({ message: 'Pembayaran berhasil!', type: 'success' });
            if (onConfirmPayment) {
              onConfirmPayment(customer.id);
            }
            console.log(result);
          },
          onPending: function (result: any) {
            setNotification({ message: 'Menunggu pembayaran Anda!', type: 'success' });
            console.log(result);
          },
          onError: function (result: any) {
            setNotification({ message: 'Pembayaran gagal!', type: 'error' });
            console.log(result);
          },
          onClose: function () {
            setNotification({ message: 'Popup pembayaran ditutup tanpa menyelesaikan.', type: 'error' });
          }
        });
      } else {
        // Fallback if snap is not loaded
        const link = document.createElement('a');
        link.href = data.redirect_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (error: any) {
      console.error(error);
      setNotification({ message: error.message || 'Error integrating payment.', type: 'error' });
    } finally {
      setIsSending(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedInvoiceIds(new Set(customers.map(c => c.id)));
    } else {
      setSelectedInvoiceIds(new Set());
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedInvoiceIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedInvoiceIds(next);
  };

  const handleBulkReminders = async () => {
    if (selectedInvoiceIds.size === 0) return;
    setIsSending(true);
    setNotification({ message: 'Mengirimkan WA Blast tagihan...', type: 'success' });
    
    try {
      const selectedCustomers = customers.filter(c => selectedInvoiceIds.has(c.id));
      const response = await fetch('/api/whatsapp/blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Halo pelanggan yang terhormat, ada tagihan internet yang perlu dibayarkan. Terima kasih.`,
          targetNumbers: selectedCustomers.map(c => c.phone)
        })
      });

      if (response.ok) {
        setNotification({ message: `Successfully sent reminders to ${selectedInvoiceIds.size} customers via WhatsApp Blast.`, type: 'success' });
        setSelectedInvoiceIds(new Set());
      } else {
        throw new Error('Gagal Blast');
      }
    } catch(e) {
       setNotification({ message: 'Gagal mengirim WA Blast', type: 'error' });
    }
    
    setIsSending(false);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBulkConfirm = () => {
    if (selectedInvoiceIds.size === 0) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      if (onConfirmPayment) {
        selectedInvoiceIds.forEach(id => onConfirmPayment(id));
      }
      setNotification({ message: `Berhasil mengkonfirmasi pembayaran untuk ${selectedInvoiceIds.size} tagihan.`, type: 'success' });
      setSelectedInvoiceIds(new Set());
      setTimeout(() => setNotification(null), 3000);
    }, 1500);
  };

  const handleSendSingleReminder = (customer: Customer, type: 'upcoming' | 'overdue' = 'upcoming') => {
    const phoneNum = customer.phone.replace(/^0/, '62');
    const amount = formatCurrency(customer.billingAmount).replace('Rp', '').trim();
    let message = '';
    
    if (customer.paymentStatus === 'overdue' || type === 'overdue') {
      message = `Halo ${customer.name}, ini Surat Peringatan. Tagihan internet Anda sebesar Rp${amount} TELAH LEWAT JATUH TEMPO. Mohon segera melakukan pembayaran.`;
    } else {
      message = `Halo ${customer.name}, ini pengingat dari kami. Tagihan internet Anda sebesar Rp${amount} akan jatuh tempo dalam 3 hari. Terima kasih atas pengertiannya.`;
    }
    
    const waUrl = `https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    
    setNotification({ message: `Membuka WhatsApp untuk tagihan ${customer.name}...`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleGenerateInvoices = () => {
    if (isSending) return;
    setIsSending(true);
    setNotification({ message: 'Generating new invoices...', type: 'success' });
    setTimeout(() => {
      setIsSending(false);
      setNotification({ message: 'Successfully generated invoices for this cycle.', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }, 1500);
  };

  const handleDownloadCSV = () => {
    if (selectedInvoiceIds.size === 0) return;

    const selectedCustomers = customers.filter(c => selectedInvoiceIds.has(c.id));
    
    const headers = ['Invoice ID', 'Nama Pelanggan', 'Jumlah', 'Tanggal Jatuh Tempo', 'Status Pembayaran'];
    
    // Asumsikan tanggal jatuh tempo adalah tanggal 10 bulan ini
    const dueDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-10`;

    const rows = selectedCustomers.map(c => [
      `INV-${c.id}`,
      `"${c.name}"`, 
      c.billingAmount.toString(),
      dueDate,
      c.paymentStatus.toUpperCase()
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tagihan_pelanggan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setNotification({ message: `Berhasil mengunduh ${selectedCustomers.length} tagihan.`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDownloadHTML = () => {
    if (selectedInvoiceIds.size === 0) return;

    const selectedCustomers = customers.filter(c => selectedInvoiceIds.has(c.id));
    
    // Asumsikan tanggal jatuh tempo adalah tanggal 10 bulan ini
    const dueDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-10`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Export Tagihan</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 2rem; color: #333; }
        h1 { color: #1a56db; margin-bottom: 0.5rem; text-align: center; }
        p.subtitle { color: #6b7280; margin-bottom: 2rem; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f9fafb; color: #374151; font-weight: 600; }
        tr:hover { background-color: #f3f4f6; }
        .badge { padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
        .badge-unpaid { background-color: #fef2f2; color: #dc2626; }
        .badge-paid { background-color: #ecfdf5; color: #059669; }
        .badge-overdue { background-color: #fffbeb; color: #d97706; }
        .currency { font-family: monospace; }
        .header { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 2rem; }
        .header h1 { margin-bottom: 0.25rem; }
        .header .subtitle { margin-bottom: 0; }
    </style>
</head>
<body>
            <div class="header">
                ${branding?.logoUrl ? `<img src="${branding.logoUrl}" alt="${branding.businessName || 'Business Logo'}" style="max-height: 48px;" />` : ''}
                <div>
                  <h1 style="color: ${branding?.primaryColorHex || '#ea580c'}">${branding?.businessName || 'Dream Paymanager'}</h1>
                  <p class="subtitle">Laporan Tagihan Terpilih - Diekspor pada: ${new Date().toLocaleString('id-ID')}</p>
                </div>
            </div>
    <table>
        <thead>
            <tr>
                <th>Invoice ID</th>
                <th>Nama Pelanggan</th>
                <th>Jumlah</th>
                <th>Tanggal Jatuh Tempo</th>
                <th>Status Pembayaran</th>
            </tr>
        </thead>
        <tbody>
            ${selectedCustomers.map(c => `
                <tr>
                    <td>INV-${c.id}</td>
                    <td><strong>${c.name}</strong><br><span style="font-size: 12px; color: #6b7280;">${c.phone}</span></td>
                    <td class="currency">Rp${c.billingAmount.toLocaleString('id-ID')}</td>
                    <td>${dueDate}</td>
                    <td><span class="badge badge-${c.paymentStatus}">${c.paymentStatus.toUpperCase()}</span></td>
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
    link.download = `Tagihan_Dipilih_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setNotification({ message: `Berhasil mengunduh HTML ${selectedCustomers.length} tagihan.`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

      const totalRevenue = customers.filter(c => c.paymentStatus === 'paid').reduce((sum, c) => sum + c.billingAmount, 0);

      return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
      {/* Notification Toast */}
      {notification && (
        <>
          <div className="fixed inset-0 z-[40]" onClick={() => setNotification(null)} />
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[41] px-4 py-3 rounded-xl text-xs font-semibold flex items-start gap-3 shadow-lg animate-in fade-in slide-in-from-top-4 ${notification.type === 'success' ? 'bg-emerald-500 border border-emerald-600 text-white' : 'bg-rose-500 border border-rose-600 text-white'}`}>
             {notification.type === 'success' ? <Check size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
             <span className="whitespace-pre-line leading-relaxed font-medium">{notification.message}</span>
             <button 
               onClick={() => setNotification(null)}
               className="ml-2 hover:opacity-75 transition-opacity focus:outline-none mt-0.5 shrink-0"
               aria-label="Tutup notifikasi"
             >
               <X size={14} />
             </button>
          </div>
        </>
      )}

      {/* Receipt Modal */}
      {/* QRIS Modal */}
      {selectedQrisCust && qrisStaticPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col items-center">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between w-full bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <QrCode size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Scan QRIS</h3>
                  <p className="text-[10px] text-slate-500 font-mono">{selectedQrisCust.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedQrisCust(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center w-full">
              <p className="text-sm text-slate-600 mb-4 text-center">Tagihan Pembayaran Internet</p>
              
              <div className="p-4 bg-white border-2 border-dashed border-indigo-200 rounded-2xl shadow-sm mb-6 flex items-center justify-center w-full max-w-[240px] aspect-square mx-auto relative group">
                <QRCodeSVG
                  value={generateDynamicQris(qrisStaticPayload, selectedQrisCust.billingAmount)}
                  size={200}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"Q"}
                  includeMargin={false}
                />
              </div>
              
              <div className="text-center w-full">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Total Tagihan</p>
                <p className="text-2xl font-bold tracking-tight text-slate-800">
                  Rp{formatCurrency(selectedQrisCust.billingAmount).replace('Rp', '').trim()}
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 w-full bg-slate-50 flex gap-2">
              <button 
                onClick={() => setSelectedQrisCust(null)}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5 translate-x-1/3 -translate-y-1/3 rounded-full" style={{ backgroundColor: branding?.primaryColorHex || '#ea580c' }} />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {branding?.logoUrl && <img src={branding.logoUrl} alt="Logo" className="h-6 object-contain" />}
                  <h2 className="font-bold text-sm" style={{ color: branding?.primaryColorHex || '#ea580c' }}>{branding?.businessName || 'Dream Paymanager'}</h2>
                </div>
                <h3 className="font-bold text-lg text-slate-900 leading-tight tracking-tight">Struk Pembayaran</h3>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-mono">Payment Receipt</p>
              </div>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-800 transition-colors p-1 relative z-10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-8 space-y-6">
              {/* Receipt Info */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px]">Tanggal</span>
                  <span className="font-medium text-slate-900">{selectedReceipt.lastPaymentDate ? formatDate(selectedReceipt.lastPaymentDate) : '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px]">No. Pelanggan</span>
                  <span className="font-medium text-slate-900">{selectedReceipt.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px]">Nama</span>
                  <span className="font-medium text-slate-900">{selectedReceipt.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px]">Paket</span>
                  <span className="font-medium text-slate-900">{selectedReceipt.speedPlan}</span>
                </div>
              </div>

              {/* Total Box */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1 text-center">Total Pembayaran</p>
                <p className="text-2xl font-bold text-center text-slate-900 tracking-tight">{formatCurrency(selectedReceipt.billingAmount)}</p>
                
                <div className="mt-3 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-widest">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    LUNAS (PAID)
                  </span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs text-slate-500">Terima kasih atas pembayaran Anda.</p>
                <p className="text-[10px] text-slate-400 font-mono">Dikeluarkan oleh sistem secara otomatis</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => {
                  alert("Fungsi cetak (Print) berjalan. Untuk mencetak struk secara fisik, pastikan kamu membuka aplikasi ini di Tab Baru (bukan dari preview).");
                  window.print();
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={16} /> Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/40 border-b border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-amber-600" /> WhatsApp Auto-Reminders (H-3 & Overdue)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Automatically send WhatsApp messages for overdue / pending invoices.
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={runAutoReminders}
                disabled={isSending || !autoReminderEnabled}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                  autoReminderEnabled && !isSending 
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/20 hover:border-amber-500/40' 
                    : 'bg-white text-slate-400 border-slate-200 cursor-not-allowed'
                } transition-colors flex items-center gap-1.5`}
              >
                <Send size={12} /> Simulasi WA Blast
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status:</span>
                <button
                  onClick={() => setAutoReminderEnabled(!autoReminderEnabled)}
                  className={`flex items-center w-10 h-6 p-1 rounded-full transition-colors ${
                    autoReminderEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                       autoReminderEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-primary-600" /> Auto-Generate PDF Invoices
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Buat dan simpan Invoice massal dalam format dokumen PDF.
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={handleGeneratePDFAll}
                disabled={isGeneratingPdf}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isGeneratingPdf ? 'Generating...' : <><Download size={12} /> Export Tagihan (Unpaid) ke PDF</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-slate-200 flex flex-col xl:flex-row items-center justify-between bg-white/50 gap-4">
        <div className="flex items-center justify-between w-full xl:w-auto gap-6 sm:justify-start">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Payment Collections</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Invoices for current billing cycle</p>
          </div>
          <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1 hidden sm:block">Total Revenue (Paid)</p>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest sm:hidden">Total</p>
            <p className="text-lg font-bold text-emerald-600 tracking-tight">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
        <div className="flex gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 overflow-y-hidden text-sm">
          {selectedInvoiceIds.size > 0 && (
            <>
              <button 
                onClick={handleBulkReminders}
                disabled={isSending}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors border ${isSending ? 'bg-white/50 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-white hover:bg-slate-700 text-slate-700 border-slate-300'}`}
              >
                {isSending ? (
                   <><div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> Processing...</>
                ) : (
                   <><Send size={14} /> Send Reminders ({selectedInvoiceIds.size})</>
                )}
              </button>
              <button 
                onClick={handleBulkConfirm}
                disabled={isSending}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-lg ${isSending ? 'bg-primary-600/50 text-white/50 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'}`}
              >
                <CheckCircle2 size={14} /> Konfirmasi ({selectedInvoiceIds.size})
              </button>
              <button
                onClick={handleDownloadCSV}
                disabled={isSending}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors border ${isSending ? 'bg-white/50 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border-emerald-500/20'}`}
              >
                 <Download size={14} /> Download CSV
              </button>
              <button
                onClick={handleDownloadHTML}
                disabled={isSending}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors border ${isSending ? 'bg-white/50 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-primary-600/10 hover:bg-primary-600/20 text-primary-600 border-primary-500/20'}`}
              >
                 <Download size={14} /> Download HTML
              </button>
            </>
          )}
          {selectedInvoiceIds.size === 0 && (
            <button 
              onClick={handleGenerateInvoices}
              disabled={isSending}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-lg ${isSending ? 'bg-primary-600/50 text-white/50 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'}`}
            >
              {isSending ? 'Generating...' : 'Generate Invoices'}
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:hidden gap-4 p-4 bg-slate-50/50">
        {customers.map((cust) => (
          <div 
            key={`bill-mobile-${cust.id}`} 
            className={`bg-white border ${selectedInvoiceIds.has(cust.id) ? 'border-primary-500 ring-1 ring-primary-500' : 'border-slate-200'} rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative`}
          >
            {/* Checkbox overlay for mobile */}
            <div className="absolute top-4 right-4">
              <input 
                type="checkbox" 
                className="rounded bg-slate-100 border-slate-300 text-primary-600 focus:ring-primary-600 focus:ring-offset-slate-50 cursor-pointer w-5 h-5"
                checked={selectedInvoiceIds.has(cust.id)}
                onChange={() => toggleSelection(cust.id)}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 border border-slate-200 flex items-center justify-center font-bold text-sm uppercase shadow-inner">
                  {cust.name.substring(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{cust.name}</h4>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{cust.speedPlan || 'Unknown Plan'}</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Amount</p>
                <div className="text-sm font-bold text-slate-900 font-mono tracking-tight">{formatCurrency(cust.billingAmount)}</div>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Status</p>
                <div>
                  {cust.paymentStatus === 'paid' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-mono font-semibold uppercase tracking-widest border border-emerald-200">
                      PAID
                    </span>
                  )}
                  {cust.paymentStatus === 'unpaid' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white text-slate-500 text-[10px] font-mono font-semibold uppercase tracking-widest border border-slate-300">
                      PENDING
                    </span>
                  )}
                  {cust.paymentStatus === 'overdue' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-mono font-semibold uppercase tracking-widest border border-amber-200">
                      OVERDUE
                    </span>
                  )}
                </div>
              </div>
              
              <div className="col-span-2 pt-2 mt-1 border-t border-slate-200/50 flex justify-between items-center">
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">Jatuh Tempo</p>
                <div>
                  <span className="text-[10px] text-slate-600 font-mono font-semibold uppercase tracking-widest">
                    {`10 ${new Date().toLocaleString('default', { month: 'short' })} ${new Date().getFullYear()}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
              <div></div>
              <div className="flex gap-2">
                {cust.paymentStatus !== 'paid' ? (
                  <>
                    <button 
                      onClick={() => handleSendSingleReminder(cust)}
                      className="text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-colors"
                    >
                      Remind
                    </button>
                    { qrisStaticPayload ? (
                      <button 
                        onClick={() => setSelectedQrisCust(cust)}
                        className="text-white hover:text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-colors inline-block"
                      >
                        QRIS
                      </button>
                    ) : ( 
                      <button 
                        onClick={() => handleInitiatePayment(cust)}
                        className="text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-colors"
                      >
                        Pay Now
                      </button>
                    )}
                    {onConfirmPayment && (
                      <button 
                        onClick={() => onConfirmPayment(cust.id)}
                        className="text-white hover:text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-colors"
                      >
                        Konfirmasi
                      </button>
                    )}
                  </>
                ) : (
                  <button 
                    onClick={() => setSelectedReceipt(cust)}
                    className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <Receipt size={12} /> Struk
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/80 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="rounded bg-slate-50 border-slate-300 text-primary-600 focus:ring-primary-600 focus:ring-offset-slate-900 cursor-pointer w-4 h-4"
                  checked={customers.length > 0 && selectedInvoiceIds.size === customers.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Pelanggan</th>
              <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Tagihan</th>
              <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Jatuh Tempo</th>
              <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Status</th>
              <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {customers.map((cust) => (
              <tr key={`bill-${cust.id}`} className={`hover:bg-white/30 transition-colors ${selectedInvoiceIds.has(cust.id) ? 'bg-primary-600/5' : ''}`}>
                <td className="px-6 py-4 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded bg-slate-50 border-slate-300 text-primary-600 focus:ring-primary-600 focus:ring-offset-slate-900 cursor-pointer w-4 h-4"
                    checked={selectedInvoiceIds.has(cust.id)}
                    onChange={() => toggleSelection(cust.id)}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white text-slate-400 flex items-center justify-center font-bold text-xs uppercase border border-slate-300">
                      {cust.name.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{cust.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{cust.speedPlan || 'Unknown Plan'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono font-medium text-slate-900 text-sm">
                  {formatCurrency(cust.billingAmount)}
                </td>
                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                  {`10 ${new Date().toLocaleString('default', { month: 'short' })} ${new Date().getFullYear()}`}
                </td>
                <td className="px-6 py-4">
                  {cust.paymentStatus === 'paid' && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-400/10 text-emerald-600 text-[10px] font-mono font-semibold uppercase tracking-widest border border-emerald-400/20">
                      PAID
                    </span>
                  )}
                  {cust.paymentStatus === 'unpaid' && (
                    <button 
                      onClick={() => handleInitiatePayment(cust)}
                      title="Klik untuk Bayar via Midtrans"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white hover:bg-slate-700 text-slate-400 hover:text-primary-600 text-[10px] font-mono font-semibold uppercase tracking-widest border border-slate-300 hover:border-primary-600/50 transition-colors cursor-pointer"
                    >
                      PENDING
                    </button>
                  )}
                  {cust.paymentStatus === 'overdue' && (
                    <button 
                      onClick={() => handleInitiatePayment(cust)}
                      title="Klik untuk Bayar via Midtrans"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-600 text-[10px] font-mono font-semibold uppercase tracking-widest border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer"
                    >
                      OVERDUE
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {cust.paymentStatus !== 'paid' ? (
                    <>
                      <button 
                        onClick={() => handleSendSingleReminder(cust)}
                        className="text-amber-600 hover:text-amber-300 font-semibold text-xs uppercase tracking-wider mx-2 transition-colors inline-block"
                      >
                        Remind
                      </button>
                      { qrisStaticPayload ? (
                        <button 
                          onClick={() => setSelectedQrisCust(cust)}
                          className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg font-semibold text-xs uppercase tracking-wider mx-2 transition-colors inline-block"
                        >
                          QRIS
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleInitiatePayment(cust)}
                          className="text-emerald-600 hover:text-emerald-300 font-semibold text-xs uppercase tracking-wider mx-2 transition-colors inline-block"
                        >
                          Pay Now
                        </button>
                      )}
                      {onConfirmPayment && (
                        <button 
                          onClick={() => onConfirmPayment(cust.id)}
                          className="text-primary-600 hover:text-primary-700 font-semibold text-xs uppercase tracking-wider mx-2 transition-colors inline-block"
                        >
                          Konfirmasi
                        </button>
                      )}
                    </>
                  ) : (
                    <button 
                      onClick={() => setSelectedReceipt(cust)}
                      className="text-slate-500 hover:text-slate-700 font-semibold text-xs uppercase tracking-wider mx-2 transition-colors flex items-center gap-1.5 justify-end"
                    >
                      <Receipt size={14} /> Struk
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
