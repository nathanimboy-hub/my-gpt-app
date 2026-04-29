export const toSafeNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const formatFixed = (value: unknown, decimals = 2, fallback = 0) =>
  toSafeNumber(value, fallback).toFixed(decimals);

export const formatLocaleNumber = (value: unknown, fallback = 0) =>
  toSafeNumber(value, fallback).toLocaleString();
