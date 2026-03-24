const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  if (diff < MINUTE) return 'agora mesmo';
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE);
    return `há ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  const days = Math.floor(diff / DAY);
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
}
