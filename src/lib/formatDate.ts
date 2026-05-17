export function formatDate(dateStr: string | number | Date): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatDateTime(dateStr: string | number | Date): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  
  const datePart = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const timePart = date.toLocaleTimeString('id-ID', {
    hour: '2-digit', 
    minute: '2-digit'
  }).replace(/\./g, ':');

  return `${datePart} • ${timePart}`;
}

export function formatShortDate(dateStr: string | number | Date): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
