"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { TripLogFormValues, tripLogSchema } from "@/lib/validation";

interface TripLogFormProps {
  userId: string;
  onSaved: () => Promise<void>;
}

export function TripLogForm({ userId, onSaved }: TripLogFormProps) {
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm<TripLogFormValues>({
    resolver: zodResolver(tripLogSchema),
    defaultValues: {
      vessel_name: "Lite Cat 1",
      route_direction: "Cebu to Tubigon",
      passenger_count: 0,
      ticket_sales_php: 0,
      cargo_count: 0,
      motorcycles_count: 0,
      cars_count: 0,
      trucks_count: 0,
      fuel_steaming_liters: 0,
      fuel_maneuvering_liters: 0,
      generator_fuel_liters: 0,
      notes: ""
    }
  });

  const fuelSteaming = watch("fuel_steaming_liters") || 0;
  const fuelManeuvering = watch("fuel_maneuvering_liters") || 0;
  const generatorFuel = watch("generator_fuel_liters") || 0;
  const actualDeparture = watch("actual_departure_time");
  const actualArrival = watch("actual_arrival_time");

  const totalFuelLiters = useMemo(
    () => Number(fuelSteaming) + Number(fuelManeuvering) + Number(generatorFuel),
    [fuelSteaming, fuelManeuvering, generatorFuel]
  );

  const tripDurationMinutes = useMemo(() => {
    if (!actualDeparture || !actualArrival) return 0;
    const diffMs = new Date(actualArrival).getTime() - new Date(actualDeparture).getTime();
    return Math.max(Math.floor(diffMs / (1000 * 60)), 0);
  }, [actualArrival, actualDeparture]);

  const onSubmit = async (data: TripLogFormValues) => {
    setSaving(true);
    setSubmitError(null);

    const payload = {
      ...data,
      notes: data.notes || null,
      total_fuel_liters: totalFuelLiters,
      trip_duration_minutes: tripDurationMinutes,
      created_by: userId
    };

    const { error } = await supabase.from("trip_logs").insert(payload);

    if (error) {
      setSubmitError(error.message);
      setSaving(false);
      return;
    }

    reset();
    await onSaved();
    setSaving(false);
  };

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Add Trip Log</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label>Vessel Name</label>
          <select {...register("vessel_name")}>
            <option>Lite Cat 1</option>
            <option>Lite Cat 2</option>
          </select>
        </div>
        <div>
          <label>Route Direction</label>
          <select {...register("route_direction")}>
            <option>Cebu to Tubigon</option>
            <option>Tubigon to Cebu</option>
          </select>
        </div>
        <div>
          <label>Scheduled Departure</label>
          <input type="datetime-local" {...register("scheduled_departure_time")} />
        </div>
        <div>
          <label>Actual Departure</label>
          <input type="datetime-local" {...register("actual_departure_time")} />
        </div>
        <div>
          <label>Actual Arrival</label>
          <input type="datetime-local" {...register("actual_arrival_time")} />
          {errors.actual_arrival_time && (
            <p className="text-xs text-red-600">{errors.actual_arrival_time.message}</p>
          )}
        </div>
        <div>
          <label>Passenger Count</label>
          <input type="number" min={0} {...register("passenger_count")} />
        </div>
        <div>
          <label>Ticket Sales (PHP)</label>
          <input type="number" min={0} step="0.01" {...register("ticket_sales_php")} />
        </div>
        <div>
          <label>Cargo Count</label>
          <input type="number" min={0} {...register("cargo_count")} />
        </div>
        <div>
          <label>Motorcycles</label>
          <input type="number" min={0} {...register("motorcycles_count")} />
        </div>
        <div>
          <label>Cars</label>
          <input type="number" min={0} {...register("cars_count")} />
        </div>
        <div>
          <label>Trucks</label>
          <input type="number" min={0} {...register("trucks_count")} />
        </div>
        <div>
          <label>Fuel Steaming (L)</label>
          <input type="number" min={0} step="0.01" {...register("fuel_steaming_liters")} />
        </div>
        <div>
          <label>Fuel Maneuvering (L)</label>
          <input type="number" min={0} step="0.01" {...register("fuel_maneuvering_liters")} />
        </div>
        <div>
          <label>Generator Fuel (L)</label>
          <input type="number" min={0} step="0.01" {...register("generator_fuel_liters")} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <p className="text-xs text-slate-600">Total Fuel (auto)</p>
          <p className="text-lg font-semibold">{totalFuelLiters.toFixed(2)} L</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <p className="text-xs text-slate-600">Trip Duration (auto)</p>
          <p className="text-lg font-semibold">{tripDurationMinutes} min</p>
        </div>
        <div className="sm:col-span-2">
          <label>Notes</label>
          <textarea rows={3} {...register("notes")} />
        </div>
        {submitError && <p className="sm:col-span-2 text-sm text-red-600">{submitError}</p>}
        <button type="submit" disabled={saving} className="sm:col-span-2 bg-blue-600 text-white">
          {saving ? "Saving..." : "Save Trip Log"}
        </button>
      </form>
    </section>
  );
}
