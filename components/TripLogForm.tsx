"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { TripLog } from "@/lib/types";
import { TripLogFormValues, tripLogSchema } from "@/lib/validation";
import { formatFixed } from "@/lib/number";
import { formatForDateTimeInput, parseLocalDateTimeInput } from "@/lib/date";

interface TripLogFormProps {
  userId: string | null;
  editingLog: TripLog | null;
  showFinancialFields: boolean;
  canManageAllLogs: boolean;
  onSaved: () => Promise<void>;
}

const defaultFormValues: TripLogFormValues = {
  vessel_name: "Lite Cat 1",
  route_direction: "Cebu to Tubigon",
  scheduled_departure_time: "",
  actual_arrival_time: "",
  passenger_count: 0,
  ticket_sales_php: 0,
  motorcycles_count: 0,
  cars_count: 0,
  trucks_count: 0,
  fuel_steaming_liters: 0,
  fuel_maneuvering_liters: 0,
  generator_fuel_liters: 0,
  notes: ""
};

export function TripLogForm({
  userId,
  editingLog,
  showFinancialFields,
  canManageAllLogs,
  onSaved
}: TripLogFormProps) {
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
    defaultValues: defaultFormValues
  });

  useEffect(() => {
    if (!editingLog) {
      reset(defaultFormValues);
      return;
    }

    reset({
      vessel_name: editingLog.vessel_name,
      route_direction: editingLog.route_direction,
      scheduled_departure_time: formatForDateTimeInput(editingLog.scheduled_departure_time),
      actual_arrival_time: formatForDateTimeInput(editingLog.actual_arrival_time),
      passenger_count: editingLog.passenger_count,
      ticket_sales_php: editingLog.ticket_sales_php,
      motorcycles_count: editingLog.motorcycles_count,
      cars_count: editingLog.cars_count,
      trucks_count: editingLog.trucks_count,
      fuel_steaming_liters: editingLog.fuel_steaming_liters,
      fuel_maneuvering_liters: editingLog.fuel_maneuvering_liters,
      generator_fuel_liters: editingLog.generator_fuel_liters,
      notes: editingLog.notes || ""
    });
  }, [editingLog, reset]);

  const fuelSteaming = watch("fuel_steaming_liters") || 0;
  const fuelManeuvering = watch("fuel_maneuvering_liters") || 0;
  const generatorFuel = watch("generator_fuel_liters") || 0;
  const scheduledDeparture = watch("scheduled_departure_time");
  const actualArrival = watch("actual_arrival_time");

  const totalFuelLiters = useMemo(
    () => Number(fuelSteaming) + Number(fuelManeuvering) + Number(generatorFuel),
    [fuelSteaming, fuelManeuvering, generatorFuel]
  );

  const tripDurationMinutes = useMemo(() => {
    if (!scheduledDeparture || !actualArrival) return 0;
    const diffMs = new Date(actualArrival).getTime() - new Date(scheduledDeparture).getTime();
    return Math.max(Math.floor(diffMs / (1000 * 60)), 0);
  }, [actualArrival, scheduledDeparture]);

  const onSubmit = async (data: TripLogFormValues) => {
    setSaving(true);
    setSubmitError(null);

    try {
      const departureDate = parseLocalDateTimeInput(data.scheduled_departure_time);
      const arrivalDate = parseLocalDateTimeInput(data.actual_arrival_time);
      const fuelInputs = [data.fuel_steaming_liters, data.fuel_maneuvering_liters, data.generator_fuel_liters];

      if (!departureDate || !arrivalDate || arrivalDate.getTime() <= departureDate.getTime()) {
        setSubmitError("Please provide a valid departure and arrival time (arrival must be later than departure).");
        setSaving(false);
        return;
      }

      if (fuelInputs.some((value) => value === null || value === undefined || Number.isNaN(Number(value)))) {
        setSubmitError("Please provide valid fuel values before saving.");
        setSaving(false);
        return;
      }

      let ownerId = userId;
      if (!ownerId) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user?.id) {
          setSubmitError("Unable to verify your user account. Please sign in again.");
          setSaving(false);
          return;
        }
        ownerId = authData.user.id;
      }

      const updatedData = {
        ...data,
        scheduled_departure_time: data.scheduled_departure_time,
        actual_departure_time: data.scheduled_departure_time,
        actual_arrival_time: data.actual_arrival_time,
        total_fuel_liters: totalFuelLiters,
        trip_duration_minutes: tripDurationMinutes,
        cargo_count: 0,
        notes: data.notes || null,
        created_by: ownerId
      };

      let query;
      if (editingLog) {
        query = supabase.from("trip_logs").update(updatedData).eq("id", editingLog.id);
        if (!canManageAllLogs) {
          query = query.eq("created_by", ownerId);
        }
      } else {
        query = supabase.from("trip_logs").insert(updatedData);
      }

      const { error } = await query;

      if (error) {
        console.error("Failed to save trip log", error);
        setSubmitError(error.message);
        setSaving(false);
        return;
      }

      await onSaved();
      setSaving(false);
    } catch (error) {
      console.error("Unexpected error while saving trip log", error);
      setSubmitError("Unable to save this trip log right now. Please try again.");
      setSaving(false);
    }
  };

  const isEditing = Boolean(editingLog);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">{isEditing ? "Edit Trip Log" : "Add Trip Log"}</h2>
        <p className="text-sm text-slate-500">Record trip movement, load, and fuel consumption details.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            <label>Passenger Count</label>
            <input type="number" min={0} required {...register("passenger_count")} />
            {errors.passenger_count && <p className="mt-1 text-xs text-red-600">{errors.passenger_count.message}</p>}
          </div>

          <div>
            <label>Departure Date and Time (24-hour)</label>
            <input type="datetime-local" required step={60} {...register("scheduled_departure_time")} />
            {errors.scheduled_departure_time && (
              <p className="mt-1 text-xs text-red-600">{errors.scheduled_departure_time.message}</p>
            )}
          </div>
          <div>
            <label>Arrival Date and Time (24-hour)</label>
            <input type="datetime-local" required step={60} {...register("actual_arrival_time")} />
            {errors.actual_arrival_time && <p className="mt-1 text-xs text-red-600">{errors.actual_arrival_time.message}</p>}
          </div>

          {showFinancialFields && (
            <div>
              <label>Ticket Sales (PHP)</label>
              <input type="number" min={0} step="0.01" {...register("ticket_sales_php")} />
            </div>
          )}
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
            <label>Main Engine Fuel Steaming (L)</label>
            <input type="number" min={0} step="0.01" required {...register("fuel_steaming_liters")} />
            {errors.fuel_steaming_liters && <p className="mt-1 text-xs text-red-600">{errors.fuel_steaming_liters.message}</p>}
          </div>
          <div>
            <label>Main Engine Fuel Maneuvering (L)</label>
            <input type="number" min={0} step="0.01" required {...register("fuel_maneuvering_liters")} />
            {errors.fuel_maneuvering_liters && (
              <p className="mt-1 text-xs text-red-600">{errors.fuel_maneuvering_liters.message}</p>
            )}
          </div>
          <div>
            <label>Auxiliary Engine Fuel (L)</label>
            <input type="number" min={0} step="0.01" required {...register("generator_fuel_liters")} />
            {errors.generator_fuel_liters && (
              <p className="mt-1 text-xs text-red-600">{errors.generator_fuel_liters.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-blue-700">Total Fuel (auto)</p>
            <p className="mt-1 text-2xl font-semibold text-blue-900">{formatFixed(totalFuelLiters, 2)} L</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-indigo-700">Trip Duration (auto)</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-900">{tripDurationMinutes} min</p>
          </div>
        </div>

        <div>
          <label>Notes</label>
          <textarea rows={4} placeholder="Additional observations, delays, or incidents..." {...register("notes")} />
        </div>

        {submitError && <p className="text-sm font-medium text-red-600">{submitError}</p>}

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto"
          >
            {saving ? "Saving..." : isEditing ? "Update Trip Log" : "Save Trip Log"}
          </button>
        </div>
      </form>
    </section>
  );
}
