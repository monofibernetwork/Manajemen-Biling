import { Customer, TrafficData } from './types';

export const mockCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Budi Santoso',
    address: 'Jl. Merdeka No. 10',
    phone: '081234567890',
    pppoeUsername: 'budi_merdeka',
    pppoePassword: '1000181000',
    ontSerialNumber: 'ZTEG12345678',
    ontRxPower: '-19.5 dBm',
    speedPlan: '50 Mbps',
    status: 'online',
    ipAddress: '192.168.10.12',
    uptime: '14d 2h 30m',
    currentUpload: '2.5 Mbps',
    currentDownload: '15.4 Mbps',
    paymentStatus: 'paid',
    billingAmount: 150000,
    lastPaymentDate: '2026-05-01',
    connectionHistory: [
      { startTime: '2026-05-08T10:00:00Z', endTime: '2026-05-10T07:00:00Z', status: 'Terhubung' },
      { startTime: '2026-05-07T08:00:00Z', endTime: '2026-05-08T09:30:00Z', status: 'Terputus karena kabel optik terputus (Loss)' }
    ]
  },
  {
    id: 'CUST-002',
    name: 'Siti Aminah',
    address: 'Blok A3 No. 5',
    phone: '085712312312',
    pppoeUsername: 'siti_a3',
    pppoePassword: '1000181000',
    ontSerialNumber: 'HWTC12345678',
    ontRxPower: '-28.4 dBm',
    speedPlan: '100 Mbps',
    status: 'offline',
    ipAddress: '192.168.10.15',
    uptime: '0h 0m 0s',
    currentUpload: '0 Mbps',
    currentDownload: '0 Mbps',
    paymentStatus: 'unpaid',
    billingAmount: 230000,
    connectionHistory: [
      { startTime: '2026-04-20T08:00:00Z', endTime: '2026-05-05T00:00:00Z', status: 'Terputus karena telat bayar (Isolir)' }
    ]
  },
  {
    id: 'CUST-003',
    name: 'Agus Pratama',
    address: 'Gang Kelinci II',
    phone: '089988776655',
    pppoeUsername: 'agus_kel',
    pppoePassword: '1000181000',
    ontSerialNumber: 'ZTEG87654321',
    ontRxPower: '-20.1 dBm',
    speedPlan: '200 Mbps',
    status: 'online',
    ipAddress: '192.168.10.22',
    uptime: '3d 5h 12m',
    currentUpload: '18.2 Mbps',
    currentDownload: '120.5 Mbps',
    paymentStatus: 'paid',
    billingAmount: 330000,
    lastPaymentDate: '2026-05-03',
    connectionHistory: [
      { startTime: '2026-05-07T05:00:00Z', endTime: 'Saat ini', status: 'Terhubung' },
      { startTime: '2026-05-01T08:00:00Z', endTime: '2026-05-07T04:30:00Z', status: 'Terputus karena modem restart (Reboot)' }
    ]
  },
  {
    id: 'CUST-004',
    name: 'Rina Kusumawati',
    address: 'Perumahan Asri Blok C',
    phone: '081122334455',
    pppoeUsername: 'rina_asri',
    pppoePassword: '1000181000',
    ontSerialNumber: 'HWTC87654321',
    ontRxPower: '-25.5 dBm',
    speedPlan: '50 Mbps',
    status: 'online',
    ipAddress: '192.168.10.45',
    uptime: '1d 1h 5m',
    currentUpload: '0.8 Mbps',
    currentDownload: '5.2 Mbps',
    paymentStatus: 'overdue',
    billingAmount: 150000,
  },
  {
    id: 'CUST-005',
    name: 'Toko Makmur (Pak Haji)',
    address: 'Jl. Raya Pasar No. 8',
    phone: '082233445566',
    pppoeUsername: 'toko_makmur',
    pppoePassword: '1000181000',
    ontSerialNumber: 'ZTEG11223344',
    ontRxPower: '-18.2 dBm',
    speedPlan: '100 Mbps',
    status: 'online',
    ipAddress: '192.168.10.50',
    uptime: '30d 12h 0m',
    currentUpload: '10.5 Mbps',
    currentDownload: '45.8 Mbps',
    paymentStatus: 'paid',
    billingAmount: 230000,
    lastPaymentDate: '2026-05-02'
  }
];

export const mockTrafficData: TrafficData[] = Array.from({ length: 24 }).map((_, i) => {
  const hour = new Date();
  hour.setHours(hour.getHours() - (23 - i));
  const timeLabel = hour.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  
  // Generate random realistic traffic flow with peaks during evening
  const isEvening = hour.getHours() >= 18 && hour.getHours() <= 22;
  const multiplier = isEvening ? 1.5 : 1;
  const baseDown = 80 + Math.random() * 40;
  const baseUp = 30 + Math.random() * 20;

  const randomCustomer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];

  return {
    time: timeLabel,
    download: parseFloat((baseDown * multiplier).toFixed(2)),
    upload: parseFloat((baseUp * multiplier).toFixed(2)),
    topClient: randomCustomer
  };
});
