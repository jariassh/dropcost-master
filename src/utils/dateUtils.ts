/**
 * Centralized Date and Time Utilities for DropCost Master
 * Handles timezone-aware formatting and display.
 */

/**
 * Detects the user's current timezone.
 * @returns string (e.g., 'America/Bogota')
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Formats an ISO date string or Date object to a localized string,
 * taking into account the user's browser timezone (local).
 * 
 * @param date ISO string or Date object
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted string
 */
export const formatDisplayDate = (
  date: string | Date | number,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
): string => {
  if (!date) return '---';
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-CO', options).format(d);
};

/**
 * Formats an ISO date string or Date object to a localized time string.
 * 
 * @param date ISO string or Date object
 * @returns Formatted time string (e.g., "09:30 PM")
 */
export const formatDisplayTime = (date: string | Date | number): string => {
  return formatDisplayDate(date, { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * Utility for tooltips or logs that need both Local and UTC time.
 * @param date Date to format
 */
export const getDateTimeAuditInfo = (date: string | Date | number = new Date()) => {
  const d = new Date(date);
  return {
    local: formatDisplayDate(d, { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit', 
      hour12: true 
    }),
    utc: d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    timezone: getUserTimezone()
  };
};
