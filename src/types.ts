export interface Customer {
  id: string;
  name: string;
  email?: string;
  address: string;
  phone: string;
  pppoeUsername: string;
  pppoePassword?: string;
  ontSerialNumber?: string;
  ontRxPower?: string;
  speedPlan: string;
  status: 'online' | 'offline' | 'isolir';
  ipAddress: string;
  uptime: string;
  currentUpload?: string;
  currentDownload?: string;
  paymentStatus: 'paid' | 'unpaid' | 'overdue';
  billingAmount: number;
  lastPaymentDate?: string;
  isIsolated?: boolean;
  connectionHistory?: {
    startTime: string;
    endTime: string;
    status: string;
  }[];
}

export interface TrafficData {
  time: string;
  download: number; // in Mbps
  upload: number;   // in Mbps
  topClient?: Customer;
}

export interface CCTVCam {
  id: string;
  name: string;
  status: 'online' | 'offline';
  type: 'dvr' | 'nvr' | 'ip';
  channel?: number;
  url?: string;
  streamUrl?: string; // HLS / WebRTC stream URL
  location: string;
  recording: boolean;
  ptz: boolean;
}

export interface CCTVEvent {
  id: string;
  cameraId: string;
  cameraName: string;
  time: string;
  date: string;
  type: 'motion' | 'offline' | 'system';
  severity: 'high' | 'medium' | 'low';
  timestamp: number;
}
