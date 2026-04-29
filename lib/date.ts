const pad = (value: number) => value.toString().padStart(2, "0");

const asDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));

export const parseLocalDateTimeInput = (value: string) => {
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date;
};

export const formatForDateTimeInput = (value: string | Date) => {
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
};

export const formatDate = (value: string | Date) => {
  const date = asDate(value);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
};

export const formatDateTime = (value: string | Date) => {
  const date = asDate(value);
  return `${formatDate(date)}. ${formatTime24(date)}`;
};

export const formatTime24 = (value: string | Date) => {
  const date = asDate(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatScheduledDeparture = (value: string | Date) => {
  const date = asDate(value);
  return `${formatDate(date)}. ${formatTime24(date)}`;
};

export const parseUsDateInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) {
    return "";
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const candidate = new Date(year, month - 1, day);

  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return "";
  }

  return `${year}-${pad(month)}-${pad(day)}`;
};

export const isoDateToUsInput = (value: string) => {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return "";
  }

  return `${month}/${day}/${year}`;
};
