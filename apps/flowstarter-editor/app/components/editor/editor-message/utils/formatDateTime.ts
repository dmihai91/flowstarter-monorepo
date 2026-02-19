export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `Today, ${time}`;
  } else if (isYesterday) {
    return `Yesterday, ${time}`;
  } else {
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${dateStr}, ${time}`;
  }
}

