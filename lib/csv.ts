import { TripLog } from "./types";

const columns: (keyof TripLog)[] = [
  "vessel_name",
  "route_direction",
  "scheduled_departure_time",
  "actual_departure_time",
  "actual_arrival_time",
  "passenger_count",
  "ticket_sales_php",
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

export function toCsv(logs: TripLog[]): string {
  const header = columns.join(",");
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
