const pad = (value: number) => value.toString().padStart(2, "0");

const asDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));

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
