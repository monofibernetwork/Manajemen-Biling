export interface InternetPackage {
  name: string;
  price: number;
  desc: string;
}

export const defaultPackages: InternetPackage[] = [
  { name: '15 Mbps', price: 150000, desc: 'Cocok untuk 1-3 perangkat santai' },
  { name: '30 Mbps', price: 250000, desc: 'Lancar untuk streaming & WFH' },
  { name: '50 Mbps', price: 350000, desc: 'Gaming & Download ngebut' },
  { name: '100 Mbps', price: 600000, desc: 'Ultra cepat tanpa batas' }
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
