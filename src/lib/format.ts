export function money(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function dateTime(value?: string | Date | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function brandName(brand: string) {
  return brand === 'enyerbados' ? 'Bien Yerbados' : 'Bien Amargos';
}
