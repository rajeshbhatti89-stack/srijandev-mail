import { format, isToday, isThisYear } from 'date-fns';

export interface ParsedAddress {
  name: string;
  email: string;
}

/**
 * Parse an email sender or recipient string into a clean human name and email address.
 * E.g. '"John Doe" <john@srijandev.in>' -> { name: 'John Doe', email: 'john@srijandev.in' }
 * E.g. 'john@srijandev.in' -> { name: 'john', email: 'john@srijandev.in' }
 */
export function parseAddress(raw: string): ParsedAddress {
  if (!raw) return { name: '', email: '' };

  const trimmed = raw.trim();

  // Check for "Name" <email@domain.com> or Name <email@domain.com>
  const angleMatch = trimmed.match(/^(?:"?([^"]*)"?\s)?(?:<([^>]+)>)$/);
  if (angleMatch) {
    const namePart = (angleMatch[1] || '').trim();
    const emailPart = (angleMatch[2] || '').trim();
    return {
      name: namePart || emailPart.split('@')[0],
      email: emailPart
    };
  }

  // Check if it's just an email
  if (trimmed.includes('@')) {
    const email = trimmed.replace(/[<>]/g, '').trim();
    const name = email.split('@')[0];
    return { name, email };
  }

  return { name: trimmed, email: trimmed };
}

/**
 * Formats a date string in Google Mail (Gmail) style:
 * - "9:41 AM" if today
 * - "Sep 11" if this year
 * - "9/11/24" if prior year
 */
export function formatGmailDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isThisYear(date)) {
      return format(date, 'MMM d');
    }
    return format(date, 'M/d/yy');
  } catch {
    return dateString;
  }
}

/**
 * Google Material pastel avatar colors
 */
const AVATAR_COLORS = [
  'bg-red-600 text-white',
  'bg-blue-600 text-white',
  'bg-emerald-600 text-white',
  'bg-amber-600 text-white',
  'bg-purple-600 text-white',
  'bg-pink-600 text-white',
  'bg-indigo-600 text-white',
  'bg-teal-600 text-white',
  'bg-cyan-700 text-white',
];

export function getAvatarColor(key: string): string {
  if (!key) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
