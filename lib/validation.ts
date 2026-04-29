import { z } from "zod";
import { parseLocalDateTimeInput } from "@/lib/date";

const requiredDateTime = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const requiredNonNegativeNumber = (label: string, integer = false) => {
  const numberSchema = integer
    ? z
        .number({
          required_error: `${label} is required`,
          invalid_type_error: `${label} must be a valid number`
        })
        .int(`${label} must be a whole number`)
    : z.number({
        required_error: `${label} is required`,
        invalid_type_error: `${label} must be a valid number`
      });

  return z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return Number(value);
  }, numberSchema.min(0, `${label} must be 0 or greater`));
};

export const tripLogSchema = z
  .object({
    vessel_name: z.enum(["Lite Cat 1", "Lite Cat 2"]),
    route_direction: z.enum(["Cebu to Tubigon", "Tubigon to Cebu"]),
    scheduled_departure_time: requiredDateTime("Scheduled departure time"),
    actual_arrival_time: requiredDateTime("Actual arrival time"),
    passenger_count: requiredNonNegativeNumber("Passenger count", true),
    ticket_sales_php: z.coerce.number().min(0),
    motorcycles_count: z.coerce.number().int().min(0),
    cars_count: z.coerce.number().int().min(0),
    trucks_count: z.coerce.number().int().min(0),
    fuel_steaming_liters: requiredNonNegativeNumber("Main engine fuel (steaming)"),
    fuel_maneuvering_liters: requiredNonNegativeNumber("Main engine fuel (maneuvering)"),
    generator_fuel_liters: requiredNonNegativeNumber("Auxiliary engine fuel"),
    notes: z.string().optional()
  })
  .refine(
    (data) => {
      const scheduled = parseLocalDateTimeInput(data.scheduled_departure_time);
      const arrival = parseLocalDateTimeInput(data.actual_arrival_time);
      return Boolean(scheduled && arrival && arrival.getTime() > scheduled.getTime());
    },
    {
      message: "Actual arrival time must be after scheduled departure time",
      path: ["actual_arrival_time"]
    }
  );

export type TripLogFormValues = z.infer<typeof tripLogSchema>;
