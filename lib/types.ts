export type VesselName = "Lite Cat 1" | "Lite Cat 2";
export type RouteDirection = "Cebu to Tubigon" | "Tubigon to Cebu";

export interface TripLog {
  id: string;
  vessel_name: VesselName;
  route_direction: RouteDirection;
  scheduled_departure_time: string;
  actual_departure_time: string;
  actual_arrival_time: string;
  passenger_count: number;
  ticket_sales_php: number;
  cargo_count: number;
  motorcycles_count: number;
  cars_count: number;
  trucks_count: number;
  fuel_steaming_liters: number;
  fuel_maneuvering_liters: number;
  generator_fuel_liters: number;
  total_fuel_liters: number;
  trip_duration_minutes: number;
  notes: string | null;
  created_by: string;
  created_at: string;
}
