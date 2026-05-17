export function applyThemeColor(hexColor: string) {
  const root = document.documentElement;
  
  if (!hexColor || !/^#[0-9A-F]{6}$/i.test(hexColor)) {
     // Revert
     root.style.removeProperty('--custom-primary-50');
     root.style.removeProperty('--custom-primary-100');
     root.style.removeProperty('--custom-primary-200');
     root.style.removeProperty('--custom-primary-300');
     root.style.removeProperty('--custom-primary-400');
     root.style.removeProperty('--custom-primary-500');
     root.style.removeProperty('--custom-primary-600');
     root.style.removeProperty('--custom-primary-700');
     root.style.removeProperty('--custom-primary-800');
     root.style.removeProperty('--custom-primary-900');
     return;
  }

  // VERY rough shading using color-mix for simplicity, avoiding complex hex math
  // We can just use color-mix if the browser supports it
  root.style.setProperty('--custom-primary-50', `color-mix(in srgb, ${hexColor} 10%, white)`);
  root.style.setProperty('--custom-primary-100', `color-mix(in srgb, ${hexColor} 20%, white)`);
  root.style.setProperty('--custom-primary-200', `color-mix(in srgb, ${hexColor} 40%, white)`);
  root.style.setProperty('--custom-primary-300', `color-mix(in srgb, ${hexColor} 60%, white)`);
  root.style.setProperty('--custom-primary-400', `color-mix(in srgb, ${hexColor} 80%, white)`);
  root.style.setProperty('--custom-primary-500', hexColor);
  root.style.setProperty('--custom-primary-600', `color-mix(in srgb, ${hexColor} 80%, black)`);
  root.style.setProperty('--custom-primary-700', `color-mix(in srgb, ${hexColor} 60%, black)`);
  root.style.setProperty('--custom-primary-800', `color-mix(in srgb, ${hexColor} 40%, black)`);
  root.style.setProperty('--custom-primary-900', `color-mix(in srgb, ${hexColor} 20%, black)`);
}
