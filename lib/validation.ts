import { z } from "zod";

export const tripLogSchema = z
  .object({
    vessel_name: z.enum(["Lite Cat 1", "Lite Cat 2"]),
    route_direction: z.enum(["Cebu to Tubigon", "Tubigon to Cebu"]),
    scheduled_departure_time: z.string().min(1),
    actual_departure_time: z.string().min(1),
    actual_arrival_time: z.string().min(1),
    passenger_count: z.coerce.number().int().min(0),
    ticket_sales_php: z.coerce.number().min(0),
    cargo_count: z.coerce.number().int().min(0),
    motorcycles_count: z.coerce.number().int().min(0),
    cars_count: z.coerce.number().int().min(0),
    trucks_count: z.coerce.number().int().min(0),
    fuel_steaming_liters: z.coerce.number().min(0),
    fuel_maneuvering_liters: z.coerce.number().min(0),
    generator_fuel_liters: z.coerce.number().min(0),
    notes: z.string().optional()
  })
  .refine(
    (data) => new Date(data.actual_arrival_time).getTime() >= new Date(data.actual_departure_time).getTime(),
    {
      message: "Arrival time cannot be earlier than departure time",
      path: ["actual_arrival_time"]
    }
  );

export type TripLogFormValues = z.infer<typeof tripLogSchema>;
