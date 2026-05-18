export interface InternetPackage {
  id?: string;
  name: string;
  price: number;
  desc: string;
  downloadSpeed?: string;
  uploadSpeed?: string;
}

export const defaultPackages: InternetPackage[] = [
  { id: 'p1', name: '15 Mbps', price: 150000, desc: 'Cocok untuk 1-3 perangkat santai', downloadSpeed: '15', uploadSpeed: '15' },
  { id: 'p2', name: '30 Mbps', price: 250000, desc: 'Lancar untuk streaming & WFH', downloadSpeed: '30', uploadSpeed: '30' },
  { id: 'p3', name: '50 Mbps', price: 350000, desc: 'Gaming & Download ngebut', downloadSpeed: '50', uploadSpeed: '50' },
  { id: 'p4', name: '100 Mbps', price: 600000, desc: 'Ultra cepat tanpa batas', downloadSpeed: '100', uploadSpeed: '100' }
];

export function getInternetPackages(): InternetPackage[] {
  try {
    const stored = localStorage.getItem('app_internetPackages');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error(e);
  }
  return defaultPackages;
}

export function saveInternetPackages(packages: InternetPackage[]) {
  localStorage.setItem('app_internetPackages', JSON.stringify(packages));
}
