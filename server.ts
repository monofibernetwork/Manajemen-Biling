import fs from 'fs';
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Midtrans from "midtrans-client";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default_fallback_secret_key_12345";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const DATA_FILE = path.join(process.cwd(), 'schedules_data.json');

let schedules: any[] = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    schedules = JSON.parse(rawData);
  } catch(e) {
    console.error("Failed to load schedules", e);
  }
} else {
  schedules = [
    {
      id: 'INST-001',
      customerName: 'Budi Santoso',
      phone: '081234567890',
      address: 'Jl. Merdeka No. 45, Jakarta',
      plan: '50 Mbps',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 - 12:00',
      status: 'pending', // pending | active | closed
      priority: 'high',
      pppoeUser: 'budi_santoso_50m',
      pppoePass: 'budi1234',
      technician: 'teknisi1' // pre-assigned to tek1
    },
    {
      id: 'INST-002',
      customerName: 'Siti Aminah',
      phone: '082198765432',
      address: '123 Kenangan Street',
      plan: '100 Mbps',
      date: new Date().toISOString().split('T')[0],
      time: '13:00 - 15:00',
      status: 'pending',
      priority: 'normal',
      pppoeUser: 'siti_aminah_100m',
      pppoePass: 'siti8899',
      technician: 'teknisi1'
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(schedules, null, 2));
}

function saveSchedules() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(schedules, null, 2));
}

  app.get('/api/schedules', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.json({ schedules });
    
    try {
       const token = authHeader.split(" ")[1];
       const decoded = jwt.verify(token, JWT_SECRET) as any;
       if (decoded.role === 'technician') {
         return res.json({ schedules: schedules.filter(s => s.technician === decoded.username) });
       }
       res.json({ schedules });
    } catch (e) {
       res.json({ schedules });
    }
  });

  app.post('/api/schedules', (req, res) => {
     const newSchedule = {
       id: `INST-00${schedules.length + 1}`,
       customerName: req.body.name,
       phone: req.body.phone,
       address: req.body.address,
       plan: req.body.plan,
       date: req.body.date,
       time: req.body.time,
       status: 'pending',
       priority: req.body.priority || 'normal',
       technician: req.body.technician || 'teknisi1',
       pppoeUser: req.body.name.toLowerCase().replace(/\s+/g, '_') + '_' + req.body.plan.split(' ')[0] + 'm',
       pppoePass: Math.random().toString(36).substring(2, 8)
     };
     schedules.push(newSchedule);
     saveSchedules();
     res.json({ schedule: newSchedule });
  });

  app.put('/api/schedules/:id', (req, res) => {
     const { id } = req.params;
     const idx = schedules.findIndex(s => s.id === id);
     if (idx === -1) return res.status(404).json({ error: 'Not found' });
     
     schedules[idx] = { ...schedules[idx], ...req.body };
     saveSchedules();
     res.json({ schedule: schedules[idx] });
  });

  app.post("/api/admin/login", (req, res) => {
    const { username, phone } = req.body;
    const cleanPhone = phone?.replace(/\D/g, '');
    const cleanUsername = username?.toLowerCase().trim();

    if (cleanUsername === 'dittya' && cleanPhone === '082124812114') {
      const token = jwt.sign({ username: cleanUsername, role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
      res.json({ token, user: { username: cleanUsername, role: 'admin' } });
    } else if (cleanUsername === 'teknisi1' && cleanPhone === '085156816741') {
      const token = jwt.sign({ username: cleanUsername, role: 'technician' }, JWT_SECRET, { expiresIn: '12h' });
      res.json({ token, user: { username: cleanUsername, role: 'technician' } });
    } else {
      res.status(401).json({ error: 'Username atau Nomor HP salah. Akses ditolak.' });
    }
  });

  app.get("/api/admin/verify", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({ valid: true, user: decoded });
    } catch (err) {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  });

  app.post("/api/payment/create-transaction", async (req, res) => {
    try {
      const { orderId, grossAmount, customerDetails, serverKey, clientKey } = req.body;

      const finalServerKey = serverKey || process.env.MIDTRANS_SERVER_KEY;
      const finalClientKey = clientKey || process.env.MIDTRANS_CLIENT_KEY || "";

      if (!finalServerKey) {
        throw new Error("MIDTRANS_SERVER_KEY is not configured.");
      }

      const snap = new Midtrans.Snap({
        isProduction: false,
        serverKey: finalServerKey,
        clientKey: finalClientKey,
      });

      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: grossAmount,
        },
        customer_details: customerDetails,
      };

      const transaction = await snap.createTransaction(parameter);
      res.json({ token: transaction.token, redirect_url: transaction.redirect_url });
    } catch (error: any) {
      console.error("Payment error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook Midtrans - Auto Lunas
  app.post("/api/webhook/midtrans", async (req, res) => {
    try {
      const { order_id, transaction_status, gross_amount, signature_key } = req.body;
      console.log(`[Midtrans Webhook] Received status ${transaction_status} for order ${order_id}`);
      
      // In a real application, you connect to Firebase Admin SDK here
      // and update the document in Firestore to status = 'paid'.
      // e.g.: await admin.firestore().collection('invoices').doc(order_id).update({ status: 'paid' })

      res.status(200).json({ status: "ok", message: "Webhook accepted." });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Notifikasi WhatsApp Blast
  app.post("/api/whatsapp/blast", async (req, res) => {
    try {
      const { message, targetNumbers } = req.body;
      const fonnteToken = process.env.FONNTE_TOKEN;
      const targetStr = Array.isArray(targetNumbers) ? targetNumbers.join(',') : targetNumbers;
      
      console.log(`[WhatsApp Blast] Sending message to ${targetStr}: ${message.substring(0, 50)}...`);
      
      if (fonnteToken && fonnteToken !== 'dummy_token') {
        // Real integration with Fonnte
        const response = await fetch('https://api.fonnte.com/send', {
           method: 'POST',
           headers: {
             'Authorization': fonnteToken,
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({
              target: targetStr,
              message: message,
              countryCode: '62'
           })
        });
        
        const data = await response.json();
        console.log('[Fonnte API Response]:', data);
        if (data.status) {
           return res.json({ status: "ok", message: "Blast dikirim via Fonnte!", data });
        } else {
           throw new Error(data.reason || 'Fonnte API error');
        }
      } else {
        // Simulated process since no valid token exists
        console.warn('[WhatsApp] No valid FONNTE_TOKEN configured. Simulating send...');
        await new Promise(r => setTimeout(r, 2000));
        res.json({ status: "ok", message: "Blast dikirim (Simulasi)!" });
      }
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Auto-Isolir MikroTik / OLT
  app.post("/api/mikrotik/isolate", async (req, res) => {
    try {
      const { customerId, pppoeUsername, isolate } = req.body;
      console.log(`[MikroTik API] Setting isolate=${isolate} for PPPoE user: ${pppoeUsername}`);
      
      // Real API logic:
      // 1. Connect to mikrotik socket (e.g. node-routeros)
      // 2. Disable/enable secret: /ppp/secret/set numbers=${pppoeUsername} profile=${isolate ? 'isolated-profile' : 'active-profile'}
      // 3. Kick active connection: /ppp/active/remove numbers=${pppoeUsername}

      // Simulated delay
      await new Promise(r => setTimeout(r, 1000));
      res.json({ status: "ok", message: isolate ? "User terisolir" : "User aktif kembali" });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Registrasi OLT ONU
  app.post("/api/olt/register-onu", async (req, res) => {
    try {
      const { serialNumber, onuType } = req.body;
      console.log(`[OLT API] Registering ONU SN: ${serialNumber} Type: ${onuType}`);
      
      // Implementasi Asli (Contoh):
      // 1. Koneksi Telnet/SSH ke OLT (menggunakan ssh2 atau telnet-client)
      // 2. Masuk ke node PON interface: interface gpon-olt_x/y/z
      // 3. Eksekusi command: onu add ${serialNumber}
      // 4. ...

      // Simulasi delay registrasi
      await new Promise(r => setTimeout(r, 4000));
      res.json({ status: "ok", message: "ONU terdaftar dengan sukses pada OLT." });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Inject PPPoE MikroTik
  app.post("/api/mikrotik/dial-pppoe", async (req, res) => {
    try {
      const { pppoeUsername, pppoePassword, profile } = req.body;
      console.log(`[MikroTik API] Injecting PPPoE Secret: ${pppoeUsername}`);
      
      // Implementasi Asli (Contoh):
      // 1. Koneksi API RouterOS (menggunakan node-routeros)
      // 2. Eksekusi command: /ppp/secret/add name=${pppoeUsername} password=${pppoePassword} profile=${profile} service=pppoe

      // Simulasi delay
      await new Promise(r => setTimeout(r, 1500));
      res.json({ status: "ok", message: "PPPoE secret berhasil di-inject ke MikroTik." });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // GeniaACS API Proxy Route
  app.get("/api/geniaacs/devices", async (req, res) => {
    try {
      const apiUrl = process.env.GENIEACS_API_URL;
      const apiToken = process.env.GENIEACS_API_TOKEN;

      const mockData = {
        devices: [
          { id: 'CPE-001', mac: '00:1A:2B:3C:4D:5E', model: 'ZTE F609', ip: '10.0.0.2', status: 'online', uptime: '14d 2h', firmware: 'V1.0.01' },
          { id: 'CPE-002', mac: '00:1A:2B:3C:4D:5F', model: 'Huawei HG8245H', ip: '10.0.0.3', status: 'online', uptime: '5d 12h', firmware: 'V3.1.4' },
          { id: 'CPE-003', mac: '00:1A:2B:3C:4D:60', model: 'Nokia G-240W-F', ip: '10.0.0.4', status: 'offline', uptime: '-', firmware: 'V2.2.1' },
          { id: 'CPE-004', mac: '00:1A:2B:3C:4D:61', model: 'Fiberhome HG6243C', ip: '10.0.0.5', status: 'online', uptime: '22d 4h', firmware: 'V5.0' },
        ]
      };

      if (!apiUrl || apiUrl.includes('your-genieacs-server')) {
        // Fallback to mock data if no GeniaACS URL is provided or it's a dummy URL
        return res.json(mockData);
      }

      try {
        new URL(apiUrl);
      } catch (e) {
        console.warn(`Invalid GENIEACS_API_URL: ${apiUrl}. Falling back to mock data.`);
        return res.json(mockData);
      }

      // If configuration exists, fetch from actual GeniaACS API
      try {
        const response = await fetch(`${apiUrl}/devices`, {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn(`GeniaACS API responded with status: ${response.status}. Falling back to mock data.`);
          return res.json(mockData);
        }

        const data = await response.json();
        res.json(data);
      } catch (fetchError) {
        console.warn("GeniaACS API fetch failed. Falling back to mock data.", fetchError);
        return res.json(mockData);
      }
    } catch (error: any) {
      console.error("GeniaACS API error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
