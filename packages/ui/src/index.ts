export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Singapore",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore",
  }).format(date);
}

export function formatLedgerDate(date: Date, compact = false): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: compact ? '2-digit' : 'numeric',
    timeZone: 'Asia/Singapore',
  }).format(date).replaceAll('/', '.');
}

export { youtubeVideoId } from './youtube';

export { numberArticleHeadings } from "./article-contents";
