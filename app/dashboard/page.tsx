"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KpiCard } from "@/components/KpiCard";
import { TripLogForm } from "@/components/TripLogForm";
import { TripLogsTable } from "@/components/TripLogsTable";
import { toCsv } from "@/lib/csv";
import { supabase } from "@/lib/supabase";
import { TripLog } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<TripLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<TripLog | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [vesselNameFilter, setVesselNameFilter] = useState("");
  const [routeDirectionFilter, setRouteDirectionFilter] = useState("");

  const loadLogs = async () => {
    const { data, error } = await supabase
      .from("trip_logs")
      .select("*")
      .order("scheduled_departure_time", { ascending: false });

    if (!error && data) {
      setLogs(data as TripLog[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    const setup = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUserId(data.user.id);
      await loadLogs();
    };

    void setup();
  }, [router]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = new Date(log.scheduled_departure_time);
      if (dateFrom) {
        const startDate = new Date(`${dateFrom}T00:00:00`);
        if (logDate < startDate) {
          return false;
        }
      }

      if (dateTo) {
        const endDate = new Date(`${dateTo}T23:59:59.999`);
        if (logDate > endDate) {
          return false;
        }
      }

      if (vesselNameFilter && log.vessel_name !== vesselNameFilter) {
        return false;
      }

      if (routeDirectionFilter && log.route_direction !== routeDirectionFilter) {
        return false;
      }

      return true;
    });
  }, [dateFrom, dateTo, logs, routeDirectionFilter, vesselNameFilter]);

  const metrics = useMemo(() => {
    const totalTrips = filteredLogs.length;
    const totalPassengers = filteredLogs.reduce((sum, log) => sum + log.passenger_count, 0);
    const totalTicketSales = filteredLogs.reduce((sum, log) => sum + Number(log.ticket_sales_php), 0);
    const totalFuelUsed = filteredLogs.reduce((sum, log) => sum + Number(log.total_fuel_liters), 0);
    const totalVehicles = filteredLogs.reduce(
      (sum, log) => sum + log.motorcycles_count + log.cars_count + log.trucks_count,
      0
    );

    return {
      totalTrips,
      totalPassengers,
      totalTicketSales,
      totalFuelUsed,
      averageFuelPerTrip: totalTrips ? totalFuelUsed / totalTrips : 0,
      fuelPerPassengerRatio: totalPassengers ? totalFuelUsed / totalPassengers : 0,
      fuelPerVehicleRatio: totalVehicles ? totalFuelUsed / totalVehicles : 0
    };
  }, [filteredLogs]);

  const analyticsSummary = useMemo(() => {
    const totalTrips = filteredLogs.length;
    const totalRevenue = filteredLogs.reduce((sum, log) => sum + Number(log.ticket_sales_php), 0);
    const totalFuelUsed = filteredLogs.reduce((sum, log) => sum + Number(log.total_fuel_liters), 0);
    const totalPassengers = filteredLogs.reduce((sum, log) => sum + Number(log.passenger_count), 0);

    const highestFuelTrip = filteredLogs.reduce<TripLog | null>((highest, current) => {
      if (!highest) {
        return current;
      }
      return Number(current.total_fuel_liters) > Number(highest.total_fuel_liters) ? current : highest;
    }, null);

    const lowestFuelTrip = filteredLogs.reduce<TripLog | null>((lowest, current) => {
      if (!lowest) {
        return current;
      }
      return Number(current.total_fuel_liters) < Number(lowest.total_fuel_liters) ? current : lowest;
    }, null);

    return {
      totalRevenue,
      totalFuelUsed,
      averageFuelPerTrip: totalTrips ? totalFuelUsed / totalTrips : 0,
      averageRevenuePerTrip: totalTrips ? totalRevenue / totalTrips : 0,
      fuelPerPassenger: totalPassengers ? totalFuelUsed / totalPassengers : 0,
      highestFuelTrip,
      lowestFuelTrip
    };
  }, [filteredLogs]);

  const formatTripLabel = (trip: TripLog | null) => {
    if (!trip) {
      return "No trips in current filter";
    }

    const tripDate = new Date(trip.scheduled_departure_time).toLocaleDateString();
    return `${trip.vessel_name} • ${trip.route_direction} • ${tripDate}`;
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setVesselNameFilter("");
    setRouteDirectionFilter("");
  };

  const exportCsv = () => {
    const csv = toCsv(logs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `lite-trip-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSaved = async () => {
    await loadLogs();
    setEditingLog(null);
  };

  const handleDelete = async (log: TripLog) => {
    if (!userId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete trip log for ${log.vessel_name} (${new Date(log.scheduled_departure_time).toLocaleString()})?\nThis action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("trip_logs")
      .delete()
      .eq("id", log.id)
      .eq("created_by", userId);

    if (!error) {
      if (editingLog?.id === log.id) {
        setEditingLog(null);
      }
      await loadLogs();
    }
  };

  if (loading) {
    return <main className="p-4">Loading...</main>;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lite Shipping Dashboard</h1>
          <p className="text-sm text-slate-500">Cebu ↔ Tubigon operations and fuel efficiency</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="bg-emerald-600 text-white">
            Export CSV
          </button>
          <button onClick={logout} className="bg-slate-700 text-white">
            Logout
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Total Trips" value={metrics.totalTrips.toString()} />
        <KpiCard label="Total Passengers" value={metrics.totalPassengers.toLocaleString()} />
        <KpiCard label="Total Ticket Sales" value={`₱${metrics.totalTicketSales.toLocaleString()}`} />
        <KpiCard label="Total Fuel Used" value={`${metrics.totalFuelUsed.toFixed(2)} L`} />
        <KpiCard label="Avg Fuel / Trip" value={`${metrics.averageFuelPerTrip.toFixed(2)} L`} />
        <KpiCard
          label="Fuel / Passenger"
          value={`${metrics.fuelPerPassengerRatio.toFixed(3)} L`}
        />
        <KpiCard label="Fuel / Vehicle" value={`${metrics.fuelPerVehicleRatio.toFixed(3)} L`} />
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Analytics Summary</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm text-slate-500">Total Revenue</p>
            <p className="text-lg font-semibold">₱{analyticsSummary.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm text-slate-500">Total Fuel Used</p>
            <p className="text-lg font-semibold">{analyticsSummary.totalFuelUsed.toFixed(2)} L</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm text-slate-500">Average Fuel per Trip</p>
            <p className="text-lg font-semibold">{analyticsSummary.averageFuelPerTrip.toFixed(2)} L</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm text-slate-500">Average Revenue per Trip</p>
            <p className="text-lg font-semibold">₱{analyticsSummary.averageRevenuePerTrip.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm text-slate-500">Fuel per Passenger</p>
            <p className="text-lg font-semibold">{analyticsSummary.fuelPerPassenger.toFixed(3)} L</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 md:col-span-2 xl:col-span-1">
            <p className="text-sm text-slate-500">Highest Fuel Usage Trip</p>
            <p className="font-medium">{formatTripLabel(analyticsSummary.highestFuelTrip)}</p>
            <p className="text-sm text-slate-500">
              {analyticsSummary.highestFuelTrip
                ? `${Number(analyticsSummary.highestFuelTrip.total_fuel_liters).toFixed(2)} L`
                : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 md:col-span-2 xl:col-span-3">
            <p className="text-sm text-slate-500">Lowest Fuel Usage Trip</p>
            <p className="font-medium">{formatTripLabel(analyticsSummary.lowestFuelTrip)}</p>
            <p className="text-sm text-slate-500">
              {analyticsSummary.lowestFuelTrip
                ? `${Number(analyticsSummary.lowestFuelTrip.total_fuel_liters).toFixed(2)} L`
                : "—"}
            </p>
          </div>
        </div>
      </section>

      <TripLogForm userId={userId} editingLog={editingLog} onSaved={handleSaved} />

      <div>
        <h2 className="mb-2 text-lg font-semibold">Trip Logs</h2>
        <section className="mb-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <div>
              <label htmlFor="date-from-filter">Date From</label>
              <input
                id="date-from-filter"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="date-to-filter">Date To</label>
              <input
                id="date-to-filter"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="vessel-filter">Vessel Name</label>
              <select
                id="vessel-filter"
                value={vesselNameFilter}
                onChange={(event) => setVesselNameFilter(event.target.value)}
              >
                <option value="">All Vessels</option>
                <option value="Lite Cat 1">Lite Cat 1</option>
                <option value="Lite Cat 2">Lite Cat 2</option>
              </select>
            </div>
            <div>
              <label htmlFor="route-filter">Route Direction</label>
              <select
                id="route-filter"
                value={routeDirectionFilter}
                onChange={(event) => setRouteDirectionFilter(event.target.value)}
              >
                <option value="">All Routes</option>
                <option value="Cebu to Tubigon">Cebu to Tubigon</option>
                <option value="Tubigon to Cebu">Tubigon to Cebu</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="button" onClick={clearFilters} className="w-full bg-slate-200 text-slate-700">
                Clear Filters
              </button>
            </div>
          </div>
        </section>
        <TripLogsTable logs={filteredLogs} onEdit={setEditingLog} onDelete={handleDelete} />
      </div>
    </main>
  );
}
