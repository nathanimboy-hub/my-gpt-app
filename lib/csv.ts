import { TripLog } from "./types";

const baseColumns: (keyof TripLog)[] = [
  "vessel_name",
  "route_direction",
  "scheduled_departure_time",
  "actual_departure_time",
  "actual_arrival_time",
  "passenger_count",
  "cargo_count",
  "motorcycles_count",
  "cars_count",
  "trucks_count",
  "fuel_steaming_liters",
  "fuel_maneuvering_liters",
  "generator_fuel_liters",
  "total_fuel_liters",
  "trip_duration_minutes",
  "notes",
  "created_by",
  "created_at"
];

const columnLabels: Partial<Record<keyof TripLog, string>> = {
  fuel_steaming_liters: "Main Engine Fuel Steaming (L)",
  fuel_maneuvering_liters: "Main Engine Fuel Maneuvering (L)",
  generator_fuel_liters: "Auxiliary Engine Fuel (L)"
};

export function toCsv(logs: TripLog[], includeFinancials = true): string {
  const columns: (keyof TripLog)[] = includeFinancials
    ? [...baseColumns.slice(0, 6), "ticket_sales_php", ...baseColumns.slice(6)]
    : baseColumns;

  const header = columns
    .map((column) => columnLabels[column] ?? column)
    .map((label) => `"${String(label).replace(/"/g, '""')}"`)
    .join(",");
  const rows = logs.map((log) =>
    columns
      .map((column) => {
        const value = log[column] ?? "";
        const text = String(value).replace(/"/g, '""');
        return `"${text}"`;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}
