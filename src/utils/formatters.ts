export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatTimeAgo(dateString: string): string {
  try {
    const past = new Date(dateString).getTime();
    const now = new Date().getTime();
    const diffMin = Math.floor((now - past) / (1000 * 60));
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return dateString;
  }
}

export function getRiskColorClass(risk: string): string {
  switch (risk) {
    case 'CRITICAL':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'HIGH':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'MEDIUM':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'LOW':
    default:
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'UNDER_INVESTIGATION':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'COLD_CASE':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'CLOSED':
      return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    default:
      return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  }
}
