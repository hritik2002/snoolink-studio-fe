export function truncateId(id: string, len = 12): string {
  if (id.length <= len + 3) return id;
  return `${id.slice(0, len)}...`;
}

export function truncateUri(url: string): string {
  const uri = `snoolink://files/${url.split("/").pop()?.split("?")[0] ?? url}`;
  if (uri.length <= 22) return uri;
  return `${uri.slice(0, 20)}...`;
}

export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function getFileName(url: string): string {
  return url.split("/").pop()?.split("?")[0] || "Untitled";
}
