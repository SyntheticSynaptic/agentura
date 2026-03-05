interface RelativeTimeProps {
  date: Date | string;
}

function relativeTimeValue(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) {
    return "just now";
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(seconds / 86400);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function RelativeTime({ date }: RelativeTimeProps) {
  const parsedDate = date instanceof Date ? date : new Date(date);
  const isValidDate = !Number.isNaN(parsedDate.getTime());

  if (!isValidDate) {
    return <span className="text-sm text-slate-500">unknown time</span>;
  }

  return (
    <time dateTime={parsedDate.toISOString()} className="text-sm text-slate-500">
      {relativeTimeValue(parsedDate)}
    </time>
  );
}
